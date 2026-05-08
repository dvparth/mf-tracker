import React, { useId } from 'react';
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { alpha } from '@mui/material/styles';
import { BACKEND_URL } from '../config/env';

const previewFunds = [
    ['Parag Parikh Flexi Cap', 31, '#3157d8'],
    ['Bandhan Small Cap', 26, '#0b8f69'],
    ['ICICI Large Cap', 22, '#7666d9'],
    ['Other funds', 21, '#64748b']
];

function FeaturePill({ icon, title, text }) {
    return (
        <Box sx={(theme) => ({
            p: { xs: 1.15, sm: 1.35 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.64)}`,
            backgroundColor: alpha('#ffffff', 0.68),
            display: 'grid',
            gridTemplateColumns: '32px minmax(0, 1fr)',
            gap: 1.15,
            alignItems: 'start',
            boxShadow: '0 10px 28px rgba(16,24,40,0.035)',
            transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
            '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-1px)' },
                borderColor: alpha(theme.palette.primary.main, 0.22),
                boxShadow: '0 16px 38px rgba(16,24,40,0.06)'
            }
        })}>
            <Box sx={(theme) => ({
                width: 32,
                height: 32,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.085)
            })}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: 13.4, fontWeight: 720, color: 'text.primary', lineHeight: 1.24 }}>{title}</Typography>
                <Typography sx={{ fontSize: 12.4, color: 'text.secondary', mt: 0.35, lineHeight: 1.45 }}>{text}</Typography>
            </Box>
        </Box>
    );
}

function MiniTrend() {
    const fillId = useId();

    return (
        <Box
            component="svg"
            viewBox="0 0 260 84"
            role="img"
            aria-label="Portfolio trend preview"
            sx={{ width: '100%', height: 86, display: 'block' }}
        >
            <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3157d8" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3157d8" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M8 68 C40 58 56 64 82 48 C110 30 134 44 160 32 C190 18 214 26 252 12" fill="none" stroke="#3157d8" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M8 68 C40 58 56 64 82 48 C110 30 134 44 160 32 C190 18 214 26 252 12 L252 84 L8 84 Z" fill={`url(#${fillId})`} />
            {[8, 70, 132, 194, 252].map((x) => (
                <line key={x} x1={x} y1="76" x2={x} y2="80" stroke="#d8e1ef" strokeWidth="2" strokeLinecap="round" />
            ))}
            <circle cx="252" cy="12" r="4.5" fill="#0b8f69" stroke="#fff" strokeWidth="3" />
        </Box>
    );
}

function DashboardPreview() {
    return (
        <Card sx={(theme) => ({
            borderRadius: { xs: 3, sm: 4 },
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
            boxShadow: '0 26px 78px rgba(16,24,40,0.11)',
            borderColor: alpha(theme.palette.divider, 0.68)
        })}>
            <Box sx={(theme) => ({
                px: { xs: 1.75, sm: 2.2 },
                py: { xs: 1.35, sm: 1.55 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.72)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.035)
            })}>
                <Box>
                    <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 650 }}>Private dashboard preview</Typography>
                    <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 760, lineHeight: 1.05, mt: 0.25 }}>Rs. 12.18L</Typography>
                </Box>
                <Chip size="small" label="+4.63%" color="success" sx={{ height: 26, fontWeight: 680 }} />
            </Box>

            <CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.35 }}>
                    {[
                        ['Invested', 'Rs. 11.64L'],
                        ['Today', '+Rs. 14,759']
                    ].map(([label, value]) => (
                        <Box key={label} sx={{ p: 1.2, borderRadius: 1.75, bgcolor: '#f7f9fd', border: '1px solid #e8eef6' }}>
                            <Typography sx={{ fontSize: 11.2, color: 'text.secondary', fontWeight: 620 }}>{label}</Typography>
                            <Typography sx={{ fontSize: { xs: 15, sm: 16 }, fontWeight: 720, mt: 0.35 }}>{value}</Typography>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ p: 1.2, borderRadius: 2, border: '1px solid #e8eef6', bgcolor: '#ffffff', mb: 1.4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 720 }}>Portfolio trend</Typography>
                        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 620 }}>90 days</Typography>
                    </Box>
                    <MiniTrend />
                </Box>

                <Box sx={{ display: 'grid', gap: 0.85 }}>
                    {previewFunds.map(([label, width, color]) => (
                        <Box key={label}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.35 }}>
                                <Typography sx={{ fontSize: 12.2, fontWeight: 680, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</Typography>
                                <Typography sx={{ fontSize: 12.2, color: 'text.secondary', fontWeight: 680 }}>{width}%</Typography>
                            </Box>
                            <Box sx={{ height: 6, borderRadius: 999, bgcolor: '#edf2f7', overflow: 'hidden' }}>
                                <Box sx={{ width: `${width}%`, height: '100%', bgcolor: color, borderRadius: 999 }} />
                            </Box>
                        </Box>
                    ))}
                </Box>

                <Box sx={(theme) => ({
                    mt: 1.45,
                    p: 1.3,
                    borderRadius: 2.25,
                    bgcolor: alpha(theme.palette.primary.main, 0.07),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`
                })}>
                    <Typography sx={{ fontSize: 12, fontWeight: 720, color: 'primary.main' }}>AI observation</Typography>
                    <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.35, lineHeight: 1.45 }}>
                        Your largest fund is visible, and concentration is explained in plain English.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

function TrustRow({ icon, text }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
            <Box sx={{ color: 'primary.main', display: 'inline-flex', opacity: 0.92 }}>{icon}</Box>
            <Typography sx={{ fontSize: 12.4, lineHeight: 1.42 }}>{text}</Typography>
        </Box>
    );
}

export default function Login({ checkingSession = false }) {
    const backend = BACKEND_URL;

    return (
        <Box
            component="main"
            sx={{
                maxWidth: 1240,
                mx: 'auto',
                px: { xs: 1.7, sm: 3, lg: 4 },
                py: { xs: 1.75, sm: 3, lg: 4.5 },
                minHeight: { lg: 'calc(100vh - 88px)' },
                display: 'grid',
                alignItems: 'center'
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(380px, 0.84fr)' },
                    gap: { xs: 2.25, md: 3.25, lg: 5 },
                    alignItems: 'center'
                }}
            >
                <Box sx={{ maxWidth: { lg: 720 } }}>
                    <Chip
                        label="Private mutual fund intelligence"
                        size="small"
                        sx={(theme) => ({
                            height: 28,
                            fontSize: 12,
                            fontWeight: 680,
                            mb: { xs: 1.35, sm: 1.75 },
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.09),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`
                        })}
                    />
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 32, sm: 45, lg: 56 },
                            fontWeight: 760,
                            lineHeight: { xs: 1.06, sm: 1.02 },
                            letterSpacing: 0,
                            maxWidth: 705
                        }}
                    >
                        Understand your mutual fund portfolio instantly.
                    </Typography>
                    <Typography
                        sx={{
                            color: 'text.secondary',
                            fontSize: { xs: 15, sm: 17 },
                            mt: { xs: 1.45, sm: 1.9 },
                            maxWidth: 600,
                            lineHeight: 1.58
                        }}
                    >
                        See current value, returns, allocation, and AI-assisted observations in a calm private dashboard built for everyday investors.
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.85, mt: { xs: 1.65, sm: 2.2 }, color: 'text.secondary' }}>
                        {['No broker login', 'No transactions', 'Google-authenticated'].map((item) => (
                            <Box key={item} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.55, fontSize: 12.6, fontWeight: 620 }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                {item}
                            </Box>
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                            gap: 1.05,
                            mt: { xs: 1.9, sm: 2.5 },
                            maxWidth: 760
                        }}
                    >
                        <FeaturePill icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} title="Portfolio clarity" text="Track invested amount, current value, returns, and latest movement without spreadsheets." />
                        <FeaturePill icon={<InsightsOutlinedIcon fontSize="small" />} title="AI-assisted insights" text="See concentration, performance drivers, and watchpoints explained without jargon." />
                        <FeaturePill icon={<AutoGraphOutlinedIcon fontSize="small" />} title="Allocation view" text="Understand how your money is spread across funds with clean visual summaries." />
                        <FeaturePill icon={<ShieldOutlinedIcon fontSize="small" />} title="Privacy-first" text="Your dashboard is read-only and tied to your signed-in account." />
                    </Box>
                </Box>

                <Box sx={{ display: 'grid', gap: { xs: 1.25, sm: 1.6 } }}>
                    <DashboardPreview />

                    <Card sx={(theme) => ({
                        borderRadius: { xs: 2.5, sm: 3 },
                        boxShadow: '0 18px 54px rgba(16,24,40,0.075)',
                        borderColor: alpha(theme.palette.divider, 0.68)
                    })}>
                        <CardContent sx={{ p: { xs: 2, sm: 2.55 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.55 }}>
                                <Box sx={(theme) => ({
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2,
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: 'primary.contrastText',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                    fontWeight: 760,
                                    boxShadow: '0 14px 26px rgba(49,87,216,0.18)'
                                })}>
                                    MF
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography component="h2" sx={{ fontSize: { xs: 19, sm: 20.5 }, fontWeight: 760, lineHeight: 1.16 }}>
                                        Open your private dashboard
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', fontSize: 12.8, mt: 0.35, lineHeight: 1.4 }}>
                                        {checkingSession ? 'Checking your session. You can still continue securely.' : 'Secure Google sign-in. No broker credentials required.'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Button
                                href={`${backend}/auth/google`}
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={<GoogleIcon />}
                                sx={{
                                    height: 50,
                                    borderRadius: 2,
                                    fontSize: 15,
                                    fontWeight: 720
                                }}
                            >
                                Continue with Google
                            </Button>

                            <Divider sx={{ my: 1.65 }} />

                            <Box sx={{ display: 'grid', gap: 0.8 }}>
                                <TrustRow icon={<LockOutlinedIcon fontSize="small" />} text="Authentication is handled by Google." />
                                <TrustRow icon={<VisibilityOutlinedIcon fontSize="small" />} text="Read-only tracking. The app cannot place transactions." />
                                <TrustRow icon={<ShieldOutlinedIcon fontSize="small" />} text="Your portfolio view stays attached to your signed-in account." />
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
}
