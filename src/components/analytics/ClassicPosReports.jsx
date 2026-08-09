/**
 * ClassicPosReports.jsx
 * High-density Reports & Audits tab for Classic POS Theme
 * Legacy enterprise dark charcoal UI with dense data grids
 */

import { useState, useMemo, useEffect } from 'react';

export default function ClassicPosReports({ _orders = [], _staff = [] }) {
  const [activeTab, setActiveTab] = useState('daily_sales');
  const [dateRange, setDateRange] = useState('TODAY');
  const [realOrders, setRealOrders] = useState([]);

  // Load real orders from localStorage
  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('cafeos_orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setRealOrders(orders);
      }
    } catch (error) {
      console.error('[ClassicPosReports] Failed to load orders:', error);
    }
  }, []);

  // Transform real orders to report format
  const salesData = useMemo(() => {
    if (realOrders.length > 0) {
      return realOrders.map((order, idx) => ({
        billNo: order.billNo || `INV-${String(idx + 1).padStart(3, '0')}`,
        time: order.time || new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        orderType: order.orderType || order.type || 'DINE_IN',
        paymentMode: order.paymentMode || order.payment?.method || 'CASH',
        subtotal: order.subtotal || order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
        discount: order.discount || 0,
        cgst: order.cgst || (order.subtotal * 0.025) || 0,
        sgst: order.sgst || (order.subtotal * 0.025) || 0,
        netAmount: order.netAmount || order.total || (order.subtotal || 0) + (order.cgst || 0) + (order.sgst || 0) - (order.discount || 0),
        server: order.server || order.staff?.name || order.staffName || 'Unknown',
      }));
    }
    // Fallback to sample data if no real orders
    return [
    {
      billNo: 'INV-001',
      time: '09:15',
      orderType: 'DINE_IN',
      paymentMode: 'UPI',
      subtotal: 450.00,
      discount: 0,
      cgst: 11.25,
      sgst: 11.25,
      netAmount: 472.50,
      server: 'Rahul',
    },
    {
      billNo: 'INV-002',
      time: '09:32',
      orderType: 'TAKEAWAY',
      paymentMode: 'CASH',
      subtotal: 280.00,
      discount: 20,
      cgst: 6.50,
      sgst: 6.50,
      netAmount: 273.00,
      server: 'Priya',
    },
    {
      billNo: 'INV-003',
      time: '10:05',
      orderType: 'DINE_IN',
      paymentMode: 'CARD',
      subtotal: 850.00,
      discount: 0,
      cgst: 21.25,
      sgst: 21.25,
      netAmount: 892.50,
      server: 'Ankit',
    },
    {
      billNo: 'INV-004',
      time: '10:18',
      orderType: 'DELIVERY',
      paymentMode: 'SWIGGY',
      subtotal: 420.00,
      discount: 0,
      cgst: 10.50,
      sgst: 10.50,
      netAmount: 441.00,
      server: 'Suresh',
    },
    {
      billNo: 'INV-005',
      time: '10:45',
      orderType: 'DINE_IN',
      paymentMode: 'UPI',
      subtotal: 650.00,
      discount: 50,
      cgst: 15.00,
      sgst: 15.00,
      netAmount: 630.00,
      server: 'Rahul',
    },
    {
      billNo: 'INV-006',
      time: '11:02',
      orderType: 'TAKEAWAY',
      paymentMode: 'CASH',
      subtotal: 320.00,
      discount: 0,
      cgst: 8.00,
      sgst: 8.00,
      netAmount: 336.00,
      server: 'Priya',
    },
    {
      billNo: 'INV-007',
      time: '11:20',
      orderType: 'DINE_IN',
      paymentMode: 'UPI',
      subtotal: 780.00,
      discount: 0,
      cgst: 19.50,
      sgst: 19.50,
      netAmount: 819.00,
      server: 'Ankit',
    },
    {
      billNo: 'INV-008',
      time: '11:45',
      orderType: 'DINE_IN',
      paymentMode: 'CARD',
      subtotal: 520.00,
      discount: 30,
      cgst: 12.25,
      sgst: 12.25,
      netAmount: 516.50,
      server: 'Suresh',
    },
    {
      billNo: 'INV-009',
      time: '12:10',
      orderType: 'TAKEAWAY',
      paymentMode: 'UPI',
      subtotal: 380.00,
      discount: 0,
      cgst: 9.50,
      sgst: 9.50,
      netAmount: 399.00,
      server: 'Rahul',
    },
    {
      billNo: 'INV-010',
      time: '12:35',
      orderType: 'DINE_IN',
      paymentMode: 'CASH',
      subtotal: 920.00,
      discount: 0,
      cgst: 23.00,
      sgst: 23.00,
      netAmount: 966.00,
      server: 'Priya',
    },
  ];
  }, [realOrders]);

  // Calculate totals
  const totals = useMemo(() => {
    return salesData.reduce((acc, row) => ({
      subtotal: acc.subtotal + row.subtotal,
      discount: acc.discount + row.discount,
      cgst: acc.cgst + row.cgst,
      sgst: acc.sgst + row.sgst,
      netAmount: acc.netAmount + row.netAmount,
    }), { subtotal: 0, discount: 0, cgst: 0, sgst: 0, netAmount: 0 });
  }, [salesData]);

  // Report tabs configuration
  const reportTabs = [
    { id: 'daily_sales', label: '1. DAILY SALES & Z-REPORT' },
    { id: 'gst_tax', label: '2. GST TAX REPORT' },
    { id: 'payment_reconciliation', label: '3. PAYMENT MODE RECONCILIATION' },
    { id: 'item_performance', label: '4. ITEM & CATEGORY PERFORMANCE' },
    { id: 'staff_report', label: '5. WAITER & STAFF REPORT' },
    { id: 'void_audit', label: '6. VOID & CANCEL AUDIT' },
  ];

  // Get table headers based on active tab
  const getTableHeaders = () => {
    switch (activeTab) {
      case 'daily_sales':
        return ['Bill No.', 'Time', 'Order Type', 'Payment Mode', 'Subtotal', 'Discount', 'CGST (2.5%)', 'SGST (2.5%)', 'Net Amount', 'Server'];
      case 'gst_tax':
        return ['Bill No.', 'Date', 'Taxable Amount', 'CGST (2.5%)', 'SGST (2.5%)', 'Total GST', 'HSN Code'];
      case 'payment_reconciliation':
        return ['Payment Mode', 'Transaction Count', 'Total Amount', 'Expected', 'Variance', 'Status'];
      case 'item_performance':
        return ['Item Name', 'Category', 'Quantity Sold', 'Revenue', 'Avg Price', 'GST %'];
      case 'staff_report':
        return ['Staff Name', 'Orders Handled', 'Total Revenue', 'Avg Order Value', 'Tips Received'];
      case 'void_audit':
        return ['Bill No.', 'Time', 'Reason', 'Amount', 'Voided By', 'Approved By'];
      default:
        return [];
    }
  };

  // Render table content based on active tab
  const renderTableContent = () => {
    switch (activeTab) {
      case 'daily_sales':
        return salesData.map((row, idx) => (
          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#27272A' : '#3F3F46' }}>
            <td style={cellStyle}>{row.billNo}</td>
            <td style={cellStyle}>{row.time}</td>
            <td style={cellStyle}>{row.orderType}</td>
            <td style={cellStyle}>{row.paymentMode}</td>
            <td style={cellStyle}>₹{row.subtotal.toFixed(2)}</td>
            <td style={{...cellStyle, color: '#EF4444'}}>₹{row.discount.toFixed(2)}</td>
            <td style={cellStyle}>₹{row.cgst.toFixed(2)}</td>
            <td style={cellStyle}>₹{row.sgst.toFixed(2)}</td>
            <td style={{...cellStyle, fontWeight: '800', color: '#22C55E'}}>₹{row.netAmount.toFixed(2)}</td>
            <td style={cellStyle}>{row.server}</td>
          </tr>
        ));
      default:
        return (
          <tr>
            <td colSpan={getTableHeaders().length} style={{...cellStyle, textAlign: 'center', padding: '40px'}}>
              Select a report tab to view data
            </td>
          </tr>
        );
    }
  };

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#27272A',
    borderBottom: '3px solid #3F3F46',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleSectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '900',
    letterSpacing: '1px',
    color: '#FFFFFF',
  };

  const subtitleStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9CA3AF',
  };

  const dateSelectorStyle = {
    display: 'flex',
    gap: '4px',
  };

  const dateButtonStyle = (isActive) => ({
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: isActive ? '#22C55E' : '#3F3F46',
    color: isActive ? '#000000' : '#FFFFFF',
    border: '2px solid #3F3F46',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const exportButtonsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const exportButtonStyle = (color) => ({
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: color,
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const tabsStyle = {
    backgroundColor: '#27272A',
    borderBottom: '2px solid #3F3F46',
    padding: '8px 16px',
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
  };

  const tabButtonStyle = (isActive) => ({
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: isActive ? '#3F3F46' : 'transparent',
    color: isActive ? '#FFFFFF' : '#9CA3AF',
    border: isActive ? '2px solid #22C55E' : '2px solid transparent',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  });

  const mainBodyStyle = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  };

  const leftSectionStyle = {
    width: '65%',
    backgroundColor: '#18181B',
    borderRight: '2px solid #3F3F46',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const rightSectionStyle = {
    width: '35%',
    backgroundColor: '#27272A',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    padding: '12px',
    gap: '12px',
  };

  const tableContainerStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
  };

  const headerCellStyle = {
    backgroundColor: '#3F3F46',
    color: '#FFFFFF',
    padding: '8px 6px',
    fontWeight: '800',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '1px solid #52525B',
    textAlign: 'left',
  };

  const cellStyle = {
    padding: '6px',
    border: '1px solid #3F3F46',
    fontSize: '11px',
    fontWeight: '600',
  };

  const footerCellStyle = {
    ...cellStyle,
    backgroundColor: '#22C55E',
    color: '#000000',
    fontWeight: '900',
    fontSize: '12px',
  };

  const summaryBoxStyle = {
    backgroundColor: '#27272A',
    border: '2px solid #3F3F46',
    padding: '12px',
  };

  const summaryTitleStyle = {
    fontSize: '12px',
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #3F3F46',
    paddingBottom: '4px',
  };

  const summaryRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '11px',
    fontWeight: '700',
  };

  const summaryValueStyle = (color) => ({
    fontFamily: 'monospace',
    fontWeight: '800',
    color: color || '#FFFFFF',
  });

  const progressBarStyle = {
    width: '100%',
    height: '20px',
    backgroundColor: '#3F3F46',
    border: '1px solid #52525B',
    marginBottom: '8px',
    position: 'relative',
  };

  const progressFillStyle = (width, color) => ({
    width: `${width}%`,
    height: '100%',
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '800',
    color: '#000000',
  });

  const alertBoxStyle = {
    backgroundColor: '#3F3F46',
    border: '2px solid #EF4444',
    padding: '12px',
  };

  const alertRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '11px',
    fontWeight: '700',
    color: '#FFFFFF',
  };

  return (
    <div style={containerStyle}>
      {/* TOP HEADER */}
      <div style={headerStyle}>
        {/* Left: Title */}
        <div style={titleSectionStyle}>
          <div style={titleStyle}>REPORTS & FINANCIAL AUDIT HUB</div>
          <div style={subtitleStyle}>Goa Flagship Outlet #01</div>
        </div>

        {/* Center: Date Selector */}
        <div style={dateSelectorStyle}>
          {['TODAY', 'YESTERDAY', 'THIS WEEK', 'THIS MONTH', 'CUSTOM DATES'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              style={dateButtonStyle(dateRange === range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Right: Export Buttons */}
        <div style={exportButtonsStyle}>
          <button style={exportButtonStyle('#22C55E')}>DOWNLOAD GSTR-1 EXCEL</button>
          <button style={exportButtonStyle('#F59E0B')}>EXPORT TO TALLY</button>
          <button style={exportButtonStyle('#EF4444')}>PRINT Z-REPORT</button>
          <button style={exportButtonStyle('#06B6D4')}>PDF SUMMARY</button>
        </div>
      </div>

      {/* REPORT NAVIGATION TABS */}
      <div style={tabsStyle}>
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN BODY */}
      <div style={mainBodyStyle}>
        {/* LEFT SECTION - DATA GRID */}
        <div style={leftSectionStyle}>
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {getTableHeaders().map((header, idx) => (
                    <th key={idx} style={headerCellStyle}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderTableContent()}
                {/* Footer Totals Row */}
                {activeTab === 'daily_sales' && (
                  <tr>
                    <td style={footerCellStyle} colSpan={4}>TOTAL</td>
                    <td style={footerCellStyle}>₹{totals.subtotal.toFixed(2)}</td>
                    <td style={{...footerCellStyle, color: '#EF4444'}}>₹{totals.discount.toFixed(2)}</td>
                    <td style={footerCellStyle}>₹{totals.cgst.toFixed(2)}</td>
                    <td style={footerCellStyle}>₹{totals.sgst.toFixed(2)}</td>
                    <td style={{...footerCellStyle, color: '#22C55E'}}>₹{totals.netAmount.toFixed(2)}</td>
                    <td style={footerCellStyle}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SECTION - AUDIT SUMMARY */}
        <div style={rightSectionStyle}>
          {/* Executive Financial Summary */}
          <div style={summaryBoxStyle}>
            <div style={summaryTitleStyle}>EXECUTIVE FINANCIAL SUMMARY</div>
            <div style={summaryRowStyle}>
              <span>Gross Sales</span>
              <span style={summaryValueStyle('#FFFFFF')}>₹42,850.00</span>
            </div>
            <div style={summaryRowStyle}>
              <span>Discounts Offered</span>
              <span style={summaryValueStyle('#EF4444')}>₹1,200.00</span>
            </div>
            <div style={summaryRowStyle}>
              <span>Net Taxable Sales</span>
              <span style={summaryValueStyle('#FFFFFF')}>₹41,650.00</span>
            </div>
            <div style={summaryRowStyle}>
              <span>CGST Collected (2.5%)</span>
              <span style={summaryValueStyle('#F59E0B')}>₹1,041.25</span>
            </div>
            <div style={summaryRowStyle}>
              <span>SGST Collected (2.5%)</span>
              <span style={summaryValueStyle('#F59E0B')}>₹1,041.25</span>
            </div>
            <div style={{...summaryRowStyle, borderTop: '2px solid #3F3F46', paddingTop: '8px', marginTop: '4px'}}>
              <span>Total GST Liability</span>
              <span style={summaryValueStyle('#F59E0B')}>₹2,082.50</span>
            </div>
            <div style={{...summaryRowStyle, fontSize: '13px', fontWeight: '900'}}>
              <span>Net Collections</span>
              <span style={summaryValueStyle('#22C55E')}>₹43,732.50</span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={summaryBoxStyle}>
            <div style={summaryTitleStyle}>PAYMENT METHOD BREAKDOWN</div>
            
            <div style={progressBarStyle}>
              <div style={progressFillStyle(65, '#22C55E')}>
                UPI/PhonePe/GPay: 65%
              </div>
            </div>
            <div style={summaryRowStyle}>
              <span>UPI / PhonePe / GPay</span>
              <span style={summaryValueStyle('#22C55E')}>₹28,500.00 (65%)</span>
            </div>

            <div style={progressBarStyle}>
              <div style={progressFillStyle(23, '#06B6D4')}>
                Cash: 23%
              </div>
            </div>
            <div style={summaryRowStyle}>
              <span>Cash</span>
              <span style={summaryValueStyle('#06B6D4')}>₹10,200.00 (23%)</span>
            </div>

            <div style={progressBarStyle}>
              <div style={progressFillStyle(9, '#F59E0B')}>
                Cards: 9%
              </div>
            </div>
            <div style={summaryRowStyle}>
              <span>Credit/Debit Cards</span>
              <span style={summaryValueStyle('#F59E0B')}>₹4,032.50 (9%)</span>
            </div>

            <div style={progressBarStyle}>
              <div style={progressFillStyle(3, '#EF4444')}>
                Delivery: 3%
              </div>
            </div>
            <div style={summaryRowStyle}>
              <span>Zomato/Swiggy Direct</span>
              <span style={summaryValueStyle('#EF4444')}>₹1,000.00 (3%)</span>
            </div>
          </div>

          {/* Audit Risk Alerts */}
          <div style={alertBoxStyle}>
            <div style={{...summaryTitleStyle, color: '#EF4444'}}>AUDIT RISK ALERTS</div>
            <div style={alertRowStyle}>
              <span>Total Cancelled Bills</span>
              <span style={summaryValueStyle('#EF4444')}>3 Bills (₹450.00)</span>
            </div>
            <div style={alertRowStyle}>
              <span>Price Overrides</span>
              <span style={summaryValueStyle('#F59E0B')}>2 Occurrences</span>
            </div>
            <div style={alertRowStyle}>
              <span>Open Cash Drawer Without Sale</span>
              <span style={summaryValueStyle('#F59E0B')}>1 Event</span>
            </div>
            <div style={{...alertRowStyle, borderTop: '2px solid #52525B', paddingTop: '8px', marginTop: '4px'}}>
              <span>Cash in Drawer vs Expected</span>
              <span style={summaryValueStyle('#22C55E')}>Matched (₹10,200.00)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
