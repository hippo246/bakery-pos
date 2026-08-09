/**
 * Classic Reports - Classic POS Theme
 * 
 * Modern flat/gradient touchscreen POS skin for Reports with:
 * - Top function key panel (maroon gradient tiles, MENU/MORE tabs)
 * - Top chrome bar (license info, customer name, terminal ID, checkboxes)
 * - Report category selector (horizontal pill bar - SALES, ITEM-WISE, GST, DAY END, STAFF-WISE, PAYMENT MODE)
 * - Filter/header row (purple/lavender bar with From Date, To Date, Terminal ID, Salesman ID inputs)
 * - Report output grid (white background table with cyan highlight for selected row)
 * - Totals footer (green Net Amount-style box for report totals)
 * - Action panel (PRINT, EXPORT, REFRESH, F9 DAY END buttons in gradient maroon tile style)
 */

import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../classic-pos/FunctionKeyPanel';
import TopChrome from '../classic-pos/TopChrome';
import CategoryBar from '../classic-pos/CategoryBar';
import ActionButtons from '../classic-pos/ActionButtons';

export default function ClassicReports({
  orders = [],
  onNavigate,
}) {
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SALES');
  const [selectedRow, setSelectedRow] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);

  const reportCategories = ['SALES', 'ITEM-WISE', 'GST', 'DAY END', 'STAFF-WISE', 'PAYMENT MODE'];

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [terminalId, setTerminalId] = useState('HQ-PC01');
  const [salesmanId, setSalesmanId] = useState('');

  const reportData = [
    { id: 1, billNo: '1001', date: '2024-01-15', time: '10:30', items: 3, amount: 450.00, payment: 'CASH' },
    { id: 2, billNo: '1002', date: '2024-01-15', time: '11:15', items: 2, amount: 320.00, payment: 'GPAY' },
    { id: 3, billNo: '1003', date: '2024-01-15', time: '12:00', items: 5, amount: 780.00, payment: 'PHONEPAY' },
    { id: 4, billNo: '1004', date: '2024-01-15', time: '13:30', items: 1, amount: 150.00, payment: 'CASH' },
    { id: 5, billNo: '1005', date: '2024-01-15', time: '14:45', items: 4, amount: 590.00, payment: 'CARD' },
  ];

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit': onNavigate?.('dashboard'); break;
      case 'day_end': console.log('Day end process'); break;
    }
  }, [onNavigate]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleActionClick = useCallback((actionId) => {
    console.log('Report action:', actionId);
    switch (actionId) {
      case 'print': console.log('Print report'); break;
      case 'export': console.log('Export report'); break;
      case 'refresh': console.log('Refresh report'); break;
      case 'day_end': console.log('Day end process'); break;
    }
  }, []);

  const inputStyle = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '12px',
    width: '100%',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
    }}>
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      <div style={{ padding: '8px', background: '#e8e8e8', borderBottom: '1px solid #d0d0d0' }}>
        <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '8px', background: '#ffffff', borderBottom: '1px solid #d0d0d0' }}>
            <CategoryBar
              categories={reportCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              currentPage={categoryPage}
              totalPages={1}
              onPageChange={setCategoryPage}
            />
          </div>

          <div style={{ background: '#8b7dd8', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', gap: '8px' }}>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From Date" style={inputStyle} />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To Date" style={inputStyle} />
            <input type="text" value={terminalId} onChange={(e) => setTerminalId(e.target.value)} placeholder="Terminal ID" style={inputStyle} />
            <input type="text" value={salesmanId} onChange={(e) => setSalesmanId(e.target.value)} placeholder="Salesman ID" style={inputStyle} />
          </div>

          <div style={{ flex: 1, margin: '8px', background: '#ffffff', border: '1px solid #d0d0d0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 100px 80px 60px 100px 100px', background: '#ffffff', borderBottom: '2px solid #d0d0d0', padding: '8px', fontSize: '12px', fontWeight: '700', color: '#000000' }}>
              <span>Bill No</span>
              <span>Date</span>
              <span>Time</span>
              <span>Items</span>
              <span>Qty</span>
              <span>Amount</span>
              <span>Payment</span>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {reportData.map((row, index) => (
                <div
                  key={index}
                  style={{ display: 'grid', gridTemplateColumns: '80px 80px 100px 80px 60px 100px 100px', padding: '8px', fontSize: '12px', background: selectedRow === index ? '#00bcd4' : '#ffffff', color: selectedRow === index ? '#ffffff' : '#000000', borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }}
                  onClick={() => setSelectedRow(index)}
                >
                  <span>{row.billNo}</span>
                  <span>{row.date}</span>
                  <span>{row.time}</span>
                  <span>{row.items}</span>
                  <span>{row.items}</span>
                  <span>₹{row.amount.toFixed(2)}</span>
                  <span>{row.payment}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderTop: '2px solid #d0d0d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Total Sales:</span>
                <span style={{ color: '#3b7dd8', fontWeight: '700' }}>₹{reportData.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Total Transactions:</span>
                <span style={{ color: '#3b7dd8', fontWeight: '700' }}>{reportData.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Total GST Collected:</span>
                <span style={{ color: '#3b7dd8', fontWeight: '700' }}>₹{(reportData.reduce((sum, r) => sum + r.amount, 0) * 0.18).toFixed(2)}</span>
              </div>
              
              <div style={{ background: '#4caf50', padding: '12px', borderRadius: '8px', marginTop: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#ffffff', marginBottom: '4px' }}>GRAND TOTAL</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#000000' }}>
                  ₹{reportData.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', background: '#e8e8e8', borderLeft: '1px solid #d0d0d0' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Actions
          </div>
          <ActionButtons
            buttons={[
              { id: 'print', label: 'PRINT', style: 'teal' },
              { id: 'export', label: 'EXPORT', style: 'green' },
              { id: 'refresh', label: 'REFRESH', style: 'purple' },
              { id: 'day_end', label: 'DAY END', style: 'red' },
            ]}
            onButtonClick={handleActionClick}
          />
        </div>
      </div>
    </div>
  );
}
