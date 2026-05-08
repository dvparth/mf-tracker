import React, { useId } from 'react';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

function buildPath(values, width, height, padding) {
    const finite = values.filter(Number.isFinite);
    if (finite.length < 2) return '';
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const range = max - min || 1;
    const step = (width - padding * 2) / (values.length - 1);

    const points = values.map((value, index) => {
        const safeValue = Number.isFinite(value) ? value : min;
        const x = padding + index * step;
        const y = height - padding - ((safeValue - min) / range) * (height - padding * 2);
        return { x, y };
    });

    return points.map((point, index) => {
        if (index === 0) return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        const prev = points[index - 1];
        const midX = (prev.x + point.x) / 2;
        return `C ${midX.toFixed(2)} ${prev.y.toFixed(2)} ${midX.toFixed(2)} ${point.y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    }).join(' ');
}

export default function MiniSparkline({ values = [], tone = 'neutral', height = 42 }) {
    const theme = useTheme();
    const fillId = useId();
    const color = tone === 'positive'
        ? theme.palette.success.main
        : tone === 'negative'
            ? theme.palette.error.main
            : theme.palette.primary.main;
    const path = buildPath(values, 140, height, 5);

    return (
        <Box aria-hidden="true" sx={{ width: 140, maxWidth: '100%', height, display: 'block' }}>
            <svg viewBox={`0 0 140 ${height}`} width="100%" height="100%" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={alpha(color, 0.22)} />
                        <stop offset="100%" stopColor={alpha(color, 0.01)} />
                    </linearGradient>
                </defs>
                <path d={`M 5 ${height - 7} L 135 ${height - 7}`} fill="none" stroke={alpha(theme.palette.text.primary, 0.08)} strokeWidth="1" strokeDasharray="3 5" />
                {path ? (
                    <>
                        <path d={`${path} L 135 ${height - 5} L 5 ${height - 5} Z`} fill={`url(#${fillId})`} stroke="none" />
                        <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                ) : null}
            </svg>
        </Box>
    );
}
