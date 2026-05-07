import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import LoadingButton from './LoadingButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Suspense } from 'react';
import BackToTop from './BackToTop';
import { parseDMY, formatDMY, findNearestEntry, monthLabelShort, formatFundName, formatCurrency } from '../utils/formatters';
import { fetchSchemeDataUsingAdapter } from '../adapters/mfAdapters';
import SectionCard from './ui/SectionCard';
import DonutChart from './ui/DonutChart';
import InsightCard from './ui/InsightCard';

function getPortfolioHealth(rows, totals) {
    const validRows = rows.filter((row) => Number.isFinite(row.marketValue) && row.marketValue > 0);
    const largest = validRows[0];
    const largestPct = largest && totals.marketValue ? (largest.marketValue / totals.marketValue) * 100 : 0;
    const returnPct = totals.principal ? (totals.profit / totals.principal) * 100 : 0;
    const fundCount = validRows.length;
    let score = 55;
    if (fundCount >= 4) score += 15;
    if (fundCount >= 7) score += 8;
    if (largestPct <= 30) score += 14;
    else if (largestPct <= 40) score += 7;
    else score -= 8;
    if (returnPct > 0) score += 10;
    if (returnPct < -5) score -= 12;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const status = score >= 78 ? 'Healthy' : score >= 62 ? 'Balanced' : score >= 45 ? 'Needs attention' : 'High concentration';
    const tone = score >= 78 ? 'success' : score >= 62 ? 'primary' : score >= 45 ? 'warning' : 'error';
    const concentration = largestPct > 40 ? 'High' : largestPct > 30 ? 'Moderate' : 'Comfortable';
    const diversification = fundCount >= 7 ? 'Broad' : fundCount >= 4 ? 'Good' : 'Limited';
    const trend = returnPct >= 0 ? 'Positive' : 'Negative';

    return { score, status, tone, largestPct, largest, concentration, diversification, trend, returnPct };
}

function buildTakeaways(rows, totals, health) {
    const takeaways = [];
    const rowsByProfit = rows.filter((row) => Number.isFinite(row.profit)).sort((a, b) => b.profit - a.profit);
    const best = rowsByProfit[0];
    const worst = rowsByProfit[rowsByProfit.length - 1];
    if (Number.isFinite(totals.prevDelta)) {
        takeaways.push({
            tone: totals.prevDelta >= 0 ? 'positive' : 'caution',
            title: totals.prevDelta >= 0 ? 'Portfolio is up today' : 'Portfolio is down today',
            text: `${formatCurrency(Math.abs(totals.prevDelta))} ${totals.prevDelta >= 0 ? 'gain' : 'drop'} versus the previous available NAV.`
        });
    }
    if (health.largest) {
        takeaways.push({
            tone: health.largestPct > 40 ? 'caution' : 'neutral',
            title: health.largestPct > 40 ? 'One fund has high weight' : 'Largest fund weight looks manageable',
            text: `${formatFundName(health.largest.scheme_name)} is ${health.largestPct.toFixed(1)}% of your portfolio.`
        });
    }
    if (best && worst && best.scheme_code !== worst.scheme_code) {
        takeaways.push({
            tone: 'neutral',
            title: 'Best and weakest funds are visible',
            text: `${formatFundName(best.scheme_name)} leads by gain/loss; ${formatFundName(worst.scheme_name)} needs review context.`
        });
    }
    return takeaways.slice(0, 3);
}

const SummaryCard = React.lazy(() => import('./SummaryCard'));
const SchemeAccordion = React.lazy(() => import('./SchemeAccordion'));

