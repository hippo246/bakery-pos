import Modal from './Modal.jsx';

const AlertDialog = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error'
  confirmText = 'OK',
  cancelText = null,
  onConfirm,
  onCancel
}) => {
  const typeStyles = {
    info: {
      icon:        'ℹ️',
      bgColor:     'var(--theme-info-bg,     var(--cafe-info-bg))',
      borderColor: 'var(--theme-info-border, var(--cafe-info-border))',
      iconColor:   'var(--theme-info,        var(--cafe-info))',
    },
    success: {
      icon:        '✓',
      bgColor:     'var(--theme-success-bg,     var(--cafe-success-bg))',
      borderColor: 'var(--theme-success-border, var(--cafe-success-border))',
      iconColor:   'var(--theme-success,        var(--cafe-success))',
    },
    warning: {
      icon:        '⚠️',
      bgColor:     'var(--theme-warning-bg,     var(--cafe-warning-bg))',
      borderColor: 'var(--theme-warning-border, var(--cafe-warning-border))',
      iconColor:   'var(--theme-warning,        var(--cafe-warning))',
    },
    error: {
      icon:        '✕',
      bgColor:     'var(--theme-danger-bg,     var(--cafe-danger-bg))',
      borderColor: 'var(--theme-danger-border, var(--cafe-danger-border))',
      iconColor:   'var(--theme-danger,        var(--cafe-danger))',
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  const handleConfirm = () => { if (onConfirm) onConfirm(); onClose(); };
  const handleCancel  = () => { if (onCancel)  onCancel();  onClose(); };

  const baseBtnStyle = {
    padding:      '10px 22px',
    borderRadius: 8,
    fontSize:     14,
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'all 0.15s ease',
    fontFamily:   'var(--theme-font-family, system-ui, sans-serif)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      showCloseButton={false}
      footer={
        <>
          {cancelText && (
            <button
              onClick={handleCancel}
              style={{
                ...baseBtnStyle,
                background:   'var(--theme-payment-surface, var(--cafe-bg, #27272a))',
                border:       '1px solid var(--theme-payment-border, var(--cafe-border, #3f3f46))',
                color:        'var(--theme-payment-subtext, var(--cafe-text-secondary, #a1a1aa))',
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              ...baseBtnStyle,
              background:   style.bgColor,
              border:       `1px solid ${style.borderColor}`,
              color:        style.iconColor,
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Icon badge */}
        <div style={{
          width:           46,
          height:          46,
          borderRadius:    12,
          background:      style.bgColor,
          border:          `1px solid ${style.borderColor}`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        22,
          flexShrink:      0,
        }}>
          {style.icon}
        </div>

        {/* Message */}
        <p style={{
          fontSize:    14,
          lineHeight:  1.65,
          color:       'var(--theme-payment-text, var(--cafe-text, #fafafa))',
          margin:      0,
          whiteSpace:  'pre-wrap',
          paddingTop:  4,
        }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default AlertDialog;
