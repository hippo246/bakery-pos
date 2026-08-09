import React from 'react';

const KEYFRAMES = `
  @keyframes modal-fadein {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
`;

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // 'small', 'medium', 'large'
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  footer
}) => {
  React.useEffect(() => {
    if (closeOnEscape && isOpen) {
      const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeStyles = {
    small:  { maxWidth: 400, width: '90%' },
    medium: { maxWidth: 520, width: '90%' },
    large:  { maxWidth: 720, width: '90%' },
  };

  return (
    <div
      style={{
        position:        'fixed',
        top:             0,
        left:            0,
        right:           0,
        bottom:          0,
        background:      'var(--theme-payment-overlay, rgba(0,0,0,0.65))',
        backdropFilter:  'blur(5px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          1000,
        padding:         16,
      }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <style>{KEYFRAMES}</style>
      <div
        style={{
          ...sizeStyles[size],
          background:     'var(--theme-payment-modal-bg, var(--cafe-bg-elevated, #1e1e1e))',
          border:         '1px solid var(--theme-payment-modal-border, var(--cafe-border, #3f3f46))',
          borderRadius:   'var(--theme-payment-modal-radius, 16px)',
          boxShadow:      'var(--theme-payment-modal-shadow, 0 20px 60px rgba(0,0,0,0.5))',
          maxHeight:      '90vh',
          overflow:       'hidden',
          display:        'flex',
          flexDirection:  'column',
          animation:      'modal-fadein 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          fontFamily:     'var(--theme-font-family, system-ui, sans-serif)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding:        '18px 22px',
          borderBottom:   '1px solid var(--theme-payment-border, var(--cafe-border, #3f3f46))',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexShrink:     0,
        }}>
          <h2 style={{
            fontSize:      17,
            fontWeight:    700,
            color:         'var(--theme-payment-text, var(--cafe-text, #fafafa))',
            margin:        0,
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              style={{
                width:        32,
                height:       32,
                borderRadius: 8,
                background:   'var(--theme-payment-surface, var(--cafe-bg, #27272a))',
                border:       '1px solid var(--theme-payment-border, var(--cafe-border, #3f3f46))',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                cursor:       'pointer',
                color:        'var(--theme-payment-subtext, var(--cafe-text-secondary, #a1a1aa))',
                fontSize:     16,
                transition:   'all 0.15s ease',
                lineHeight:   1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background    = 'var(--theme-payment-danger-bg, rgba(239,68,68,0.12))';
                e.currentTarget.style.borderColor   = 'var(--theme-payment-danger, #ef4444)';
                e.currentTarget.style.color         = 'var(--theme-payment-danger, #ef4444)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background    = 'var(--theme-payment-surface, var(--cafe-bg, #27272a))';
                e.currentTarget.style.borderColor   = 'var(--theme-payment-border, var(--cafe-border, #3f3f46))';
                e.currentTarget.style.color         = 'var(--theme-payment-subtext, var(--cafe-text-secondary, #a1a1aa))';
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:        '14px 22px',
            borderTop:      '1px solid var(--theme-payment-border, var(--cafe-border, #3f3f46))',
            display:        'flex',
            justifyContent: 'flex-end',
            gap:            10,
            flexShrink:     0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
