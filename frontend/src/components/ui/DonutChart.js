import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function polarToCartesian(cx, cy, radius, angle) {
    const radians = (angle - 90) * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians)
    };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function DonutChart({ items = [], total = 0, centerLabel = 'Allocation', centerValue = '' }) {
    const colors = ['#2563eb', '#0f9f6e', '#7c3aed', '#d97706', '#0891b2', '#64748b'];
    let cursor = 0;
    const normalized = items.filter((item) => Number(item.value) > 0);

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '170px minmax(0, 1fr)' }, gap: 2, alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: 170, height: 170, mx: { xs: 'auto', sm: 0 } }}>
                <svg viewBox="0 0 160 160" width="170" height="170" role="img" aria-label="Portfolio allocation donut chart">
                    <circle cx="80" cy="80" r="58" fill="none" stroke="#e2e8f0" strokeWidth="18" />
                    {normalized.map((item, index) => {
                        const pct = total ? (item.value / total) * 100 : 0;
                        const start = cursor;
                        const end = cursor + (pct / 100) * 360;
                        cursor = end;
                        return (
                            <path
                                key={item.label}
                                d={describeArc(80, 80, 58, start, Math.max(start + 0.1, end - 1))}
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth="18"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </svg>
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', px: 3 }}>
                    <Box>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 800 }}>{centerLabel}</Typography>
                        <Typography sx={{ fontSize: 18, color: 'text.primary', fontWeight: 950, lineHeight: 1.1 }}>{centerValue}</Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'grid', gap: 1 }}>
                {normalized.slice(0, 6).map((item, index) => {
                    const pct = total ? (item.value / total) * 100 : 0;
                    return (
                        <Box key={item.label} sx={{ display: 'grid', gridTemplateColumns: '12px minmax(0, 1fr) auto', gap: 1, alignItems: 'center' }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: colors[index % colors.length] }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 850 }}>{pct.toFixed(1)}%</Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
