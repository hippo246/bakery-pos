/**
 * Classic POS Theme - Dark Mode
 * 
 * Dark variant of the Classic POS layout
 */

export const classicDarkTheme = {
  id: 'classic-dark',
  name: 'Classic POS Dark',
  description: 'Traditional POS layout with dark colors and large keypad',
  category: 'classic',
  preview: '/themes/classic-dark-preview.png',
  mode: 'dark',
  
  colors: {
    primary: '#4a9eff',
    primaryLight: '#7ab8ff',
    primaryDark: '#2a80e0',
    primaryDim: 'rgba(74,158,255,0.1)',
    primaryBg: 'rgba(74,158,255,0.05)',
    primaryBorder: '#2a80e0',
    
    background: '#1a1a2e',
    backgroundElevated: '#16213e',
    backgroundSurface: '#0f3460',
    backgroundCard: '#1a1a2e',
    backgroundHover: '#16213e',
    
    textPrimary: '#eaeaea',
    textSecondary: '#b8b8b8',
    textTertiary: '#888888',
    textMuted: '#666666',
    
    success: '#00d9a5',
    successBg: 'rgba(0,217,165,0.1)',
    successBorder: 'rgba(0,217,165,0.3)',
    
    danger: '#ff4757',
    dangerBg: 'rgba(255,71,87,0.1)',
    dangerBorder: 'rgba(255,71,87,0.3)',
    
    warning: '#ffa502',
    warningBg: 'rgba(255,165,2,0.1)',
    warningBorder: 'rgba(255,165,2,0.3)',
    
    info: '#4a9eff',
    infoBg: 'rgba(74,158,255,0.1)',
    infoBorder: 'rgba(74,158,255,0.3)',
    
    border: '#2a2a4a',
    borderLight: '#3a3a5a',
    borderFocus: '#4a9eff',
    
    shadowSm: '1px 1px 2px rgba(0,0,0,0.3)',
    shadowMd: '2px 2px 4px rgba(0,0,0,0.4)',
    shadowLg: '3px 3px 6px rgba(0,0,0,0.5)',
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
        border: '2px outset #2a2a4a',
        background: '#16213e',
        color: '#eaeaea',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      ghost: {
        padding: '8px 12px',
        borderRadius: '0px',
        border: '1px solid #3a3a5a',
        background: '#1a1a2e',
        color: '#eaeaea',
        fontSize: '11px',
        fontWeight: 400,
        minHeight: '32px',
        transition: 'none',
      },
      danger: {
        padding: '8px 16px',
        borderRadius: '0px',
        border: '2px outset #2a1a1a',
        background: '#1a1a1a',
        color: '#ff4757',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      success: {
        padding: '8px 16px',
        borderRadius: '0px',
        border: '2px outset #1a2a1a',
        background: '#1a1a1a',
        color: '#00d9a5',
        fontSize: '12px',
        fontWeight: 700,
        minHeight: '40px',
        transition: 'none',
      },
      icon: {
        padding: '6px',
        borderRadius: '0px',
        border: '1px solid #3a3a5a',
        background: '#1a1a2e',
        color: '#eaeaea',
        fontSize: '14px',
        minWidth: '32px',
        minHeight: '32px',
        transition: 'none',
      },
    },
    card: {
      background: '#1a1a2e',
      border: '2px inset #2a2a4a',
      borderRadius: '0px',
      padding: '8px',
      boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
      transition: 'none',
    },
    input: {
      background: '#1a1a2e',
      border: '2px inset #2a2a4a',
      borderRadius: '0px',
      padding: '6px 8px',
      color: '#eaeaea',
      fontSize: '12px',
      minHeight: '28px',
      transition: 'none',
    },
    modal: {
      overlay: {
        background: 'rgba(0,0,0,0.7)',
      },
      content: {
        background: '#1a1a2e',
        border: '3px outset #2a2a4a',
        borderRadius: '0px',
        padding: '16px',
        maxWidth: '600px',
        boxShadow: '3px 3px 6px rgba(0,0,0,0.5)',
      },
    },
    menuItem: {
      background: '#1a1a2e',
      border: '2px outset #2a2a4a',
      borderRadius: '0px',
      padding: '8px',
      minHeight: '80px',
      transition: 'none',
    },
    cartItem: {
      background: '#1a1a2e',
      border: '1px solid #2a2a4a',
      borderRadius: '0px',
      padding: '6px',
    },
    categoryButton: {
      padding: '8px 12px',
      borderRadius: '0px',
      border: '2px outset #16213e',
      background: '#16213e',
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
    focusRing: '1px dotted #4a9eff',
  },
  
  custom: {
    windowsStyle: true,
    bevelButtons: true,
    denseLayout: true,
    functionPanel: true,
  },
};

export default classicDarkTheme;
