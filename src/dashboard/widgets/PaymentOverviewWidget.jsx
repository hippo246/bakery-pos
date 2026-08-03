// Payment Overview Widget
// Displays payment breakdown for today

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function PaymentOverviewWidget({ paymentData = {}, onClick = null }) {
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        cash: paymentData.cash || 0,
        card: paymentData.card || 0,
        upi: paymentData.upi || 0,
        split: paymentData.split || 0,
        refunds: paymentData.refunds || 0,
        failed: paymentData.failed || 0,
        pending: paymentData.pending || 0
      };
      setPayments(mockData);
    } catch (err) {
      setError('Failed to load payment data');
      console.error('[PaymentOverviewWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [paymentData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!payments && !loading && !error) {
    return (
      <BaseWidget
        widgetType="payment_overview"
        title="Payment Overview"
        empty={true}
        emptyMessage="No payments today"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="payment_overview"
      title="Payment Overview"
      loading={loading}
      error={error}
      onRefresh={fetchPayments}
      size="medium"
      onClick={onClick}
    >
      {payments && (
        <div className="space-y-3">
          {/* Total Payments */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Collected</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(payments.cash + payments.card + payments.upi)}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Cash</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(payments.cash)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Card</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(payments.card)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">UPI</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(payments.upi)}</div>
            </div>
          </div>

          {/* Issues */}
          {(payments.refunds > 0 || payments.failed > 0 || payments.pending > 0) && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Issues</div>
              <div className="space-y-1">
                {payments.refunds > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Refunds</span>
                    <span className="text-xs font-medium text-red-600">{payments.refunds}</span>
                  </div>
                )}
                {payments.failed > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Failed</span>
                    <span className="text-xs font-medium text-red-600">{payments.failed}</span>
                  </div>
                )}
                {payments.pending > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Pending</span>
                    <span className="text-xs font-medium text-amber-600">{payments.pending}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
