/**
 * Fast Food Comprehensive Theme
 * 
 * Full-featured fast food theme with all advanced features
 * Drive-thru management, complex modifiers, loyalty programs, etc.
 */

export const fastFoodComprehensiveTheme = {
  id: 'fastfood-comprehensive',
  name: 'Fast Food (Comprehensive)',
  description: 'Full-featured fast food theme with drive-thru, modifiers, and loyalty',
  category: 'industry',
  preview: '/themes/fastfood-comprehensive-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#E63946',
    primaryLight: '#FF6B6B',
    primaryDark: '#C1121F',
    primaryDim: 'rgba(230,57,70,0.1)',
    primaryBg: 'rgba(230,57,70,0.05)',
    primaryBorder: '#E63946',
    
    secondary: '#FFD166',
    secondaryLight: '#FFE066',
    secondaryDark: '#E6B800',
    
    background: '#F8F9FA',
    backgroundElevated: '#FFFFFF',
    backgroundSurface: '#F0F0F0',
    backgroundCard: '#FFFFFF',
    backgroundHover: '#FFE8E8',
    
    textPrimary: '#1A1A1A',
    textSecondary: '#333333',
    textTertiary: '#666666',
    textMuted: '#999999',
    
    success: '#2ECC71',
    successBg: '#E8FFE8',
    successBorder: '#2ECC71',
    
    danger: '#E63946',
    dangerBg: '#FFE8E8',
    dangerBorder: '#E63946',
    
    warning: '#FFD166',
    warningBg: '#FFF4E8',
    warningBorder: '#FFD166',
    
    info: '#3498DB',
    infoBg: '#E8F0FF',
    infoBorder: '#3498DB',
    
    border: '#E63946',
    borderLight: '#E0E0E0',
    borderFocus: '#E63946',
    
    shadowSm: '0 2px 4px rgba(0,0,0,0.1)',
    shadowMd: '0 4px 8px rgba(0,0,0,0.15)',
    shadowLg: '0 8px 16px rgba(0,0,0,0.2)',
    shadowGlow: '0 0 10px rgba(230,57,70,0.2)',
  },
  
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
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
    structure: 'fastfood-comprehensive',
    mode: 'sidebar-left',
    grid: {
      desktop: '250px 1fr 400px',
      tablet: '220px 1fr 350px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 250,
        collapsible: true,
      },
      category: {
        position: 'top',
      },
      menu: {
        gridColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        itemMinWidth: '120px',
      },
      cart: {
        width: 400,
        position: 'right',
      },
      payment: {
        position: 'inline',
      },
      keypad: {
        visible: true,
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
        padding: '12px 24px',
        borderRadius: '8px',
        border: '2px solid #E63946',
        background: '#E63946',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 800,
        minHeight: '48px',
        transition: 'all 0.15s ease-out',
      },
      ghost: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: '2px solid #E63946',
        background: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: '14px',
        fontWeight: 800,
        minHeight: '48px',
        transition: 'all 0.15s ease-out',
      },
      danger: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: '2px solid #E63946',
        background: '#E63946',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 800,
        minHeight: '48px',
        transition: 'all 0.15s ease-out',
      },
      success: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: '2px solid #2ECC71',
        background: '#2ECC71',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 800,
        minHeight: '48px',
        transition: 'all 0.15s ease-out',
      },
      icon: {
        padding: '12px',
        borderRadius: '8px',
        border: '2px solid #E63946',
        background: '#FFFFFF',
        color: '#1A1A1A',
        fontSize: '20px',
        minWidth: '48px',
        minHeight: '48px',
        transition: 'all 0.15s ease-out',
      },
    },
    card: {
      background: '#FFFFFF',
      border: '3px solid #E63946',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    },
    input: {
      background: '#F8F9FA',
      border: '2px solid #E63946',
      borderRadius: '4px',
      padding: '12px 16px',
      color: '#1A1A1A',
      fontSize: '14px',
      fontWeight: 700,
      minHeight: '48px',
      transition: 'border-color 0.15s ease-out',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.5)',
      },
      content: {
        background: '#FFFFFF',
        border: '3px solid #E63946',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      },
    },
    menuItem: {
      background: '#FFFFFF',
      border: '3px solid #E63946',
      borderRadius: '8px',
      padding: '16px',
      minHeight: '120px',
      transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
    },
    cartItem: {
      background: '#F8F9FA',
      border: '2px solid #E63946',
      borderRadius: '8px',
      padding: '12px',
    },
    categoryButton: {
      padding: '8px 12px',
      borderRadius: '4px',
      border: '2px solid #E63946',
      background: '#FFFFFF',
      fontSize: '11px',
      fontWeight: 800,
      minHeight: '40px',
      transition: 'all 0.15s ease-out',
    },
    paymentButton: {
      padding: '16px 12px',
      borderRadius: '4px',
      border: '2px solid',
      fontSize: '12px',
      fontWeight: 800,
      minHeight: '48px',
      transition: 'all 0.15s ease-out',
    },
  },
  
  keyboard: {
    enabled: true,
    shortcuts: {
      hold: 'F1',
      clear: 'F2',
      checkout: 'F12',
      search: 'Ctrl+F',
    },
    functionKeys: {
      F1: 'HOLD',
      F2: 'CANCEL',
      F3: 'DISCOUNT',
      F4: 'CUSTOMER',
      F5: 'MODIFY',
      F6: 'PRINT',
      F7: 'SPLIT',
      F8: 'GIFT',
      F9: 'VOID',
      F10: 'COUPON',
      F11: 'LOYALTY',
      F12: 'CHECKOUT',
    },
  },
  
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '0 0 0 4px #E63946',
  },
  
  custom: {
    driveThru: true,
    complexModifiers: true,
    loyaltyProgram: true,
    splitPayment: true,
    kitchenRouting: true,
    stationManagement: true,
  },
};

export default fastFoodComprehensiveTheme;
