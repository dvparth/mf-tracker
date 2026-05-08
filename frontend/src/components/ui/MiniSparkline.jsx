import React from 'react';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';

function buildPath(values, width, height, padding) {
    const finite = values.filter(Number.isFinite);
    if (finite.length < 2) return '';
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const range = max - min || 1;
    const step = (width - padding * 2) / (values.length - 1);

    return values.map((value, index) => {
        const safeValue = Number.isFinite(value) ? value : min;
        const x = padding + index * step;
        const y = height - padding - ((safeValue - min) / range) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

export default function MiniSparkline({ values = [], tone = 'neutral', height = 42 }) {
    const theme = useTheme();
    const color = tone === 'positive'
        ? theme.palette.success.main
        : tone === 'negative'
            ? theme.palette.error.main
            : theme.palette.primary.main;
    const path = buildPath(values, 140, height, 5);

    return (
        <Box aria-hidden="true" sx={{ width: 140, maxWidth: '100%', height, display: 'block' }}>
            <svg viewBox={`0 0 140 ${height}`} width="100%" height="100%" preserveAspectRatio="none">
                <path d={`M 5 ${height - 5} L 135 ${height - 5}`} fill="none" stroke={alpha(theme.palette.text.primary, 0.10)} strokeWidth="1" />
                {path ? (
                    <>
                        <path d={`${path} L 135 ${height - 5} L 5 ${height - 5} Z`} fill={alpha(color, 0.12)} stroke="none" />
                        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                ) : null}
            </svg>
        </Box>
    );
}
