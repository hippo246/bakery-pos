import React, { useState } from 'react';

export default function ReceiptStudioPanel({ formData, handleInputChange, darkMode, screenSize }) {
  const [activeReceiptTab, setActiveReceiptTab] = useState('design');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalScale, setReceiptModalScale] = useState(1);

  const getPaperWidthPx = (width) => {
    const widths = {
      '58mm': '232px',
      '70mm': '280px',
      '80mm': '320px',
      '82mm': '328px',
      '100mm': '400px',
      '110mm': '440px'
    };
    return widths[width] || '320px';
  };

  const paperWidthPx = getPaperWidthPx(formData.receiptPaperWidth || '80mm');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Preview Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#111111' : '#f9fafb'), borderRadius: '16px', border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>🎨 Receipt Studio</div>
          <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>Customize your thermal receipts with live preview</div>
        </div>
        <button
          onClick={() => setShowReceiptModal(true)}
          style={{
            padding: '12px 24px',
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
        >
          📄 Preview Receipt
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 20px', overflowX: 'auto' }}>
        {[
          { id: 'design', label: '🎨 Design', desc: 'Header, footer, branding' },
          { id: 'paper', label: '🖨️ Paper', desc: 'Width, margins, printing' },
          { id: 'content', label: '📋 Content', desc: 'Sections, items, totals' },
          { id: 'fonts', label: '✏️ Fonts', desc: 'Sizes, styles, alignment' },
          { id: 'tax', label: '🧾 Tax', desc: 'GST, compliance, legal' },
          { id: 'footer', label: '📝 Footer', desc: 'Messages, QR, branding' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReceiptTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeReceiptTab === tab.id ? '#6366f1' : (darkMode ? '#111111' : '#f3f4f6'),
              color: activeReceiptTab === tab.id ? '#ffffff' : (darkMode ? '#9ca3af' : '#4b5563'),
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '0 20px' }}>
        {activeReceiptTab === 'design' && (
          <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Store Logo URL</label>
                <input
                  type="text"
                  value={formData.receiptLogo || ''}
                  onChange={e => handleInputChange('receiptLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Logo Position</label>
                <select
                  value={formData.receiptLogoPosition || 'center'}
                  onChange={e => handleInputChange('receiptLogoPosition', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="center">Center</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Logo Size (px)</label>
                <input
                  type="number"
                  value={formData.receiptLogoSize || 48}
                  onChange={e => handleInputChange('receiptLogoSize', e.target.value)}
                  style={inputStyle(darkMode)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Custom Header Text</label>
                <textarea
                  value={formData.receiptHeader || ''}
                  onChange={e => handleInputChange('receiptHeader', e.target.value)}
                  placeholder="Welcome to our bakery!"
                  rows={2}
                  style={{ ...inputStyle(darkMode), resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Header Style</label>
                <select
                  value={formData.receiptHeaderStyle || 'bold'}
                  onChange={e => handleInputChange('receiptHeaderStyle', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="bold">Bold</option>
                  <option value="italic">Italic</option>
                  <option value="underline">Underline</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Header Border Style</label>
                <select
                  value={formData.receiptHeaderBorder || 'dashed'}
                  onChange={e => handleInputChange('receiptHeaderBorder', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="dashed">Dashed</option>
                  <option value="solid">Solid</option>
                  <option value="double">Double</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeReceiptTab === 'paper' && (
          <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Thermal Paper Width</label>
                <select
                  value={formData.receiptPaperWidth || '80mm'}
                  onChange={e => handleInputChange('receiptPaperWidth', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="58mm">58mm (Compact Mobile)</option>
                  <option value="70mm">70mm (Standard Mobile)</option>
                  <option value="80mm">80mm (Standard)</option>
                  <option value="82mm">82mm (Standard Wide)</option>
                  <option value="100mm">100mm (Wide)</option>
                  <option value="110mm">110mm (Extra Wide)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Paper Margins (px)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <input
                    type="number"
                    value={formData.receiptMarginTop || 16}
                    onChange={e => handleInputChange('receiptMarginTop', e.target.value)}
                    placeholder="Top"
                    style={inputStyle(darkMode)}
                  />
                  <input
                    type="number"
                    value={formData.receiptMarginBottom || 16}
                    onChange={e => handleInputChange('receiptMarginBottom', e.target.value)}
                    placeholder="Bottom"
                    style={inputStyle(darkMode)}
                  />
                  <input
                    type="number"
                    value={formData.receiptMarginLeft || 16}
                    onChange={e => handleInputChange('receiptMarginLeft', e.target.value)}
                    placeholder="Left"
                    style={inputStyle(darkMode)}
                  />
                  <input
                    type="number"
                    value={formData.receiptMarginRight || 16}
                    onChange={e => handleInputChange('receiptMarginRight', e.target.value)}
                    placeholder="Right"
                    style={inputStyle(darkMode)}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Printer Port / Connection</label>
                <input
                  type="text"
                  value={formData.receiptPrinterPort || '9100'}
                  onChange={e => handleInputChange('receiptPrinterPort', e.target.value)}
                  placeholder="9100 or COM1"
                  style={inputStyle(darkMode)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Print Density (DPI)</label>
                <select
                  value={formData.receiptPrintDensity || '203'}
                  onChange={e => handleInputChange('receiptPrintDensity', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="203">203 DPI (Standard)</option>
                  <option value="300">300 DPI (High)</option>
                  <option value="600">600 DPI (Ultra High)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Paper Cut Mode</label>
                <select
                  value={formData.receiptCutMode || 'full'}
                  onChange={e => handleInputChange('receiptCutMode', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="full">Full Cut</option>
                  <option value="partial">Partial Cut</option>
                  <option value="none">No Cut</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Print Speed</label>
                <select
                  value={formData.receiptPrintSpeed || 'normal'}
                  onChange={e => handleInputChange('receiptPrintSpeed', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="slow">Slow (High Quality)</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeReceiptTab === 'content' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
              <ToggleRow label="Show Logo" value={formData.receiptShowLogo !== false} onChange={v => handleInputChange('receiptShowLogo', v)} darkMode={darkMode} />
              <ToggleRow label="Show Header" value={formData.receiptShowHeader !== false} onChange={v => handleInputChange('receiptShowHeader', v)} darkMode={darkMode} />
              <ToggleRow label="Show Footer" value={formData.receiptShowFooter !== false} onChange={v => handleInputChange('receiptShowFooter', v)} darkMode={darkMode} />
              <ToggleRow label="Show Date & Time" value={formData.receiptShowDateTime !== false} onChange={v => handleInputChange('receiptShowDateTime', v)} darkMode={darkMode} />
              <ToggleRow label="Show Bill ID" value={formData.receiptShowBillId !== false} onChange={v => handleInputChange('receiptShowBillId', v)} darkMode={darkMode} />
              <ToggleRow label="Show Order ID" value={formData.receiptShowOrderId !== false} onChange={v => handleInputChange('receiptShowOrderId', v)} darkMode={darkMode} />
              <ToggleRow label="Show Table" value={formData.receiptShowTable !== false} onChange={v => handleInputChange('receiptShowTable', v)} darkMode={darkMode} />
              <ToggleRow label="Show Server" value={formData.receiptShowServer !== false} onChange={v => handleInputChange('receiptShowServer', v)} darkMode={darkMode} />
              <ToggleRow label="Show Customer" value={formData.receiptShowCustomer !== false} onChange={v => handleInputChange('receiptShowCustomer', v)} darkMode={darkMode} />
              <ToggleRow label="Show Email" value={formData.receiptShowEmail !== false} onChange={v => handleInputChange('receiptShowEmail', v)} darkMode={darkMode} />
              <ToggleRow label="Show Items" value={formData.receiptShowItems !== false} onChange={v => handleInputChange('receiptShowItems', v)} darkMode={darkMode} />
              <ToggleRow label="Show Quantities" value={formData.receiptShowQuantities !== false} onChange={v => handleInputChange('receiptShowQuantities', v)} darkMode={darkMode} />
              <ToggleRow label="Show Prices" value={formData.receiptShowPrices !== false} onChange={v => handleInputChange('receiptShowPrices', v)} darkMode={darkMode} />
              <ToggleRow label="Show Subtotal" value={formData.receiptShowSubtotal !== false} onChange={v => handleInputChange('receiptShowSubtotal', v)} darkMode={darkMode} />
              <ToggleRow label="Show Tax" value={formData.receiptShowTax !== false} onChange={v => handleInputChange('receiptShowTax', v)} darkMode={darkMode} />
              <ToggleRow label="Show Discount" value={formData.receiptShowDiscount !== false} onChange={v => handleInputChange('receiptShowDiscount', v)} darkMode={darkMode} />
              <ToggleRow label="Show Service Charge" value={formData.receiptShowServiceCharge !== false} onChange={v => handleInputChange('receiptShowServiceCharge', v)} darkMode={darkMode} />
              <ToggleRow label="Show Tips" value={formData.receiptShowTips !== false} onChange={v => handleInputChange('receiptShowTips', v)} darkMode={darkMode} />
              <ToggleRow label="Show Grand Total" value={formData.receiptShowGrandTotal !== false} onChange={v => handleInputChange('receiptShowGrandTotal', v)} darkMode={darkMode} />
              <ToggleRow label="Show Payment Method" value={formData.receiptShowPaymentMethod !== false} onChange={v => handleInputChange('receiptShowPaymentMethod', v)} darkMode={darkMode} />
              <ToggleRow label="Show Change" value={formData.receiptShowChange !== false} onChange={v => handleInputChange('receiptShowChange', v)} darkMode={darkMode} />
              <ToggleRow label="Show Barcode" value={formData.receiptShowBarcode !== false} onChange={v => handleInputChange('receiptShowBarcode', v)} darkMode={darkMode} />
              <ToggleRow label="Auto-Print Receipt" value={formData.receiptAutoPrint !== false} onChange={v => handleInputChange('receiptAutoPrint', v)} darkMode={darkMode} />
            </div>
          </div>
        )}

        {activeReceiptTab === 'fonts' && (
          <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Font Family</label>
                <select
                  value={formData.receiptFontFamily || 'Courier New'}
                  onChange={e => handleInputChange('receiptFontFamily', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="Courier New">Courier New (Monospace)</option>
                  <option value="Arial">Arial (Sans-serif)</option>
                  <option value="Times New Roman">Times New Roman (Serif)</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Base Font Size (px)</label>
                <input
                  type="number"
                  value={formData.receiptFontSize || 12}
                  onChange={e => handleInputChange('receiptFontSize', e.target.value)}
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Header Font Size (px)</label>
                <input
                  type="number"
                  value={formData.receiptHeaderFontSize || 14}
                  onChange={e => handleInputChange('receiptHeaderFontSize', e.target.value)}
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Total Font Size (px)</label>
                <input
                  type="number"
                  value={formData.receiptTotalFontSize || 16}
                  onChange={e => handleInputChange('receiptTotalFontSize', e.target.value)}
                  style={inputStyle(darkMode)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Line Height</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.receiptLineHeight || 1.4}
                  onChange={e => handleInputChange('receiptLineHeight', e.target.value)}
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Text Alignment</label>
                <select
                  value={formData.receiptTextAlign || 'left'}
                  onChange={e => handleInputChange('receiptTextAlign', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.receiptTextColor || '#000000'}
                    onChange={e => handleInputChange('receiptTextColor', e.target.value)}
                    style={{ width: '50px', height: '40px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    value={formData.receiptTextColor || '#000000'}
                    onChange={e => handleInputChange('receiptTextColor', e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Border Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={formData.receiptBorderColor || '#000000'}
                    onChange={e => handleInputChange('receiptBorderColor', e.target.value)}
                    style={{ width: '50px', height: '40px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    value={formData.receiptBorderColor || '#000000'}
                    onChange={e => handleInputChange('receiptBorderColor', e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`, borderRadius: '12px', fontSize: '15px', background: darkMode ? '#000000' : '#ffffff', color: darkMode ? '#ffffff' : '#0a0a0a', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReceiptTab === 'tax' && (
          <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>GSTIN Number</label>
                <input
                  type="text"
                  value={formData.receiptGstin || ''}
                  onChange={e => handleInputChange('receiptGstin', e.target.value)}
                  placeholder="27AAPFU0939F1ZV"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>FSSAI License Number</label>
                <input
                  type="text"
                  value={formData.receiptFssai || ''}
                  onChange={e => handleInputChange('receiptFssai', e.target.value)}
                  placeholder="11521000000000"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>PAN Number</label>
                <input
                  type="text"
                  value={formData.receiptPan || ''}
                  onChange={e => handleInputChange('receiptPan', e.target.value)}
                  placeholder="ABCDE1234F"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Tariff Code</label>
                <input
                  type="text"
                  value={formData.receiptTariff || ''}
                  onChange={e => handleInputChange('receiptTariff', e.target.value)}
                  placeholder="HSN/SAC Code"
                  style={inputStyle(darkMode)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ToggleRow label="Show GST Breakup" value={formData.receiptShowGst !== false} onChange={v => handleInputChange('receiptShowGst', v)} darkMode={darkMode} />
              <ToggleRow label="Show CGST/SGST Separately" value={formData.receiptShowGstSeparate !== false} onChange={v => handleInputChange('receiptShowGstSeparate', v)} darkMode={darkMode} />
              <ToggleRow label="Show FSSAI License" value={formData.receiptShowFssai !== false} onChange={v => handleInputChange('receiptShowFssai', v)} darkMode={darkMode} />
              <ToggleRow label="Show PAN Number" value={formData.receiptShowPan !== false} onChange={v => handleInputChange('receiptShowPan', v)} darkMode={darkMode} />
              <ToggleRow label="Show Tariff Code" value={formData.receiptShowTariff !== false} onChange={v => handleInputChange('receiptShowTariff', v)} darkMode={darkMode} />
              <ToggleRow label="Show Tax Invoice Number" value={formData.receiptShowTaxInvoice !== false} onChange={v => handleInputChange('receiptShowTaxInvoice', v)} darkMode={darkMode} />
              <ToggleRow label="Show Reverse Charge" value={formData.receiptShowReverseCharge !== false} onChange={v => handleInputChange('receiptShowReverseCharge', v)} darkMode={darkMode} />
            </div>
          </div>
        )}

        {activeReceiptTab === 'footer' && (
          <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle(darkMode)}>Custom Footer Text</label>
                <textarea
                  value={formData.receiptFooter || ''}
                  onChange={e => handleInputChange('receiptFooter', e.target.value)}
                  placeholder="Thank you for visiting!"
                  rows={2}
                  style={{ ...inputStyle(darkMode), resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Footer Style</label>
                <select
                  value={formData.receiptFooterStyle || 'italic'}
                  onChange={e => handleInputChange('receiptFooterStyle', e.target.value)}
                  style={inputStyle(darkMode)}
                >
                  <option value="italic">Italic</option>
                  <option value="bold">Bold</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Google Review URL</label>
                <input
                  type="text"
                  value={formData.receiptGoogleReviewUrl || ''}
                  onChange={e => handleInputChange('receiptGoogleReviewUrl', e.target.value)}
                  placeholder="https://g.page/r/yourbusiness/review"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Brevo API Key (for email receipts)</label>
                <input
                  type="password"
                  value={formData.brevoApiKey || ''}
                  onChange={e => handleInputChange('brevoApiKey', e.target.value)}
                  placeholder="Enter your Brevo API key"
                  style={inputStyle(darkMode)}
                />
              </div>
              <div>
                <label style={labelStyle(darkMode)}>Store Email (sender)</label>
                <input
                  type="email"
                  value={formData.storeEmail || ''}
                  onChange={e => handleInputChange('storeEmail', e.target.value)}
                  placeholder="noreply@yourstore.com"
                  style={inputStyle(darkMode)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <ToggleRow label="Show QR Code" value={formData.receiptShowQr !== false} onChange={v => handleInputChange('receiptShowQr', v)} darkMode={darkMode} />
              <ToggleRow label="Show Google Review QR" value={formData.receiptShowReviewQr !== false} onChange={v => handleInputChange('receiptShowReviewQr', v)} darkMode={darkMode} />
              <ToggleRow label="Show Terms & Conditions" value={formData.receiptShowTerms !== false} onChange={v => handleInputChange('receiptShowTerms', v)} darkMode={darkMode} />
              <ToggleRow label="Show Contact Info" value={formData.receiptShowContact !== false} onChange={v => handleInputChange('receiptShowContact', v)} darkMode={darkMode} />
              <ToggleRow label="Show Social Media" value={formData.receiptShowSocial !== false} onChange={v => handleInputChange('receiptShowSocial', v)} darkMode={darkMode} />
              <ToggleRow label="Show Website URL" value={formData.receiptShowWebsite !== false} onChange={v => handleInputChange('receiptShowWebsite', v)} darkMode={darkMode} />
            </div>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {showReceiptModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '20px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a' }}>📄 Receipt Preview</div>
                <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>
                  {formData.receiptPaperWidth || '80mm'} thermal paper
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setReceiptModalScale(Math.max(0.5, receiptModalScale - 0.1))}
                  style={{
                    padding: '8px 16px',
                    background: darkMode ? '#222222' : '#f3f4f6',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#0a0a0a', minWidth: '50px', textAlign: 'center' }}>
                  {Math.round(receiptModalScale * 100)}%
                </span>
                <button
                  onClick={() => setReceiptModalScale(Math.min(2, receiptModalScale + 0.1))}
                  style={{
                    padding: '8px 16px',
                    background: darkMode ? '#222222' : '#f3f4f6',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Receipt Canvas */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: darkMode ? '#000000' : '#f3f4f6', borderRadius: '12px' }}>
              <div style={{
                transform: `scale(${receiptModalScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s'
              }}>
                <div style={{
                  width: paperWidthPx,
                  background: '#ffffff',
                  color: formData.receiptTextColor || '#000000',
                  padding: `${formData.receiptMarginTop || 16}px ${formData.receiptMarginLeft || 16}px ${formData.receiptMarginBottom || 16}px ${formData.receiptMarginRight || 16}px`,
                  fontFamily: formData.receiptFontFamily || 'Courier New',
                  fontSize: `${formData.receiptFontSize || 12}px`,
                  lineHeight: formData.receiptLineHeight || 1.4,
                  textAlign: formData.receiptTextAlign || 'left',
                  border: '1px solid #ddd',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                  {/* Logo */}
                  {formData.receiptShowLogo !== false && formData.receiptLogo && (
                    <div style={{ textAlign: formData.receiptLogoPosition || 'center', marginBottom: '8px' }}>
                      <img src={formData.receiptLogo} alt="Logo" style={{ maxHeight: `${formData.receiptLogoSize || 48}px`, maxWidth: '100%' }} />
                    </div>
                  )}

                  {/* Header */}
                  {formData.receiptShowHeader !== false && (
                    <div style={{ 
                      fontSize: `${formData.receiptHeaderFontSize || 14}px`,
                      fontWeight: formData.receiptHeaderStyle === 'bold' ? 'bold' : (formData.receiptHeaderStyle === 'italic' ? 'italic' : 'normal'),
                      textDecoration: formData.receiptHeaderStyle === 'underline' ? 'underline' : 'none',
                      textAlign: 'center',
                      marginBottom: '8px'
                    }}>
                      {formData.receiptHeader || 'Welcome to our bakery!'}
                    </div>
                  )}

                  {/* Header Border */}
                  {formData.receiptHeaderBorder !== 'none' && (
                    <div style={{ 
                      borderBottom: formData.receiptHeaderBorder === 'double' ? '3px double' : `1px ${formData.receiptHeaderBorder || 'dashed'} ${formData.receiptBorderColor || '#000000'}`,
                      margin: '8px 0'
                    }} />
                  )}

                  {/* Store Info */}
                  <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
                    {formData.storeName || 'BakeryPOS'}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.9em', marginBottom: '2px' }}>
                    {formData.storeAddress || '123 Baker Street'}
                  </div>
                  {formData.phone && <div style={{ textAlign: 'center', fontSize: '0.9em', marginBottom: '2px' }}>Ph: {formData.phone}</div>}

                  {/* Date & Time */}
                  {formData.receiptShowDateTime !== false && (
                    <div style={{ textAlign: 'center', fontSize: '0.85em', marginTop: '8px' }}>
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {/* Bill ID */}
                  {formData.receiptShowBillId !== false && (
                    <div style={{ textAlign: 'center', fontSize: '0.85em' }}>Bill #: INV-2026-0892</div>
                  )}

                  {/* Order ID */}
                  {formData.receiptShowOrderId !== false && (
                    <div style={{ textAlign: 'center', fontSize: '0.85em' }}>Order #: ORD-12345</div>
                  )}

                  <div style={{ borderBottom: `1px solid ${formData.receiptBorderColor || '#000000'}`, margin: '8px 0' }} />

                  {/* Table & Server */}
                  {formData.receiptShowTable !== false && <div>Table: T-04</div>}
                  {formData.receiptShowServer !== false && <div>Server: John</div>}
                  {formData.receiptShowCustomer !== false && <div>Customer: Jane Doe</div>}

                  <div style={{ borderBottom: `1px solid ${formData.receiptBorderColor || '#000000'}`, margin: '8px 0' }} />

                  {/* Items */}
                  {formData.receiptShowItems !== false && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9em' }}>
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Price</span>
                        <span>Total</span>
                      </div>
                      <div style={{ borderBottom: '1px solid #ddd', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sourdough Bread</span>
                        <span>1</span>
                        <span>₹180</span>
                        <span>₹180.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Croissant</span>
                        <span>2</span>
                        <span>₹120</span>
                        <span>₹240.00</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cappuccino</span>
                        <span>1</span>
                        <span>₹150</span>
                        <span>₹150.00</span>
                      </div>
                    </>
                  )}

                  <div style={{ borderBottom: `1px solid ${formData.receiptBorderColor || '#000000'}`, margin: '8px 0' }} />

                  {/* Subtotal */}
                  {formData.receiptShowSubtotal !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal</span>
                      <span>₹570.00</span>
                    </div>
                  )}

                  {/* Tax */}
                  {formData.receiptShowTax !== false && (
                    <>
                      {formData.receiptShowGstSeparate !== false ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                            <span>CGST (9%)</span>
                            <span>₹51.30</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                            <span>SGST (9%)</span>
                            <span>₹51.30</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>GST (18%)</span>
                          <span>₹102.60</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Discount */}
                  {formData.receiptShowDiscount !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Discount</span>
                      <span>-₹20.00</span>
                    </div>
                  )}

                  {/* Service Charge */}
                  {formData.receiptShowServiceCharge !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Service Charge</span>
                      <span>₹28.50</span>
                    </div>
                  )}

                  {/* Tips */}
                  {formData.receiptShowTips !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tip</span>
                      <span>₹57.00</span>
                    </div>
                  )}

                  <div style={{ borderBottom: `1px solid ${formData.receiptBorderColor || '#000000'}`, margin: '8px 0' }} />

                  {/* Grand Total */}
                  {formData.receiptShowGrandTotal !== false && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontWeight: 'bold', 
                      fontSize: `${formData.receiptTotalFontSize || 16}px`,
                      marginTop: '4px'
                    }}>
                      <span>GRAND TOTAL</span>
                      <span>₹738.10</span>
                    </div>
                  )}

                  <div style={{ borderBottom: `1px solid ${formData.receiptBorderColor || '#000000'}`, margin: '8px 0' }} />

                  {/* Payment Method */}
                  {formData.receiptShowPaymentMethod !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Payment Method</span>
                      <span>Card</span>
                    </div>
                  )}

                  {/* Change */}
                  {formData.receiptShowChange !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Change</span>
                      <span>₹261.90</span>
                    </div>
                  )}

                  {/* Footer */}
                  {formData.receiptShowFooter !== false && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '12px', 
                      fontSize: '0.85em',
                      fontStyle: formData.receiptFooterStyle === 'italic' ? 'italic' : 'normal',
                      fontWeight: formData.receiptFooterStyle === 'bold' ? 'bold' : 'normal'
                    }}>
                      {formData.receiptFooter || 'Thank you for visiting!'}
                    </div>
                  )}

                  {/* Legal */}
                  {formData.receiptShowGst !== false && formData.receiptGstin && (
                    <div style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '4px' }}>GSTIN: {formData.receiptGstin}</div>
                  )}
                  {formData.receiptShowFssai !== false && formData.receiptFssai && (
                    <div style={{ textAlign: 'center', fontSize: '0.8em' }}>FSSAI: {formData.receiptFssai}</div>
                  )}
                  {formData.receiptShowPan !== false && formData.receiptPan && (
                    <div style={{ textAlign: 'center', fontSize: '0.8em' }}>PAN: {formData.receiptPan}</div>
                  )}

                  {/* QR Code */}
                  {formData.receiptShowQr !== false && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <div style={{ width: '64px', height: '64px', background: '#000', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                        [QR]
                      </div>
                    </div>
                  )}

                  {/* Social Media */}
                  {formData.receiptShowSocial !== false && (
                    <div style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '8px' }}>
                      Follow us @yourbusiness
                    </div>
                  )}

                  {/* Website */}
                  {formData.receiptShowWebsite !== false && (
                    <div style={{ textAlign: 'center', fontSize: '0.8em', marginTop: '4px' }}>
                      www.yourbusiness.com
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                style={{
                  padding: '12px 32px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, value, onChange, darkMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: darkMode ? '#111111' : '#f9fafb', borderRadius: '12px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
      <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: value ? '#6366f1' : (darkMode ? '#222222' : '#d1d5db'),
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );
}

const labelStyle = (darkMode) => ({
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: darkMode ? '#e0e0e0' : '#111111',
  marginBottom: '8px'
});

const inputStyle = (darkMode) => ({
  width: '100%',
  padding: '12px 16px',
  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
  borderRadius: '12px',
  fontSize: '15px',
  background: darkMode ? '#000000' : '#ffffff',
  color: darkMode ? '#ffffff' : '#0a0a0a',
  outline: 'none',
  boxSizing: 'border-box'
});
