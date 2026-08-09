/**
 * Classic POS Theme
 * 
 * Based on legacy POS systems - dense interface, square buttons,
 * minimal animations, Windows XP/7 style inspiration, large keypad,
 * category buttons, large payment section, function key panel.
 * 
 * Information-first, touch friendly, very fast, optimized for cashiers.
 */

export const classicTheme = {
  id: 'classic',
  name: 'Classic POS',
  description: 'Traditional POS layout with large keypad and function keys',
  category: 'classic',
  preview: '/themes/classic-preview.png',
  mode: 'light',
  
  colors: {
    primary: '#0066cc',
    primaryLight: '#3388dd',
    primaryDark: '#004499',
    primaryDim: 'rgba(0,102,204,0.1)',
    primaryBg: 'rgba(0,102,204,0.05)',
    primaryBorder: '#004499',

    background: '#ece9d8',
    backgroundElevated: '#ffffff',
    backgroundSurface: '#f5f5f5',
    backgroundCard: '#ffffff',
    backgroundHover: '#e8e8e8',

    textPrimary: '#1a1a1a',
    textSecondary: '#2d2d2d',
    textTertiary: '#4a4a4a',
    textMuted: '#666666',

    success: '#008000',
    successBg: '#ccffcc',
    successBorder: '#008000',

    danger: '#cc0000',
    dangerBg: '#ffe8e8',
    dangerBorder: '#cc0000',

    warning: '#ff9900',
    warningBg: '#fff4e8',
    warningBorder: '#ff9900',

    info: '#0066cc',
    infoBg: '#e8f0ff',
    infoBorder: '#0066cc',

    border: '#808080',
    borderLight: '#c0c0c0',
    borderFocus: '#0066cc',

    shadowSm: '1px 1px 2px rgba(0,0,0,0.1)',
    shadowMd: '2px 2px 4px rgba(0,0,0,0.15)',
    shadowLg: '3px 3px 6px rgba(0,0,0,0.2)',
    shadowGlow: 'none',
  },
  
  typography: {
    fontFamily: 'Tahoma, Arial, sans-serif',
    fontFamilyMono: 'Courier New, monospace',
    sizes: {
      xs: '10px',
      sm: '11px',
      base: '12px',
      lg: '13px',
      xl: '14px',
      '2xl': '18px',
      '3xl': '24px',
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
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    '3xl': '16px',
    '4xl': '20px',
  },
  
  borderRadius: {
    none: '0px',
    sm: '0px',
    md: '0px',
    lg: '2px',
    xl: '2px',
    '2xl': '3px',
    full: '0px',
  },
  
  layout: {
    mode: 'classic',
    structure: 'classic-pos',
    grid: {
      desktop: '1fr 280px',
      tablet: '1fr 240px',
      mobile: '1fr',
    },
    panels: {
      sidebar: {
        width: 0,
        collapsible: false,
        visible: false,
      },
      category: {
        position: 'top',
        visible: true,
        orientation: 'horizontal',
      },
      menu: {
        gridColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
        itemMinWidth: '90px',
        itemSize: 'compact',
        showImages: false,
      },
      cart: {
        width: 280,
        position: 'right',
        orientation: 'vertical',
        compact: true,
      },
      payment: {
        position: 'bottom',
        largeButtons: true,
      },
      keypad: {
        visible: true,
        position: 'right',
        size: 'large',
      },
      functionKeys: {
        visible: true,
        position: 'top',
        columns: 12,
      },
      header: {
        visible: false,
        position: 'top',
      },
    },
    regions: {
      functionKeys: ['FunctionKeyPanel'],
      category: ['CategorySidebar'],
      menu: ['MenuGrid'],
      cart: ['CartPanel'],
      keypad: ['NumericKeypad'],
      payment: ['PaymentPanel'],
      header: [],
      sidebar: [],
      main: [],
      right: [],
      bottom: [],
    },
    density: {
      level: 'maximum',
      fontSizeScale: 0.9,
      spacingScale: 0.7,
    },
  },
  
  animation: {
    duration: '0.05s',
    easing: 'linear',
    reducedMotion: true,
    transitions: {
      fast: '0.05s linear',
      base: '0.1s linear',
      slow: '0.15s linear',
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
        padding: '8px 16px',
        borderRadius: '0px',
        border: '2px outset #ece9d8',
        background: '#ece9d8',
        color: '#000000',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      ghost: {
        padding: '8px 12px',
        borderRadius: '0px',
        border: '1px solid #808080',
        background: '#f5f5f5',
        color: '#000000',
        fontSize: '11px',
        fontWeight: 400,
        minHeight: '32px',
        transition: 'none',
      },
      danger: {
        padding: '8px 16px',
        borderRadius: '0px',
        border: '2px outset #ffcccc',
        background: '#ffcccc',
        color: '#cc0000',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      success: {
        padding: '8px 16px',
        borderRadius: '0px',
        border: '2px outset #ccffcc',
        background: '#ccffcc',
        color: '#008000',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      icon: {
        padding: '6px',
        borderRadius: '0px',
        border: '1px solid #808080',
        background: '#f5f5f5',
        color: '#000000',
        fontSize: '14px',
        minWidth: '32px',
        minHeight: '32px',
        transition: 'none',
      },
    },
    card: {
      background: '#ffffff',
      border: '2px inset #c0c0c0',
      borderRadius: '0px',
      padding: '8px',
      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
      transition: 'none',
    },
    input: {
      background: '#ffffff',
      border: '2px inset #c0c0c0',
      borderRadius: '0px',
      padding: '6px 8px',
      color: '#000000',
      fontSize: '12px',
      minHeight: '28px',
      transition: 'none',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.5)',
      },
      content: {
        background: '#ece9d8',
        border: '3px outset #ffffff',
        borderRadius: '0px',
        padding: '16px',
        maxWidth: '600px',
        boxShadow: '3px 3px 6px rgba(0,0,0,0.3)',
      },
    },
    menuItem: {
      background: '#ffffff',
      border: '2px outset #c0c0c0',
      borderRadius: '0px',
      padding: '8px',
      minHeight: '80px',
      transition: 'none',
    },
    cartItem: {
      background: '#ffffff',
      border: '1px solid #c0c0c0',
      borderRadius: '0px',
      padding: '6px',
    },
    categoryButton: {
      padding: '8px 12px',
      borderRadius: '0px',
      border: '2px outset #ece9d8',
      background: '#ece9d8',
      fontSize: '11px',
      fontWeight: 700,
      transition: 'none',
    },
    paymentButton: {
      padding: '16px 8px',
      borderRadius: '0px',
      border: '3px outset',
      fontSize: '14px',
      fontWeight: 800,
      minHeight: '60px',
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
    highContrast: false,
    largeText: false,
    reducedMotion: true,
    screenReader: false,
    colorblind: false,
    focusVisible: true,
    focusRing: '1px dotted #000000',
  },
  
  custom: {
    windowsStyle: true,
    bevelButtons: true,
    denseLayout: true,
    functionPanel: true,
  },
};

export default classicTheme;
