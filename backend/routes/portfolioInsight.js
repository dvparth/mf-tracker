const express = require('express');
const router = express.Router();
const {
  callGitHubModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  normalizeResponseText,
  isGitHubModelsConfigured,
} = require('../services/llmService');

router.post('/', async (req, res) => {
  try {
    const { portfolio } = req.body;
    const portfolioDetails = portfolio || req.body;

    if (!portfolioDetails || typeof portfolioDetails !== 'object' || Array.isArray(portfolioDetails)) {
      return res.status(400).json({ error: 'Request body must contain portfolio details JSON.' });
    }

    if (!isGitHubModelsConfigured()) {
      return res.status(503).json({
        error: 'AI portfolio insights are not configured',
        message: 'GITHUB_TOKEN is missing on the backend.',
      });
    }

    const prompt = buildPortfolioPrompt(portfolioDetails);
    const systemPrompt = buildPortfolioSystemPrompt();
    const insightResult = await callGitHubModel({ prompt, systemPrompt });

    return res.json({
      insight: normalizeResponseText(insightResult.reply),
      provider: insightResult.provider,
      model: insightResult.model,
    });
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
