/**
 * Modern Theme
 * 
 * The current CafeOS Modern design - rounded UI, Material-inspired,
 * large spacing, smooth animations, cards, modern colors, glass effects.
 * 
 * This is extracted from the existing theme.js configuration.
 */

export const modernTheme = {
  id: 'modern',
  name: 'CafeOS Modern',
  description: 'Modern rounded UI with smooth animations and glass effects',
  category: 'modern',
  preview: '/themes/modern-preview.png',
  mode: 'dark',
  
  colors: {
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    primaryDim: 'rgba(245,158,11,0.15)',
    primaryBg: 'rgba(245,158,11,0.1)',
    primaryBorder: 'rgba(245,158,11,0.4)',
    
    background: '#09090b',
    backgroundElevated: '#121214',
    backgroundSurface: '#18181b',
    backgroundCard: '#27272a',
    backgroundHover: '#3f3f46',
    
    textPrimary: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textMuted: '#52525b',
    
    success: '#10b981',
    successBg: 'rgba(16,185,129,0.1)',
    successBorder: 'rgba(16,185,129,0.3)',
    
    danger: '#ef4444',
    dangerBg: 'rgba(239,68,68,0.1)',
    dangerBorder: 'rgba(239,68,68,0.3)',
    
    warning: '#f97316',
    warningBg: 'rgba(249,115,22,0.1)',
    warningBorder: 'rgba(249,115,22,0.3)',
    
    info: '#3b82f6',
    infoBg: 'rgba(59,130,246,0.1)',
    infoBorder: 'rgba(59,130,246,0.3)',
    
    border: '#3f3f46',
    borderLight: '#27272a',
    borderFocus: '#f59e0b',
    
    shadowSm: '0 1px 3px rgba(0,0,0,0.4)',
    shadowMd: '0 4px 12px rgba(0,0,0,0.5)',
    shadowLg: '0 8px 32px rgba(0,0,0,0.6)',
    shadowGlow: '0 0 20px rgba(245,158,11,0.25)',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
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
        padding: '10px 20px',
        borderRadius: '8px',
        border: '1px solid #d97706',
        background: '#f59e0b',
        color: '#1A1208',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '44px',
        transition: 'all 0.15s ease',
      },
      ghost: {
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid #27272a',
        background: 'transparent',
        color: '#a1a1aa',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.15s ease',
      },
      danger: {
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(239,68,68,0.3)',
        background: 'rgba(239,68,68,0.1)',
        color: '#ef4444',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.15s ease',
      },
      success: {
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid rgba(16,185,129,0.3)',
        background: 'rgba(16,185,129,0.1)',
        color: '#10b981',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.15s ease',
      },
      icon: {
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid transparent',
        background: 'transparent',
        color: '#a1a1aa',
        fontSize: '16px',
        minWidth: '36px',
        minHeight: '36px',
        transition: 'all 0.15s ease',
      },
    },
    card: {
      background: '#27272a',
      border: '1px solid #3f3f46',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    },
    input: {
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '8px',
      padding: '10px 12px',
      color: '#fafafa',
      fontSize: '14px',
      minHeight: '44px',
      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.6)',
      },
      content: {
        background: '#27272a',
        border: '1px solid #3f3f46',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      },
    },
    menuItem: {
      background: '#27272a',
      border: '1px solid #27272a',
      borderRadius: '14px',
      padding: '14px',
      minHeight: '140px',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    },
    cartItem: {
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '12px',
      padding: '14px',
    },
    categoryButton: {
      padding: '12px',
      borderRadius: '10px',
      border: '1px solid transparent',
      background: 'transparent',
      fontSize: '13px',
      fontWeight: 600,
      transition: 'all 0.2s',
    },
    paymentButton: {
      padding: '14px 0',
      borderRadius: '12px',
      border: '2px solid',
      fontSize: '13px',
      fontWeight: 600,
      transition: 'all 0.2s',
    },
  },
  
  keyboard: {
    enabled: false,
    shortcuts: {
      hold: '',
      clear: '',
      checkout: '',
      search: '',
    },
    functionKeys: {},
  },
  
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '0 0 0 2px #f59e0b',
  },
  
  custom: {
    glassEffect: true,
    gradientAccents: true,
  },
};

export default modernTheme;
