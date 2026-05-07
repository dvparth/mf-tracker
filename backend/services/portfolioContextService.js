const axios = require('axios');

const MARKET_SYMBOLS = [
  { label: 'Nifty 50', symbol: '^NSEI' },
  { label: 'Sensex', symbol: '^BSESN' },
];

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function round(value, digits = 2) {
  if (!isFiniteNumber(value)) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function inferCategory(name = '') {
  const text = String(name).toLowerCase();
  if (text.includes('small cap')) return 'Small Cap';
  if (text.includes('midcap') || text.includes('mid cap')) return 'Mid Cap';
  if (text.includes('large cap') || text.includes('bluechip') || text.includes('blue chip')) return 'Large Cap';
  if (text.includes('flexi cap') || text.includes('flexicap')) return 'Flexi Cap';
  if (text.includes('multi cap') || text.includes('multicap')) return 'Multi Cap';
  if (text.includes('index')) return 'Index';
  if (text.includes('debt') || text.includes('liquid') || text.includes('gilt') || text.includes('income')) return 'Debt';
  if (text.includes('hybrid') || text.includes('balanced')) return 'Hybrid';
  if (text.includes('elss') || text.includes('tax saver')) return 'ELSS';
  return 'Unclassified';
}

function concentrationLabel(percent) {
  if (percent >= 45) return 'high';
  if (percent >= 30) return 'moderate';
  return 'comfortable';
}

function derivePortfolioFacts(portfolioDetails) {
  const portfolio = portfolioDetails?.portfolio || {};
  const schemes = Array.isArray(portfolioDetails?.schemes) ? portfolioDetails.schemes : [];
  const currentValue = Number(portfolio.currentValue || 0);
  const investedAmount = Number(portfolio.investedAmount || 0);
  const totalProfitLoss = Number(portfolio.totalProfitLoss || 0);
  const oneDayChange = Number(portfolio.oneDayChange || 0);
  const totalReturnPct = investedAmount ? (totalProfitLoss / investedAmount) * 100 : null;
  const oneDayChangePct = currentValue ? (oneDayChange / currentValue) * 100 : null;

  const normalizedSchemes = schemes.map((scheme) => {
    const marketValue = Number(scheme.marketValue || 0);
    const principal = Number(scheme.principal || 0);
    const profit = Number(scheme.profit || 0);
    const oneDay = Number(scheme.oneDayChange || 0);
    const allocationPct = currentValue ? (marketValue / currentValue) * 100 : 0;
    return {
      scheme_code: Number(scheme.scheme_code),
      scheme_name: scheme.scheme_name,
      category: inferCategory(scheme.scheme_name),
      principal: round(principal),
      marketValue: round(marketValue),
      profit: round(profit),
      profitPct: principal ? round((profit / principal) * 100) : null,
      oneDayChange: round(oneDay),
      oneDayChangePct: marketValue ? round((oneDay / marketValue) * 100) : null,
      allocationPct: round(allocationPct),
    };
  }).sort((a, b) => Number(b.marketValue || 0) - Number(a.marketValue || 0));

  const byProfit = normalizedSchemes.slice().sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0));
  const categoryExposure = normalizedSchemes.reduce((acc, scheme) => {
    const key = scheme.category || 'Unclassified';
    if (!acc[key]) acc[key] = { category: key, marketValue: 0, allocationPct: 0, schemes: 0 };
    acc[key].marketValue += Number(scheme.marketValue || 0);
    acc[key].allocationPct += Number(scheme.allocationPct || 0);
    acc[key].schemes += 1;
    return acc;
  }, {});
  const categoryExposureList = Object.values(categoryExposure)
    .map((item) => ({ ...item, marketValue: round(item.marketValue), allocationPct: round(item.allocationPct) }))
    .sort((a, b) => b.allocationPct - a.allocationPct);

  const largest = normalizedSchemes[0] || null;
  const facts = {
    asOfDate: portfolio.latestDate || null,
    totals: {
      currentValue: round(currentValue),
      investedAmount: round(investedAmount),
      totalProfitLoss: round(totalProfitLoss),
      totalReturnPct: round(totalReturnPct),
      oneDayChange: round(oneDayChange),
      oneDayChangePct: round(oneDayChangePct),
    },
    fundCount: normalizedSchemes.length,
    concentration: {
      largestSchemeCode: largest?.scheme_code || null,
      largestSchemeName: largest?.scheme_name || null,
      largestAllocationPct: largest ? largest.allocationPct : null,
      level: largest ? concentrationLabel(Number(largest.allocationPct || 0)) : 'unknown',
    },
    categoryExposure: categoryExposureList,
    topPerformers: byProfit.slice(0, 3),
    weakestPerformers: byProfit.slice(-3).reverse(),
    largestHoldings: normalizedSchemes.slice(0, 5),
  };

  return facts;
}

async function fetchMarketSymbol(symbolConfig) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbolConfig.symbol)}?range=5d&interval=1d`;
  const response = await axios.get(url, {
    timeout: 2500,
    headers: { 'User-Agent': 'mf-tracker/1.0' },
  });
  const result = response.data?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const closes = Array.isArray(quote?.close) ? quote.close.filter(isFiniteNumber).map(Number) : [];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
  if (closes.length < 2) return null;
  const latest = closes[closes.length - 1];
  const previous = closes[closes.length - 2];
  const change = latest - previous;
  const changePct = previous ? (change / previous) * 100 : null;
  const timestamp = timestamps[timestamps.length - 1] ? new Date(timestamps[timestamps.length - 1] * 1000).toISOString() : null;
  return {
    label: symbolConfig.label,
    symbol: symbolConfig.symbol,
    latest: round(latest),
    change: round(change),
    changePct: round(changePct),
    asOf: timestamp,
    source: 'Yahoo Finance chart API',
  };
}

async function fetchMarketContext() {
  const results = await Promise.allSettled(MARKET_SYMBOLS.map(fetchMarketSymbol));
  const indices = results
    .filter((result) => result.status === 'fulfilled' && result.value)
    .map((result) => result.value);

  return {
    included: indices.length > 0,
    indices,
    sources: indices.length ? ['Yahoo Finance chart API'] : [],
    fetchedAt: new Date().toISOString(),
  };
}

async function buildEnrichedPortfolioContext(portfolioDetails) {
  const facts = derivePortfolioFacts(portfolioDetails);
  let marketContext = {
    included: false,
    indices: [],
    sources: [],
    fetchedAt: new Date().toISOString(),
    error: null,
  };

  try {
    marketContext = await fetchMarketContext();
  } catch (error) {
    marketContext.error = 'Market context unavailable';
  }

  return {
    portfolio: portfolioDetails,
    facts,
    marketContext,
    contextNotes: [
      'Fund categories are inferred from fund names when exact category metadata is unavailable.',
      'Market context is broad index movement only and must not be treated as fund-specific news.',
    ],
  };
}

module.exports = {
  derivePortfolioFacts,
  fetchMarketContext,
  buildEnrichedPortfolioContext,
};
