const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client for GitHub Models only when a token is configured
const githubToken = process.env.GITHUB_TOKEN;
const client = githubToken
  ? new OpenAI({ baseURL: 'https://models.inference.ai.azure.com', apiKey: githubToken })
  : null;

// GET /health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'github-llm-service',
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini'
  });
});

// POST /api/llm/chat
router.post('/chat', async (req, res) => {
  try {
    const { prompt, systemPrompt, model = 'gpt-4o-mini', maxTokens = 1024, temperature = 0.7 } = req.body;

    if (!githubToken || !client) {
      return res.status(503).json({
        error: 'GitHub Models are not configured',
        message: 'GITHUB_TOKEN is missing. Please configure GitHub Models credentials or use another AI provider.',
      });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const reply = completion.choices[0].message.content;
    const usage = completion.usage;

    res.json({
      success: true,
      data: {
        id: completion.id,
        model: completion.model,
        reply,
        finishReason: completion.choices[0].finish_reason,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      },
    });
  } catch (error) {
    console.error('Error in LLM chat:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;