/**
 * Theme Type Definitions
 * 
 * Defines the complete schema for POS themes including layout, colors, typography,
 * spacing, animations, components, and keyboard shortcuts.
 */

/**
 * @typedef {Object} ThemeColors
 * @property {string} primary - Primary accent color
 * @property {string} primaryLight - Lighter variant of primary
 * @property {string} primaryDark - Darker variant of primary
 * @property {string} primaryDim - Dimmed/transparent variant
 * @property {string} primaryBg - Background tint
 * @property {string} primaryBorder - Border tint
 * @property {string} background - Main background color
 * @property {string} backgroundElevated - Elevated surface background
 * @property {string} backgroundSurface - Surface background
 * @property {string} backgroundCard - Card background
 * @property {string} backgroundHover - Hover state background
 * @property {string} textPrimary - Primary text color
 * @property {string} textSecondary - Secondary text color
 * @property {string} textTertiary - Tertiary text color
 * @property {string} textMuted - Muted text color
 * @property {string} success - Success color
 * @property {string} successBg - Success background tint
 * @property {string} successBorder - Success border tint
 * @property {string} danger - Danger/error color
 * @property {string} dangerBg - Danger background tint
 * @property {string} dangerBorder - Danger border tint
 * @property {string} warning - Warning color
 * @property {string} warningBg - Warning background tint
 * @property {string} warningBorder - Warning border tint
 * @property {string} info - Info color
 * @property {string} infoBg - Info background tint
 * @property {string} infoBorder - Info border tint
 * @property {string} border - Default border color
 * @property {string} borderLight - Light border color
 * @property {string} borderFocus - Focus border color
 * @property {string} shadowSm - Small shadow
 * @property {string} shadowMd - Medium shadow
 * @property {string} shadowLg - Large shadow
 * @property {string} shadowGlow - Glow effect
 */

/**
 * @typedef {Object} ThemeTypography
 * @property {string} fontFamily - Default font family
 * @property {string} fontFamilyMono - Monospace font family
 * @property {Object} sizes - Font size scale
 * @property {string} sizes.xs - Extra small font (11px)
 * @property {string} sizes.sm - Small font (12px)
 * @property {string} sizes.base - Base font (14px)
 * @property {string} sizes.lg - Large font (16px)
 * @property {string} sizes.xl - Extra large font (18px)
 * @property {string} sizes.2xl - 2x large font (24px)
 * @property {string} sizes.3xl - 3x large font (32px)
 * @property {Object} weights - Font weights
 * @property {number} weights.regular - Regular (400)
 * @property {number} weights.medium - Medium (500)
 * @property {number} weights.semibold - Semibold (600)
 * @property {number} weights.bold - Bold (700)
 * @property {number} weights.extrabold - Extra bold (800)
 */

/**
 * @typedef {Object} ThemeSpacing
 * @property {string} xs - Extra small spacing (4px)
 * @property {string} sm - Small spacing (8px)
 * @property {string} md - Medium spacing (12px)
 * @property {string} lg - Large spacing (16px)
 * @property {string} xl - Extra large spacing (20px)
 * @property {string} 2xl - 2x large spacing (24px)
 * @property {string} 3xl - 3x large spacing (32px)
 * @property {string} 4xl - 4x large spacing (48px)
 */

/**
 * @typedef {Object} ThemeBorderRadius
 * @property {string} none - No radius (0px)
 * @property {string} sm - Small radius (6px)
 * @property {string} md - Medium radius (8px)
 * @property {string} lg - Large radius (12px)
 * @property {string} xl - Extra large radius (16px)
 * @property {string} 2xl - 2x large radius (20px)
 * @property {string} full - Full radius (50%)
 */

