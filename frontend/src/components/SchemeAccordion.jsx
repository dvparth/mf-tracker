import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import { fmtUnit, formatCurrency, formatFundName, monthLabelShort, accentColor, dateShort, fmtAmount, formatPercent } from '../utils/formatters';
import MiniSparkline from './ui/MiniSparkline';
import InfoTooltip from './ui/InfoTooltip';

function DetailMetric({ label, value, tone = 'text.primary' }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography component="div" sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 620 }}>{label}</Typography>
            <Typography sx={{ fontSize: 14, color: tone, fontWeight: 720, mt: 0.25, overflowWrap: 'anywhere' }}>{value}</Typography>
        </Box>
    );
}

export default function SchemeAccordion({ r, totalValue = 0, month1Label, month2Label, month3Label }) {
    const pct = (r.hist[0] && r.hist[0].marketValue) ? ((r.prevDelta / r.hist[0].marketValue) * 100) : null;
    const profitPct = (r.principal && r.profit !== null) ? ((r.profit / r.principal) * 100) : null;
    const allocationPct = totalValue && r.marketValue ? (r.marketValue / totalValue) * 100 : 0;
    const profitTone = r.profit > 0 ? 'success.main' : r.profit < 0 ? 'error.main' : 'text.secondary';
    const dayTone = r.prevDelta > 0 ? 'success.main' : r.prevDelta < 0 ? 'error.main' : 'text.secondary';
    const accent = accentColor(r.prevDelta);
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
                borderRadius: 2,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.74)',
                border: `1px solid ${alpha(theme.palette.divider, 0.62)}`,
                boxShadow: '0 8px 26px rgba(15,23,42,0.035)',
                transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease, background-color .18s ease',
                '&:before': { display: 'none' },
                '&:hover': {
                    transform: 'translateY(-1px)',
                    background: '#ffffff',
                    borderColor: alpha(accent, 0.34),
                    boxShadow: '0 16px 40px rgba(15,23,42,0.075)'
                },
                '&.Mui-expanded': {
                    margin: 0,
                    background: '#ffffff',
                    boxShadow: '0 18px 46px rgba(15,23,42,0.08)'
                }
            })}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`scheme-${r.scheme_code}-content`}
                id={`scheme-${r.scheme_code}-header`}
                sx={{
                    px: { xs: 1.35, sm: 1.75 },
                    py: { xs: 0.55, sm: 0.45 },
                    minHeight: { xs: 68, sm: 72 },
                    '& .MuiAccordionSummary-content': { my: 0.7 }
                }}
            >
                <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 154px minmax(210px, auto)' }, gap: { xs: 1, md: 2 }, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                            <Typography component="h3" sx={{ fontSize: { xs: 14.5, sm: 15.5 }, fontWeight: 730, color: 'text.primary', lineHeight: 1.25 }}>
                                {formatFundName(r.scheme_name)}
                            </Typography>
                            <Chip size="small" label={`${allocationPct.toFixed(1)}%`} sx={{ height: 21, fontSize: 11, fontWeight: 680, bgcolor: 'rgba(49,87,216,0.08)', color: 'primary.dark' }} />
                        </Box>
                        <Box sx={{ mt: 0.85, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 1, alignItems: 'center', maxWidth: 520 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(100, Math.max(0, allocationPct))}
                                sx={{
                                    height: 5,
                                    borderRadius: 999,
                                    backgroundColor: 'rgba(15,23,42,0.07)',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 999,
                                        background: `linear-gradient(90deg, ${alpha(accent, 0.72)}, ${accent})`
                                    }
                                }}
                            />
                            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 620 }}>{allocationPct.toFixed(1)}%</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: { xs: 'none', md: 'block' }, justifySelf: 'center' }}>
                        <MiniSparkline values={sparkValues} tone={sparkTone} />
                    </Box>

                    <Box sx={{ textAlign: { xs: 'left', md: 'right' }, minWidth: { md: 220 } }}>
                        <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 760, color: 'text.primary', lineHeight: 1.05 }}>
                            {r.marketValue !== null ? formatCurrency(r.marketValue) : '-'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 0.9, mt: 0.55, flexWrap: 'wrap' }}>
                            <Typography sx={{ color: profitTone, fontSize: 12.5, fontWeight: 720 }}>
                                {r.profit !== null ? `${formatCurrency(r.profit)} ${profitPct !== null ? `(${formatPercent(profitPct)})` : ''}` : '-'}
                            </Typography>
                            <Typography sx={{ color: dayTone, fontSize: 11.5, fontWeight: 670 }}>
                                {r.prevDelta !== null ? `1D ${formatCurrency(r.prevDelta)} ${pct !== null ? `(${formatPercent(pct)})` : ''}` : ''}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 1.35, sm: 1.75 }, pt: 0, pb: 1.55 }}>
                <Box sx={(theme) => ({ height: 1, bgcolor: alpha(theme.palette.divider, 0.68), mb: 1.25 })} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: { xs: 1.2, md: 1.5 } }}>
                    <DetailMetric label="Money invested" value={formatCurrency(r.principal)} />
                    <DetailMetric label="Units held" value={fmtUnit(r.unit)} />
                    <DetailMetric
                        label={<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>Fund NAV <InfoTooltip title="NAV is the per-unit price of the mutual fund on the latest available date." ariaLabel="Fund NAV explanation" size={13} /></Box>}
                        value={r.nav !== null ? `Rs ${fmtAmount(r.nav)}` : '-'}
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
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 1.25 }}>Fund ID {r.scheme_code}{r.latestDate ? ` | Updated ${dateShort(r.latestDate)}` : ''}</Typography>
            </AccordionDetails>
        </Accordion>
    );
}