export default function MFTracker({ user }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Visible count for progressive rendering (declare with other hooks)
    const [visibleCount, setVisibleCount] = useState(8);
    // UI state for scrolling helpers (declare before any early returns)
    const topRef = useRef(null);
    const latestPortfolioStateRef = useRef(null);
    const [aiInsight, setAiInsight] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiRefreshing, setAiRefreshing] = useState(false);
    const [aiError, setAiError] = useState(null);


    // Adapter selection is now handled by REACT_APP_DATA_ADAPTER env var in mfAdapters.js

    const [manualLoading, setManualLoading] = useState(false);

    const fetchAIInsight = async (portfolioState, { refresh = false } = {}) => {
        if (!portfolioState) return;
        setAiError(null);
        if (refresh) {
            setAiRefreshing(true);
        } else {
            setAiLoading(true);
        }

        try {
            const backend = process.env.REACT_APP_BACKEND_URL || '';
            const requestBody = {
                portfolio: portfolioState,
                ...(refresh ? { refresh: true } : {})
            };
            const response = await fetch(`${backend}/api/portfolioInsight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            if (response.ok) {
                const data = await response.json();
                setAiInsight(data);
            } else {
                // Handle error responses with specific messages
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || 'Failed to load AI summary';

                setAiError(errorMessage);
            }
        } catch (err) {
            setAiError('Error loading AI summary');
        } finally {
            setAiLoading(false);
            setAiRefreshing(false);
        }
    };

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load user's tracked holdings and fetch NAVs using adapters. Do not call /schemes here.
            const backend = process.env.REACT_APP_BACKEND_URL || '';
            const holdingsRes = await fetch(`${backend}/user/holdings`, { credentials: 'include' });
            const userHoldings = (await holdingsRes.json().catch(() => ({ holdings: [] }))).holdings || [];
            // Build the tracked list from user holdings; adapter metadata (meta.scheme_name) will be used when available.
            const tracked = userHoldings.map(h => ({ scheme_code: h.scheme_code, principal: h.principal || 0, unit: h.unit || 0 }));
            if (!tracked.length) {
                setRows([]);
                return;
            }
            // fetch through adapter(s) to keep MFTracker decoupled from API shape
            const results = await fetchSchemeDataUsingAdapter(tracked);
            // Create a lookup map for results by schemeCode (results may be in different order)
            const resultsMap = {};
            const safeResults = Array.isArray(results) ? results : [];
            safeResults.forEach(result => {
                if (result && result.schemeCode) {
                    resultsMap[result.schemeCode] = result;
                }
            });
            const processedResults = tracked.map((s) => {
                const result = resultsMap[s.scheme_code];
                if (result && !result.error) {
                    // adapter guarantees canonical shape: { entries: [{date, nav}], meta: { scheme_name } }
                    const payload = result.data || { entries: [], meta: { scheme_name: '' } };
                    const entries = Array.isArray(payload.entries) ? payload.entries : [];
                    // robustly parse NAVs and convert non-finite values to null to avoid NaN propagation
                    let nav0 = entries[0] && entries[0].nav ? Number.parseFloat(entries[0].nav) : null;
                    let nav1 = entries[1] && entries[1].nav ? Number.parseFloat(entries[1].nav) : null;
                    let nav2 = entries[2] && entries[2].nav ? Number.parseFloat(entries[2].nav) : null;
                    if (!Number.isFinite(nav0)) nav0 = null;
                    if (!Number.isFinite(nav1)) nav1 = null;
                    if (!Number.isFinite(nav2)) nav2 = null;
                    const mv0 = (nav0 !== null) ? nav0 * s.unit : null;
                    const mv1 = (nav1 !== null) ? nav1 * s.unit : null;
                    const mv2 = (nav2 !== null) ? nav2 * s.unit : null;
                    const profit = (mv0 !== null && Number.isFinite(mv0)) ? (mv0 - s.principal) : null;
                    const prevDelta = (mv0 !== null && mv1 !== null && Number.isFinite(mv0) && Number.isFinite(mv1)) ? (mv0 - mv1) : null;
                    const latestDate = entries[0] && entries[0].date ? entries[0].date : null;
                    const schemeName = (payload.meta && payload.meta.scheme_name) ? payload.meta.scheme_name : `Code ${s.scheme_code}`;
                    return {
                        scheme_code: s.scheme_code,
                        scheme_name: schemeName,
                        principal: s.principal,
                        unit: s.unit,
                        // ensure numeric fields are either finite numbers or null
                        nav: nav0 !== null && Number.isFinite(nav0) ? nav0 : null,
                        marketValue: mv0 !== null && Number.isFinite(mv0) ? mv0 : null,
                        profit: profit !== null && Number.isFinite(profit) ? profit : null,
                        prevDelta: prevDelta !== null && Number.isFinite(prevDelta) ? prevDelta : null,
                        hist: [{ date: entries[1] && entries[1].date ? entries[1].date : null, nav: nav1, marketValue: mv1 }, { date: entries[2] && entries[2].date ? entries[2].date : null, nav: nav2, marketValue: mv2 }],
                        entries,
                        latestDate,
                    };
                }
                return {
                    scheme_code: s.scheme_code,
                    scheme_name: `Code ${s.scheme_code}`,
                    principal: s.principal,
                    unit: s.unit,
                    nav: null,
                    marketValue: null,
                    profit: null,
                    prevDelta: null,
                    hist: [{ date: null, nav: null, marketValue: null }, { date: null, nav: null, marketValue: null }],
                    entries: [],
                    latestDate: null,
                };
            });
            setRows(processedResults);
        } catch (err) {
            setError(err.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    };

    // Fetch AI summary after data is loaded
    useEffect(() => {
        if (!loading && !error && rows.length > 0) {
            // Compute portfolio state here since it's after data load
            const latestDate = rows.reduce((acc, r) => r.latestDate && (!acc || r.latestDate > acc) ? r.latestDate : acc, null);
            let monthTargets = [null, null, null];
            if (latestDate) {
                const base = parseDMY(latestDate);
                if (base) {
                    monthTargets = [1, 2, 3].map(i => {
                        const d = new Date(base.getTime());
                        d.setMonth(d.getMonth() - i);
                        return d;
                    });
                }
            }
            const rowsWithMonths = rows.map(r => {
                const entries = r.entries || [];
                const months = monthTargets.map(t => {
                    if (!t) return { date: null, marketValue: null };
                    const found = findNearestEntry(entries, t);
                    if (!found || (found.nav === undefined || found.nav === null)) return { date: null, marketValue: null };
                    const nav = parseFloat(found.nav);
                    const mv = (Number.isFinite(nav) && r.unit) ? (nav * r.unit) : null;
                    return { date: found.date, marketValue: mv };
                });
                return { ...r, months };
            });
            const totals = rowsWithMonths.reduce((acc, r) => {
                acc.principal += Number(r.principal || 0);
                acc.marketValue += Number(r.marketValue || 0);
                acc.profit += Number(r.profit || 0);
                acc.prevDelta += Number(r.prevDelta || 0);
                acc.month1 += Number((r.months && r.months[0] && r.months[0].marketValue) || 0);
                acc.month2 += Number((r.months && r.months[1] && r.months[1].marketValue) || 0);
                acc.month3 += Number((r.months && r.months[2] && r.months[2].marketValue) || 0);
                return acc;
            }, { principal: 0, marketValue: 0, profit: 0, prevDelta: 0, month1: 0, month2: 0, month3: 0 });
            const sortedRows = rowsWithMonths.slice().sort((a, b) => {
                const av = Number.isFinite(a.marketValue) ? a.marketValue : -Infinity;
                const bv = Number.isFinite(b.marketValue) ? b.marketValue : -Infinity;
                return bv - av;
            });
            const portfolioState = {
                portfolio: {
                    currentValue: Number.isFinite(totals.marketValue) ? totals.marketValue : null,
                    investedAmount: Number.isFinite(totals.principal) ? totals.principal : null,
                    totalProfitLoss: Number.isFinite(totals.profit) ? totals.profit : null,
                    oneDayChange: Number.isFinite(totals.prevDelta) ? totals.prevDelta : null,
                    oneDayChangePct: totals.month1 ? (totals.prevDelta / totals.month1) : null,
                    latestDate,
                },
                schemes: sortedRows.map((r) => ({
                    scheme_code: r.scheme_code,
                    scheme_name: r.scheme_name,
                    principal: Number.isFinite(r.principal) ? r.principal : null,
                    unit: Number.isFinite(r.unit) ? r.unit : null,
                    currentNav: Number.isFinite(r.nav) ? r.nav : null,
                    marketValue: Number.isFinite(r.marketValue) ? r.marketValue : null,
                    profit: Number.isFinite(r.profit) ? r.profit : null,
                    oneDayChange: Number.isFinite(r.prevDelta) ? r.prevDelta : null,
                    oneDayChangePct: (r.hist && r.hist[0] && Number.isFinite(r.hist[0].marketValue) && Number.isFinite(r.prevDelta)) ? (r.prevDelta / r.hist[0].marketValue) : null,
                    latestDate: r.latestDate || null,
                }))
            };
            latestPortfolioStateRef.current = portfolioState;
            fetchAIInsight(portfolioState);
        }
    }, [loading, error, rows]);

    // Schedule the expensive data fetch during idle time so the browser can
    // paint the initial UI faster. Falls back to a short timeout if
    // requestIdleCallback isn't available.
    useEffect(() => {
        let idleId = null;
        let timeoutId = null;
        const run = () => { load(); };
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(run, { timeout: 300 });
        } else {
            // Small delay to allow initial paint and avoid blocking the main thread
            timeoutId = window.setTimeout(run, 200);
        }
        return () => {
            if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, []);

    // ...existing code...

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // We'll compute totals after we derive per-row month values (rowsWithMonths)

    if (loading) {
        return (
            <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <CircularProgress aria-label="Loading portfolio" size={28} />
                </Box>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 2 }} />
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3, mb: 2 }} />
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2, mb: 1 }} />
                <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
                <Typography color="error">Error: {error}</Typography>
                <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    if (!rows.length) {
        return (
            <Box component="main" sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
                <SectionCard title="Start your mutual fund snapshot" eyebrow="No holdings added yet">
                    <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                        <Box sx={{ width: 58, height: 58, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', mx: 'auto', mb: 2 }}>
                            <AddCircleOutlineIcon />
                        </Box>
                        <Typography sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 950, lineHeight: 1.12 }}>
                            Add your first fund to unlock portfolio insights.
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 560, mx: 'auto' }}>
                            Search by mutual fund name, enter your principal or units, and MF Snapshot will build your private dashboard.
                        </Typography>
                        <Button variant="contained" size="large" sx={{ mt: 2.5 }} onClick={() => window.location.assign('/holdings')} startIcon={<AddCircleOutlineIcon />}>
                            Add holdings
                        </Button>
                    </Box>
                </SectionCard>
            </Box>
        );
    }

    const latestDate = rows.reduce((acc, r) => r.latestDate && (!acc || r.latestDate > acc) ? r.latestDate : acc, null);

    // compute target dates relative to latestDate: 1,2,3 months back
    let monthTargets = [null, null, null];
    if (latestDate) {
        const base = parseDMY(latestDate);
        if (base) {
            monthTargets = [1, 2, 3].map(i => {
                const d = new Date(base.getTime());
                d.setMonth(d.getMonth() - i);
                return d;
            });
        }
    }

    const month1Label = monthTargets[0] ? monthLabelShort(formatDMY(monthTargets[0])) : '';
    const month2Label = monthTargets[1] ? monthLabelShort(formatDMY(monthTargets[1])) : '';
    const month3Label = monthTargets[2] ? monthLabelShort(formatDMY(monthTargets[2])) : '';

    // Derive per-row month values (nearest NAV to each month target)
    const rowsWithMonths = rows.map(r => {
        const entries = r.entries || [];
        const months = monthTargets.map(t => {
            if (!t) return { date: null, marketValue: null };
            const found = findNearestEntry(entries, t);
            if (!found || (found.nav === undefined || found.nav === null)) return { date: null, marketValue: null };
            const nav = parseFloat(found.nav);
            const mv = (Number.isFinite(nav) && r.unit) ? (nav * r.unit) : null;
            return { date: found.date, marketValue: mv };
        });
        return { ...r, months };
    });

    // totals computed from rowsWithMonths
    const totals = rowsWithMonths.reduce((acc, r) => {
        acc.principal += Number(r.principal || 0);
        acc.marketValue += Number(r.marketValue || 0);
        acc.profit += Number(r.profit || 0);
        acc.prevDelta += Number(r.prevDelta || 0);
        acc.month1 += Number((r.months && r.months[0] && r.months[0].marketValue) || 0);
        acc.month2 += Number((r.months && r.months[1] && r.months[1].marketValue) || 0);
        acc.month3 += Number((r.months && r.months[2] && r.months[2].marketValue) || 0);
        return acc;
    }, { principal: 0, marketValue: 0, profit: 0, prevDelta: 0, month1: 0, month2: 0, month3: 0 });

    // sort rows by marketValue descending for display (null/invalid marketValues go last)
    const sortedRows = rowsWithMonths.slice().sort((a, b) => {
        const av = Number.isFinite(a.marketValue) ? a.marketValue : -Infinity;
        const bv = Number.isFinite(b.marketValue) ? b.marketValue : -Infinity;
        return bv - av;
    });

    // Progressive rendering: only render a subset of accordions initially to
    // reduce JS work and improve Total Blocking Time. User can expand to load more.
    const visibleRows = sortedRows.slice(0, visibleCount);
    const topAllocationRows = sortedRows
        .filter((row) => Number.isFinite(row.marketValue) && row.marketValue > 0)
        .slice(0, 5);

    const aiCards = Array.isArray(aiInsight?.cards) ? aiInsight.cards : [];
    const schemeNameMap = sortedRows.reduce((acc, row) => {
        acc[String(row.scheme_code)] = row.scheme_name;
        return acc;
    }, {});
    const formatRelatedSchemeName = (schemeCode) => {
        const rawName = schemeNameMap[String(schemeCode)];
        if (!rawName) return `Code ${schemeCode}`;
        return formatFundName(rawName);
    };
    const allocationItems = topAllocationRows.map((row) => ({
        label: formatFundName(row.scheme_name),
        value: row.marketValue
    }));
    const health = getPortfolioHealth(sortedRows, totals);
    const takeaways = buildTakeaways(sortedRows, totals, health);




    return (
        <>
            <a className="skip-link" href="#summary-card">Skip to summary</a>
            <Box component="main" aria-label="mutual-fund-tracker" ref={topRef} sx={(t) => ({
                px: { xs: 2, sm: 3 },
                py: { xs: 2.5, sm: 3 },
                maxWidth: 1180,
                mx: 'auto'
            })}>
                <Box component="header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box>
                        <Chip label="Live mutual fund snapshot" size="small" sx={{ fontWeight: 850, mb: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }} />
                        <Typography component="h1" sx={{ color: 'text.primary', fontWeight: 950, fontSize: { xs: 28, sm: 36 }, lineHeight: 1.08, letterSpacing: 0 }}>
                            {user?.name ? `${user.name}'s portfolio` : 'Portfolio snapshot'}
                        </Typography>
                        <Typography component="p" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: 14, sm: 16 }, mt: 0.75 }}>
                            Start with the important signals. Expand sections when you want the details.
                        </Typography>
                    </Box>
                    <Box role="group" aria-label="dashboard controls" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Refresh">
                            <LoadingButton aria-label="Refresh data" onClick={() => { setManualLoading(true); load().finally(() => setManualLoading(false)); }} startIcon={<RefreshIcon />} size="small" loading={manualLoading}>Refresh</LoadingButton>
                        </Tooltip>
                    </Box>
                </Box>



                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={28} /></Box>}>
                    <SummaryCard id="summary-card" totals={totals} latestDate={latestDate} month1Label={month1Label} month2Label={month2Label} month3Label={month3Label} />
                </Suspense>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.82fr 1.18fr' }, gap: 2, mb: 2 }}>
                    <SectionCard title="Portfolio Health" eyebrow="At a glance">
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 2, alignItems: 'center' }}>
                            <Box sx={(theme) => ({
                                width: 92,
                                height: 92,
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                border: '9px solid',
                                borderColor: `${health.tone}.main`,
                                bgcolor: '#ffffff'
                            })}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: 25, fontWeight: 950, lineHeight: 1 }}>{health.score}</Typography>
                                    <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 800 }}>score</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap' }}>
                                    <HealthAndSafetyOutlinedIcon color={health.tone} fontSize="small" />
                                    <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{health.status}</Typography>
                                    <Tooltip title="A simple guide based on diversification, concentration, and current return. It is not financial advice.">
                                        <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    </Tooltip>
                                </Stack>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13.5, lineHeight: 1.55 }}>
                                    Diversification is <b>{health.diversification.toLowerCase()}</b>, concentration is <b>{health.concentration.toLowerCase()}</b>, and the return trend is <b>{health.trend.toLowerCase()}</b>.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.25 }}>
                                    <Chip size="small" label={`${health.concentration} concentration`} />
                                    <Chip size="small" label={`${health.diversification} diversification`} />
                                </Box>
                            </Box>
                        </Box>
                    </SectionCard>

                    <SectionCard title="What You Should Know" eyebrow="Top insights" action={<TipsAndUpdatesOutlinedIcon color="primary" />}>
                        <Box sx={{ display: 'grid', gap: 1 }}>
                            {takeaways.map((item) => {
                                const color = item.tone === 'positive' ? 'success.main' : item.tone === 'caution' ? 'warning.main' : 'primary.main';
                                const Icon = item.tone === 'positive' ? TrendingUpIcon : item.tone === 'caution' ? WarningAmberIcon : InfoOutlinedIcon;
                                return (
                                    <Box key={item.title} sx={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', gap: 1.1, p: 1.15, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                        <Box sx={{ color, display: 'grid', placeItems: 'center' }}><Icon fontSize="small" /></Box>
                                        <Box>
                                            <Typography sx={{ fontSize: 14, fontWeight: 850 }}>{item.title}</Typography>
                                            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.2 }}>{item.text}</Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </SectionCard>
                </Box>

                {allocationItems.length ? (
                    <SectionCard title="Portfolio Allocation" eyebrow="Where your money is invested" sx={{ mb: 2 }}>
                        <DonutChart items={allocationItems} total={totals.marketValue} centerLabel="Total value" centerValue={formatCurrency(totals.marketValue, { compact: true })} />
                    </SectionCard>
                ) : null}

                {/* AI Summary Section */}
                <Box sx={{ mb: 1.25 }}>
                    <SectionCard
                        title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><AutoAwesomeIcon fontSize="small" /> AI Insights</Box>}
                        eyebrow="Plain-English observations"
                        action={(
                            <LoadingButton
                                aria-label="Refresh AI insights"
                                onClick={() => fetchAIInsight(latestPortfolioStateRef.current, { refresh: true })}
                                startIcon={<RefreshIcon />}
                                size="small"
                                loading={aiRefreshing}
                                disabled={!latestPortfolioStateRef.current || aiLoading}
                            >
                                Refresh AI
                            </LoadingButton>
                        )}
                    >
                            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: -1, mb: 1.5 }}>AI-generated observations based only on your shown portfolio data. Not financial advice.</Typography>
                            {aiInsight?.context ? (
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                                    {aiInsight.context.factsIncluded ? <Chip size="small" label="Portfolio facts checked" sx={{ fontWeight: 800 }} /> : null}
                                    {aiInsight.context.marketContextIncluded ? <Chip size="small" color="primary" label="Market context included" sx={{ fontWeight: 800 }} /> : null}
                                    {aiInsight.context.categoryInference ? (
                                        <Tooltip title="Fund categories are inferred from fund names where exact category metadata is unavailable.">
                                            <Chip size="small" label="Categories inferred" sx={{ fontWeight: 800 }} />
                                        </Tooltip>
                                    ) : null}
                                </Box>
                            ) : null}

                            {aiLoading && !aiInsight ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75 }}>
                                    <CircularProgress size={16} />
                                    <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Loading AI insights...</Typography>
                                </Box>
                            ) : null}

                            {aiError ? (
                                <Typography sx={{ fontSize: 14, color: 'error.main', lineHeight: 1.45, mb: aiInsight ? 1 : 0 }}>{aiError}</Typography>
                            ) : null}

                            {aiInsight?.summary ? (
                                <Typography sx={{ fontSize: { xs: 15, sm: 16 }, color: 'text.primary', lineHeight: 1.55, fontWeight: 750, mb: 1.5 }}>{aiInsight.summary}</Typography>
                            ) : null}

                            {aiCards.length ? (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1.25 }}>
                                    {aiCards.map((card, idx) => {
                                        const relatedNames = Array.isArray(card.relatedSchemes) ? card.relatedSchemes.map(formatRelatedSchemeName) : [];
                                        return (
                                            <InsightCard key={`${card.type}-${idx}`} card={card} relatedNames={relatedNames} />
                                        );
                                    })}
                                </Box>
                            ) : (!aiLoading && !aiError ? (
                                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>No AI insights available.</Typography>
                            ) : null)}
                    </SectionCard>
                </Box>

                {/* Holdings are managed on the dedicated /holdings page */}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mt: 2.5, mb: 1.25 }}>
                    <Box>
                        <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 950 }}>Funds You Hold</Typography>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.2 }}>Tap a fund to see advanced details like NAV, units, and fund ID.</Typography>
                    </Box>
                    <Chip label={`${sortedRows.length} funds`} size="small" sx={{ fontWeight: 850 }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visibleRows.map(r => (
                        <Suspense key={r.scheme_code} fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}><CircularProgress size={18} /></Box>}>
                            {/* Reserve approx height to avoid Cumulative Layout Shift when content loads */}
                            <Box sx={{ minHeight: 78 }}>
                                <SchemeAccordion r={r} totalValue={totals.marketValue} month1Label={month1Label} month2Label={month2Label} month3Label={month3Label} />
                            </Box>
                        </Suspense>
                    ))}

                    {sortedRows.length > visibleCount && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Button onClick={() => setVisibleCount(c => Math.min(sortedRows.length, c + 8))} size="small">Show more</Button>
                        </Box>
                    )}
                    {visibleCount > 8 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Button onClick={() => setVisibleCount(8)} size="small">Show less</Button>
                        </Box>
                    )}
                </Box>

                {/* Back to top button */}
                <BackToTop onClick={scrollToTop} />
            </Box>
        </>
    );
}
