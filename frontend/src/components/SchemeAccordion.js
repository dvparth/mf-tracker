import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { fmtUnit, fmtRoundUp, toTitleCase, monthLabelShort, accentColor, dateShort, fmtAmount } from '../utils/formatters';

export default function SchemeAccordion({ r, month1Label, month2Label, month3Label }) {
    const pct = (r.hist[0] && r.hist[0].marketValue) ? ((r.prevDelta / r.hist[0].marketValue) * 100) : null;
    const profitPct = (r.principal && r.profit !== null) ? ((r.profit / r.principal) * 100) : null;
    return (
        <Accordion id={`scheme-${r.scheme_code}`} component="article" aria-label={`scheme-${r.scheme_code}`}
            key={r.scheme_code}
            disableGutters
            sx={(theme) => ({
                borderRadius: 2,
                borderLeft: '4px solid',
                borderLeftColor: accentColor(r.prevDelta),
                background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                boxShadow: theme.palette.mode === 'dark' ? '0 6px 18px rgba(0,0,0,0.6)' : '0 6px 18px rgba(15,23,36,0.03)',
                transition: 'transform .18s ease, box-shadow .18s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.palette.mode === 'dark' ? '0 12px 28px rgba(0,0,0,0.7)' : '0 10px 28px rgba(15,23,36,0.08)' },
                '&:hover .invested-amt': { color: theme.palette.text.primary, transform: 'translateY(-1px)' }
            })}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`scheme-${r.scheme_code}-content`} id={`scheme-${r.scheme_code}-header`}>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '62%' }}>
                        <Typography component="h3" sx={{ fontSize: '0.98rem', fontWeight: 800, color: 'text.primary' }}>{toTitleCase(r.scheme_name)}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{r.unit ? `${fmtUnit(r.unit)} units` : ''} • NAV: ₹{r.nav !== null ? fmtAmount(r.nav) : '-'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                        <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>₹{r.marketValue !== null ? fmtRoundUp(r.marketValue) : '-'}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }} style={{ color: accentColor(r.profit) }}>{r.profit !== null ? `₹${fmtRoundUp(r.profit)}` : '-'}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', ml: 0.5 }} style={{ color: accentColor(r.profit) }}>{profitPct !== null ? `${profitPct > 0 ? '+' : ''}${profitPct.toFixed(2)}%` : ''}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: accentColor(r.prevDelta), fontWeight: 700 }}>{r.prevDelta !== null ? `${r.prevDelta > 0 ? '+' : ''}₹${fmtRoundUp(r.prevDelta)} ${pct !== null ? `(${pct.toFixed(2)}%)` : ''}` : ''}</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>{r.latestDate ? dateShort(r.latestDate) : ''}</Typography>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={1} alignItems="center">
                    <Grid item xs={3} sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Invested</Typography>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>₹{fmtRoundUp(r.principal)}</Typography>
                    </Grid>
                    <Grid item xs={3} sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', textAlign: 'left' }}>{r.months && r.months[0] && r.months[0].date ? monthLabelShort(r.months[0].date) : month1Label}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: (r.months && r.months[0] && Number(r.months[0].marketValue) > Number(r.marketValue) ? 'success.main' : 'text.primary'), textAlign: 'left' }}>₹{r.months && r.months[0] && r.months[0].marketValue !== null ? fmtRoundUp(r.months[0].marketValue) : '-'}</Typography>
                    </Grid>
                    <Grid item xs={3} sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', textAlign: 'left' }}>{r.months && r.months[1] && r.months[1].date ? monthLabelShort(r.months[1].date) : month2Label}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: (r.months && r.months[1] && Number(r.months[1].marketValue) > Number(r.marketValue) ? 'success.main' : 'text.primary'), textAlign: 'left' }}>₹{r.months && r.months[1] && r.months[1].marketValue !== null ? fmtRoundUp(r.months[1].marketValue) : '-'}</Typography>
                    </Grid>
                    <Grid item xs={3} sx={{ flex: 1, textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', textAlign: 'left' }}>{r.months && r.months[2] && r.months[2].date ? monthLabelShort(r.months[2].date) : month3Label}</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: (r.months && r.months[2] && Number(r.months[2].marketValue) > Number(r.marketValue) ? 'success.main' : 'text.primary'), textAlign: 'left' }}>₹{r.months && r.months[2] && r.months[2].marketValue !== null ? fmtRoundUp(r.months[2].marketValue) : '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
}
