/**
 * Bar Theme
 * 
 * Dark mode with neon accents, high contrast, large buttons,
 * optimized for dim lighting environments. Purple/blue/pink color scheme.
 * 
 * Perfect for bars, nightclubs, and entertainment venues.
 */

export const barTheme = {
  id: 'bar',
  name: 'Bar',
  description: 'Dark mode with neon accents optimized for dim lighting',
  category: 'industry',
  preview: '/themes/bar-preview.png',
  mode: 'dark',
  
  colors: {
    primary: '#9b59b6',
    primaryLight: '#bb77d6',
    primaryDark: '#7d3c98',
    primaryDim: 'rgba(155,89,182,0.15)',
    primaryBg: 'rgba(155,89,182,0.1)',
    primaryBorder: '#7d3c98',
    
    background: '#0d0d14',
    backgroundElevated: '#14141f',
    backgroundSurface: '#1a1a2e',
    backgroundCard: '#16213e',
    backgroundHover: '#1f2a48',
    
    textPrimary: '#e8e8f0',
    textSecondary: '#b8b8c8',
    textTertiary: '#8888a0',
    textMuted: '#606080',
    
    success: '#00ff88',
    successBg: 'rgba(0,255,136,0.1)',
    successBorder: 'rgba(0,255,136,0.4)',
    
    danger: '#ff4757',
    dangerBg: 'rgba(255,71,87,0.1)',
    dangerBorder: 'rgba(255,71,87,0.4)',
    
    warning: '#ffa502',
    warningBg: 'rgba(255,165,2,0.1)',
    warningBorder: 'rgba(255,165,2,0.4)',
    
    info: '#00d2ff',
    infoBg: 'rgba(0,210,255,0.1)',
    infoBorder: 'rgba(0,210,255,0.4)',
    
    border: '#2a2a40',
    borderLight: '#1f1f30',
    borderFocus: '#9b59b6',
    
    shadowSm: '0 2px 8px rgba(0,0,0,0.5)',
    shadowMd: '0 4px 16px rgba(0,0,0,0.6)',
    shadowLg: '0 8px 32px rgba(0,0,0,0.7)',
    shadowGlow: '0 0 24px rgba(155,89,182,0.4)',
  },
  
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontFamilyMono: 'Courier New, monospace',
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
    '4xl': '40px',
  },
  
  borderRadius: {
    none: '0px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '22px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'bar',
    grid: {
      desktop: '180px 1fr 320px',
      tablet: '160px 1fr 280px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 180,
        collapsible: true,
      },
      category: {
        position: 'sidebar',
      },
      menu: {
        gridColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        itemMinWidth: '140px',
      },
      cart: {
        width: 320,
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
    duration: '0.2s',
    easing: 'ease-out',
    reducedMotion: false,
    transitions: {
      fast: '0.15s ease-out',
      base: '0.2s ease-out',
      slow: '0.3s ease-out',
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
        borderRadius: '10px',
        border: '2px solid #7d3c98',
        background: '#9b59b6',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 700,
        minHeight: '48px',
        textShadow: '0 0 8px rgba(155,89,182,0.5)',
        transition: 'all 0.2s ease-out',
      },
      ghost: {
        padding: '12px 20px',
        borderRadius: '10px',
        border: '1px solid #2a2a40',
        background: 'transparent',
        color: '#b8b8c8',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        transition: 'all 0.2s ease-out',
      },
      danger: {
        padding: '12px 20px',
        borderRadius: '10px',
        border: '2px solid rgba(255,71,87,0.4)',
        background: 'rgba(255,71,87,0.1)',
        color: '#ff4757',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        textShadow: '0 0 8px rgba(255,71,87,0.5)',
        transition: 'all 0.2s ease-out',
      },
      success: {
        padding: '12px 20px',
        borderRadius: '10px',
        border: '2px solid rgba(0,255,136,0.4)',
        background: 'rgba(0,255,136,0.1)',
        color: '#00ff88',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        textShadow: '0 0 8px rgba(0,255,136,0.5)',
        transition: 'all 0.2s ease-out',
      },
      icon: {
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid transparent',
        background: 'transparent',
        color: '#b8b8c8',
        fontSize: '18px',
        minWidth: '40px',
        minHeight: '40px',
        transition: 'all 0.2s ease-out',
      },
    },
    card: {
      background: '#16213e',
      border: '1px solid #2a2a40',
      borderRadius: '14px',
      padding: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      transition: 'box-shadow 0.2s ease-out, border-color 0.2s ease-out',
    },
    input: {
      background: '#1a1a2e',
      border: '1px solid #2a2a40',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#e8e8f0',
      fontSize: '14px',
      minHeight: '48px',
      transition: 'border-color 0.2s ease-out, box-shadow 0.2s ease-out',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.8)',
      },
      content: {
        background: '#16213e',
        border: '1px solid #2a2a40',
        borderRadius: '14px',
        padding: '24px',
        maxWidth: '500px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
    menuItem: {
      background: '#16213e',
      border: '1px solid #2a2a40',
      borderRadius: '14px',
      padding: '14px',
      minHeight: '140px',
      transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
    },
    cartItem: {
      background: '#1a1a2e',
      border: '1px solid #2a2a40',
      borderRadius: '10px',
      padding: '14px',
    },
    categoryButton: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid transparent',
      background: 'transparent',
      fontSize: '13px',
      fontWeight: 700,
      transition: 'all 0.2s ease-out',
    },
    paymentButton: {
      padding: '16px 12px',
      borderRadius: '12px',
      border: '2px solid',
      fontSize: '14px',
      fontWeight: 800,
      transition: 'all 0.2s ease-out',
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
    highContrast: true,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '0 0 0 2px #9b59b6',
  },
  
  custom: {
    neonAccents: true,
    darkMode: true,
    highContrast: true,
    glowEffects: true,
  },
};

export default barTheme;
