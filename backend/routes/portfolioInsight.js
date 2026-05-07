const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const {
  callGitHubModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  isGitHubModelsConfigured,
} = require('../services/llmService');
const { buildEnrichedPortfolioContext } = require('../services/portfolioContextService');

const insightCache = new Map();
const MAX_CACHE_ENTRIES = 50;
const CARD_TYPES = new Set(['performance', 'concentration', 'risk', 'watchpoint']);
const SEVERITIES = new Set(['positive', 'neutral', 'caution']);

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function getPortfolioHash(portfolioDetails) {
  return crypto.createHash('sha256').update(stableStringify(portfolioDetails)).digest('hex').slice(0, 16);
}

function setCachedInsight(portfolioHash, insight) {
  if (insightCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = insightCache.keys().next().value;
    insightCache.delete(oldestKey);
  }
  insightCache.set(portfolioHash, insight);
}

function parseModelJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const error = new Error('AI response was not valid JSON.');
    error.status = 502;
    throw error;
  }
}

function normalizeInsightPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    const error = new Error('AI response did not match the expected insight schema.');
    error.status = 502;
    throw error;
  }

  const summary = typeof rawPayload.summary === 'string' ? rawPayload.summary.trim() : '';
  const cardsRaw = Array.isArray(rawPayload.cards) ? rawPayload.cards : [];
  const cards = cardsRaw.slice(0, 5).map((card) => {
    const type = CARD_TYPES.has(card?.type) ? card.type : 'watchpoint';
    const severity = SEVERITIES.has(card?.severity) ? card.severity : 'neutral';
    const relatedSchemes = Array.isArray(card?.relatedSchemes)
      ? card.relatedSchemes.map(Number).filter(Number.isFinite)
      : [];

    return {
      type,
      title: typeof card?.title === 'string' && card.title.trim() ? card.title.trim() : 'Portfolio observation',
      severity,
      message: typeof card?.message === 'string' ? card.message.trim() : '',
      relatedSchemes,
    };
  }).filter((card) => card.message);

  if (!summary || cards.length === 0) {
    const error = new Error('AI response did not include a summary and at least one card.');
    error.status = 502;
    throw error;
  }

  return { summary, cards };
}

router.post('/', async (req, res) => {
  try {
    const { portfolio, refresh } = req.body;
    const portfolioDetails = portfolio || Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => key !== 'refresh')
    );

    if (!portfolioDetails || typeof portfolioDetails !== 'object' || Array.isArray(portfolioDetails) || Object.keys(portfolioDetails).length === 0) {
      return res.status(400).json({ error: 'Request body must contain portfolio details JSON.' });
    }

    const portfolioHash = getPortfolioHash(portfolioDetails);
    const cacheDate = new Date().toISOString().slice(0, 10);
    const cacheKey = `${portfolioHash}:${cacheDate}`;
    if (!refresh && insightCache.has(cacheKey)) {
      return res.json(insightCache.get(cacheKey));
    }

    if (!isGitHubModelsConfigured()) {
      return res.status(503).json({
        error: 'AI portfolio insights are not configured',
        message: 'GITHUB_TOKEN is missing on the backend.',
      });
    }

    const enrichedContext = await buildEnrichedPortfolioContext(portfolioDetails);
    const prompt = buildPortfolioPrompt(enrichedContext);
    const systemPrompt = buildPortfolioSystemPrompt();
    const insightResult = await callGitHubModel({ prompt, systemPrompt });
    const parsedInsight = normalizeInsightPayload(parseModelJson(insightResult.reply));

    const responseBody = {
      summary: parsedInsight.summary,
      cards: parsedInsight.cards,
      provider: insightResult.provider,
      model: insightResult.model,
      portfolioHash,
      context: {
        factsIncluded: true,
        marketContextIncluded: Boolean(enrichedContext.marketContext?.included),
        marketSources: enrichedContext.marketContext?.sources || [],
        marketFetchedAt: enrichedContext.marketContext?.fetchedAt || null,
        categoryInference: true,
      },
    };
    setCachedInsight(cacheKey, responseBody);

    return res.json(responseBody);
  } catch (error) {
    console.error('[portfolioInsight] error', error?.message || error);

    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Unable to generate portfolio insight.',
      message: error?.message || 'GitHub Models request failed.',
    });
  }
});

module.exports = router;
