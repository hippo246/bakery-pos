/**
 * Fast Food Reports Layout
 * 
 * Vibrant touch-friendly reports with fast food styling.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import FunctionKeyPanel from '../fastfood-pos/FunctionKeyPanel';
import ActionButtons from '../fastfood-pos/ActionButtons';
import TopChrome from '../fastfood-pos/TopChrome';

export default function FastFoodReports(props) {
  const { onNavigate } = props;
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Sales');
  const [selectedRow, setSelectedRow] = useState(null);
  const [_categoryPage, _setCategoryPage] = useState(0);
  const [realOrders, setRealOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Load real orders from localStorage
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const storedOrders = localStorage.getItem('cafeos_orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setRealOrders(orders);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('[FastFoodReports] Failed to load orders:', error);
      setLoadError('Failed to load orders data');
      setIsLoading(false);
    }
  }, []);

  const reportCategories = ['Sales', 'Items', 'Payment', 'Staff', 'Hourly'];

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit':
        onNavigate?.('dashboard');
        break;
      case 'print':
        console.log('Print report');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const handleActionClick = useCallback((action) => {
    console.log('Action clicked:', action);
    switch (action) {
      case 'dashboard':
        onNavigate?.('dashboard');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const actionButtons = [
    { id: 'dashboard', label: 'DASHBOARD', style: 'teal' },
  ];

  // Transform real orders to report format
  const reportData = useMemo(() => {
    if (realOrders.length > 0) {
      const itemMap = {};
      realOrders.forEach(order => {
        order.items?.forEach(item => {
          const name = item.name || 'Unknown';
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          itemMap[name] = {
            id: name,
            item: name,
            quantity: (itemMap[name]?.quantity || 0) + quantity,
            amount: (itemMap[name]?.amount || 0) + (price * quantity),
          };
        });
      });
      return Object.values(itemMap).slice(0, 10);
    }
    // Fallback to sample data if no real orders
    return [
      { id: 1, item: 'Burger Combo', quantity: 45, amount: 6750 },
      { id: 2, item: 'Pizza Slice', quantity: 32, amount: 1920 },
      { id: 3, item: 'Fries', quantity: 78, amount: 2340 },
      { id: 4, item: 'Soft Drink', quantity: 120, amount: 3600 },
      { id: 5, item: 'Coffee', quantity: 56, amount: 1680 },
    ];
  }, [realOrders]);

  const rowStyle = (isSelected) => ({
    padding: '12px',
    background: isSelected 
      ? 'linear-gradient(135deg, #e8f4fd 0%, #d4e9f7 100%)'
      : '#ffffff',
    border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f5f5f5',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        gap: '12px', 
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Left Panel - Function Keys */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
        }}>
          <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
        </div>

        {/* Center Panel - Reports */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          overflow: 'auto',
        }}>
          <h2 style={{ 
            margin: '0', 
            fontSize: '28px', 
            fontWeight: '800',
            color: '#2d3436',
          }}>
            Reports
          </h2>

          {/* Category Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {reportCategories.map((category) => (
              <button
                key={category}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCategory === category
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  color: selectedCategory === category ? '#ffffff' : '#2d3436',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: selectedCategory === category
                    ? '0 4px 8px rgba(255, 107, 107, 0.4)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Report Data */}
          <div style={{ 
            flex: 1,
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            overflow: 'auto',
            border: '2px solid #e0e0e0',
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '12px',
              padding: '8px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#2d3436',
            }}>
              <div>Item</div>
              <div>Qty</div>
              <div>Amount</div>
            </div>
            {reportData.map((row) => (
              <div
                key={row.id}
                style={rowStyle(selectedRow?.id === row.id)}
                onClick={() => setSelectedRow(row)}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '12px',
                  fontSize: '14px',
                }}>
                  <div style={{ fontWeight: '600' }}>{row.item}</div>
                  <div>{row.quantity}</div>
                  <div style={{ fontWeight: '700' }}>₹{row.amount.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Actions */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          minWidth: '200px',
        }}>
          <ActionButtons buttons={actionButtons} onButtonClick={handleActionClick} />
        </div>
      </div>
    </div>
  );
}
