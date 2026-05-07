const supportedProviders = ['openai', 'huggingface', 'github'];

function getProvider() {
  const configuredProvider = (process.env.AI_PROVIDER || 'huggingface').toLowerCase();
  
  // If configured provider is available, use it
  if (supportedProviders.includes(configuredProvider) && isProviderAvailable(configuredProvider)) {
    return configuredProvider;
  }
  
  // Otherwise, find the first available provider
  for (const provider of supportedProviders) {
    if (isProviderAvailable(provider)) {
      return provider;
    }
  }
  
  throw new Error(`No AI provider is available. Please configure API keys for one of: ${supportedProviders.join(', ')}`);
}

function isProviderAvailable(provider) {
  if (provider === 'openai') {
    return !!process.env.OPENAI_API_KEY;
  }
  if (provider === 'huggingface') {
    return !!process.env.HUGGINGFACE_API_KEY;
  }
  if (provider === 'github') {
    return !!process.env.GITHUB_TOKEN;
  }
  return false;
}

function buildPortfolioPrompt(portfolioDetails) {
  const portfolioJson = JSON.stringify(portfolioDetails, null, 2);
  return `Provide advice for this portfolio: ${portfolioJson}`;
}

function buildPortfolioSystemPrompt() {
  return 'You are a financial analyst specializing in Indian Mutual Funds. Your task is to analyze the provided JSON portfolio data and provide a concise, spoken English summary in plain text. Focus on total profit/loss in INR, the best and worst performing schemes, and portfolio concentration. Limit your response to 8 short, impactful lines. Do not use markdown or bolding.';
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

  if (lines.length === 0) {
    return '';
  }

  if (lines.length > 4) {
    return lines.slice(0, 4).join('\n');
  }

  return lines.join('\n');
}

async function callOpenAI(prompt, systemPrompt = null, model = process.env.OPENAI_MODEL || 'gpt-4o-mini', maxTokens = 220, temperature = 0.4, baseURL = null, apiKey = null) {
  const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY;
  if (!effectiveApiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI provider.');
  }

  const apiBase = baseURL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${effectiveApiKey}`,
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
    throw new Error(`OpenAI returned invalid JSON (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    const errorMessage = data?.error?.message || JSON.stringify(data);
    throw new Error(`OpenAI request failed (${response.status}): ${errorMessage}`);
  }

  return data?.choices?.[0]?.message?.content || '';
}

async function callHuggingFace(prompt, modelOverride = null, systemPrompt = null, maxTokens = 150, temperature = 0.4) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = modelOverride || process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is required for HuggingFace provider.');
  }

  const chatModels = [
    'Qwen/Qwen2.5-7B-Instruct',
    'microsoft/DialoGPT-medium',
    'microsoft/DialoGPT-large',
    'meta-llama/Llama-2-7b-chat-hf',
    'meta-llama/Llama-2-13b-chat-hf',
    'mistralai/Mistral-7B-Instruct-v0.1'
  ];

  const isChatModel = chatModels.some(chatModel => model.includes(chatModel.split('/')[1]) || model === chatModel);

  if (!isChatModel) {
    throw new Error(`Model ${model} is not supported for chat completions. Only instruction/chat models work with this endpoint.`);
  }

  console.log(`[HuggingFace] Using model: ${model}, isChatModel: ${isChatModel}`);

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages,
      model,
      stream: false,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`HuggingFace returned invalid JSON (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || JSON.stringify(data);
    console.log('[HuggingFace] Full error response:', JSON.stringify(data, null, 2));
    const error = new Error(`HuggingFace request failed (${response.status}): ${errorMessage}`);
    error.status = response.status;
    error.provider = 'huggingface';
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content || '';
  console.log('[HuggingFace] Response data structure:', JSON.stringify(data, null, 2));
  console.log('[HuggingFace] Response content:', content.substring(0, 200));
  return content;
}


/**
 * Selects and invokes the configured LLM provider.
 *
 * This wrapper supports OpenAI, HuggingFace, and GitHub Models.
 * It chooses the effective provider, applies any model override,
 * sends the prompt and system prompt to the provider, and returns
 * the generated reply together with the provider and model used.
 *
 * @param {Object} options
 * @param {string|null} [options.provider] - Explicit provider to use; defaults to configured provider.
 * @param {string} options.prompt - User prompt to send to the model.
 * @param {string|null} [options.systemPrompt] - Optional system prompt for the model.
 * @param {string|null} [options.modelOverride] - Optional model override.
 * @param {number} [options.maxTokens=1024] - Maximum token count for the request.
 * @param {number} [options.temperature=0.7] - Sampling temperature.
 * @returns {Promise<{reply: string, model: string, provider: string}>}
 */
async function callModel({ provider = null, prompt, systemPrompt = null, modelOverride = null, maxTokens = 1024, temperature = 0.7 }) {
  const selectedProvider = provider || getProvider();

  if (selectedProvider === 'openai') {
    const model = modelOverride || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const reply = await callOpenAI(prompt, systemPrompt, model, maxTokens, temperature);
    return { reply, model, provider: 'openai' };
  }

  if (selectedProvider === 'huggingface') {
    const model = modelOverride || process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
    const reply = await callHuggingFace(prompt, model, systemPrompt, maxTokens, temperature);
    return { reply, model, provider: 'huggingface' };
  }

  if (selectedProvider === 'github') {
    const githubModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-mini-preview', 'gpt-4o-realtime-preview'];
    const requestedModel = modelOverride || 'gpt-4o-mini';
    const model = githubModels.includes(requestedModel) ? requestedModel : 'gpt-4o-mini';
    const reply = await callOpenAI(prompt, systemPrompt, model, maxTokens, temperature, 'https://models.inference.ai.azure.com', process.env.GITHUB_TOKEN);
    return { reply, model, provider: 'github' };
  }

  throw new Error(`Unsupported provider: ${selectedProvider}`);
}

module.exports = {
  callModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  normalizeResponseText,
  isProviderAvailable,
};
