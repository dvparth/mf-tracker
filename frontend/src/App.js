import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListAltIcon from '@mui/icons-material/ListAlt';
import HomeIcon from '@mui/icons-material/Home';
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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

/**
 * Main App component.
 * @returns {JSX.Element}
 */
function App() {
    const [darkMode, setDarkMode] = useState(false);
    const { user, loading, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const logout = async () => {
        // close menu first
        handleMenuClose();
        await fetch((process.env.REACT_APP_BACKEND_URL || '') + '/auth/logout', { method: 'POST', credentials: 'include' });
        setUser(null);
        navigate('/login');
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const theme = createTheme({
        palette: (() => {
            if (darkMode) return {
                mode: 'dark',
                primary: { main: '#635bff' },
                background: { default: '#0b0b12', paper: '#0f1220' },
                text: { primary: '#e6eef6', secondary: '#9aa4b2' },
                divider: 'rgba(255,255,255,0.06)'
            };
            return {
                mode: 'light',
                primary: { main: '#635bff' },
                background: { default: '#f6fafd', paper: '#ffffff' },
                text: { primary: '#0f1724', secondary: '#556475' },
                divider: 'rgba(15,23,36,0.08)'
            };
        })(),
        typography: { fontFamily: 'Inter, Roboto, Arial' }
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ minHeight: '100vh', background: theme.palette?.background?.default }}>
                <AppBar position="sticky" elevation={0} color="transparent">
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>MF Tracker</Typography>
                            {!loading && user ? (
                                <IconButton size="small" onClick={() => navigate(location.pathname === '/holdings' ? '/' : '/holdings')} sx={{ ml: 1 }} aria-label={location.pathname === '/holdings' ? 'home' : 'holdings'}>
                                    {location.pathname === '/holdings' ? <HomeIcon /> : <ListAltIcon />}
                                </IconButton>
                            ) : null}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!loading && user ? (
                                <>
                                    <Tooltip title={user.name || 'Profile'}>
                                        <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 1 }} aria-controls={open ? 'account-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined}>
                                            <Avatar src={user.photo || undefined} alt={user.name}>{!user.photo ? (user.name ? (user.name.split(' ').map(n => n[0]).slice(0, 2).join('')) : '?') : null}</Avatar>
                                        </IconButton>
                                    </Tooltip>
                                    <Menu anchorEl={anchorEl} id="account-menu" open={open} onClose={handleMenuClose} onClick={handleMenuClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                                        <MenuItem disabled>
                                            <Box>
                                                <Typography variant="subtitle1">{user.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem onClick={logout}>Logout</MenuItem>
                                    </Menu>
                                </>
                            ) : null}
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box sx={{ px: 0, py: 0 }} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/holdings" element={loading ? <div>Loading...</div> : (user ? <HoldingsPage /> : <Navigate to="/login" />)} />
                    <Route path="/" element={loading ? <div>Loading...</div> : (user ? <MFTracker user={user} darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" />)} />
                </Routes>
            </div>
        </ThemeProvider>
    );
}

export default App;
