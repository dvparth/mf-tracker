const express = require('express');
const router = express.Router();
const {
  callModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  normalizeResponseText,
  isProviderAvailable,
} = require('../services/llmService');

router.post('/', async (req, res) => {
  try {
    const { portfolio, provider, model, fallback, systemPrompt: clientSystemPrompt } = req.body;
    let portfolioDetails = portfolio;

    if (!portfolioDetails) {
      const { provider: _, model: __, fallback: ___, ...rest } = req.body;
      portfolioDetails = Object.keys(rest).length ? rest : null;
    }

    if (!portfolioDetails || typeof portfolioDetails !== 'object') {
      return res.status(400).json({ error: 'Request body must contain portfolio details JSON.' });
    }

    const prompt = buildPortfolioPrompt(portfolioDetails);
    const systemPrompt = clientSystemPrompt || buildPortfolioSystemPrompt();
    let insightResult;
    let fallbackUsed = null;

    // Determine the effective provider to use
    const effectiveProvider = provider && isProviderAvailable(provider) ? provider : null;

    try {
      insightResult = await callModel({
        provider: effectiveProvider,
        prompt,
        systemPrompt,
        modelOverride: model,
      });
    } catch (primaryError) {
      if (fallback && typeof fallback === 'object' && fallback.provider && isProviderAvailable(fallback.provider)) {
        try {
          insightResult = await callModel({
            provider: fallback.provider,
            prompt,
            systemPrompt,
            modelOverride: fallback.model,
          });
          fallbackUsed = {
            provider: fallback.provider,
            model: insightResult.model,
            reason: primaryError.message,
          };
        } catch (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw primaryError;
      }
    }

    return res.json({
      insight: normalizeResponseText(insightResult.reply),
      provider: insightResult.provider,
      model: insightResult.model,
      ...(fallbackUsed ? { fallbackUsed } : {}),
    });
  } catch (error) {
    console.error('[portfolioInsight] error', error?.message || error);

    if (error?.status === 402 && error?.provider === 'huggingface') {
      return res.status(402).json({
        error: 'AI service credits depleted',
        message: 'Your HuggingFace account has run out of included credits. Please purchase pre-paid credits or subscribe to PRO to continue using portfolio insights.',
        details: error.message,
      });
    }

    if (error?.status >= 500 && error?.provider === 'huggingface') {
      return res.status(503).json({
        error: 'AI service temporarily unavailable',
        message: 'The HuggingFace AI service is temporarily unavailable. Please try again in a few moments.',
        details: error.message,
      });
    }

    return res.status(500).json({ error: error?.message || 'Unable to generate portfolio insight.' });
  }
});

module.exports = router;
