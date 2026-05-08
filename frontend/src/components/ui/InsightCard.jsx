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
    const message = card?.message || '';
    const shortMessage = message.length > 120 ? `${message.slice(0, 118).trim()}...` : message;
    const hasMore = message.length > 120 || relatedNames.length > 0;

    return (
        <Box sx={(theme) => ({
            position: 'relative',
            p: 1.75,
            borderRadius: 2.5,
            backgroundColor: '#ffffff',
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: `4px solid ${theme.palette[severity === 'positive' ? 'success' : severity === 'caution' ? 'warning' : 'primary'].main}`,
            boxShadow: '0 10px 26px rgba(15, 23, 42, 0.05)'
        })}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <Box sx={(theme) => ({
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: tone,
                    bgcolor: alpha(theme.palette[severity === 'positive' ? 'success' : severity === 'caution' ? 'warning' : 'primary'].main, 0.10),
                    flexShrink: 0
                })}>
                    {iconBySeverity[severity] || <ShieldOutlinedIcon fontSize="small" />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', mb: 0.7 }}>
                        <Typography sx={{ color: 'text.primary', fontSize: 15, fontWeight: 950, lineHeight: 1.25 }}>{card.title}</Typography>
                        <Chip label={typeLabel[card.type] || card.type || 'Insight'} size="small" sx={{ height: 22, fontSize: 10, fontWeight: 900, flexShrink: 0 }} />
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13, lineHeight: 1.55 }}>{expanded ? message : shortMessage}</Typography>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            {relatedNames.length ? (
                                <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                                    Related funds: <Box component="span" sx={{ color: 'text.primary', fontWeight: 800 }}>{relatedNames.join(', ')}</Box>
                                </Typography>
                            ) : null}
                            <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: relatedNames.length ? 0.75 : 0 }}>
                                Confidence: Data-based observation. Review this with your own risk profile before acting.
                            </Typography>
                        </Box>
                    </Collapse>
                    {hasMore ? (
                        <Button size="small" onClick={() => setExpanded((value) => !value)} sx={{ mt: 0.65, px: 0, minHeight: 28 }}>
                            {expanded ? 'Show less' : 'What does this mean?'}
                        </Button>
                    ) : null}
                </Box>
            </Box>
        </Box>
    );
}
