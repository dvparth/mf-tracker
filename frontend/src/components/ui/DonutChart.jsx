import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';

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
    const colors = ['#3157d8', '#0b8f69', '#7666d9', '#b26b21', '#148da4', '#64748b'];
    const [activeIndex, setActiveIndex] = useState(null);
    let cursor = 0;
    const normalized = items.filter((item) => Number(item.value) > 0);
    const largest = useMemo(() => normalized.reduce((acc, item) => Number(item.value) > Number(acc?.value || 0) ? item : acc, null), [normalized]);
    const activeItem = activeIndex !== null ? normalized[activeIndex] : largest;
    const activePct = activeItem && total ? (activeItem.value / total) * 100 : 0;

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' }, gap: { xs: 2, md: 3 }, alignItems: 'center' }}>
            <Box sx={{ position: 'relative', width: 220, height: 220, mx: { xs: 'auto', md: 0 } }}>
                <svg viewBox="0 0 180 180" width="220" height="220" role="img" aria-label="Portfolio allocation donut chart">
                    <defs>
                        <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="rgba(16,24,40,0.18)" />
                        </filter>
                    </defs>
                    <circle cx="90" cy="90" r="64" fill="none" stroke="#e9eef5" strokeWidth="17" />
                    {normalized.map((item, index) => {
                        const pct = total ? (item.value / total) * 100 : 0;
                        const start = cursor;
                        const end = cursor + (pct / 100) * 360;
                        cursor = end;
                        const active = activeIndex === null || activeIndex === index;
                        return (
                            <path
                                key={item.label}
                                d={describeArc(90, 90, 64, start, Math.max(start + 0.1, end - 1.8))}
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth={activeIndex === index ? 20 : 17}
                                strokeLinecap="round"
                                opacity={active ? 1 : 0.32}
                                filter={activeIndex === index ? 'url(#donut-shadow)' : 'none'}
                                style={{ transition: 'opacity 180ms ease, stroke-width 180ms ease' }}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            />
                        );
                    })}
                </svg>
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', px: 3 }}>
                    <Box>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 650 }}>{activeItem ? 'Largest weight' : centerLabel}</Typography>
                        <Typography sx={{ fontSize: 23, color: 'text.primary', fontWeight: 780, lineHeight: 1.05 }}>{activePct ? `${activePct.toFixed(1)}%` : centerValue}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.4 }}>{centerValue}</Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'grid', gap: 1.1 }}>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 0.35 }}>
                    <Chip label={`${normalized.length} leading positions`} size="small" sx={{ bgcolor: 'rgba(49,87,216,0.08)', color: 'primary.dark', fontWeight: 700 }} />
                    {largest ? <Chip label={`Top: ${((largest.value / total) * 100).toFixed(1)}%`} size="small" sx={{ bgcolor: 'rgba(11,143,105,0.08)', color: 'success.main', fontWeight: 700 }} /> : null}
                </Box>
                {normalized.slice(0, 6).map((item, index) => {
                    const pct = total ? (item.value / total) * 100 : 0;
                    const active = activeIndex === index;
                    return (
                        <Box
                            key={item.label}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                            sx={(theme) => ({
                                display: 'grid',
                                gridTemplateColumns: '12px minmax(0, 1fr) auto',
                                gap: 1,
                                alignItems: 'center',
                                p: 0.75,
                                borderRadius: 1.5,
                                bgcolor: active ? alpha(theme.palette.primary.main, 0.055) : 'transparent',
                                transition: 'background-color 160ms ease'
                            })}
                        >
                            <Box sx={{ width: 9, height: 9, borderRadius: 999, bgcolor: colors[index % colors.length], boxShadow: `0 0 0 4px ${alpha(colors[index % colors.length], 0.10)}` }} />
                            <Typography sx={{ fontSize: 13, fontWeight: active ? 760 : 620, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: 12.5, color: active ? 'text.primary' : 'text.secondary', fontWeight: 720 }}>{pct.toFixed(1)}%</Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
