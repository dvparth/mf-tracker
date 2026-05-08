import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import { fmtUnit, formatCurrency, formatFundName, monthLabelShort, accentColor, dateShort, fmtAmount, formatPercent } from '../utils/formatters';
import MiniSparkline from './ui/MiniSparkline';
import InfoTooltip from './ui/InfoTooltip';

function DetailMetric({ label, value, tone = 'text.primary' }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography component="div" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>{label}</Typography>
            <Typography sx={{ fontSize: 15, color: tone, fontWeight: 850, mt: 0.25, overflowWrap: 'anywhere' }}>{value}</Typography>
        </Box>
    );
}

export default function SchemeAccordion({ r, totalValue = 0, month1Label, month2Label, month3Label }) {
    const pct = (r.hist[0] && r.hist[0].marketValue) ? ((r.prevDelta / r.hist[0].marketValue) * 100) : null;
    const profitPct = (r.principal && r.profit !== null) ? ((r.profit / r.principal) * 100) : null;
    const allocationPct = totalValue && r.marketValue ? (r.marketValue / totalValue) * 100 : 0;
    const profitTone = r.profit > 0 ? 'success.main' : r.profit < 0 ? 'error.main' : 'text.secondary';
    const dayTone = r.prevDelta > 0 ? 'success.main' : r.prevDelta < 0 ? 'error.main' : 'text.secondary';
    const sparkValues = [
        r.months?.[2]?.marketValue,
        r.months?.[1]?.marketValue,
        r.months?.[0]?.marketValue,
        r.marketValue
    ].map((value) => Number(value));
    const sparkTone = r.profit > 0 ? 'positive' : r.profit < 0 ? 'negative' : 'neutral';
    const estimatedValueHelp = 'Estimated value of this fund using your current units on a past date. This may differ from actual past value if you bought or sold units.';

    return (
        <Accordion
            id={`scheme-${r.scheme_code}`}
            component="article"
            aria-label={`scheme-${r.scheme_code}`}
            disableGutters
            sx={(theme) => ({
                borderRadius: 2.25,
                overflow: 'hidden',
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 12px 32px rgba(15,23,42,0.06)',
                transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: alpha(accentColor(r.prevDelta), 0.38),
                    boxShadow: '0 18px 44px rgba(15,23,42,0.10)'
                }
            })}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`scheme-${r.scheme_code}-content`} id={`scheme-${r.scheme_code}-header`} sx={{ px: { xs: 1.5, sm: 2 }, py: 0.65 }}>
                <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 150px auto' }, gap: { xs: 1.4, md: 2 }, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography component="h3" sx={{ fontSize: { xs: 15, sm: 16 }, fontWeight: 900, color: 'text.primary', lineHeight: 1.25 }}>
                                {formatFundName(r.scheme_name)}
                            </Typography>
                            <Chip size="small" label={`${allocationPct.toFixed(1)}%`} sx={{ height: 22, fontSize: 11, fontWeight: 850, bgcolor: 'action.hover' }} />
                        </Box>
                        <Box sx={{ mt: 0.9, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 54px', gap: 1, alignItems: 'center', maxWidth: 560 }}>
                            <Box sx={{ height: 7, borderRadius: 999, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                                <Box sx={{ width: `${Math.min(100, Math.max(0, allocationPct))}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #2563eb, #0f9f6e)' }} />
                            </Box>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 750, textAlign: 'right' }}>{allocationPct.toFixed(1)}%</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: { xs: 'none', md: 'block' }, justifySelf: 'center' }}>
                        <MiniSparkline values={sparkValues} tone={sparkTone} />
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { md: 235 } }}>
                        <Typography sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 950, color: 'text.primary', lineHeight: 1.05 }}>
                            {r.marketValue !== null ? formatCurrency(r.marketValue) : '-'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1, mt: 0.65, flexWrap: 'wrap' }}>
                            <Typography sx={{ color: profitTone, fontSize: 13, fontWeight: 850 }}>
                                {r.profit !== null ? `${formatCurrency(r.profit)} ${profitPct !== null ? `(${formatPercent(profitPct)})` : ''}` : '-'}
                            </Typography>
                            <Typography sx={{ color: dayTone, fontSize: 12, fontWeight: 800 }}>
                                {r.prevDelta !== null ? `1D ${formatCurrency(r.prevDelta)} ${pct !== null ? `(${formatPercent(pct)})` : ''}` : ''}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 0, pb: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
                    <DetailMetric label="Money invested" value={formatCurrency(r.principal)} />
                    <DetailMetric label="Units held" value={fmtUnit(r.unit)} />
                    <DetailMetric
                        label={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>Fund NAV <InfoTooltip title="NAV is the per-unit price of the mutual fund on the latest available date." ariaLabel="Fund NAV explanation" size={13} /></Box>}
                        value={`₹${r.nav !== null ? fmtAmount(r.nav) : '-'}`}
                    />
                    <DetailMetric
                        label={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>{r.months?.[0]?.date ? monthLabelShort(r.months[0].date) : month1Label} estimate <InfoTooltip title={estimatedValueHelp} ariaLabel="Estimated value explanation" size={13} /></Box>}
                        value={r.months?.[0]?.marketValue !== null ? formatCurrency(r.months?.[0]?.marketValue) : '-'}
                    />
                    <DetailMetric
                        label={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>{r.months?.[1]?.date ? monthLabelShort(r.months[1].date) : month2Label} estimate <InfoTooltip title={estimatedValueHelp} ariaLabel="Estimated value explanation" size={13} /></Box>}
                        value={r.months?.[1]?.marketValue !== null ? formatCurrency(r.months?.[1]?.marketValue) : '-'}
                    />
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5 }}>Fund ID {r.scheme_code}{r.latestDate ? ` · Updated ${dateShort(r.latestDate)}` : ''}</Typography>
            </AccordionDetails>
        </Accordion>
    );
}
