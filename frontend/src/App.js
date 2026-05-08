import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import './index.css';
import MFTracker from './components/MFTracker';
import HoldingsPage from './components/HoldingsPage';
import Login from './auth/Login';
import { useAuth } from './auth/useAuth';
import { fetchWithCsrf, resetCsrfToken } from './auth/csrf';
import { ThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { buildAppTheme } from './theme';

/**
 * Main App component.
 * @returns {JSX.Element}
 */
function App() {
    const { user, loading, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const logout = async () => {
        // close menu first
        handleMenuClose();
        await fetchWithCsrf((process.env.REACT_APP_BACKEND_URL || '') + '/auth/logout', { method: 'POST' }).catch(() => {});
        resetCsrfToken();
        setUser(null);
        navigate('/login');
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const theme = buildAppTheme();
    const isHoldings = location.pathname === '/holdings';
    const renderProtected = (element) => {
        if (user) return element;
        if (loading) return <Login checkingSession />;
        return <Navigate to="/login" />;
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
                <AppBar position="sticky" elevation={0} color="transparent" sx={(t) => ({
                    borderBottom: `1px solid ${t.palette.divider}`,
                    backdropFilter: 'blur(18px)',
                    backgroundColor: alpha(t.palette.background.default, 0.82)
                })}>
                    <Toolbar sx={{ maxWidth: 1180, width: '100%', mx: 'auto', px: { xs: 1.5, sm: 3 }, minHeight: { xs: 60, sm: 72 }, display: 'flex', justifyContent: 'space-between', gap: { xs: 1, sm: 2 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2.5 }, minWidth: 0 }}>
                            <Box
                                aria-hidden="true"
                                sx={{
                                    width: { xs: 34, sm: 38 },
                                    height: { xs: 34, sm: 38 },
                                    borderRadius: { xs: 2, sm: 2.5 },
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: 'primary.contrastText',
                                    background: 'linear-gradient(135deg, #2563eb, #0f9f6e)',
                                    boxShadow: '0 14px 30px rgba(37, 99, 235, 0.25)',
                                    fontWeight: 900,
                                    fontSize: { xs: 13, sm: 14 },
                                    flexShrink: 0
                                }}
                            >
                                MF
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" noWrap sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: 0, fontSize: { xs: 19, sm: 20 } }}>MF Snapshot</Typography>
                                <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary', fontSize: 12, mt: 0.35 }}>Portfolio clarity for mutual fund investors</Typography>
                            </Box>
                            {!loading && user ? (
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.75, ml: 1 }}>
                                    <Button
                                        size="small"
                                        startIcon={<HomeIcon />}
                                        variant={!isHoldings ? 'contained' : 'text'}
                                        color={!isHoldings ? 'primary' : 'inherit'}
                                        onClick={() => navigate('/')}
                                    >
                                        Snapshot
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<ListAltIcon />}
                                        variant={isHoldings ? 'contained' : 'text'}
                                        color={isHoldings ? 'primary' : 'inherit'}
                                        onClick={() => navigate('/holdings')}
                                    >
                                        Funds
                                    </Button>
                                </Box>
                            ) : null}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!loading && user ? (
                                <>
                                    <Tooltip title={isHoldings ? 'Open dashboard' : 'Manage funds'}>
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(isHoldings ? '/' : '/holdings')}
                                            aria-label={isHoldings ? 'open dashboard' : 'manage funds'}
                                            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                                        >
                                            {isHoldings ? <HomeIcon /> : <ListAltIcon />}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={user.name || 'Profile'}>
                                        <IconButton onClick={handleMenuOpen} size="small" aria-controls={open ? 'account-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
                                            <Avatar src={user.photo || undefined} alt={user.name}>{!user.photo ? (user.name ? (user.name.split(' ').map(n => n[0]).slice(0, 2).join('')) : '?') : null}</Avatar>
                                        </IconButton>
                                    </Tooltip>
                                    <Menu anchorEl={anchorEl} id="account-menu" open={open} onClose={handleMenuClose} onClick={handleMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}>
                                        <MenuItem disabled>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{user.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem onClick={logout}>
                                            <LogoutIcon fontSize="small" style={{ marginRight: 10 }} /> Logout
                                        </MenuItem>
                                    </Menu>
                                </>
                            ) : null}
                        </Box>
                    </Toolbar>
                </AppBar>

                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/holdings" element={renderProtected(<HoldingsPage />)} />
                    <Route path="/" element={renderProtected(<MFTracker user={user} />)} />
                </Routes>
            </Box>
        </ThemeProvider>
    );
}

export default App;
