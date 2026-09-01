const GROQ_CHAT_COMPLETIONS_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

function getGroqModel(modelOverride = null) {
  return modelOverride || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
}

function buildPortfolioPrompt(portfolioDetails) {
  const portfolioJson = JSON.stringify(portfolioDetails, null, 2);
  return [
    'Analyze this Indian mutual fund portfolio context JSON.',
    'Return only valid JSON with this exact shape:',
    '{"summary":"Short overall portfolio summary","cards":[{"type":"performance|concentration|risk|watchpoint","title":"Short card title","severity":"positive|neutral|caution","message":"Plain-English explanation","relatedSchemes":[123456]}]}',
    'Create exactly 3 cards. Prefer the precomputed facts section over recalculating from raw holdings.',
    'Make every card decision-useful: state the observation, why it matters, and a sensible item for the investor to review next.',
    'Prioritize concentration and overlap risk, diversification, performance contribution, unusually large recent moves, category exposure, and missing or stale NAV data.',
    'When figures are available, cite the relevant INR amount, percentage, fund, or category from the context. Clearly label estimates and inferred categories.',
    'Use marketContext only as broad market context when included=true; never claim it explains a specific fund unless the JSON directly supports that.',
    'Mention inferred categories only as approximate category exposure, not official fund classification.',
    'Keep the summary to two sentences and each card message to at most 45 words.',
    'Do not recommend buying, selling, switching, redeeming, timing the market, or adding money. You may suggest neutral review questions, such as checking allocation against the investor\'s risk tolerance, time horizon, or financial goals.',
    `Portfolio context JSON:\n${portfolioJson}`,
  ].join('\n');
}

function buildPortfolioSystemPrompt() {
  return [
    'You are a financial analyst specializing in Indian mutual funds.',
    'Write concise plain-English observations for the provided portfolio context JSON.',
    'Focus on total profit/loss in INR, best and weakest funds, today movement, concentration, diversification, category exposure, and broad market context when provided.',
    'Make the analysis useful for a financial review: identify material risks or strengths, explain their practical significance, and give a neutral next review question or check.',
    'Use specific values from the input where available; distinguish facts, estimates, and inferred categories.',
    'Do not invent news, fund facts, benchmarks, categories, or causes that are not in the JSON.',
    'Return valid JSON only. Do not wrap it in markdown fences. Produce exactly three cards with concise messages.',
    'Do not provide personalized buy/sell instructions, timing advice, or guarantees. Do not replace professional financial advice.',
  ].join(' ');
}

async function callGroqModel({
  prompt,
  systemPrompt = null,
  modelOverride = null,
  maxTokens = 1400,
}) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is required for AI portfolio insights.');
    error.status = 503;
    throw error;
  }

  const model = getGroqModel(modelOverride);
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(GROQ_CHAT_COMPLETIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: maxTokens,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Groq returned invalid JSON (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.message || JSON.stringify(data);
    const error = new Error(`Groq request failed (${response.status}): ${message}`);
    error.status = response.status;
    throw error;
  }

  const reply = data?.choices?.[0]?.message?.content || '';
  if (!reply.trim()) {
    const finishReason = data?.choices?.[0]?.finish_reason || 'unknown';
    const error = new Error(`Groq returned no text output (finish reason: ${finishReason}).`);
    error.status = 502;
    throw error;
  }

  return {
    reply,
    model: data?.model || model,
    provider: 'groq',
  };
}

module.exports = {
  callGroqModel,
  buildPortfolioPrompt,
  buildPortfolioSystemPrompt,
  isGroqConfigured,
};