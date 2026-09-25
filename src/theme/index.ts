import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#f57c00', // Solar Orange
      light: '#ffad42',
      dark: '#bb4d00',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2e7d32', // Eco Green
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#f57c00',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#b71c1c',
    },
    info: {
      main: '#0288d1',
      light: '#039be5',
      dark: '#01579b',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#4a4a6a',
      disabled: '#9a9abf',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      letterSpacing: '0.01em',
    },
    body2: {
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.05)',
    '0 25px 50px -12px rgba(0,0,0,0.10)',
    '0 30px 60px -12px rgba(0,0,0,0.12)',
    '0 35px 70px -15px rgba(0,0,0,0.14)',
    '0 40px 80px -15px rgba(0,0,0,0.16)',
    '0 45px 90px -18px rgba(0,0,0,0.18)',
    '0 50px 100px -20px rgba(0,0,0,0.20)',
    '0 55px 110px -22px rgba(0,0,0,0.22)',
    '0 60px 120px -24px rgba(0,0,0,0.24)',
    '0 65px 130px -26px rgba(0,0,0,0.26)',
    '0 70px 140px -28px rgba(0,0,0,0.28)',
    '0 75px 150px -30px rgba(0,0,0,0.30)',
    '0 80px 160px -32px rgba(0,0,0,0.32)',
    '0 85px 170px -34px rgba(0,0,0,0.34)',
    '0 90px 180px -36px rgba(0,0,0,0.36)',
    '0 95px 190px -38px rgba(0,0,0,0.38)',
    '0 100px 200px -40px rgba(0,0,0,0.40)',
    '0 105px 210px -42px rgba(0,0,0,0.42)',
    '0 110px 220px -44px rgba(0,0,0,0.44)',
    '0 115px 230px -46px rgba(0,0,0,0.46)',
    '0 120px 240px -48px rgba(0,0,0,0.48)',
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*': {
          '&::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 4,
            '&:hover': {
              background: 'rgba(0,0,0,0.25)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
        colorPrimary: {
          backgroundColor: '#f57c00',
          backgroundImage: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        contained: {
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.06)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.06)',
          },
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff8f00 0%, #f57c00 100%)',
            },
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
            },
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
        sizeMedium: {
          padding: '10px 20px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.2s ease',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
        },
        elevation4: {
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#f57c00',
              borderWidth: 2,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#f57c00',
              borderWidth: 2,
              boxShadow: '0 0 0 4px rgba(245, 124, 0, 0.1)',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            '&.Mui-focused': {
              color: '#f57c00',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        outlined: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, #f57c00, #e65100)',
          color: '#fff',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
          color: '#fff',
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0,0,0,0.02)',
          letterSpacing: '0.01em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(245, 124, 0, 0.04)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: 'linear-gradient(90deg, #f57c00, #ffad42)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
          fontSize: '0.875rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(245, 124, 0, 0.04)',
          },
          '&.Mui-selected': {
            fontWeight: 600,
            color: '#f57c00',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
          '&.MuiAlert-filledSuccess': {
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
          },
          '&.MuiAlert-filledError': {
            background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
          },
          '&.MuiAlert-filledWarning': {
            background: 'linear-gradient(135deg, #f57c00, #e65100)',
          },
          '&.MuiAlert-filledInfo': {
            background: 'linear-gradient(135deg, #0288d1, #01579b)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '24px 24px 16px 24px',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 24px 20px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px 24px',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 12,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.06)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
        },
        arrow: {
          color: 'rgba(0,0,0,0.85)',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: '1px solid rgba(0,0,0,0.06)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
            borderColor: 'rgba(245, 124, 0, 0.3)',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
          '&.Mui-expanded': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        },
        content: {
          margin: '8px 0',
          '&.Mui-expanded': {
            margin: '8px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '12px 16px 16px 16px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
          backgroundColor: 'rgba(0,0,0,0.06)',
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #f57c00, #ffad42)',
        },
        colorPrimary: {
          background: 'linear-gradient(90deg, #f57c00, #ffad42)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.MuiAvatar-colorPrimary': {
            background: 'linear-gradient(135deg, #f57c00, #e65100)',
          },
          '&.MuiAvatar-colorSecondary': {
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        dot: {
          width: 10,
          height: 10,
          borderRadius: '50%',
        },
        colorWarning: {
          background: 'linear-gradient(135deg, #f57c00, #ffad42)',
        },
        colorSuccess: {
          background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0,0,0,0.06)',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '4px 0',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '& .MuiCheckbox-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-checked': {
            color: '#f57c00',
          },
        },
      },
    },
  },
});

export default theme;