/**
 * Cafe Theme
 * 
 * Warm, cozy, coffee shop aesthetic. Earth tones, soft colors,
 * elegant typography, relaxed spacing, artisanal feel.
 * 
 * Perfect for coffee shops, bakeries, and casual dining.
 */

export const cafeTheme = {
  id: 'cafe',
  name: 'Cafe',
  description: 'Warm, cozy cafe atmosphere with earth tones and soft shadows',
  category: 'industry',
  preview: '/themes/cafe-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#8b5a2b',
    primaryLight: '#a0724a',
    primaryDark: '#6b4423',
    primaryDim: 'rgba(139,90,43,0.1)',
    primaryBg: 'rgba(139,90,43,0.05)',
    primaryBorder: '#6b4423',
    
    background: '#faf5f0',
    backgroundElevated: '#ffffff',
    backgroundSurface: '#f5ebe0',
    backgroundCard: '#ffffff',
    backgroundHover: '#f0e6dc',
    
    textPrimary: '#3d2914',
    textSecondary: '#5c4033',
    textTertiary: '#8b7355',
    textMuted: '#a89070',
    
    success: '#5c8a4c',
    successBg: '#e8f0e0',
    successBorder: '#5c8a4c',
    
    danger: '#c94c4c',
    dangerBg: '#f5e8e8',
    dangerBorder: '#c94c4c',
    
    warning: '#d4a044',
    warningBg: '#fcf4e8',
    warningBorder: '#d4a044',
    
    info: '#5c7a9c',
    infoBg: '#e8f0f8',
    infoBorder: '#5c7a9c',
    
    border: '#d4c4b0',
    borderLight: '#e8dcc8',
    borderFocus: '#8b5a2b',
    
    shadowSm: '0 2px 4px rgba(61,41,20,0.08)',
    shadowMd: '0 4px 12px rgba(61,41,20,0.12)',
    shadowLg: '0 8px 24px rgba(61,41,20,0.15)',
    shadowGlow: '0 0 20px rgba(139,90,43,0.15)',
  },
  
  typography: {
    fontFamily: 'Georgia, "Times New Roman", serif',
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
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'cafe',
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
        gridColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        itemMinWidth: '160px',
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
    duration: '0.25s',
    easing: 'ease-in-out',
    reducedMotion: false,
    transitions: {
      fast: '0.2s ease-in-out',
      base: '0.25s ease-in-out',
      slow: '0.35s ease-in-out',
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
        borderRadius: '8px',
        border: '1px solid #6b4423',
        background: '#8b5a2b',
        color: '#faf5f0',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '44px',
        transition: 'all 0.25s ease-in-out',
      },
      ghost: {
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #d4c4b0',
        background: 'transparent',
        color: '#5c4033',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.25s ease-in-out',
      },
      danger: {
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #c94c4c',
        background: '#f5e8e8',
        color: '#c94c4c',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.25s ease-in-out',
      },
      success: {
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #5c8a4c',
        background: '#e8f0e0',
        color: '#5c8a4c',
        fontSize: '14px',
        fontWeight: 500,
        minHeight: '44px',
        transition: 'all 0.25s ease-in-out',
      },
      icon: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid transparent',
        background: 'transparent',
        color: '#5c4033',
        fontSize: '18px',
        minWidth: '40px',
        minHeight: '40px',
        transition: 'all 0.25s ease-in-out',
      },
    },
    card: {
      background: '#ffffff',
      border: '1px solid #e8dcc8',
      borderRadius: '12px',
      padding: '18px',
      boxShadow: '0 2px 8px rgba(61,41,20,0.08)',
      transition: 'box-shadow 0.25s ease-in-out, border-color 0.25s ease-in-out',
    },
    input: {
      background: '#ffffff',
      border: '1px solid #d4c4b0',
      borderRadius: '8px',
      padding: '12px 16px',
      color: '#3d2914',
      fontSize: '14px',
      minHeight: '44px',
      transition: 'border-color 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
    },
    modal: {
      overlay: {
        background: 'rgba(61,41,20,0.5)',
      },
      content: {
        background: '#ffffff',
        border: '1px solid #d4c4b0',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        boxShadow: '0 8px 32px rgba(61,41,20,0.2)',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '1px solid #e8dcc8',
      borderRadius: '12px',
      padding: '16px',
      minHeight: '150px',
      transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
    },
    cartItem: {
      background: '#f5ebe0',
      border: '1px solid #e8dcc8',
      borderRadius: '10px',
      padding: '14px',
    },
    categoryButton: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid transparent',
      background: 'transparent',
      fontSize: '13px',
      fontWeight: 600,
      transition: 'all 0.25s ease-in-out',
    },
    paymentButton: {
      padding: '16px 12px',
      borderRadius: '10px',
      border: '2px solid',
      fontSize: '14px',
      fontWeight: 700,
      transition: 'all 0.25s ease-in-out',
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
    focusRing: '0 0 0 2px #8b5a2b',
  },
  
  custom: {
    warmPalette: true,
    serifHeadings: true,
    organicShapes: true,
  },
};

export default cafeTheme;
