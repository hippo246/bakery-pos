/**
 * Modern Theme - Light Mode
 * 
 * Light variant of the CafeOS Modern design
 */

export const modernLightTheme = {
  id: 'modern-light',
  name: 'CafeOS Modern Light',
  description: 'Modern rounded UI with light colors and smooth animations',
  category: 'modern',
  preview: '/themes/modern-light-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#ea580c',
    primaryLight: '#f97316',
    primaryDark: '#c2410c',
    primaryDim: 'rgba(234,88,12,0.1)',
    primaryBg: 'rgba(234,88,12,0.06)',
    primaryBorder: 'rgba(234,88,12,0.25)',

    background: '#f8fafc',
    backgroundElevated: '#ffffff',
    backgroundSurface: '#f1f5f9',
    backgroundCard: '#ffffff',
    backgroundHover: '#e2e8f0',

    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    textMuted: '#94a3b8',

    success: '#059669',
    successBg: '#ecfdf5',
    successBorder: '#a7f3d0',

    danger: '#dc2626',
    dangerBg: '#fef2f2',
    dangerBorder: '#fecaca',

    warning: '#ea580c',
    warningBg: '#fff7ed',
    warningBorder: '#ffedd5',

    info: '#2563eb',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',

    border: '#cbd5e1',
    borderLight: '#e2e8f0',
    borderFocus: '#ea580c',
    
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.1)',
    shadowLg: '0 10px 15px rgba(0,0,0,0.1)',
    shadowGlow: '0 0 20px rgba(245,158,11,0.3)',
  },
  
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'JetBrains Mono, "Fira Code", monospace',
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '24px',
      '3xl': '32px',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  
  borderRadius: {
    none: '0px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'modern',
    grid: {
      desktop: '180px 1fr 320px',
      tablet: '160px 1fr 280px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 180,
        collapsible: true,
        visible: true,
      },
      category: {
        position: 'sidebar',
        visible: true,
        orientation: 'vertical',
      },
      menu: {
        gridColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        itemMinWidth: '150px',
        itemSize: 'normal',
        showImages: true,
      },
      cart: {
        width: 320,
        position: 'right',
        orientation: 'vertical',
        compact: false,
      },
      payment: {
        position: 'inline',
        largeButtons: false,
      },
      keypad: {
        visible: false,
        position: 'right',
        size: 'normal',
      },
      functionKeys: {
        visible: false,
        position: 'top',
        columns: 12,
      },
      header: {
        visible: true,
        position: 'top',
      },
    },
    regions: {
      functionKeys: [],
      category: [],
      menu: [],
      cart: [],
      keypad: [],
      payment: [],
      header: ['Header'],
      sidebar: ['Navigation'],
      main: ['Content'],
      right: ['Panel'],
      bottom: [],
    },
    density: {
      level: 'medium',
      fontSizeScale: 1.0,
      spacingScale: 1.0,
    },
  },
  
  animation: {
    duration: '0.2s',
    easing: 'ease',
    reducedMotion: false,
    transitions: {
      fast: '0.15s ease',
      base: '0.2s ease',
      slow: '0.3s ease',
    },
    effects: {
      hoverLift: true,
      buttonPress: true,
      cardEntrance: true,
      fadeIn: true,
    },
  },
  
  components: {
    button: {
      primary: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '44px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
      },
      ghost: {
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: 'transparent',
        color: '#0f172a',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.2s ease',
      },
      danger: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '44px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
      },
      success: {
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '44px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
      },
      icon: {
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        background: 'transparent',
        color: '#0f172a',
        fontSize: '16px',
        minWidth: '40px',
        minHeight: '40px',
        transition: 'all 0.2s ease',
      },
    },
    card: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    },
    input: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#0f172a',
      fontSize: '14px',
      minHeight: '44px',
      transition: 'all 0.2s ease',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.5)',
      },
      content: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px',
        maxWidth: '600px',
        boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '16px',
      minHeight: '140px',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    cartItem: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '12px',
    },
    categoryButton: {
      padding: '12px 20px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      background: '#ffffff',
      fontSize: '13px',
      fontWeight: 600,
      transition: 'all 0.2s ease',
    },
    paymentButton: {
      padding: '16px 24px',
      borderRadius: '14px',
      border: 'none',
      fontSize: '15px',
      fontWeight: 700,
      minHeight: '56px',
      transition: 'all 0.2s ease',
    },
  },
  
  keyboard: {
    enabled: true,
    shortcuts: {
      hold: 'F2',
      clear: 'F3',
      checkout: 'F4',
      search: 'Ctrl+F',
    },
    functionKeys: {
      F1: 'help',
      F2: 'hold',
      F3: 'clear',
      F4: 'checkout',
      F5: 'discount',
      F6: 'customer',
      F7: 'reports',
      F8: 'print',
      F9: 'settlement',
      F10: 'day_end',
      F11: 'settings',
      F12: 'exit',
    },
  },
  
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '2px solid #f59e0b',
  },
  
  custom: {
    glassEffect: true,
    roundedUI: true,
    smoothAnimations: true,
  },
};

export default modernLightTheme;
