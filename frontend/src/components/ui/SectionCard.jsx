import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

export default function SectionCard({ title, eyebrow, action, children, sx, variant = 'default' }) {
    const isQuiet = variant === 'quiet';
    const isTinted = variant === 'tinted';

    return (
        <Card sx={(theme) => ({
            borderRadius: 2.5,
            background: isQuiet
                ? 'transparent'
                : isTinted
                    ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.045)}, ${alpha('#ffffff', 0.92)})`
                    : alpha('#ffffff', 0.88),
            border: isQuiet ? '0' : `1px solid ${alpha(theme.palette.divider, 0.68)}`,
            boxShadow: isQuiet ? 'none' : '0 16px 44px rgba(16, 24, 40, 0.055)',
            backdropFilter: isQuiet ? 'none' : 'blur(12px)',
            ...sx
        })}>
            <CardContent sx={{ p: isQuiet ? 0 : { xs: 1.75, sm: 2.25 } }}>
                {(title || eyebrow || action) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: isQuiet ? 1.35 : 1.75 }}>
                        <Box sx={{ minWidth: 0 }}>
                            {eyebrow ? <Typography sx={{ color: 'text.secondary', fontSize: 11.5, fontWeight: 650, mb: 0.35 }}>{eyebrow}</Typography> : null}
                            {title ? <Typography component="h2" sx={{ color: 'text.primary', fontSize: { xs: 17, sm: 19 }, fontWeight: 760, lineHeight: 1.18 }}>{title}</Typography> : null}
                        </Box>
                        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
                    </Box>
                ) : null}
                {children}
            </CardContent>
        </Card>
    );
}
