/**
 * Fast Food Theme
 * 
 * Huge menu buttons, large combo selection, very large touch targets,
 * minimal information, quick order flow, color coded.
 * 
 * Optimized for high-volume quick service restaurants.
 */

export const fastFoodTheme = {
  id: 'fastfood',
  name: 'Fast Food',
  description: 'Large touch targets and quick order flow for high-volume service',
  category: 'industry',
  preview: '/themes/fastfood-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#ff0000',
    primaryLight: '#ff4444',
    primaryDark: '#cc0000',
    primaryDim: 'rgba(255,0,0,0.1)',
    primaryBg: 'rgba(255,0,0,0.05)',
    primaryBorder: '#cc0000',
    
    background: '#ffffff',
    backgroundElevated: '#fafafa',
    backgroundSurface: '#f0f0f0',
    backgroundCard: '#ffffff',
    backgroundHover: '#ffe8e8',
    
    textPrimary: '#000000',
    textSecondary: '#333333',
    textTertiary: '#666666',
    textMuted: '#999999',
    
    success: '#00cc00',
    successBg: '#e8ffe8',
    successBorder: '#00cc00',
    
    danger: '#ff0000',
    dangerBg: '#ffe8e8',
    dangerBorder: '#ff0000',
    
    warning: '#ff9900',
    warningBg: '#fff4e8',
    warningBorder: '#ff9900',
    
    info: '#0066ff',
    infoBg: '#e8f0ff',
    infoBorder: '#0066ff',
    
    border: '#cccccc',
    borderLight: '#e0e0e0',
    borderFocus: '#ff0000',
    
    shadowSm: '0 2px 4px rgba(0,0,0,0.1)',
    shadowMd: '0 4px 8px rgba(0,0,0,0.15)',
    shadowLg: '0 8px 16px rgba(0,0,0,0.2)',
    shadowGlow: '0 0 10px rgba(255,0,0,0.2)',
  },
  
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontFamilyMono: 'Courier New, monospace',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '28px',
      '3xl': '36px',
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
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    '4xl': '48px',
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
    structure: 'fastfood-pos',
    mode: 'sidebar-left',
    grid: {
      desktop: '200px 1fr 350px',
      tablet: '180px 1fr 300px',
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
        gridColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        itemMinWidth: '200px',
      },
      cart: {
        width: 350,
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
    duration: '0.15s',
    easing: 'ease-out',
    reducedMotion: false,
    transitions: {
      fast: '0.1s ease-out',
      base: '0.15s ease-out',
      slow: '0.25s ease-out',
    },
    effects: {
      hoverLift: true,
      buttonPress: true,
      cardEntrance: false,
      fadeIn: true,
    },
  },
  
  components: {
    button: {
      primary: {
        padding: '16px 32px',
        borderRadius: '12px',
        border: '2px solid #cc0000',
        background: '#ff0000',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 800,
        minHeight: '60px',
        transition: 'all 0.15s ease-out',
      },
      ghost: {
        padding: '14px 24px',
        borderRadius: '12px',
        border: '2px solid #cccccc',
        background: '#f0f0f0',
        color: '#000000',
        fontSize: '16px',
        fontWeight: 600,
        minHeight: '56px',
        transition: 'all 0.15s ease-out',
      },
      danger: {
        padding: '16px 32px',
        borderRadius: '12px',
        border: '2px solid #cc0000',
        background: '#ff0000',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 800,
        minHeight: '60px',
        transition: 'all 0.15s ease-out',
      },
      success: {
        padding: '16px 32px',
        borderRadius: '12px',
        border: '2px solid #00cc00',
        background: '#00cc00',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 800,
        minHeight: '60px',
        transition: 'all 0.15s ease-out',
      },
      icon: {
        padding: '12px',
        borderRadius: '12px',
        border: '2px solid #cccccc',
        background: '#f0f0f0',
        color: '#000000',
        fontSize: '24px',
        minWidth: '56px',
        minHeight: '56px',
        transition: 'all 0.15s ease-out',
      },
    },
    card: {
      background: '#ffffff',
      border: '2px solid #e0e0e0',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    },
    input: {
      background: '#ffffff',
      border: '2px solid #cccccc',
      borderRadius: '12px',
      padding: '16px 20px',
      color: '#000000',
      fontSize: '18px',
      minHeight: '56px',
      transition: 'border-color 0.15s ease-out',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.5)',
      },
      content: {
        background: '#ffffff',
        border: '3px solid #ff0000',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '3px solid #e0e0e0',
      borderRadius: '16px',
      padding: '20px',
      minHeight: '200px',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    },
    cartItem: {
      background: '#fafafa',
      border: '2px solid #e0e0e0',
      borderRadius: '12px',
      padding: '16px',
    },
    categoryButton: {
      padding: '16px 20px',
      borderRadius: '12px',
      border: '2px solid transparent',
      background: '#f0f0f0',
      fontSize: '16px',
      fontWeight: 700,
      minHeight: '60px',
      transition: 'all 0.15s ease-out',
    },
    paymentButton: {
      padding: '24px 16px',
      borderRadius: '16px',
      border: '3px solid',
      fontSize: '20px',
      fontWeight: 800,
      minHeight: '80px',
      transition: 'all 0.15s ease-out',
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
    largeText: true,
    reducedMotion: false,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '0 0 0 4px #ff0000',
  },
  
  custom: {
    largeTouchTargets: true,
    colorCodedCategories: true,
    comboFocus: true,
  },
};

export default fastFoodTheme;
