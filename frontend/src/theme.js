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
    brand: '#3157d8',
    brandDark: '#17346f',
    brandSoft: '#eef4ff',
    ink: '#142033',
    muted: '#667085',
    subtle: '#98a2b3',
    canvas: '#f6f8fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fafb',
    line: '#e8edf4',
    success: '#0b8f69',
    danger: '#c93c35',
    warning: '#a76a18',
    info: '#3157d8'
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
            h1: { fontWeight: 780, letterSpacing: 0, lineHeight: 1.08 },
            h2: { fontWeight: 760, letterSpacing: 0, lineHeight: 1.16 },
            h3: { fontWeight: 740, letterSpacing: 0, lineHeight: 1.2 },
            h4: { fontWeight: 720, letterSpacing: 0, lineHeight: 1.22 },
            h5: { fontWeight: 700, letterSpacing: 0 },
            h6: { fontWeight: 700, letterSpacing: 0 },
            button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
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
                            'radial-gradient(circle at 16% 0%, rgba(49, 87, 216, 0.08), transparent 32rem)',
                            'radial-gradient(circle at 86% 8%, rgba(15, 118, 110, 0.055), transparent 28rem)',
                            'linear-gradient(180deg, rgba(255,255,255,0.84), rgba(246,248,251,0))'
                        ].join(',')
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${alpha(fintechPalette.line, 0.72)}`,
                        boxShadow: '0 14px 42px rgba(16, 24, 40, 0.055)'
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
                    root: { fontWeight: 700 }
                }
            }
        }
    });
}

export { fintechPalette, alpha };