/**
 * @typedef {Object} ThemeLayout
 * @property {string} mode - Layout mode: 'sidebar-left', 'sidebar-right', 'top-bar', 'classic', 'legacy'
 * @property {string} structure - Component structure: 'modern', 'classic-pos', 'dense', 'minimal'
 * @property {Object} grid - Grid layout configuration
 * @property {string} grid.desktop - Desktop grid template (e.g., "180px 1fr 320px")
 * @property {string} grid.tablet - Tablet grid template
 * @property {string} grid.mobile - Mobile grid template
 * @property {Object} panels - Panel configurations
 * @property {Object} panels.sidebar - Sidebar panel config
 * @property {number} panels.sidebar.width - Sidebar width in px
 * @property {boolean} panels.sidebar.collapsible - Can sidebar be collapsed
 * @property {boolean} panels.sidebar.visible - Show sidebar
 * @property {Object} panels.category - Category panel config
 * @property {string} panels.category.position - 'sidebar', 'top', 'bottom', 'left'
 * @property {boolean} panels.category.visible - Show category panel
 * @property {string} panels.category.orientation - 'horizontal', 'vertical'
 * @property {Object} panels.menu - Menu panel config
 * @property {string} panels.menu.gridColumns - Grid column template
 * @property {string} panels.menu.itemMinWidth - Minimum item width
 * @property {string} panels.menu.itemSize - 'compact', 'normal', 'large'
 * @property {boolean} panels.menu.showImages - Show product images
 * @property {Object} panels.cart - Cart panel config
 * @property {number} panels.cart.width - Cart width in px
 * @property {string} panels.cart.position - 'right', 'left', 'bottom'
 * @property {string} panels.cart.orientation - 'vertical', 'horizontal'
 * @property {boolean} panels.cart.compact - Compact cart display
 * @property {Object} panels.payment - Payment panel config
 * @property {string} panels.payment.position - 'inline', 'modal', 'bottom', 'right'
 * @property {boolean} panels.payment.largeButtons - Large payment buttons
 * @property {Object} panels.keypad - Numeric keypad config
 * @property {boolean} panels.keypad.visible - Show numeric keypad
 * @property {string} panels.keypad.position - 'right', 'bottom'
 * @property {string} panels.keypad.size - 'normal', 'large'
 * @property {Object} panels.functionKeys - F1-F12 function key panel config
 * @property {boolean} panels.functionKeys.visible - Show function key panel
 * @property {string} panels.functionKeys.position - 'top', 'bottom', 'left', 'right'
 * @property {number} panels.functionKeys.columns - Number of columns
 * @property {Object} panels.header - Header panel config
 * @property {boolean} panels.header.visible - Show header
 * @property {string} panels.header.position - 'top', 'bottom'
 * @property {Object} regions - Layout regions for component placement
 * @property {Array<string>} regions.header - Components in header region
 * @property {Array<string>} regions.sidebar - Components in sidebar region
 * @property {Array<string>} regions.main - Components in main content region
 * @property {Array<string>} regions.right - Components in right panel region
 * @property {Array<string>} regions.bottom - Components in bottom panel region
 * @property {Object} density - Information density settings
 * @property {string} density.level - 'low', 'medium', 'high', 'maximum'
 * @property {number} density.fontSizeScale - Font size multiplier
 * @property {number} density.spacingScale - Spacing multiplier
 */

/**
 * @typedef {Object} ThemeAnimation
 * @property {string} duration - Default animation duration (e.g., "0.2s")
 * @property {string} easing - Default easing function (e.g., "ease")
 * @property {boolean} reducedMotion - Respect reduced motion preference
 * @property {Object} transitions - Transition configurations
 * @property {string} transitions.fast - Fast transition
 * @property {string} transitions.base - Base transition
 * @property {string} transitions.slow - Slow transition
 * @property {Object} effects - Special animation effects
 * @property {boolean} effects.hoverLift - Enable hover lift effect
 * @property {boolean} effects.buttonPress - Enable button press effect
 * @property {boolean} effects.cardEntrance - Enable card entrance animation
 * @property {boolean} effects.fadeIn - Enable fade-in animations
 */

/**
 * @typedef {Object} ThemeComponentStyles
 * @property {Object} button - Button component styles
 * @property {Object} button.primary - Primary button style
 * @property {Object} button.ghost - Ghost button style
 * @property {Object} button.danger - Danger button style
 * @property {Object} button.success - Success button style
 * @property {Object} button.icon - Icon button style
 * @property {Object} card - Card component style
 * @property {Object} input - Input component style
 * @property {Object} modal - Modal component style
 * @property {Object} menuItem - Menu item card style
 * @property {Object} cartItem - Cart item style
 * @property {Object} categoryButton - Category button style
 * @property {Object} paymentButton - Payment button style
 */

/**
 * @typedef {Object} ThemeKeyboard
 * @property {boolean} enabled - Enable keyboard shortcuts
 * @property {Object} shortcuts - Keyboard shortcut mappings
 * @property {string} shortcuts.hold - Hold bill shortcut
 * @property {string} shortcuts.clear - Clear cart shortcut
 * @property {string} shortcuts.checkout - Checkout shortcut
 * @property {string} shortcuts.search - Search shortcut
 * @property {Object} functionKeys - F1-F12 key mappings
 * @property {string} functionKeys.F1 - F1 action
 * @property {string} functionKeys.F2 - F2 action
 * @property {string} functionKeys.F3 - F3 action
 * @property {string} functionKeys.F4 - F4 action
 * @property {string} functionKeys.F5 - F5 action
 * @property {string} functionKeys.F6 - F6 action
 * @property {string} functionKeys.F7 - F7 action
 * @property {string} functionKeys.F8 - F8 action
 * @property {string} functionKeys.F9 - F9 action
 * @property {string} functionKeys.F10 - F10 action
 * @property {string} functionKeys.F11 - F11 action
 * @property {string} functionKeys.F12 - F12 action
 */

