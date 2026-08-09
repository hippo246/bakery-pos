/**
 * Bakery Theme
 * 
 * Soft pastels, warm colors, rounded corners, friendly typography.
 * Pink, cream, light brown color palette. Inviting and sweet aesthetic.
 * 
 * Perfect for bakeries, patisseries, and sweet shops.
 */

export const bakeryTheme = {
  id: 'bakery',
  name: 'Bakery',
  description: 'Soft pastels with warm colors for a sweet and inviting feel',
  category: 'industry',
  preview: '/themes/bakery-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#e899a3',
    primaryLight: '#f0b8c0',
    primaryDark: '#d47888',
    primaryDim: 'rgba(232,153,163,0.15)',
    primaryBg: 'rgba(232,153,163,0.1)',
    primaryBorder: '#d47888',
    
    background: '#fff9f5',
    backgroundElevated: '#ffffff',
    backgroundSurface: '#fef5f0',
    backgroundCard: '#ffffff',
    backgroundHover: '#fee8e0',
    
    textPrimary: '#4a3728',
    textSecondary: '#6b5444',
    textTertiary: '#8c7360',
    textMuted: '#a8907c',
    
    success: '#7fb069',
    successBg: '#e8f5e0',
    successBorder: '#7fb069',
    
    danger: '#e87878',
    dangerBg: '#f5e8e8',
    dangerBorder: '#e87878',
    
    warning: '#f0b060',
    warningBg: '#fef8f0',
    warningBorder: '#f0b060',
    
    info: '#78a8d0',
    infoBg: '#e8f0f8',
    infoBorder: '#78a8d0',
    
    border: '#e8d8c8',
    borderLight: '#f0e8dc',
    borderFocus: '#e899a3',
    
    shadowSm: '0 2px 6px rgba(74,55,40,0.08)',
    shadowMd: '0 4px 12px rgba(74,55,40,0.12)',
    shadowLg: '0 8px 24px rgba(74,55,40,0.15)',
    shadowGlow: '0 0 20px rgba(232,153,163,0.2)',
  },
  
  typography: {
    fontFamily: '"Nunito", "Quicksand", Arial, sans-serif',
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
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'bakery',
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
    duration: '0.3s',
    easing: 'ease-out',
    reducedMotion: false,
    transitions: {
      fast: '0.2s ease-out',
      base: '0.3s ease-out',
      slow: '0.4s ease-out',
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
        borderRadius: '16px',
        border: '2px solid #d47888',
        background: '#e899a3',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 700,
        minHeight: '48px',
        transition: 'all 0.3s ease-out',
      },
      ghost: {
        padding: '12px 20px',
        borderRadius: '16px',
        border: '2px solid #e8d8c8',
        background: 'transparent',
        color: '#6b5444',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        transition: 'all 0.3s ease-out',
      },
      danger: {
        padding: '12px 20px',
        borderRadius: '16px',
        border: '2px solid #e87878',
        background: '#f5e8e8',
        color: '#e87878',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        transition: 'all 0.3s ease-out',
      },
      success: {
        padding: '12px 20px',
        borderRadius: '16px',
        border: '2px solid #7fb069',
        background: '#e8f5e0',
        color: '#7fb069',
        fontSize: '14px',
        fontWeight: 600,
        minHeight: '48px',
        transition: 'all 0.3s ease-out',
      },
      icon: {
        padding: '10px',
        borderRadius: '12px',
        border: '2px solid transparent',
        background: 'transparent',
        color: '#6b5444',
        fontSize: '18px',
        minWidth: '40px',
        minHeight: '40px',
        transition: 'all 0.3s ease-out',
      },
    },
    card: {
      background: '#ffffff',
      border: '2px solid #e8d8c8',
      borderRadius: '16px',
      padding: '18px',
      boxShadow: '0 2px 8px rgba(74,55,40,0.08)',
      transition: 'box-shadow 0.3s ease-out, border-color 0.3s ease-out',
    },
    input: {
      background: '#ffffff',
      border: '2px solid #e8d8c8',
      borderRadius: '12px',
      padding: '12px 16px',
      color: '#4a3728',
      fontSize: '14px',
      minHeight: '48px',
      transition: 'border-color 0.3s ease-out, box-shadow 0.3s ease-out',
    },
    modal: {
      overlay: {
        background: 'rgba(74,55,40,0.4)',
      },
      content: {
        background: '#ffffff',
        border: '2px solid #e8d8c8',
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '520px',
        boxShadow: '0 8px 32px rgba(74,55,40,0.15)',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '2px solid #e8d8c8',
      borderRadius: '18px',
      padding: '16px',
      minHeight: '150px',
      transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
    },
    cartItem: {
      background: '#fef5f0',
      border: '2px solid #e8d8c8',
      borderRadius: '14px',
      padding: '14px',
    },
    categoryButton: {
      padding: '12px 18px',
      borderRadius: '14px',
      border: '2px solid transparent',
      background: 'transparent',
      fontSize: '13px',
      fontWeight: 700,
      transition: 'all 0.3s ease-out',
    },
    paymentButton: {
      padding: '16px 14px',
      borderRadius: '16px',
      border: '2px solid',
      fontSize: '14px',
      fontWeight: 800,
      transition: 'all 0.3s ease-out',
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
    focusRing: '0 0 0 3px #e899a3',
  },
  
  custom: {
    pastelPalette: true,
    roundedCorners: true,
    friendlyTypography: true,
    softShadows: true,
  },
};

export default bakeryTheme;
