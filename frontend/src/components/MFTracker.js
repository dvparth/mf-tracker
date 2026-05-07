import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import LoadingButton from './LoadingButton';
import '../components/styles/common.css';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import RefreshIcon from '@mui/icons-material/Refresh';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Suspense } from 'react';
import BackToTop from './BackToTop';
import './styles/header.css';
import { parseDMY, formatDMY, findNearestEntry, monthLabelShort } from '../utils/formatters';
import { getAIModel } from '../config/runtimeConfig';
import { fetchSchemeDataUsingAdapter } from '../adapters/mfAdapters';

const SummaryCard = React.lazy(() => import('./SummaryCard'));
const SchemeAccordion = React.lazy(() => import('./SchemeAccordion'));

export default function MFTracker({ user, darkMode, setDarkMode }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Visible count for progressive rendering (declare with other hooks)
    const [visibleCount, setVisibleCount] = useState(8);
    // UI state for scrolling helpers (declare before any early returns)
    const topRef = useRef(null);
    const [aiSummary, setAiSummary] = useState('');


    // Adapter selection is now handled by REACT_APP_DATA_ADAPTER env var in mfAdapters.js

    const [manualLoading, setManualLoading] = useState(false);

    const fetchAISummary = async (portfolioState) => {
        try {
            const backend = process.env.REACT_APP_BACKEND_URL || '';
            const model = getAIModel();
            const requestBody = {
                portfolio: portfolioState,
                provider: "github",
                model: "gpt-4o-mini",
                fallback: {
                    provider: "huggingface",
                    model: model
                }
            };
            const response = await fetch(`${backend}/api/portfolioInsight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });
            if (response.ok) {
                const data = await response.json();
                console.log('AI Summary API response:', data);
                setAiSummary(data.insight || 'No summary available');
            } else {
                // Handle error responses with specific messages
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = 'Failed to load AI summary';
                
                if (response.status === 402) {
                    // Credit Depletion
                    errorMessage = errorData.body?.message || 'Your AI credits have been depleted. Please subscribe to continue using portfolio insights.';
                } else if (response.status >= 500) {
                    // Service Unavailable (5xx)
                    errorMessage = errorData.body?.message || 'The AI service is temporarily unavailable. Please try again in a few moments.';
                } else if (errorData.body?.message) {
                    errorMessage = errorData.body.message;
                }
                
                setAiSummary(errorMessage);
            }
        } catch (err) {
            setAiSummary('Error loading AI summary');
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
            // fetch through adapter(s) to keep MFTracker decoupled from API shape
            const results = await fetchSchemeDataUsingAdapter(tracked);
            // Create a lookup map for results by schemeCode (results may be in different order)
            const resultsMap = {};
            results.forEach(result => {
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
            fetchAISummary(portfolioState);
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
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">Error: {error}</Typography>
                <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={{ mt: 2 }}>Retry</Button>
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




    return (
        <>
            <a className="skip-link" href="#summary-card">Skip to summary</a>
            <Box component="main" aria-label="mutual-fund-tracker" ref={topRef} sx={(t) => ({
                p: { xs: 1.5, sm: 2 }, maxWidth: '980px', mx: 'auto', borderRadius: 2,
                background: (t.palette && t.palette.mode === 'dark') ? 'linear-gradient(135deg, #070210 0%, #120428 40%, #1b0f3d 100%)' : 'linear-gradient(135deg, rgba(99,91,255,0.18), rgba(99,91,255,0.06))',
                boxShadow: (t.palette && t.palette.mode === 'dark') ? '0 20px 60px rgba(6,6,20,0.75)' : '0 12px 40px rgba(99,91,255,0.12)',
                border: (t.palette && t.palette.mode === 'dark') ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(6px) saturate(110%)',
                WebkitBackdropFilter: 'blur(6px) saturate(110%)'
            })}>
                {/* Sticky header with navigation */}
                <Box component="header" className="sticky-header" sx={(t) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, color: 'text.primary', background: t.palette.mode === 'dark' ? 'rgba(8,8,12,0.6)' : 'rgba(255,255,255,0.95)', borderBottom: t.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(15,23,36,0.04)' })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography component="h1" sx={{ color: 'text.primary', fontWeight: 900, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>{user?.name || 'User'}</Typography>
                            <Typography component="p" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, mt: 0.25 }}>Personal MF Snapshot</Typography>
                        </Box>
                    </Box>

                    {/* navigation links removed per design request */}

                    <Box role="group" aria-label="controls" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Refresh">
                            <LoadingButton aria-label="Refresh data" onClick={() => { setManualLoading(true); load().finally(() => setManualLoading(false)); }} startIcon={<RefreshIcon />} size="small" loading={manualLoading}>Refresh</LoadingButton>
                        </Tooltip>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', zIndex: 20 }}>
                            <Switch checked={!!darkMode} onChange={(e, checked) => setDarkMode && setDarkMode(checked)} inputProps={{ 'aria-label': 'toggle dark mode' }} />
                        </Box>
                    </Box>
                </Box>



                <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={28} /></Box>}>
                    <SummaryCard id="summary-card" totals={totals} latestDate={latestDate} month1Label={month1Label} month2Label={month2Label} month3Label={month3Label} />
                </Suspense>

                {/* AI Summary Section */}
                <Box sx={{ p: '2px', background: 'linear-gradient(135deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 57%, #4b0082 71%, #9400d3 85%)', borderRadius: 2, mb: 1.25, boxShadow: '0 0 10px rgba(255,0,0,0.6), 0 0 15px rgba(255,127,0,0.5), 0 0 20px rgba(255,255,0,0.4), 0 0 25px rgba(0,255,0,0.3), 0 0 30px rgba(0,0,255,0.2)' }}>
                    <Card elevation={4} sx={(theme) => ({ background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff', boxShadow: theme.palette.mode === 'dark' ? '0 6px 18px rgba(0,0,0,0.6)' : '0 6px 18px rgba(31,42,68,0.05)', border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.12)' })}>
                        <CardContent sx={{ py: 1, px: { xs: 1.25, sm: 2 } }}>
                            <Typography component="h2" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: 'text.primary', fontWeight: 900, mb: 1 }}>AI Summary</Typography>
                            <Typography sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.5 }}>{aiSummary || 'Loading AI summary...'}</Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Holdings are managed on the dedicated /holdings page */}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {visibleRows.map(r => (
                        <Suspense key={r.scheme_code} fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}><CircularProgress size={18} /></Box>}>
                            {/* Reserve approx height to avoid Cumulative Layout Shift when content loads */}
                            <Box sx={{ minHeight: 64 }}>
                                <SchemeAccordion r={r} month1Label={month1Label} month2Label={month2Label} month3Label={month3Label} />
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
