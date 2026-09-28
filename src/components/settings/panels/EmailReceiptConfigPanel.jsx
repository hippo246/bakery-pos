import React, { useState } from 'react';

export default function EmailReceiptConfigPanel({ formData, handleInputChange, darkMode }) {
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState('');

  const handleTestEmail = async () => {
    if (!formData.brevoApiKey) {
      setTestEmailStatus('Error: Brevo API key not configured');
      return;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': formData.brevoApiKey
        },
        body: JSON.stringify({
          sender: {
            name: formData.storeName || 'BakeryPOS',
            email: formData.storeEmail || 'noreply@bakerypos.com'
          },
          to: [{
            email: formData.testEmailRecipient || formData.storeEmail || 'noreply@bakerypos.com',
            name: 'Test Recipient'
          }],
          subject: 'Test Email from BakeryPOS',
          htmlContent: `
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="text-align: center;">${formData.storeName || 'BakeryPOS'}</h2>
              <p>This is a test email from BakeryPOS email receipt configuration.</p>
              <p>If you receive this email, your email configuration is working correctly!</p>
              <p style="text-align: center; margin-top: 20px;">Thank you!</p>
            </body>
            </html>
          `
        })
      });

      if (response.ok) {
        setTestEmailStatus('Test email sent successfully!');
        setTestEmailSent(true);
        setTimeout(() => setTestEmailSent(false), 3000);
      } else {
        const errorData = await response.json();
        setTestEmailStatus(`Failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      setTestEmailStatus(`Error: ${error.message}`);
    }
  };

  const dm = darkMode;
  const t = {
    bg: dm ? '#1a1a1a' : '#ffffff',
    text: dm ? '#e5e5e5' : '#1a1a1a',
    border: dm ? '#333333' : '#e5e7eb',
    inputBg: dm ? '#2a2a2a' : '#ffffff',
    label: dm ? '#a3a3a3' : '#6b7280'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '15px', fontWeight: '700', color: t.text, marginBottom: '8px' }}>
        📧 Email Receipt Configuration
      </div>

      <div style={{ padding: '16px', background: dm ? '#2a2a2a' : '#f9fafb', borderRadius: '8px', border: `1px solid ${t.border}` }}>
        <div style={{ fontSize: '13px', color: t.label, marginBottom: '12px' }}>
          Configure email receipt delivery using Brevo (formerly Sendinblue) API.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Enable Email Receipts */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: t.text }}>Enable Email Receipts</div>
              <div style={{ fontSize: '12px', color: t.label }}>Send receipts via email to customers</div>
            </div>
            <button
              onClick={() => handleInputChange({ target: { name: 'enableEmailReceipts', value: !formData.enableEmailReceipts } })}
              style={{
                padding: '8px 16px',
                background: formData.enableEmailReceipts ? '#10b981' : '#374151',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {formData.enableEmailReceipts ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Brevo API Key */}
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: t.label }}>
              Brevo API Key
            </label>
            <input
              type="password"
              name="brevoApiKey"
              value={formData.brevoApiKey || ''}
              onChange={handleInputChange}
              placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
              style={{
                width: '100%',
                padding: '10px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '4px',
                color: t.text,
                fontSize: '13px'
              }}
            />
            <div style={{ fontSize: '11px', color: t.label, marginTop: '4px' }}>
              Get your API key from <a href="https://app.brevo.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Brevo Dashboard</a>
            </div>
          </div>

          {/* Store Email */}
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: t.label }}>
              Sender Email Address
            </label>
            <input
              type="email"
              name="storeEmail"
              value={formData.storeEmail || ''}
              onChange={handleInputChange}
              placeholder="noreply@yourstore.com"
              style={{
                width: '100%',
                padding: '10px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '4px',
                color: t.text,
                fontSize: '13px'
              }}
            />
          </div>

          {/* Store Name */}
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: t.label }}>
              Store Name (for email header)
            </label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName || ''}
              onChange={handleInputChange}
              placeholder="Your Store Name"
              style={{
                width: '100%',
                padding: '10px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '4px',
                color: t.text,
                fontSize: '13px'
              }}
            />
          </div>

          {/* Test Email */}
          <div style={{ padding: '12px', background: dm ? '#333333' : '#e5e7eb', borderRadius: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text, marginBottom: '8px' }}>
              Test Email Configuration
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="email"
                name="testEmailRecipient"
                value={formData.testEmailRecipient || ''}
                onChange={handleInputChange}
                placeholder="test@example.com"
                style={{
                  flex: 1,
                  padding: '8px',
                  background: t.inputBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: '4px',
                  color: t.text,
                  fontSize: '12px'
                }}
              />
              <button
                onClick={handleTestEmail}
                disabled={testEmailSent}
                style={{
                  padding: '8px 16px',
                  background: testEmailSent ? '#10b981' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: testEmailSent ? 'default' : 'pointer',
                  fontSize: '12px'
                }}
              >
                {testEmailSent ? 'Sent!' : 'Send Test'}
              </button>
            </div>
            {testEmailStatus && (
              <div style={{ fontSize: '12px', color: testEmailStatus.includes('Error') || testEmailStatus.includes('Failed') ? '#ef4444' : '#10b981' }}>
                {testEmailStatus}
              </div>
            )}
          </div>

          {/* Receipt Template Options */}
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px', color: t.label }}>
              Receipt Template Style
            </label>
            <select
              name="emailReceiptTemplate"
              value={formData.emailReceiptTemplate || 'standard'}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                background: t.inputBg,
                border: `1px solid ${t.border}`,
                borderRadius: '4px',
                color: t.text,
                fontSize: '13px'
              }}
            >
              <option value="standard">Standard (Professional)</option>
              <option value="minimal">Minimal (Simple)</option>
              <option value="detailed">Detailed (Full Breakdown)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
