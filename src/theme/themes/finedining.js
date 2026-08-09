/**
 * Fine Dining Theme
 * 
 * Elegant, sophisticated, minimalist. Black and white with gold accents,
 * refined typography, generous whitespace, subtle animations.
 * 
 * Perfect for upscale restaurants and fine dining establishments.
 */

export const fineDiningTheme = {
  id: 'finedining',
  name: 'Fine Dining',
  description: 'Elegant minimalist design with gold accents for upscale restaurants',
  category: 'industry',
  preview: '/themes/finedining-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#c9a962',
    primaryLight: '#dbc48a',
    primaryDark: '#a68a4a',
    primaryDim: 'rgba(201,169,98,0.1)',
    primaryBg: 'rgba(201,169,98,0.05)',
    primaryBorder: '#a68a4a',
    
    background: '#0a0a0a',
    backgroundElevated: '#141414',
    backgroundSurface: '#1a1a1a',
    backgroundCard: '#1f1f1f',
    backgroundHover: '#252525',
    
    textPrimary: '#f5f5f5',
    textSecondary: '#b8b8b8',
    textTertiary: '#888888',
    textMuted: '#666666',
    
    success: '#7fb069',
    successBg: 'rgba(127,176,105,0.1)',
    successBorder: 'rgba(127,176,105,0.3)',
    
    danger: '#b84747',
    dangerBg: 'rgba(184,71,71,0.1)',
    dangerBorder: 'rgba(184,71,71,0.3)',
    
    warning: '#c9a962',
    warningBg: 'rgba(201,169,98,0.1)',
    warningBorder: 'rgba(201,169,98,0.3)',
    
    info: '#6b8eb8',
    infoBg: 'rgba(107,142,184,0.1)',
    infoBorder: 'rgba(107,142,184,0.3)',
    
    border: '#333333',
    borderLight: '#2a2a2a',
    borderFocus: '#c9a962',
    
    shadowSm: '0 2px 8px rgba(0,0,0,0.4)',
    shadowMd: '0 4px 16px rgba(0,0,0,0.5)',
    shadowLg: '0 8px 32px rgba(0,0,0,0.6)',
    shadowGlow: '0 0 24px rgba(201,169,98,0.2)',
  },
  
  typography: {
    fontFamily: '"Playfair Display", Georgia, serif',
    fontFamilyMono: '"Fira Code", monospace',
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
      regular: 300,
      medium: 400,
      semibold: 500,
      bold: 600,
      extrabold: 700,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '40px',
    '3xl': '48px',
    '4xl': '64px',
  },
  
  borderRadius: {
    none: '0px',
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    '2xl': '12px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'finedining',
    grid: {
      desktop: '200px 1fr 360px',
      tablet: '180px 1fr 320px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 200,
        collapsible: true,
      },
      category: {
        position: 'sidebar',
      },
      menu: {
        gridColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        itemMinWidth: '180px',
      },
      cart: {
        width: 360,
        position: 'right',
      },
      payment: {
        position: 'inline',
      },
      keypad: {
        visible: false,
        position: 'right',
      },
    },
  },
  
  animation: {
    duration: '0.4s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reducedMotion: false,
    transitions: {
      fast: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      base: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '0.6s cubic-bezier(0.4, 0, 0.2, 1)',
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
        padding: '14px 28px',
        borderRadius: '4px',
        border: '1px solid #a68a4a',
        background: '#c9a962',
        color: '#0a0a0a',
        fontSize: '13px',
        fontWeight: 500,
        minHeight: '48px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      ghost: {
        padding: '14px 24px',
        borderRadius: '4px',
        border: '1px solid #333333',
        background: 'transparent',
        color: '#b8b8b8',
        fontSize: '13px',
        fontWeight: 400,
        minHeight: '48px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      danger: {
        padding: '14px 24px',
        borderRadius: '4px',
        border: '1px solid rgba(184,71,71,0.3)',
        background: 'rgba(184,71,71,0.1)',
        color: '#b84747',
        fontSize: '13px',
        fontWeight: 400,
        minHeight: '48px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      success: {
        padding: '14px 24px',
        borderRadius: '4px',
        border: '1px solid rgba(127,176,105,0.3)',
        background: 'rgba(127,176,105,0.1)',
        color: '#7fb069',
        fontSize: '13px',
        fontWeight: 400,
        minHeight: '48px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      icon: {
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid transparent',
        background: 'transparent',
        color: '#b8b8b8',
        fontSize: '16px',
        minWidth: '40px',
        minHeight: '40px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    card: {
      background: '#1f1f1f',
      border: '1px solid #333333',
      borderRadius: '6px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      transition: 'box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    input: {
      background: '#1a1a1a',
      border: '1px solid #333333',
      borderRadius: '4px',
      padding: '14px 18px',
      color: '#f5f5f5',
      fontSize: '14px',
      minHeight: '48px',
      letterSpacing: '0.02em',
      transition: 'border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.8)',
      },
      content: {
        background: '#1f1f1f',
        border: '1px solid #333333',
        borderRadius: '6px',
        padding: '32px',
        maxWidth: '540px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
      },
    },
    menuItem: {
      background: '#1f1f1f',
      border: '1px solid #333333',
      borderRadius: '6px',
      padding: '20px',
      minHeight: '160px',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    cartItem: {
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '4px',
      padding: '16px',
    },
    categoryButton: {
      padding: '14px 18px',
      borderRadius: '4px',
      border: '1px solid transparent',
      background: 'transparent',
      fontSize: '12px',
      fontWeight: 400,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    paymentButton: {
      padding: '18px 16px',
      borderRadius: '4px',
      border: '1px solid',
      fontSize: '13px',
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
    focusRing: '0 0 0 1px #c9a962',
  },
  
  custom: {
    goldAccents: true,
    serifTypography: true,
    minimalWhitespace: true,
    subtleAnimations: true,
  },
};

export default fineDiningTheme;
