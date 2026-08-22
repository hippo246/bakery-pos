import React, { useState, useMemo, useEffect } from 'react';
import SpeakButton from '../voice/SpeakButton';
import textToSpeechService from '../../services/voice/TextToSpeechService';

export default function SimpleDashboard({ orders = [], setOrders, menuItems = [], inventory = [], onNavigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'pending', 'preparing', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate key metrics with real-time data
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const completedOrders = todayOrders.filter(o => o.status === 'COMPLETED');
    const activeOrders = orders.filter(o => o.status === 'PREPARING' || o.status === 'PENDING');
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    
    const totalSales = completedOrders.reduce((sum, o) => {
      const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
      const subtotal = o.subtotal || calculatedSubtotal;
      const tax = o.tax || 0;
      const discount = o.discount || 0;
      const total = o.total || (subtotal + tax - discount);
      return sum + total;
    }, 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    const activeMenuItems = menuItems.filter(m => m.active && !m.eightySixed).length;
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStock).length;
    const outOfStockItems = inventory.filter(i => i.quantity === 0).length;
    
    // Calculate hourly sales for real-time chart
    const hourlySales = {};
    const currentHour = currentTime.getHours();
    for (let i = 0; i <= currentHour; i++) {
      hourlySales[i] = { orders: 0, revenue: 0 };
    }
    
    completedOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      if (hourlySales[hour]) {
        hourlySales[hour].orders += 1;
        const calculatedSubtotal = order.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
        const subtotal = order.subtotal || calculatedSubtotal;
        const tax = order.tax || 0;
        const discount = order.discount || 0;
        const total = order.total || (subtotal + tax - discount);
        hourlySales[hour].revenue += total;
      }
    });
    
    // Calculate top selling items
    const itemSales = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        itemSales[item.name] = (itemSales[item.name] || 0) + (item.quantity || 0);
      });
    });
    const topItems = Object.entries(itemSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));
    
    // Calculate category breakdown
    const categorySales = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.category || 'Other';
        categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity || 0);
      });
    });
    const totalCategorySales = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const categoryBreakdown = Object.entries(categorySales)
      .map(([category, sales]) => ({
        category,
        sales,
        percentage: totalCategorySales > 0 ? (sales / totalCategorySales * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.sales - a.sales);
    
    // Payment method breakdown
    const paymentMethods = {};
    completedOrders.forEach(order => {
      const method = order.paymentMethod || 'CASH';
      const calculatedSubtotal = order.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
      const subtotal = order.subtotal || calculatedSubtotal;
      const tax = order.tax || 0;
      const discount = order.discount || 0;
      const total = order.total || (subtotal + tax - discount);
      paymentMethods[method] = (paymentMethods[method] || 0) + total;
    });
    
    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      activeMenuItems,
      lowStockItems,
      outOfStockItems,
      topItems,
      categoryBreakdown,
      hourlySales,
      activeOrders: activeOrders.length,
      pendingOrders: pendingOrders.length,
      paymentMethods
    };
  }, [orders, menuItems, inventory, currentTime]);

  const recentOrders = orders
    .filter(o => o.status !== 'CANCELLED')
    .slice(0, 8)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filter orders for billing tab
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(o => new Date(o.createdAt) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(o => new Date(o.createdAt) <= endDate);
    }
    
    // Apply status filter
    if (orderFilter !== 'all') {
      filtered = filtered.filter(o => o.status === orderFilter.toUpperCase());
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id?.toString().includes(query) ||
        o.items?.some(item => item.name?.toLowerCase().includes(query)) ||
        o.customer?.name?.toLowerCase().includes(query) ||
        o.table?.toString().includes(query)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, orderFilter, searchQuery, dateRange]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleViewOrder = (order) => {
    const calculatedSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const subtotal = order.subtotal || calculatedSubtotal;
    const tax = order.tax || 0;
    const discount = order.discount || 0;
    const total = order.total || (subtotal + tax - discount);
    
    setSelectedOrder({
      ...order,
      _calculated: {
        subtotal,
        tax,
        discount,
        total
      }
    });
    setShowOrderModal(true);
  };

  const handlePrintOrder = (order) => {
    const calculatedSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const subtotal = order.subtotal || calculatedSubtotal;
    const tax = order.tax || 0;
    const discount = order.discount || 0;
    const total = order.total || (subtotal + tax - discount);
    
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order #${order.id}</h2>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'CASH'}</p>
        ${order.table ? `<p><strong>Table:</strong> ${order.table}</p>` : ''}
        ${order.customer ? `<p><strong>Customer:</strong> ${order.customer.name}</p>` : ''}
        <h3>Items:</h3>
        <ul>
          ${order.items?.map(item => `<li>${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</li>`).join('') || '<li>No items</li>'}
        </ul>
        <p><strong>Subtotal:</strong> ₹${subtotal.toFixed(2)}</p>
        <p><strong>Tax:</strong> ₹${tax.toFixed(2)}</p>
        <p><strong>Discount:</strong> ₹${discount.toFixed(2)}</p>
        <h3><strong>Total:</strong> ₹${total.toFixed(2)}</h3>
      </div>
    `;
    
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportOrders = () => {
    const csvContent = [
      ['Order ID', 'Date', 'Status', 'Customer', 'Table', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method'],
      ...filteredOrders.map(o => {
        const calculatedSubtotal = o.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
        const subtotal = o.subtotal || calculatedSubtotal;
        const tax = o.tax || 0;
        const discount = o.discount || 0;
        const total = o.total || (subtotal + tax - discount);
        
        return [
          o.id,
          new Date(o.createdAt).toLocaleString(),
          o.status,
          o.customer?.name || 'N/A',
          o.table || 'N/A',
          o.items?.map(i => `${i.name} x${i.quantity}`).join('; ') || 'N/A',
          subtotal.toFixed(2),
          tax.toFixed(2),
          discount.toFixed(2),
          total.toFixed(2),
          o.paymentMethod || 'CASH'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const storeName = settings.storeName || 'BakeryPOS';
    const storeAddress = settings.storeAddress || '';
    const storePhone = settings.phone || '';
    const storeEmail = settings.email || '';
    const gstin = settings.gstin || '';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orders Report - ${storeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            padding: 40px;
            background: #f8f9fa;
            color: #1a1a2e;
            line-height: 1.6;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 3px solid #6366f1;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 8px;
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 20px;
          }
          
          .company-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 14px;
            color: #6b7280;
            flex-wrap: wrap;
          }
          
          .company-info span {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .report-meta {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .report-meta h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
          }
          
          .report-meta .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            font-size: 14px;
          }
          
          .report-meta .meta-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px 15px;
            border-radius: 6px;
          }
          
          .report-meta .meta-item label {
            display: block;
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 4px;
          }
          
          .report-meta .meta-item span {
            font-weight: 600;
            font-size: 15px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          thead {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
          }
          
          th { 
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          td { 
            padding: 14px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          
          tr:nth-child(even) { background-color: #f9fafb; }
          
          tr:hover { background-color: #f3f4f6; }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          
          .payment-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: #e0e7ff;
            color: #4338ca;
          }
          
          .items-cell {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .summary { 
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            border: 1px solid #dee2e6;
          }
          
          .summary h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #6366f1;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          
          .summary-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .summary-item label {
            display: block;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
          }
          
          .summary-item .value {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a2e;
          }
          
          .summary-item .value.highlight {
            color: #10b981;
            font-size: 28px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          
          .footer .page-number {
            margin-top: 8px;
            font-weight: 600;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Orders Report</h1>
            <div class="subtitle">${storeName}</div>
            <div class="company-info">
              ${storeAddress ? `<span>📍 ${storeAddress}</span>` : ''}
              ${storePhone ? `<span>📞 ${storePhone}</span>` : ''}
              ${storeEmail ? `<span>✉️ ${storeEmail}</span>` : ''}
              ${gstin ? `<span>🏷️ GSTIN: ${gstin}</span>` : ''}
            </div>
          </div>
          
          <div class="report-meta">
            <h2>📅 Report Details</h2>
            <div class="meta-grid">
              <div class="meta-item">
                <label>Generated On</label>
                <span>${new Date().toLocaleString()}</span>
              </div>
              <div class="meta-item">
                <label>Date Range</label>
                <span>${dateRange.start ? new Date(dateRange.start).toLocaleDateString() : 'All'} - ${dateRange.end ? new Date(dateRange.end).toLocaleDateString() : 'Present'}</span>
              </div>
              <div class="meta-item">
                <label>Total Orders</label>
                <span>${filteredOrders.length}</span>
              </div>
              <div class="meta-item">
                <label>Report Type</label>
                <span>Detailed Analysis</span>
              </div>
            </div>
          </div>
        
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Table</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(o => {
                const calculatedSubtotal = o.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                const subtotal = o.subtotal || calculatedSubtotal;
                const tax = o.tax || 0;
                const discount = o.discount || 0;
                const total = o.total || (subtotal + tax - discount);
                const statusClass = o.status?.toLowerCase() === 'completed' ? 'status-completed' : 
                                   o.status?.toLowerCase() === 'pending' ? 'status-pending' : 'status-cancelled';
                
                return `
                  <tr>
                    <td><strong>${o.id}</strong></td>
                    <td>${new Date(o.createdAt).toLocaleString()}</td>
                    <td><span class="status-badge ${statusClass}">${o.status}</span></td>
                    <td>${o.customer?.name || 'Walk-in'}</td>
                    <td>${o.table || 'N/A'}</td>
                    <td class="items-cell">${o.items?.map(i => `${i.name} x${i.quantity}`).join(', ') || 'N/A'}</td>
                    <td><strong>₹${subtotal.toFixed(2)}</strong></td>
                    <td>₹${tax.toFixed(2)}</td>
                    <td style="color: #10b981;">-₹${discount.toFixed(2)}</td>
                    <td style="font-weight: 700; color: #6366f1;">₹${total.toFixed(2)}</td>
                    <td><span class="payment-badge">${o.paymentMethod || 'CASH'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>📈 Financial Summary</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <label>Total Orders</label>
                <div class="value">${filteredOrders.length}</div>
              </div>
              <div class="summary-item">
                <label>Total Revenue</label>
                <div class="value">₹${filteredOrders.reduce((sum, o) => {
                  const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
                  const subtotal = o.subtotal || calculatedSubtotal;
                  const tax = o.tax || 0;
                  const discount = o.discount || 0;
                  const total = o.total || (subtotal + tax - discount);
                  return sum + total;
                }, 0).toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <label>Total Discounts</label>
                <div class="value" style="color: #10b981;">₹${filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0).toFixed(2)}</div>
              </div>
              <div class="summary-item">
                <label>Average Order Value</label>
                <div class="value">₹${filteredOrders.length > 0 ? (filteredOrders.reduce((sum, o) => {
                  const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
                  const subtotal = o.subtotal || calculatedSubtotal;
                  const tax = o.tax || 0;
                  const discount = o.discount || 0;
                  const total = o.total || (subtotal + tax - discount);
                  return sum + total;
                }, 0) / filteredOrders.length).toFixed(2) : '0.00'}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Report generated by ${storeName} POS System</p>
            <p>© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
            <div class="page-number">Page 1 of 1</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1a1a2e',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '28px 32px',
        borderBottom: '1px solid #2d2d44'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              fontSize: screenSize === 'small' ? '20px' : '28px',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.5px'
            }}>
              {activeTab === 'overview' ? 'Overview' : 'Billing & Orders'}
            </div>
            <div style={{
              fontSize: screenSize === 'small' ? '12px' : '14px',
              color: '#8b8b9e',
              marginTop: '4px'
            }}>
              {activeTab === 'overview' ? "Today's performance metrics" : 'Track all orders and billing information'}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: activeTab === 'overview' ? '#6366f1' : 'transparent',
                color: activeTab === 'overview' ? '#ffffff' : '#8b8b9e',
                border: activeTab === 'overview' ? 'none' : '1px solid #2d2d44',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: activeTab === 'billing' ? '#6366f1' : 'transparent',
                color: activeTab === 'billing' ? '#ffffff' : '#8b8b9e',
                border: activeTab === 'billing' ? 'none' : '1px solid #2d2d44',
                borderRadius: '8px',
                fontSize: screenSize === 'small' ? '12px' : '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Billing
            </button>
            <SpeakButton
              onGenerateText={() => textToSpeechService.generateDashboardSpeechText(metrics)}
              size="medium"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '28px 32px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : screenSize === 'medium' ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '28px'
            }}>
              <StatCard
                label="Total Revenue"
                value={`₹${metrics.totalSales.toLocaleString()}`}
                change="+12.5%"
                trend="up"
                color="#6366f1"
                screenSize={screenSize}
              />
              <StatCard
                label="Orders"
                value={metrics.totalOrders}
                change="+8.2%"
                trend="up"
                color="#10b981"
                screenSize={screenSize}
              />
              <StatCard
                label="Active Orders"
                value={metrics.activeOrders}
                change="Live"
                trend="neutral"
                color="#f59e0b"
                screenSize={screenSize}
              />
              <StatCard
                label="Pending"
                value={metrics.pendingOrders}
                change="Live"
                trend="neutral"
                color="#ef4444"
                screenSize={screenSize}
              />
              <StatCard
                label="Low Stock"
                value={metrics.lowStockItems}
                change="Alert"
                trend="down"
                color="#f97316"
                screenSize={screenSize}
              />
              <StatCard
                label="Out of Stock"
                value={metrics.outOfStockItems}
                change="Alert"
                trend="down"
                color="#dc2626"
                screenSize={screenSize}
              />
            </div>

            {/* Real-time Clock & Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '28px',
              padding: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                  Current Time
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                  System Status
                </div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#10b981', 
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  Live
                </div>
              </div>
            </div>

            {/* Real-time Hourly Sales Chart */}
            <div style={{
              background: '#252538',
              borderRadius: '16px',
              padding: screenSize === 'small' ? '16px' : '24px',
              border: '1px solid #2d2d44',
              marginBottom: screenSize === 'small' ? '16px' : '28px'
            }}>
              <div style={{
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: screenSize === 'small' ? '16px' : '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>📊 Real-time Hourly Sales</span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#10b981',
                  padding: '4px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px'
                }}>
                  Live
                </span>
              </div>
              
              <div style={{ 
                height: '200px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                padding: '20px 0'
              }}>
                {Object.entries(metrics.hourlySales).map(([hour, data], index) => {
                  const maxRevenue = Math.max(...Object.values(metrics.hourlySales).map(d => d.revenue), 1);
                  const height = (data.revenue / maxRevenue) * 160;
                  const isCurrentHour = parseInt(hour) === currentTime.getHours();
                  
                  return (
                    <div key={hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '100%',
                        height: `${Math.max(height, 4)}px`,
                        background: isCurrentHour ? '#6366f1' : '#3b3b5c',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}>
                        {data.revenue > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            color: '#8b8b9e',
                            whiteSpace: 'nowrap'
                          }}>
                            ₹{Math.round(data.revenue)}
                          </div>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: isCurrentHour ? '#6366f1' : '#6b6b7e',
                        fontWeight: isCurrentHour ? '600' : '400'
                      }}>
                        {parseInt(hour)}:00
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div style={{
              background: '#252538',
              borderRadius: '16px',
              padding: screenSize === 'small' ? '16px' : '24px',
              border: '1px solid #2d2d44',
              marginBottom: screenSize === 'small' ? '16px' : '28px'
            }}>
              <div style={{
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: screenSize === 'small' ? '16px' : '24px'
              }}>
                💳 Payment Methods
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {Object.entries(metrics.paymentMethods).map(([method, amount]) => {
                  const total = Object.values(metrics.paymentMethods).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
                  const colors = {
                    'CASH': '#10b981',
                    'CARD': '#3b82f6',
                    'UPI': '#f59e0b',
                    'default': '#8b5cf6'
                  };
                  const icons = {
                    'CASH': '💵',
                    'CARD': '💳',
                    'UPI': '📱',
                    'default': '💰'
                  };
                  
                  return (
                    <div key={method} style={{
                      background: '#1a1a2e',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #2d2d44'
                    }}>
                      <div style={{ 
                        fontSize: '24px', 
                        marginBottom: '8px' 
                      }}>
                        {icons[method] || icons.default}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>
                        {method}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                        ₹{amount.toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: colors[method] || colors.default,
                        fontWeight: '500'
                      }}>
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders */}
            <div style={{
              background: '#252538',
              borderRadius: '16px',
              padding: screenSize === 'small' ? '16px' : '24px',
              border: '1px solid #2d2d44'
            }}>
              <div style={{
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: screenSize === 'small' ? '16px' : '24px'
              }}>
                📋 Recent Orders
              </div>
              
              {recentOrders.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b6b7e' }}>
                  <div style={{ fontSize: '14px' }}>No orders yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentOrders.map(order => (
                    <div key={order.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#1a1a2e',
                      borderRadius: '12px',
                      border: '1px solid #2d2d44'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                          Order #{order.id}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b8b9e' }}>
                          {order.items?.map(item => item.name).join(', ') || 'No items'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                          ₹{((order.total || 0) > 0 ? order.total : order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: order.status === 'COMPLETED' ? '#10b981' : order.status === 'PREPARING' ? '#f59e0b' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Billing & Orders Tab */}
            <div style={{ marginBottom: '24px' }}>
              {/* Filters */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: 'wrap'
              }}>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '12px 16px',
                    background: '#252538',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  style={{
                    padding: '12px 16px',
                    background: '#252538',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  style={{
                    padding: '12px 16px',
                    background: '#252538',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    background: '#252538',
                    border: '1px solid #2d2d44',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleExportOrders}
                  style={{
                    padding: '12px 16px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  style={{
                    padding: '12px 16px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  📄 Export PDF
                </button>
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    style={{
                      padding: '12px 16px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Date Filter
                  </button>
                )}
              </div>

              {/* Order Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: '#252538',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #2d2d44'
                }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Total Orders</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                    {filteredOrders.length}
                  </div>
                </div>
                <div style={{
                  background: '#252538',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #2d2d44'
                }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Total Revenue</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                    ₹{filteredOrders.reduce((sum, o) => {
                      const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
                      const subtotal = o.subtotal || calculatedSubtotal;
                      const tax = o.tax || 0;
                      const discount = o.discount || 0;
                      const total = o.total || (subtotal + tax - discount);
                      return sum + total;
                    }, 0).toLocaleString()}
                  </div>
                </div>
                <div style={{
                  background: '#252538',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #2d2d44'
                }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Avg Order Value</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>
                    ₹{filteredOrders.length > 0 ? (filteredOrders.reduce((sum, o) => {
                      const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
                      const subtotal = o.subtotal || calculatedSubtotal;
                      const tax = o.tax || 0;
                      const discount = o.discount || 0;
                      const total = o.total || (subtotal + tax - discount);
                      return sum + total;
                    }, 0) / filteredOrders.length).toFixed(0) : 0}
                  </div>
                </div>
                <div style={{
                  background: '#252538',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #2d2d44'
                }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Pending</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                    {filteredOrders.filter(o => o.status === 'PENDING').length}
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div style={{
                background: '#252538',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #2d2d44'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '20px'
                }}>
                  📋 Orders ({filteredOrders.length})
                </div>
                
                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b6b7e' }}>
                    <div style={{ fontSize: '14px' }}>No orders found</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredOrders.map(order => (
                      <div key={order.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        background: '#1a1a2e',
                        borderRadius: '12px',
                        border: '1px solid #2d2d44'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                              Order #{order.id}
                            </div>
                            {order.table && (
                              <div style={{
                                fontSize: '12px',
                                padding: '4px 8px',
                                background: '#3b3b5c',
                                borderRadius: '4px',
                                color: '#8b8b9e'
                              }}>
                                Table {order.table}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: '12px', 
                              color: order.status === 'COMPLETED' ? '#10b981' : 
                                     order.status === 'PREPARING' ? '#f59e0b' : 
                                     order.status === 'PENDING' ? '#ef4444' : '#6b6b7e',
                              fontWeight: '500'
                            }}>
                              {order.status}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>
                            {order.items?.map(item => item.name).join(', ') || 'No items'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b6b7e' }}>
                            {formatTimeAgo(order.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                            ₹{((order.total || 0) > 0 ? order.total : order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8b8b9e' }}>
                            {order.paymentMethod || 'CASH'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => handleViewOrder(order)}
                            style={{
                              padding: '8px 12px',
                              background: '#6366f1',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="View Order Details"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handlePrintOrder(order)}
                            style={{
                              padding: '8px 12px',
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            title="Print Order"
                          >
                            🖨️ Print
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: '24px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                Order #{selectedOrder.id}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  padding: '8px 12px',
                  background: '#2d2d44',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Status</div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: selectedOrder.status === 'COMPLETED' ? '#10b981' : 
                           selectedOrder.status === 'PREPARING' ? '#f59e0b' : 
                           selectedOrder.status === 'PENDING' ? '#ef4444' : '#6b6b7e',
                    fontWeight: '500'
                  }}>
                    {selectedOrder.status}
                  </div>
                </div>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Payment Method</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    {selectedOrder.paymentMethod || 'CASH'}
                  </div>
                </div>
                {selectedOrder.table && (
                  <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Table</div>
                    <div style={{ fontSize: '14px', color: '#ffffff' }}>
                      {selectedOrder.table}
                    </div>
                  </div>
                )}
              </div>

              {selectedOrder.customer && (
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Customer</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    {selectedOrder.customer.name}
                    {selectedOrder.customer.phone && ` (${selectedOrder.customer.phone})`}
                  </div>
                </div>
              )}

              <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '8px' }}>Items</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#ffffff' }}>
                          {item.name} x{item.quantity}
                        </div>
                        {item.variant && (
                          <div style={{ fontSize: '12px', color: '#6b6b7e' }}>
                            {item.variant}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  )) || <div style={{ fontSize: '14px', color: '#6b6b7e' }}>No items</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Subtotal</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    ₹{(selectedOrder._calculated?.subtotal || selectedOrder.subtotal || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Tax</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    ₹{(selectedOrder._calculated?.tax || selectedOrder.tax || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#252538', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>Discount</div>
                  <div style={{ fontSize: '14px', color: '#ffffff' }}>
                    ₹{(selectedOrder._calculated?.discount || selectedOrder.discount || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#10b981', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#ffffff', marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '18px', color: '#ffffff', fontWeight: '700' }}>
                    ₹{(selectedOrder._calculated?.total || selectedOrder.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => handlePrintOrder(selectedOrder)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Order
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2d2d44',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, change, trend, color, screenSize }) {
  return (
    <div style={{
      background: '#252538',
      borderRadius: '12px',
      padding: screenSize === 'small' ? '16px' : '20px',
      border: '1px solid #2d2d44'
    }}>
      <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '24px' : '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
        {value}
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#8b8b9e' }}>
        {change}
      </div>
    </div>
  );
}
