const GITHUB_MODELS_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
const GITHUB_API_VERSION = '2026-03-10';
const DEFAULT_GITHUB_MODEL = 'openai/gpt-4.1';
const ALLOWED_GITHUB_MODELS = new Set([
  'openai/gpt-4.1',
  'openai/gpt-4.1-mini',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
]);

function isGitHubModelsConfigured() {
  return Boolean(process.env.GITHUB_TOKEN);
}

function getGitHubModel(modelOverride = null) {
  const requestedModel = modelOverride || process.env.GITHUB_MODEL || DEFAULT_GITHUB_MODEL;
  return ALLOWED_GITHUB_MODELS.has(requestedModel) ? requestedModel : DEFAULT_GITHUB_MODEL;
}

function buildPortfolioPrompt(portfolioDetails) {
  const portfolioJson = JSON.stringify(portfolioDetails, null, 2);
  return [
    'Analyze this Indian mutual fund portfolio context JSON.',
    'Return only valid JSON with this exact shape:',
    '{"summary":"Short overall portfolio summary","cards":[{"type":"performance|concentration|risk|watchpoint","title":"Short card title","severity":"positive|neutral|caution","message":"Plain-English explanation","relatedSchemes":[123456]}]}',
    'Create 3 to 5 cards. Prefer the precomputed facts section over recalculating from raw holdings.',
    'Use marketContext only as broad market context when included=true; never claim it explains a specific fund unless the JSON directly supports that.',
    'Mention inferred categories only as approximate category exposure, not official fund classification.',
    'Use beginner-friendly language. Explain why the observation matters in one short paragraph.',
    'Do not recommend buying, selling, switching, redeeming, or adding money.',
    `Portfolio context JSON:\n${portfolioJson}`,
  ].join('\n');
}

function buildPortfolioSystemPrompt() {
  return [
    'You are a financial analyst specializing in Indian mutual funds.',
    'Write concise plain-English observations for the provided portfolio context JSON.',
    'Focus on total profit/loss in INR, best and weakest funds, today movement, concentration, diversification, category exposure, and broad market context when provided.',
    'Do not invent news, fund facts, benchmarks, categories, or causes that are not in the JSON.',
    'Return valid JSON only. Do not wrap it in markdown fences.',
    'Do not provide personalized buy/sell instructions.',
  ].join(' ');
}

function normalizeResponseText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  const lines = rawText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.slice(0, 4).join('\n');
}

async function callGitHubModel({
  prompt,
  systemPrompt = null,
  modelOverride = null,
  maxTokens = 900,
  temperature = 0.4,
}) {
  if (!process.env.GITHUB_TOKEN) {
    const error = new Error('GITHUB_TOKEN is required for AI portfolio insights.');
    error.status = 503;
    throw error;
  }

  const model = getGitHubModel(modelOverride);
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(GITHUB_MODELS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`GitHub Models returned invalid JSON (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || JSON.stringify(data);
    const error = new Error(`GitHub Models request failed (${response.status}): ${message}`);
    error.status = response.status;
    throw error;
  }

  return {
    reply: data?.choices?.[0]?.message?.content || '',
    model: data?.model || model,
    provider: 'github',
  };
}

module.exports = {
  callGitHubModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  normalizeResponseText,
  isGitHubModelsConfigured,
};
