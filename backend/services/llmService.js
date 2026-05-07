const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const DEFAULT_GITHUB_MODEL = 'gpt-4o-mini';
const ALLOWED_GITHUB_MODELS = new Set([
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-mini-preview',
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
  return `Analyze this Indian mutual fund portfolio JSON and produce a concise investor-facing summary:\n${portfolioJson}`;
}

function buildPortfolioSystemPrompt() {
  return [
    'You are a financial analyst specializing in Indian mutual funds.',
    'Write a concise plain-English summary for the provided portfolio JSON.',
    'Focus on total profit/loss in INR, best and worst performing schemes, one-day movement, and concentration risk.',
    'Limit the response to 4 short lines.',
    'Do not use markdown, bullets, or bold formatting.',
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
  maxTokens = 260,
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
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
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
