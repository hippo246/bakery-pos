/**
 * Accessibility Theme
 * 
 * WCAG AA/AAA compliant with high contrast, large text, reduced motion,
 * screen reader optimizations, colorblind-safe palette, enhanced focus states.
 * 
 * Ensures the POS is usable by everyone regardless of ability.
 */

export const accessibilityTheme = {
  id: 'accessibility',
  name: 'Accessibility',
  description: 'WCAG compliant with high contrast and large text for maximum accessibility',
  category: 'accessibility',
  preview: '/themes/accessibility-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#0057b8',
    primaryLight: '#0066d9',
    primaryDark: '#004499',
    primaryDim: 'rgba(0,87,184,0.15)',
    primaryBg: 'rgba(0,87,184,0.1)',
    primaryBorder: '#004499',
    
    background: '#ffffff',
    backgroundElevated: '#ffffff',
    backgroundSurface: '#f8f8f8',
    backgroundCard: '#ffffff',
    backgroundHover: '#e8e8e8',
    
    textPrimary: '#000000',
    textSecondary: '#1a1a1a',
    textTertiary: '#333333',
    textMuted: '#555555',
    
    success: '#006600',
    successBg: '#e8ffe8',
    successBorder: '#006600',
    
    danger: '#cc0000',
    dangerBg: '#ffe8e8',
    dangerBorder: '#cc0000',
    
    warning: '#b8860b',
    warningBg: '#fff8e8',
    warningBorder: '#b8860b',
    
    info: '#0057b8',
    infoBg: '#e8f0ff',
    infoBorder: '#0057b8',
    
    border: '#000000',
    borderLight: '#666666',
    borderFocus: '#0057b8',
    
    shadowSm: '2px 2px 0px #000000',
    shadowMd: '3px 3px 0px #000000',
    shadowLg: '4px 4px 0px #000000',
    shadowGlow: 'none',
  },
  
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontFamilyMono: 'Courier New, monospace',
    sizes: {
      xs: '14px',
      sm: '16px',
      base: '18px',
      lg: '20px',
      xl: '22px',
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
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    full: '50%',
  },
  
  layout: {
    mode: 'sidebar-left',
    structure: 'accessibility',
    grid: {
      desktop: '220px 1fr 360px',
      tablet: '200px 1fr 320px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 220,
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
    duration: '0s',
    easing: 'linear',
    reducedMotion: true,
    transitions: {
      fast: '0s linear',
      base: '0s linear',
      slow: '0s linear',
    },
    effects: {
      hoverLift: false,
      buttonPress: false,
      cardEntrance: false,
      fadeIn: false,
    },
  },
  
  components: {
    button: {
      primary: {
        padding: '16px 32px',
        borderRadius: '6px',
        border: '3px solid #004499',
        background: '#0057b8',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 700,
        minHeight: '56px',
        transition: 'none',
      },
      ghost: {
        padding: '16px 28px',
        borderRadius: '6px',
        border: '3px solid #000000',
        background: '#ffffff',
        color: '#000000',
        fontSize: '18px',
        fontWeight: 600,
        minHeight: '56px',
        transition: 'none',
      },
      danger: {
        padding: '16px 28px',
        borderRadius: '6px',
        border: '3px solid #cc0000',
        background: '#cc0000',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 700,
        minHeight: '56px',
        transition: 'none',
      },
      success: {
        padding: '16px 28px',
        borderRadius: '6px',
        border: '3px solid #006600',
        background: '#006600',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 700,
        minHeight: '56px',
        transition: 'none',
      },
      icon: {
        padding: '12px',
        borderRadius: '6px',
        border: '3px solid #000000',
        background: '#ffffff',
        color: '#000000',
        fontSize: '24px',
        minWidth: '48px',
        minHeight: '48px',
        transition: 'none',
      },
    },
    card: {
      background: '#ffffff',
      border: '3px solid #000000',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '3px 3px 0px #000000',
      transition: 'none',
    },
    input: {
      background: '#ffffff',
      border: '3px solid #000000',
      borderRadius: '6px',
      padding: '16px 20px',
      color: '#000000',
      fontSize: '18px',
      minHeight: '56px',
      transition: 'none',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.8)',
      },
      content: {
        background: '#ffffff',
        border: '4px solid #000000',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '600px',
        boxShadow: '4px 4px 0px #000000',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '3px solid #000000',
      borderRadius: '8px',
      padding: '20px',
      minHeight: '180px',
      transition: 'none',
    },
    cartItem: {
      background: '#f8f8f8',
      border: '2px solid #000000',
      borderRadius: '6px',
      padding: '16px',
    },
    categoryButton: {
      padding: '16px 20px',
      borderRadius: '6px',
      border: '3px solid transparent',
      background: '#f8f8f8',
      fontSize: '16px',
      fontWeight: 700,
      minHeight: '56px',
      transition: 'none',
    },
    paymentButton: {
      padding: '20px 16px',
      borderRadius: '8px',
      border: '3px solid',
      fontSize: '18px',
      fontWeight: 800,
      minHeight: '72px',
      transition: 'none',
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
    highContrast: true,
    largeText: true,
    reducedMotion: true,
    screenReader: true,
    colorblind: true,
    focusVisible: true,
    focusRing: '4px solid #0057b8',
  },
  
  custom: {
    wcagCompliant: true,
    enhancedFocus: true,
    semanticLabels: true,
    keyboardNavigation: true,
  },
};

export default accessibilityTheme;
