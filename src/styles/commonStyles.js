// Common style utilities to reduce inline style duplication

export const COLORS = {
  primary: '#2563eb',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1a1a1a',
  light: '#f9fafb',
  text: '#374151',
  textMute: '#6b7280',
  border: '#d1d5db',
  background: '#ffffff'
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px'
};

export const FONT_SIZES = {
  xs: '10px',
  sm: '12px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  xxl: '20px'
};

export const commonStyles = {
  // Button styles
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  buttonPrimary: {
    ...commonStyles.button,
    background: COLORS.primary,
    color: '#ffffff'
  },
  buttonSecondary: {
    ...commonStyles.button,
    background: COLORS.secondary,
    color: '#ffffff'
  },
  buttonSuccess: {
    ...commonStyles.button,
    background: COLORS.success,
    color: '#ffffff'
  },
  buttonDanger: {
    ...commonStyles.button,
    background: COLORS.danger,
    color: '#ffffff'
  },
  buttonWarning: {
    ...commonStyles.button,
    background: COLORS.warning,
    color: '#ffffff'
  },
  buttonOutline: {
    ...commonStyles.button,
    background: COLORS.background,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`
  },
  
  // Input styles
  input: {
    padding: '8px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    fontSize: FONT_SIZES.md,
    background: COLORS.background,
    color: COLORS.text,
    outline: 'none'
  },
  inputFocus: {
    ...commonStyles.input,
    borderColor: COLORS.primary
  },
  
  // Card styles
  card: {
    background: COLORS.background,
    borderRadius: '8px',
    padding: SPACING.lg,
    border: `1px solid ${COLORS.border}`
  },
  cardDark: {
    ...commonStyles.card,
    background: COLORS.dark,
    color: '#ffffff',
    borderColor: '#333333'
  },
  
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: COLORS.background,
    borderRadius: '8px',
    padding: SPACING.xxl,
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  
  // Flex utilities
  flex: {
    display: 'flex'
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  
  // Text styles
  text: {
    color: COLORS.text
  },
  textMute: {
    color: COLORS.textMute
  },
  textSmall: {
    fontSize: FONT_SIZES.sm
  },
  textLarge: {
    fontSize: FONT_SIZES.lg
  },
  
  // Spacing utilities
  p: {
    padding: SPACING.md
  },
  pSm: {
    padding: SPACING.sm
  },
  pLg: {
    padding: SPACING.lg
  },
  m: {
    margin: SPACING.md
  },
  mSm: {
    margin: SPACING.sm
  },
  mLg: {
    margin: SPACING.lg
  },
  mb: {
    marginBottom: SPACING.md
  },
  mbSm: {
    marginBottom: SPACING.sm
  },
  mbLg: {
    marginBottom: SPACING.lg
  },
  
  // Border utilities
  rounded: {
    borderRadius: '4px'
  },
  roundedLg: {
    borderRadius: '8px'
  },
  
  // Shadow utilities
  shadow: {
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  shadowLg: {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }
};

// Helper function to merge styles
export const mergeStyles = (...styles) => {
  return Object.assign({}, ...styles);
};

// Helper function to create conditional styles
export const conditionalStyle = (condition, style) => {
  return condition ? style : {};
};