/**
 * @typedef {Object} ThemeAccessibility
 * @property {boolean} highContrast - High contrast mode
 * @property {boolean} largeText - Large text mode
 * @property {boolean} reducedMotion - Reduced motion
 * @property {boolean} screenReader - Screen reader optimizations
 * @property {boolean} colorblind - Colorblind-safe palette
 * @property {boolean} focusVisible - Enhanced focus states
 * @property {string} focusRing - Focus ring style
 */

/**
 * @typedef {Object} Theme
 * @property {string} id - Unique theme identifier
 * @property {string} name - Display name
 * @property {string} description - Theme description
 * @property {string} category - Theme category: 'modern', 'classic', 'industry', 'accessibility'
 * @property {string} preview - Preview image URL
 * @property {string} mode - Color mode: 'light', 'dark', or 'auto'
 * @property {ThemeColors} colors - Color palette
 * @property {ThemeTypography} typography - Typography settings
 * @property {ThemeSpacing} spacing - Spacing scale
 * @property {ThemeBorderRadius} borderRadius - Border radius scale
 * @property {ThemeLayout} layout - Layout configuration
 * @property {ThemeAnimation} animation - Animation settings
 * @property {ThemeComponentStyles} components - Component-specific styles
 * @property {ThemeKeyboard} keyboard - Keyboard shortcuts
 * @property {ThemeAccessibility} accessibility - Accessibility settings
 * @property {Object} custom - Custom theme-specific settings
 */

export const THEME_SCHEMA = {
  id: 'string',
  name: 'string',
  description: 'string',
  category: 'string',
  preview: 'string',
  colors: {
    primary: 'string',
    primaryLight: 'string',
    primaryDark: 'string',
    primaryDim: 'string',
    primaryBg: 'string',
    primaryBorder: 'string',
    background: 'string',
    backgroundElevated: 'string',
    backgroundSurface: 'string',
    backgroundCard: 'string',
    backgroundHover: 'string',
    textPrimary: 'string',
    textSecondary: 'string',
    textTertiary: 'string',
    textMuted: 'string',
    success: 'string',
    successBg: 'string',
    successBorder: 'string',
    danger: 'string',
    dangerBg: 'string',
    dangerBorder: 'string',
    warning: 'string',
    warningBg: 'string',
    warningBorder: 'string',
    info: 'string',
    infoBg: 'string',
    infoBorder: 'string',
    border: 'string',
    borderLight: 'string',
    borderFocus: 'string',
    shadowSm: 'string',
    shadowMd: 'string',
    shadowLg: 'string',
    shadowGlow: 'string',
  },
  typography: {
    fontFamily: 'string',
    fontFamilyMono: 'string',
    sizes: {
      xs: 'string',
      sm: 'string',
      base: 'string',
      lg: 'string',
      xl: 'string',
      '2xl': 'string',
      '3xl': 'string',
    },
    weights: {
      regular: 'number',
      medium: 'number',
      semibold: 'number',
      bold: 'number',
      extrabold: 'number',
    },
  },
  spacing: {
    xs: 'string',
    sm: 'string',
    md: 'string',
    lg: 'string',
    xl: 'string',
    '2xl': 'string',
    '3xl': 'string',
    '4xl': 'string',
  },
  borderRadius: {
    none: 'string',
    sm: 'string',
    md: 'string',
    lg: 'string',
    xl: 'string',
    '2xl': 'string',
    full: 'string',
  },
  layout: {
    mode: 'string',
    grid: {
      desktop: 'string',
      tablet: 'string',
      mobile: 'string',
    },
    panels: {
      sidebar: {
        width: 'number',
        collapsible: 'boolean',
      },
      category: {
        position: 'string',
      },
      menu: {
        gridColumns: 'string',
        itemMinWidth: 'string',
      },
      cart: {
        width: 'number',
        position: 'string',
      },
      payment: {
        position: 'string',
      },
      keypad: {
        visible: 'boolean',
        position: 'string',
      },
    },
  },
  animation: {
    duration: 'string',
    easing: 'string',
    reducedMotion: 'boolean',
    transitions: {
      fast: 'string',
      base: 'string',
      slow: 'string',
    },
    effects: {
      hoverLift: 'boolean',
      buttonPress: 'boolean',
      cardEntrance: 'boolean',
      fadeIn: 'boolean',
    },
  },
  components: {
    button: {},
    card: {},
    input: {},
    modal: {},
    menuItem: {},
    cartItem: {},
    categoryButton: {},
    paymentButton: {},
  },
  keyboard: {
    enabled: 'boolean',
    shortcuts: {
      hold: 'string',
      clear: 'string',
      checkout: 'string',
      search: 'string',
    },
    functionKeys: {},
  },
  accessibility: {
    highContrast: 'boolean',
    largeText: 'boolean',
    reducedMotion: 'boolean',
    screenReader: 'boolean',
    colorblind: 'boolean',
    focusVisible: 'boolean',
    focusRing: 'string',
  },
  custom: {},
};
