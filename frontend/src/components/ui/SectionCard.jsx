import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SectionCard({ title, eyebrow, action, children, sx }) {
    return (
        <Card sx={{ borderRadius: 3, ...sx }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                {(title || eyebrow || action) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                            {eyebrow ? <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, mb: 0.35 }}>{eyebrow}</Typography> : null}
                            {title ? <Typography component="h2" sx={{ color: 'text.primary', fontSize: { xs: 18, sm: 20 }, fontWeight: 950, lineHeight: 1.15 }}>{title}</Typography> : null}
                        </Box>
                        {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
                    </Box>
                ) : null}
                {children}
            </CardContent>
        </Card>
    );
}
