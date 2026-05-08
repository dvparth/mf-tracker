import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RadarIcon from '@mui/icons-material/Radar';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { alpha } from '@mui/material/styles';

const iconBySeverity = {
    positive: <TrendingUpIcon fontSize="small" />,
    caution: <ErrorOutlineIcon fontSize="small" />,
    neutral: <RadarIcon fontSize="small" />
};

const typeLabel = {
    performance: 'Performance',
    concentration: 'Concentration',
    risk: 'Risk',
    watchpoint: 'Watchpoint'
};

export default function InsightCard({ card, relatedNames = [] }) {
    const [expanded, setExpanded] = useState(false);
    const severity = card?.severity || 'neutral';
    const tone = severity === 'positive' ? 'success.main' : severity === 'caution' ? 'warning.main' : 'primary.main';
    const toneKey = severity === 'positive' ? 'success' : severity === 'caution' ? 'warning' : 'primary';
    const message = card?.message || '';
    const shortMessage = message.length > 96 ? `${message.slice(0, 94).trim()}...` : message;
    const hasMore = message.length > 96 || relatedNames.length > 0;

    return (
        <Box sx={(theme) => ({
            position: 'relative',
            p: { xs: 1.35, sm: 1.55 },
            borderRadius: 2,
            background: `linear-gradient(180deg, ${alpha(theme.palette[toneKey].main, 0.045)}, rgba(255,255,255,0.86))`,
            border: `1px solid ${alpha(theme.palette[toneKey].main, 0.12)}`,
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.04)',
            transition: 'transform 180ms ease, box-shadow 180ms ease',
            '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 16px 38px rgba(15, 23, 42, 0.07)'
            }
        })}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.1 }}>
                <Box sx={(theme) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 1.5,
                    display: 'grid',
                    placeItems: 'center',
                    color: tone,
                    bgcolor: alpha(theme.palette[toneKey].main, 0.09),
                    flexShrink: 0
                })}>
                    {iconBySeverity[severity] || <ShieldOutlinedIcon fontSize="small" />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', mb: 0.55 }}>
                        <Typography sx={{ color: 'text.primary', fontSize: 14.5, fontWeight: 760, lineHeight: 1.25 }}>{card.title}</Typography>
                        <Chip label={typeLabel[card.type] || card.type || 'Insight'} size="small" sx={{ height: 21, fontSize: 10, fontWeight: 700, flexShrink: 0, bgcolor: 'rgba(255,255,255,0.7)' }} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12.8, lineHeight: 1.5 }}>{expanded ? message : shortMessage}</Typography>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={(theme) => ({ mt: 1, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.72)}` })}>
                            {relatedNames.length ? (
                                <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                                    Related funds: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{relatedNames.join(', ')}</Box>
                                </Typography>
                            ) : null}
                            <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: relatedNames.length ? 0.75 : 0 }}>
                                Confidence: Data-based observation. Review this with your own risk profile before acting.
                            </Typography>
                        </Box>
                    </Collapse>
                    {hasMore ? (
                        <Button size="small" onClick={() => setExpanded((value) => !value)} sx={{ mt: 0.55, px: 0, minHeight: 26, fontSize: 12.5 }}>
                            {expanded ? 'Less detail' : 'Details'}
                        </Button>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
}
