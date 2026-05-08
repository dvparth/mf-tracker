import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import GoogleIcon from '@mui/icons-material/Google';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { alpha } from '@mui/material/styles';
import { BACKEND_URL } from '../config/env';

function FeaturePill({ icon, title, text }) {
    return (
        <Box sx={(theme) => ({
            p: 1.45,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: '#ffffff',
            display: 'grid',
            gridTemplateColumns: '32px minmax(0, 1fr)',
            gap: 1.15,
            alignItems: 'start',
            boxShadow: '0 10px 26px rgba(15,23,42,0.045)'
        })}>
            <Box sx={(theme) => ({
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.10)
            })}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 850, color: 'text.primary', lineHeight: 1.25 }}>{title}</Typography>
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.35, lineHeight: 1.45 }}>{text}</Typography>
            </Box>
        </Box>
    );
}

function DashboardPreview() {
    return (
        <Card sx={(theme) => ({
            borderRadius: 4,
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 26px 70px rgba(15,23,42,0.14)'
        })}>
            <Box sx={(theme) => ({
                px: 2,
                py: 1.4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: '#f8fafc'
            })}>
                <Box>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 800 }}>Private dashboard preview</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 950 }}>₹••.••L</Typography>
                </Box>
                <Chip size="small" color="success" label="Demo data" sx={{ fontWeight: 850 }} />
            </Box>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.1, mb: 1.4 }}>
                    <Box sx={{ p: 1.35, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 800 }}>Health</Typography>
                        <Typography sx={{ fontSize: 20, fontWeight: 950 }}>••</Typography>
                    </Box>
                    <Box sx={{ p: 1.35, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 800 }}>Latest</Typography>
                        <Typography sx={{ fontSize: 20, fontWeight: 950, color: 'success.main' }}>+•.••%</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'grid', gap: 0.9 }}>
                    {[
                        ['Equity Fund A', 34, '#2563eb'],
                        ['Flexi Cap Fund B', 27, '#0f9f6e'],
                        ['Large Cap Fund C', 21, '#7c3aed']
                    ].map(([label, width, color]) => (
                        <Box key={label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{label}</Typography>
                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 800 }}>{width}%</Typography>
                            </Box>
                            <Box sx={{ height: 7, borderRadius: 999, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
                                <Box sx={{ width: `${width}%`, height: '100%', bgcolor: color, borderRadius: 999 }} />
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box sx={(theme) => ({ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}` })}>
                    <Typography sx={{ fontSize: 12, fontWeight: 900, color: 'primary.main' }}>AI insight</Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.35 }}>Your signed-in dashboard will explain portfolio patterns here.</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function Login({ checkingSession = false }) {
    const backend = BACKEND_URL;

    return (
        <Box component="main" sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2.5, md: 4.5 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)' }, gap: { xs: 3, lg: 5 }, alignItems: 'center' }}>
                <Box>
                    <Chip label="Private mutual fund dashboard" size="small" color="primary" sx={{ fontWeight: 850, mb: 1.5 }} />
                    <Typography component="h1" sx={{ fontSize: { xs: 34, sm: 46, lg: 58 }, fontWeight: 950, lineHeight: 1.02, letterSpacing: 0, maxWidth: 720 }}>
                        Understand your mutual fund portfolio instantly.
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: { xs: 15.5, sm: 18 }, mt: 2, maxWidth: 650, lineHeight: 1.6 }}>
                        See current value, returns, diversification, and AI-assisted observations in one calm dashboard built for clarity.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2, mt: 2.6, maxWidth: 760 }}>
                        <FeaturePill icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} title="Portfolio clarity" text="Track amount invested, current value, returns, and latest movement without spreadsheets." />
                        <FeaturePill icon={<InsightsOutlinedIcon fontSize="small" />} title="AI-assisted insights" text="Spot concentration, performance drivers, and watchpoints in plain English." />
                        <FeaturePill icon={<AutoGraphOutlinedIcon fontSize="small" />} title="Visual allocation" text="Understand where your money sits across funds with clean charts and trends." />
                        <FeaturePill icon={<ShieldOutlinedIcon fontSize="small" />} title="Privacy-first tracking" text="No broker login, no transactions, no trading. Just your private dashboard." />
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <DashboardPreview />

                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: { xs: 2.25, sm: 2.75 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                                <Box sx={{ width: 42, height: 42, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'primary.contrastText', bgcolor: 'primary.main', fontWeight: 950 }}>
                                    MF
                                </Box>
                                <Box>
                                    <Typography component="h2" sx={{ fontSize: 21, fontWeight: 950, lineHeight: 1.1 }}>Open your private dashboard</Typography>
                                    <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.35 }}>
                                        {checkingSession ? 'Checking for an existing session. You can still sign in.' : 'Secure Google sign-in. No broker credentials required.'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                href={`${backend}/auth/google`}
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={<GoogleIcon />}
                                sx={{ height: 48, borderRadius: 2 }}
                            >
                                Continue with Google
                            </Button>

                            <Divider sx={{ my: 1.75 }} />

                            <Box sx={{ display: 'grid', gap: 0.9 }}>
                                {[
                                    { icon: <LockOutlinedIcon fontSize="small" />, text: 'Authentication is handled by Google.' },
                                    { icon: <VisibilityOutlinedIcon fontSize="small" />, text: 'Read-only tracking. The app cannot place transactions.' },
                                    { icon: <ShieldOutlinedIcon fontSize="small" />, text: 'Your dashboard is tied to your signed-in account.' }
                                ].map((item) => (
                                    <Box key={item.text} sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
                                        <Box sx={{ color: 'primary.main', display: 'inline-flex' }}>{item.icon}</Box>
                                        <Typography sx={{ fontSize: 12.5, lineHeight: 1.4 }}>{item.text}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}
