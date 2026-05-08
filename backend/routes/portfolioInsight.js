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
const MAX_SCHEMES = 50;
const MAX_STRING_LENGTH = 180;
const MAX_AMOUNT = 1_000_000_000_000;
const CARD_TYPES = new Set(['performance', 'concentration', 'risk', 'watchpoint']);
const SEVERITIES = new Set(['positive', 'neutral', 'caution']);

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function cleanString(value, maxLength = MAX_STRING_LENGTH) {
  if (value === undefined || value === null) return null;
  return String(value).trim().slice(0, maxLength);
}

function cleanNumber(value, maxAbs = MAX_AMOUNT) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > maxAbs) {
    throw validationError('Portfolio contains an invalid number.');
  }
  return parsed;
}

function cleanSchemeCode(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw validationError('Portfolio contains an invalid scheme code.');
  }
  return parsed;
}

function sanitizePortfolioDetails(rawDetails) {
  if (!rawDetails || typeof rawDetails !== 'object' || Array.isArray(rawDetails)) {
    throw validationError('Request body must contain portfolio details JSON.');
  }

  const portfolio = rawDetails.portfolio;
  const schemes = rawDetails.schemes;
  if (!portfolio || typeof portfolio !== 'object' || Array.isArray(portfolio)) {
    throw validationError('Portfolio summary is required.');
  }
  if (!Array.isArray(schemes) || schemes.length === 0) {
    throw validationError('At least one portfolio scheme is required.');
  }
  if (schemes.length > MAX_SCHEMES) {
    throw validationError(`Maximum ${MAX_SCHEMES} schemes are allowed.`);
  }

  return {
    portfolio: {
      currentValue: cleanNumber(portfolio.currentValue),
      investedAmount: cleanNumber(portfolio.investedAmount),
      totalProfitLoss: cleanNumber(portfolio.totalProfitLoss),
      oneDayChange: cleanNumber(portfolio.oneDayChange),
      oneDayChangePct: cleanNumber(portfolio.oneDayChangePct, 100),
      latestDate: cleanString(portfolio.latestDate, 24),
    },
    schemes: schemes.map((scheme) => {
      if (!scheme || typeof scheme !== 'object' || Array.isArray(scheme)) {
        throw validationError('Each scheme must be an object.');
      }
      return {
        scheme_code: cleanSchemeCode(scheme.scheme_code),
        scheme_name: cleanString(scheme.scheme_name) || '',
        principal: cleanNumber(scheme.principal),
        unit: cleanNumber(scheme.unit, 1_000_000_000),
        currentNav: cleanNumber(scheme.currentNav, 10_000_000),
        marketValue: cleanNumber(scheme.marketValue),
        profit: cleanNumber(scheme.profit),
        oneDayChange: cleanNumber(scheme.oneDayChange),
        oneDayChangePct: cleanNumber(scheme.oneDayChangePct, 100),
        latestDate: cleanString(scheme.latestDate, 24),
      };
    }),
  };
}

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
    const rawPortfolioDetails = portfolio || Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => key !== 'refresh')
    );
    const portfolioDetails = sanitizePortfolioDetails(rawPortfolioDetails);

    const portfolioHash = getPortfolioHash(portfolioDetails);
    const cacheDate = new Date().toISOString().slice(0, 10);
    const cacheKey = `${portfolioHash}:${cacheDate}`;
    if (!refresh && insightCache.has(cacheKey)) {
      return res.json(insightCache.get(cacheKey));
    }

    if (!isGitHubModelsConfigured()) {
      return res.status(503).json({
        error: 'AI portfolio insights are not configured',
        message: 'AI insights are unavailable right now.',
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
    console.error('[portfolioInsight] error', error);

    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    const safeMessage = status === 400
      ? error.message
      : status === 502
        ? 'AI insights returned an unexpected response. Please try again later.'
        : status === 503
          ? 'AI insights are unavailable right now.'
          : 'AI insights could not be generated right now.';
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: 'Unable to generate portfolio insight.',
      message: safeMessage,
    });
  }
});

module.exports = router;
