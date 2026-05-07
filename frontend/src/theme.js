import { createTheme, alpha } from '@mui/material/styles';

const baseFont = [
    'Inter',
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Arial',
    'sans-serif'
].join(',');

const fintechPalette = {
    brand: '#2755e7',
    brandDark: '#1f3fb8',
    brandSoft: '#eef3ff',
    ink: '#101828',
    muted: '#667085',
    subtle: '#98a2b3',
    canvas: '#f4f7fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    line: '#e4eaf2',
    success: '#0f9f6e',
    danger: '#d92d20',
    warning: '#b7791f',
    info: '#2755e7'
};

const shadows = [
    'none',
    '0 1px 2px rgba(16, 24, 40, 0.05)',
    '0 4px 12px rgba(16, 24, 40, 0.06)',
    '0 10px 28px rgba(16, 24, 40, 0.08)',
    '0 18px 44px rgba(16, 24, 40, 0.10)',
    ...Array(20).fill('0 24px 70px rgba(16, 24, 40, 0.12)')
];

export function buildAppTheme() {
    return createTheme({
        palette: {
            mode: 'light',
            primary: {
                main: fintechPalette.brand,
                dark: fintechPalette.brandDark,
                contrastText: '#ffffff'
            },
            success: { main: fintechPalette.success },
            error: { main: fintechPalette.danger },
            warning: { main: fintechPalette.warning },
            info: { main: fintechPalette.info },
            background: {
                default: fintechPalette.canvas,
                paper: fintechPalette.surface
            },
            text: {
                primary: fintechPalette.ink,
                secondary: fintechPalette.muted
            },
            divider: fintechPalette.line
        },
        typography: {
            fontFamily: baseFont,
            h1: { fontWeight: 850, letterSpacing: 0, lineHeight: 1.08 },
            h2: { fontWeight: 820, letterSpacing: 0, lineHeight: 1.16 },
            h3: { fontWeight: 800, letterSpacing: 0, lineHeight: 1.2 },
            h4: { fontWeight: 780, letterSpacing: 0, lineHeight: 1.22 },
            h5: { fontWeight: 750, letterSpacing: 0 },
            h6: { fontWeight: 750, letterSpacing: 0 },
            button: { textTransform: 'none', fontWeight: 760, letterSpacing: 0 },
            body1: { lineHeight: 1.55 },
            body2: { lineHeight: 1.5 }
        },
        shape: { borderRadius: 12 },
        shadows,
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: fintechPalette.canvas,
                        backgroundImage: [
                            'radial-gradient(circle at 12% 0%, rgba(39, 85, 231, 0.10), transparent 34rem)',
                            'linear-gradient(180deg, rgba(255,255,255,0.76), rgba(244,247,251,0))'
                        ].join(',')
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${fintechPalette.line}`,
                        boxShadow: '0 16px 44px rgba(16, 24, 40, 0.07)'
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        minHeight: 40,
                        boxShadow: 'none',
                        transition: 'background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease'
                    },
                    contained: {
                        boxShadow: '0 12px 24px rgba(39, 85, 231, 0.18)',
                        '&:hover': {
                            boxShadow: '0 14px 30px rgba(39, 85, 231, 0.24)',
                            transform: 'translateY(-1px)'
                        }
                    }
                }
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        transition: 'background-color 160ms ease, transform 160ms ease',
                        '&:hover': { transform: 'translateY(-1px)' }
                    }
                }
            },
            MuiTextField: {
                defaultProps: { variant: 'outlined' }
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        backgroundColor: fintechPalette.surface
                    }
                }
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        borderRadius: 8,
                        backgroundColor: fintechPalette.ink,
                        fontSize: 12
                    }
                }
            },
            MuiChip: {
                styleOverrides: {
                    root: { fontWeight: 760 }
                }
            }
        }
    });
}

export { fintechPalette, alpha };
