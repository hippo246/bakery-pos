/**
 * Payment Modal
 *
 * Fully theme-aware checkout modal. All colours come from
 * --theme-payment-* CSS variables (set by ThemeStyles.js),
 * so it looks great on every one of the 12 built-in themes.
 *
 * Payment method buttons are rendered by PaymentMethodSelector,
 * which uses brand-accurate logos and gradients for each provider.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPaymentGatewayFactory } from '../../payment/PaymentGatewayFactory.js';
import { PaymentMethod, PaymentStatus } from '../../payment/PaymentGateway.js';
import { getPaymentStorage, PaymentRecord } from '../../payment/PaymentGateway.js';
import { getSelfHealingEngine } from '../../operations/SelfHealingEngine';
import PaymentMethodSelector from './PaymentMethodSelector';

// Map selector method IDs to our internal PaymentMethod enum values
const ID_TO_ENUM = {
  cash:       PaymentMethod.CASH,
  gpay:       PaymentMethod.UPI,
  phonepay:   PaymentMethod.UPI,
  razorpay:   PaymentMethod.CARD, // Razorpay gateway defaults to card
  upi:        PaymentMethod.UPI,
  paytm:      PaymentMethod.WALLET,
  card:       PaymentMethod.CARD,
  netbanking: PaymentMethod.NET_BANKING,
};

const PROVIDER_LABELS = {
  cash:     'Cash',
  gpay:     'GPay',
  phonepay: 'PhonePe',
  razorpay: 'Razorpay',
  upi:      'UPI',
  paytm:    'Paytm',
};

// ─── Keyframe injection (once) ────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes pm-spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pm-fadein {
    from { opacity: 0; transform: scale(0.97) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes pm-success-pop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentModal({
  visible,
  onClose,
  orderDetails,
  onSuccess,
  onFailure,
  customerInfo,
  initialPaymentMethod = 'razorpay',
}) {
  const [loading, setLoading]                   = useState(false);
  const [processing, setProcessing]             = useState(false);
  const [error, setError]                       = useState(null);
  const [succeeded, setSucceeded]               = useState(false);
  const [selectedGateway, setSelectedGateway]   = useState(null);
  const [selectedMethod, setSelectedMethod]     = useState(initialPaymentMethod);
  const [paymentRecord, setPaymentRecord]       = useState(null);
  const [gatewayOrder, setGatewayOrder]         = useState(null);

  const factory        = getPaymentGatewayFactory();
  const paymentStorage = getPaymentStorage();
  const initializedRef = useRef(false);

  const initializePayment = useCallback(async () => {
    try {
      console.log('[PaymentModal] === INITIALIZING PAYMENT ===');
      setLoading(true);
      setError(null);

      console.log('[PaymentModal] Order details:', orderDetails);

      // Validate order details
      if (!orderDetails || typeof orderDetails !== 'object') {
        throw new Error('Invalid order details provided');
      }
      
      if (!orderDetails.amount || isNaN(orderDetails.amount) || orderDetails.amount <= 0) {
        throw new Error(`Invalid amount: ${orderDetails.amount}. Amount must be a positive number.`);
      }
      
      if (!orderDetails.orderId) {
        throw new Error('Missing order ID');
      }

      console.log('[PaymentModal] Getting available gateways...');
      const availableGateways = factory?.getAvailableGateways?.() || [];
      console.log('[PaymentModal] Available gateways:', availableGateways);
      
      if (availableGateways.length === 0) {
        console.warn('[PaymentModal] No gateways configured, checking localStorage');
        // Check if Razorpay is configured in localStorage
        const storedConfigs = localStorage.getItem('cafeos_gateway_configs');
        console.log('[PaymentModal] Stored configs from localStorage:', storedConfigs);
        
        if (storedConfigs) {
          try {
            const configs = JSON.parse(storedConfigs);
            console.log('[PaymentModal] Parsed configs:', configs);
            if (configs.razorpay && configs.razorpay.enabled) {
              console.log('[PaymentModal] Razorpay is configured in localStorage');
              // Try to manually set it as primary
              factory.setPrimaryGateway('razorpay');
              console.log('[PaymentModal] Set Razorpay as primary gateway');
            } else {
              const error = new Error('Razorpay is not configured. Please configure Razorpay first using the "Razorpay Config" button in the POS top bar.');
              error.cause = { reason: 'razorpay_not_configured' };
              throw error;
            }
          } catch (parseError) {
            console.error('[PaymentModal] Failed to parse stored configs:', parseError);
            const error = new Error('Payment gateway configuration is corrupted. Please reconfigure Razorpay.');
            error.cause = { reason: 'config_corrupted', originalError: parseError };
            throw error;
          }
        } else {
          const error = new Error('No payment gateways configured. Please configure Razorpay first using the "Razorpay Config" button in the POS top bar.');
          error.cause = { reason: 'no_gateways' };
          throw error;
        }
      }

      console.log('[PaymentModal] Getting gateway...');
      const gateway = await factory.getGateway?.();
      console.log('[PaymentModal] Gateway obtained:', gateway?.constructor?.name);
      
      if (!gateway) {
        const error = new Error('Failed to get payment gateway. Please check your configuration.');
        error.cause = { reason: 'gateway_not_available' };
        throw error;
      }

      setSelectedGateway(gateway.constructor.name);

      const record = new PaymentRecord({
        orderId:       orderDetails.orderId,
        gateway:       gateway.constructor.name,
        amount:        orderDetails.amount,
        currency:      orderDetails.currency || 'INR',
        paymentMethod: ID_TO_ENUM[selectedMethod] || PaymentMethod.UPI,
        customerInfo:  customerInfo || {},
      });
      setPaymentRecord(record);

      const gatewayOrder = await gateway.createOrder({
        amount: orderDetails.amount,
        currency: orderDetails.currency || 'INR',
        orderId: orderDetails.orderId,
        customerInfo: customerInfo || {},
      });
      setGatewayOrder(gatewayOrder);

      console.log('[PaymentModal] Gateway order created:', gatewayOrder);
    } catch (err) {
      console.error('[PaymentModal] Initialization failed:', err);
      setError(err.message || 'Payment initialization failed');
    } finally {
      setLoading(false);
      console.log('[PaymentModal] === INITIALIZATION COMPLETE ===');
    }
  }, [orderDetails, factory, selectedMethod, customerInfo]);

  const handlePaymentSuccess = useCallback((detail) => {
    setProcessing(false);
    setSucceeded(true);

    try {
      const selfHealingEngine = getSelfHealingEngine();
      if (selfHealingEngine) console.log('[PaymentModal] Payment success reported to self-healing:', detail);
    } catch (e) {
      console.warn('[PaymentModal] Failed to report payment success:', e);
    }

    if (paymentRecord) {
      paymentRecord.updateStatus(PaymentStatus.COMPLETED, {
        gatewayOrderId: detail.razorpayOrderId || detail.transactionId || detail.paymentIntentId,
        gatewayResponse: detail,
        verified: true,
      });
      paymentRecord.markVerified();
      paymentStorage.save(paymentRecord);
    }

    onSuccess?.(detail);
    setTimeout(() => onClose(), 2200);
  }, [paymentRecord, onSuccess, onClose, paymentStorage]);

  const handlePaymentFailure = useCallback((detail) => {
    setProcessing(false);

    try {
      const selfHealingEngine = getSelfHealingEngine();
      if (selfHealingEngine) console.error('[PaymentModal] Payment failure reported to self-healing:', detail);
    } catch (e) {
      console.warn('[PaymentModal] Failed to report payment failure:', e);
    }

    if (paymentRecord) {
      paymentRecord.updateStatus(PaymentStatus.FAILED, { gatewayResponse: detail });
      paymentStorage.save(paymentRecord);
    }

    setError(detail.error || 'Payment failed');
    onFailure?.(detail);
  }, [paymentRecord, onFailure, paymentStorage]);

  useEffect(() => {
    const handleSuccess = (event) => handlePaymentSuccess(event.detail);
    const handleFailure = (event) => handlePaymentFailure(event.detail);
    window.addEventListener('paymentSuccess', handleSuccess);
    window.addEventListener('paymentFailure', handleFailure);
    return () => {
      window.removeEventListener('paymentSuccess', handleSuccess);
      window.removeEventListener('paymentFailure', handleFailure);
    };
  }, [handlePaymentSuccess, handlePaymentFailure]);

  useEffect(() => {
    if (visible && !initializedRef.current) {
      console.log('[PaymentModal] Modal opening, initializing payment...');
      initializedRef.current = true;
      initializePayment();
    } else if (!visible) {
      console.log('[PaymentModal] Modal closing');
      initializedRef.current = false;
    }
  }, [visible, initializePayment]);

  const handleProcessPayment = async () => {
    try {
      console.log('[PaymentModal] === HANDLE PROCESS PAYMENT STARTED ===');
      setProcessing(true);
      setError(null);

      console.log('[PaymentModal] Getting gateway factory...');
      const gateway = await factory.getGateway?.();
      if (!gateway) {
        console.error('[PaymentModal] Payment gateway not available');
        throw new Error('Payment gateway not available');
      }
      console.log('[PaymentModal] Gateway obtained:', gateway.constructor.name);
      
      if (!gatewayOrder?.orderId) {
        console.error('[PaymentModal] Payment order not initialized');
        throw new Error('Payment order not initialized');
      }
      console.log('[PaymentModal] Gateway order ID:', gatewayOrder.orderId);

      console.log('[PaymentModal] Processing payment...');
      console.log('[PaymentModal] Gateway:', gateway.constructor.name);
      console.log('[PaymentModal] Selected method:', selectedMethod);
      console.log('[PaymentModal] Gateway order:', gatewayOrder);

      // Map selected method to payment method enum
      const paymentMethod = ID_TO_ENUM[selectedMethod] || PaymentMethod.CARD;
      console.log('[PaymentModal] Mapped payment method:', paymentMethod);

      const paymentDetails = {
        orderId: gatewayOrder.orderId,
        amount: orderDetails?.amount || 0,
        currency: orderDetails?.currency || 'INR',
        customerInfo: customerInfo || {},
        paymentMethod: paymentMethod,
        description: `Payment for order ${orderDetails?.orderId || 'unknown'}`,
        theme: { color: 'var(--theme-payment-accent)' },
      };

      // Add gateway-specific details
      if (gateway.constructor.name === 'PaytmAdapter') {
        paymentDetails.txnToken = gatewayOrder.txnToken;
      }
      if (gateway.constructor.name === 'StripeAdapter') {
        paymentDetails.clientSecret = gatewayOrder.clientSecret;
      }

      console.log('[PaymentModal] Payment details:', paymentDetails);
      console.log('[PaymentModal] Calling gateway.processPayment...');
      
      // Process payment
      const result = await gateway.processPayment?.(paymentDetails);
      console.log('[PaymentModal] Payment result:', result);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Payment processing failed');
      }

      // Payment completed successfully
      console.log('[PaymentModal] Payment completed successfully');
      handlePaymentSuccess({ gateway: gateway.constructor.name, ...result });
    } catch (err) {
      console.error('[PaymentModal] Payment processing failed:', err);
      handlePaymentFailure({ gateway: selectedGateway, error: err.message || 'Payment processing failed' });
    } finally {
      setProcessing(false);
    }
  };

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleRetry = () => {
    setError(null);
    initializePayment();
  };

  if (!visible) return null;

  // ─── Styles (all use --theme-payment-* variables) ─────────────────────────

  const overlayStyle = {
    position:        'fixed',
    inset:           0,
    backgroundColor: 'var(--theme-payment-overlay)',
    backdropFilter:  'blur(6px)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          9999,
  };

  const modalStyle = {
    position:        'relative',
    backgroundColor: 'var(--theme-payment-modal-bg)',
    border:          '1px solid var(--theme-payment-modal-border)',
    borderRadius:    'var(--theme-payment-modal-radius)',
    padding:         '28px',
    width:           '480px',
    maxWidth:        'calc(100vw - 32px)',
    maxHeight:       'calc(100vh - 48px)',
    overflowY:       'auto',
    color:           'var(--theme-payment-text)',
    boxShadow:       'var(--theme-payment-modal-shadow)',
    animation:       'pm-fadein 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    fontFamily:      'var(--theme-font-family)',
  };

  const headerStyle = {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    marginBottom:    '24px',
    paddingBottom:   '18px',
    borderBottom:    '1px solid var(--theme-payment-border)',
  };

  const titleStyle = {
    fontSize:   '18px',
    fontWeight: '700',
    color:      'var(--theme-payment-text)',
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  };

  const closeBtnStyle = {
    background:   'transparent',
    border:       '1px solid var(--theme-payment-border)',
    borderRadius: '8px',
    color:        'var(--theme-payment-subtext)',
    fontSize:     '18px',
    cursor:       'pointer',
    padding:      '4px 10px',
    lineHeight:   1,
    transition:   'all 0.15s ease',
  };

  const amountCardStyle = {
    background:    'var(--theme-payment-selected-bg)',
    border:        '1px solid var(--theme-payment-selected-border)',
    borderRadius:  '12px',
    padding:       '16px 20px',
    marginBottom:  '22px',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
  };

  const amountStyle = {
    fontSize:   '32px',
    fontWeight: '800',
    color:      'var(--theme-payment-success)',
    lineHeight:  1,
  };

  const sectionLabelStyle = {
    fontSize:      '11px',
    fontWeight:    '600',
    color:         'var(--theme-payment-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom:  '12px',
  };

  const payBtnStyle = {
    width:        '100%',
    padding:      '16px',
    background:   'var(--theme-payment-accent)',
    color:        '#fff',
    border:       'none',
    borderRadius: '12px',
    fontSize:     '16px',
    fontWeight:   '700',
    cursor:        gatewayOrder ? 'pointer' : 'not-allowed',
    opacity:       gatewayOrder ? 1 : 0.5,
    marginTop:    '22px',
    transition:   'all 0.18s ease',
    fontFamily:   'var(--theme-font-family)',
    letterSpacing: '0.3px',
    boxShadow:    gatewayOrder ? 'var(--theme-payment-selected-glow)' : 'none',
  };

  const spinnerStyle = {
    width:        '36px',
    height:       '36px',
    border:       '3px solid var(--theme-payment-border)',
    borderTop:    '3px solid var(--theme-payment-accent)',
    borderRadius: '50%',
    animation:    'pm-spin 0.8s linear infinite',
    margin:       '0 auto 16px',
  };

  const errorBoxStyle = {
    background:   'var(--theme-payment-danger-bg)',
    border:       '1px solid var(--theme-payment-danger)',
    borderRadius: '10px',
    padding:      '12px 16px',
    marginBottom: '18px',
    fontSize:     '14px',
    color:        'var(--theme-payment-danger)',
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
  };

  const successStyle = {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '32px 16px',
    gap:            '16px',
    textAlign:      'center',
  };

  const successIconStyle = {
    fontSize:  '64px',
    animation: 'pm-success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  // ─── Render states ─────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <div style={{ color: 'var(--theme-payment-subtext)', fontSize: '14px' }}>
          Initializing payment…
        </div>
      </div>
    );

    if (processing) return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <div style={{ color: 'var(--theme-payment-subtext)', fontSize: '14px', marginBottom: '8px' }}>
          Processing payment…
        </div>
        <div style={{ color: 'var(--theme-payment-muted)', fontSize: '12px' }}>
          Complete payment in the opened window
        </div>
      </div>
    );

    if (succeeded) return (
      <div style={successStyle}>
        <div style={successIconStyle}>✅</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--theme-payment-success)' }}>
          Payment Successful!
        </div>
        <div style={{ fontSize: '14px', color: 'var(--theme-payment-subtext)' }}>
          ₹{orderDetails?.amount?.toFixed(2)} via {PROVIDER_LABELS[selectedMethod] || selectedMethod}
        </div>
      </div>
    );

    if (error) return (
      <div>
        <div style={errorBoxStyle}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleRetry}
            style={{ ...closeBtnStyle, color: 'var(--theme-payment-accent)', borderColor: 'var(--theme-payment-selected-border)' }}
          >
            Retry
          </button>
          <button onClick={onClose} style={closeBtnStyle}>
            Close
          </button>
        </div>
      </div>
    );

    return (
      <div>
        {/* Amount */}
        <div style={amountCardStyle}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--theme-payment-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Total Amount
            </div>
            <div style={amountStyle}>
              ₹{orderDetails?.amount?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--theme-payment-muted)', marginBottom: '4px' }}>Order</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-payment-subtext)' }}>
              #{orderDetails?.orderId}
            </div>
          </div>
        </div>

        {/* Customer */}
        {customerInfo?.name && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-payment-text)' }}>
                {customerInfo.name}
              </div>
              {customerInfo.phone && (
                <div style={{ fontSize: '12px', color: 'var(--theme-payment-subtext)' }}>
                  {customerInfo.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment method selector */}
        <div style={{ marginBottom: '6px' }}>
          <div style={sectionLabelStyle}>Select Payment Method</div>
          <PaymentMethodSelector
            selected={selectedMethod}
            onSelect={handleMethodSelect}
            size="normal"
            columns={3}
          />
        </div>

        {/* Pay button */}
        <button
          onClick={() => {
            console.log('[PaymentModal] Pay button clicked!');
            handleProcessPayment();
          }}
          style={payBtnStyle}
          disabled={!gatewayOrder}
          onMouseOver={(e) => { if (gatewayOrder) e.currentTarget.style.opacity = '0.88'; }}
          onMouseOut={(e)  => { if (gatewayOrder) e.currentTarget.style.opacity = '1'; }}
        >
          Pay ₹{orderDetails?.amount?.toFixed(2) || '0.00'} via {PROVIDER_LABELS[selectedMethod] || selectedMethod}
        </button>

        {/* Security note */}
        <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--theme-payment-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>🔒</span>
          <span>Secured by {selectedGateway || 'payment gateway'}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <style>{KEYFRAMES}</style>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <span>💳</span>
            <span>Checkout</span>
          </div>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--theme-payment-border)'; }}
            onMouseOut={(e)  => { e.currentTarget.style.background = 'transparent'; }}
          >
            ✕
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
