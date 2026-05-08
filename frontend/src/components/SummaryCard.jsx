import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { alpha } from '@mui/material/styles';
import { dateShort, formatCurrency, formatPercent } from '../utils/formatters';
import InfoTooltip from './ui/InfoTooltip';

function HelpLabel({ label, help }) {
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.45 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 650 }}>{label}</Typography>
            {help ? (
                <InfoTooltip title={help} ariaLabel={`${label} explanation`} size={14} />
            ) : null}
        </Box>
    );
}

function MetricTile({ label, value, helper, tone = 'default', icon, help }) {
    const toneColor = tone === 'positive' ? 'success.main' : tone === 'negative' ? 'error.main' : 'text.primary';

    return (
        <Box sx={(theme) => ({
            p: { xs: 1.25, sm: 1.5 },
            borderRadius: 1.75,
            backgroundColor: alpha('#ffffff', 0.68),
            border: `1px solid ${alpha('#d8e0ea', 0.58)}`,
            minWidth: 0
        })}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <HelpLabel label={label} help={help} />
                <Box sx={{ color: toneColor, display: 'inline-flex' }}>{icon}</Box>
            </Box>
            <Typography sx={{ color: toneColor, fontSize: { xs: 17, sm: 20 }, fontWeight: 760, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</Typography>
            {helper ? <Typography sx={{ color: 'text.secondary', fontSize: 11.5, mt: 0.65 }}>{helper}</Typography> : null}
        </Box>
    );
}

export default function SummaryCard({ id, totals, latestDate, month1Label, month2Label, month3Label }) {
    const oneDayPct = totals.month1 ? (totals.prevDelta / totals.month1) * 100 : null;
    const returnPct = totals.principal ? (totals.profit / totals.principal) * 100 : null;
    const positiveReturn = Number(totals.profit) >= 0;
    const positiveDay = Number(totals.prevDelta) >= 0;
    const trendIcon = positiveDay ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />;
    const estimatedTrendHelp = 'Your current units valued with older NAVs. This is an estimate, not your exact past portfolio value if you bought or sold units during the period.';

    return (
        <Card id={id} component="section" aria-label="portfolio summary" sx={{ mb: 2.25, overflow: 'hidden', borderRadius: 3, border: 0, boxShadow: '0 22px 70px rgba(16,24,40,0.08)' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)' }, gap: { xs: 2, md: 3 }, alignItems: 'stretch' }}>
                    <Box sx={(theme) => ({
                        position: 'relative',
                        overflow: 'hidden',
                        p: { xs: 2.25, sm: 3 },
                        borderRadius: 3,
                        color: '#ffffff',
                        background: [
                            'radial-gradient(circle at 86% 8%, rgba(173, 216, 210, 0.24), transparent 18rem)',
                            'radial-gradient(circle at 20% 105%, rgba(132, 157, 224, 0.24), transparent 20rem)',
                            'linear-gradient(135deg, #111827 0%, #243b73 48%, #1d5d59 100%)'
                        ].join(','),
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 24px 62px rgba(15, 23, 42, 0.18)'
                    })}>
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent 42%)', pointerEvents: 'none' }} />
                        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography sx={{ color: alpha('#ffffff', 0.72), fontSize: 13, fontWeight: 620 }}>Current value</Typography>
                                <Typography component="h2" sx={{ fontSize: { xs: 33, sm: 43 }, fontWeight: 780, lineHeight: 1.02, mt: 0.75, letterSpacing: 0 }}>
                                    {formatCurrency(totals.marketValue)}
                                </Typography>
                            </Box>
                            <Box sx={{ px: 1.25, py: 0.75, borderRadius: 999, backgroundColor: alpha('#ffffff', 0.12), color: alpha('#ffffff', 0.86), fontSize: 12, fontWeight: 650, whiteSpace: 'nowrap', border: `1px solid ${alpha('#ffffff', 0.14)}` }}>
                                {latestDate ? dateShort(latestDate) : 'Latest NAV'}
                            </Box>
                        </Box>

                        <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.25 }}>
                            <Box>
                                <Typography sx={{ color: alpha('#ffffff', 0.68), fontSize: 12 }}>Money invested</Typography>
                                <Typography sx={{ color: '#ffffff', fontSize: 18, fontWeight: 720 }}>{formatCurrency(totals.principal)}</Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: alpha('#ffffff', 0.68), fontSize: 12 }}>Total gain/loss</Typography>
                                <Typography sx={{ color: positiveReturn ? '#9eeac6' : '#fecaca', fontSize: 18, fontWeight: 720 }}>
                                    {formatCurrency(totals.profit)} {returnPct !== null ? `(${formatPercent(returnPct)})` : ''}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ color: alpha('#ffffff', 0.68), fontSize: 12 }}>Latest gain/loss</Typography>
                                <Typography sx={{ color: positiveDay ? '#9eeac6' : '#fecaca', fontSize: 18, fontWeight: 720 }}>
                                    {formatCurrency(totals.prevDelta)} {oneDayPct !== null ? `(${formatPercent(oneDayPct)})` : ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr' }, gap: 1.25 }}>
                        <MetricTile label="Overall return" help="How much your portfolio has gained or lost compared with the money you invested." value={returnPct !== null ? formatPercent(returnPct) : '-'} helper={formatCurrency(totals.profit)} tone={positiveReturn ? 'positive' : 'negative'} icon={positiveReturn ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />} />
                        <MetricTile label="Latest change" help="How much the portfolio changed compared with the previous available NAV date." value={oneDayPct !== null ? formatPercent(oneDayPct) : '-'} helper={formatCurrency(totals.prevDelta)} tone={positiveDay ? 'positive' : 'negative'} icon={trendIcon} />
                    </Box>
                </Box>

                <Box sx={{ mt: 1.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 720 }}>Estimated past value</Typography>
                        <InfoTooltip title={estimatedTrendHelp} ariaLabel="Estimated value trend explanation" size={15} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.25 }}>
                        <MetricTile label={month1Label || '1 month'} value={formatCurrency(totals.month1)} helper="Current units at past NAV" help={estimatedTrendHelp} icon={<CalendarTodayIcon fontSize="small" />} />
                        <MetricTile label={month2Label || '2 months'} value={formatCurrency(totals.month2)} helper="Current units at past NAV" help={estimatedTrendHelp} icon={<SavingsIcon fontSize="small" />} />
                        <MetricTile label={month3Label || '3 months'} value={formatCurrency(totals.month3)} helper="Current units at past NAV" help={estimatedTrendHelp} icon={<AccountBalanceWalletIcon fontSize="small" />} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}
