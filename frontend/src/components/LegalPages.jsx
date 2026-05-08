import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LaunchIcon from '@mui/icons-material/Launch';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { alpha } from '@mui/material/styles';

const LINKEDIN_URL = 'https://www.linkedin.com/in/parthdave2';

function PageShell({ children }) {
    return (
        <Box component="main" sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
            {children}
        </Box>
    );
}

function CloseButton({ children = 'Close', to = '/' }) {
    const navigate = useNavigate();
    return (
        <Button variant="outlined" onClick={() => navigate(to, { replace: true })} sx={{ borderRadius: 2 }}>
            {children}
        </Button>
    );
}

function HeroCard({ eyebrow, title, description, icon, children }) {
    return (
        <Card sx={(theme) => ({
            borderRadius: 3,
            overflow: 'hidden',
            background: [
                `radial-gradient(circle at 92% 12%, ${alpha(theme.palette.primary.main, 0.09)}, transparent 18rem)`,
                'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.84))'
            ].join(','),
            borderColor: alpha(theme.palette.divider, 0.72),
            boxShadow: '0 22px 70px rgba(16,24,40,0.08)'
        })}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={(theme) => ({
                        width: 34,
                        height: 34,
                        borderRadius: 1.7,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.09)
                    })}>
                        {icon}
                    </Box>
                    {eyebrow ? <Chip size="small" label={eyebrow} sx={{ fontWeight: 680, bgcolor: 'rgba(255,255,255,0.68)' }} /> : null}
                </Stack>
                <Typography component="h1" sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 760, lineHeight: 1.08, color: 'text.primary' }}>
                    {title}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: { xs: 14.5, sm: 16 }, lineHeight: 1.58, mt: 0.9, maxWidth: 690 }}>
                    {description}
                </Typography>
                {children}
            </CardContent>
        </Card>
    );
}

function PolicySection({ title, children }) {
    return (
        <Box sx={(theme) => ({ py: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.72)}`, '&:last-of-type': { borderBottom: 0 } })}>
            <Typography component="h2" sx={{ fontSize: 17, fontWeight: 760, mb: 0.75 }}>{title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.62 }}>{children}</Typography>
        </Box>
    );
}

export function AboutPage({ closeTo = '/' }) {
    return (
        <PageShell>
            <HeroCard
                eyebrow="About"
                title="About MF Snapshot"
                description="A financial lifecycle management tool focused on cashflow visibility, interest tracking, and reinvestment decisions."
                icon={<InfoOutlinedIcon fontSize="small" />}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-end' }, gap: 2, mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 760, color: 'text.primary' }}>Built by Parth Dave</Typography>
                        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.35 }}>Technology Leader - Banking & Financial Systems</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
                        <CloseButton to={closeTo} />
                        <Button
                            component={Link}
                            href={LINKEDIN_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            endIcon={<LaunchIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            View LinkedIn
                        </Button>
                    </Stack>
                </Box>
            </HeroCard>
        </PageShell>
    );
}

export function PrivacyPage({ closeTo = '/' }) {
    return (
        <PageShell>
            <HeroCard
                eyebrow="Privacy"
                title="Privacy Policy"
                description="MF Snapshot is designed as a private, read-only portfolio dashboard. This summary explains what the app uses and what it does not do."
                icon={<ShieldOutlinedIcon fontSize="small" />}
            >
                <Box sx={{ mt: 2.5 }}>
                    <PolicySection title="Information used">
                        The app uses your Google sign-in profile to create and protect your session. Portfolio records you add, such as fund identifiers, units, and invested amounts, are used to calculate dashboard views and insights.
                    </PolicySection>
                    <PolicySection title="Read-only experience">
                        MF Snapshot does not ask for broker credentials, does not place trades, and does not move money. It is an informational portfolio tracking tool.
                    </PolicySection>
                    <PolicySection title="AI-assisted insights">
                        AI summaries are generated from your portfolio data and available market context. They are for explanation and review only, not financial advice.
                    </PolicySection>
                    <PolicySection title="Your control">
                        You can sign out at any time. Keep your Google account secure, and avoid entering sensitive credentials or account passwords into portfolio notes or fund names.
                    </PolicySection>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <CloseButton to={closeTo} />
                </Box>
            </HeroCard>
        </PageShell>
    );
}

export function TermsPage({ closeTo = '/' }) {
    return (
        <PageShell>
            <HeroCard
                eyebrow="Terms"
                title="Terms of Use"
                description="These terms keep the product boundary clear: MF Snapshot is a portfolio visibility and analytics tool, not an investment advisor or trading platform."
                icon={<GavelOutlinedIcon fontSize="small" />}
            >
                <Box sx={{ mt: 2.5 }}>
                    <PolicySection title="Informational use">
                        The app provides calculations, historical estimates, allocation views, and AI-assisted observations for your personal review. It should not be treated as financial, tax, legal, or investment advice.
                    </PolicySection>
                    <PolicySection title="Data accuracy">
                        Values depend on the information you enter and the availability of market or NAV data. Past values may be estimates, especially if units changed during the period.
                    </PolicySection>
                    <PolicySection title="User responsibility">
                        You are responsible for reviewing your own portfolio decisions and consulting a qualified professional when needed. Do not rely solely on automated insights.
                    </PolicySection>
                    <PolicySection title="Service availability">
                        The application may change, pause, or become unavailable during maintenance, hosting issues, third-party outages, or product updates.
                    </PolicySection>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <CloseButton to={closeTo} />
                </Box>
            </HeroCard>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link component={RouterLink} to="/privacy" sx={{ fontSize: 13 }}>Read Privacy Policy</Link>
            </Box>
        </PageShell>
    );
}
