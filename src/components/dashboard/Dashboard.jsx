import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import LiveClock from "../common/LiveClock.jsx";
import SpeakButton from "../voice/SpeakButton.jsx";
import textToSpeechService from "../../services/voice/TextToSpeechService.js";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Billing from "../billing/WhatsAppBilling.jsx";

export default function SimpleDashboard({ orders = [], setOrders, menuItems = [], inventory = [], onNavigate, settings = {}, darkMode = true }) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'pending', 'preparing', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Live auxiliary data from localStorage (debounced to reduce performance impact)
  const [wasteRecords, setWasteRecords] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [qrOrdersLocal, setQrOrdersLocal] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  useEffect(() => {
    const load = () => {
      try { const w = JSON.parse(localStorage.getItem('bakerypos_waste') || '[]'); setWasteRecords(Array.isArray(w) ? w : []); } catch {}
      try { const r = JSON.parse(localStorage.getItem('bakerypos_reservations') || '[]'); setReservations(Array.isArray(r) ? r : []); } catch {}
      try { const q = JSON.parse(localStorage.getItem('qr_orders') || '[]'); setQrOrdersLocal(Array.isArray(q) ? q : []); } catch {}
      setLastRefresh(new Date());
    };
    load();
    const interval = setInterval(load, 30000); // Increased from 10s to 30s to reduce performance impact
    return () => clearInterval(interval);
  }, []);

  // Listen for custom events for instant updates
  useEffect(() => {
    const handleOrderUpdate = () => {
      setLastRefresh(new Date());
    };
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('order-created', handleOrderUpdate);
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('order-created', handleOrderUpdate);
    };
  }, []);

  // Real-time clock update (reduced from 1s to 5s to reduce CPU usage)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 5000);
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
    const cancelledOrders = todayOrders.filter(o => o.status === 'CANCELLED');
    
    // Apply chart filters if selected
    let filteredForCharts = completedOrders;
    if (selectedCategory) {
      filteredForCharts = filteredForCharts.filter(order => 
        order.items?.some(item => item.category === selectedCategory)
      );
    }
    if (selectedPaymentMethod) {
      filteredForCharts = filteredForCharts.filter(order => 
        order.paymentMethod === selectedPaymentMethod
      );
    }
    
    const totalSales = filteredForCharts.reduce((sum, o) => {
      const calculatedSubtotal = o.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
      const subtotal = o.subtotal || calculatedSubtotal;
      const tax = o.tax || 0;
      const discount = o.discount || 0;
      const total = o.total || (subtotal + tax - discount);
      return sum + total;
    }, 0);
    const totalOrders = filteredForCharts.length;
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
    
    filteredForCharts.forEach(order => {
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
    filteredForCharts.forEach(order => {
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
    filteredForCharts.forEach(order => {
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
    filteredForCharts.forEach(order => {
      const method = order.paymentMethod || 'CASH';
      const calculatedSubtotal = order.items?.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
      const subtotal = order.subtotal || calculatedSubtotal;
      const tax = order.tax || 0;
      const discount = order.discount || 0;
      const total = order.total || (subtotal + tax - discount);
      paymentMethods[method] = (paymentMethods[method] || 0) + total;
    });
    
    // Calculate additional metrics
    const orderCompletionRate = todayOrders.length > 0 ? (completedOrders.length / todayOrders.length * 100).toFixed(1) : 0;
    const cancellationRate = todayOrders.length > 0 ? (cancelledOrders.length / todayOrders.length * 100).toFixed(1) : 0;
    const avgPreparationTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const created = new Date(o.createdAt);
          const completed = o.completedAt ? new Date(o.completedAt) : new Date();
          return sum + (completed - created) / 60000; // minutes
        }, 0) / completedOrders.length
      : 0;

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
      cancelledOrders: cancelledOrders.length,
      totalTodayOrders: todayOrders.length,
      orderCompletionRate,
      cancellationRate,
      avgPreparationTime,
      paymentMethods,
      // Auxiliary live data
      totalWasteCost: wasteRecords.reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0),
      wasteCount: wasteRecords.length,
      upcomingReservations: reservations.filter(r => new Date(r.date) >= new Date()).length,
      totalReservations: reservations.length,
      qrOrdersCount: qrOrdersLocal.length,
      qrOrdersRevenue: qrOrdersLocal.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      lastRefresh
    };
  }, [orders, menuItems, inventory, currentTime, selectedCategory, selectedPaymentMethod, wasteRecords, reservations, qrOrdersLocal, lastRefresh]);

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
            color: #141414;
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
            border-bottom: 3px solid #18181b;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #141414;
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
            background: #141414;
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
            background: #141414;
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
            border-radius: 4px;
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
            background: #e4e4e7;
            color: #3f3f46;
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
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #dee2e6;
          }
          
          .summary h3 {
            font-size: 20px;
            font-weight: 700;
            color: #141414;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #18181b;
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
            color: #141414;
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
            <h1>Orders Report</h1>
            <div class="subtitle">${storeName}</div>
            <div class="company-info">
              ${storeAddress ? `<span>${storeAddress}</span>` : ''}
              ${storePhone ? `<span>${storePhone}</span>` : ''}
              ${storeEmail ? `<span>${storeEmail}</span>` : ''}
              ${gstin ? `<span>GSTIN: ${gstin}</span>` : ''}
            </div>
          </div>
          
          <div class="report-meta">
            <h2>Report Details</h2>
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
                    <td style="font-weight: 700; color: #18181b;">₹${total.toFixed(2)}</td>
                    <td><span class="payment-badge">${o.paymentMethod || 'CASH'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Financial Summary</h3>
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
            <p>${storeName} — generated ${new Date().toLocaleDateString()}</p>
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
      background: darkMode ? '#1a1a1a' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Content */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '24px',
        background: darkMode ? '#1a1a1a' : '#ffffff',
        flex: 1,
        overflowY: 'auto',
        minHeight: 0
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: darkMode ? '#ffffff' : '#000000' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: darkMode ? '#888888' : '#666666', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Key Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#f5f5f5',
            border: `1px solid ${darkMode ? '#333333' : '#dddddd'}`,
            borderRadius: '4px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#666666', marginBottom: '8px' }}>Total Revenue</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>
              ₹{metrics.totalSales.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: darkMode ? '#888888' : '#666666', marginTop: '4px' }}>Today</div>
          </div>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#f5f5f5',
            border: `1px solid ${darkMode ? '#333333' : '#dddddd'}`,
            borderRadius: '4px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#666666', marginBottom: '8px' }}>Total Orders</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>
              {metrics.totalOrders}
            </div>
            <div style={{ fontSize: '11px', color: darkMode ? '#888888' : '#666666', marginTop: '4px' }}>Completed</div>
          </div>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#f5f5f5',
            border: `1px solid ${darkMode ? '#333333' : '#dddddd'}`,
            borderRadius: '4px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#666666', marginBottom: '8px' }}>Active Orders</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>
              {metrics.activeOrders}
            </div>
            <div style={{ fontSize: '11px', color: darkMode ? '#888888' : '#666666', marginTop: '4px' }}>Preparing/Pending</div>
          </div>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#f5f5f5',
            border: `1px solid ${darkMode ? '#333333' : '#dddddd'}`,
            borderRadius: '4px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#666666', marginBottom: '8px' }}>Avg Order Value</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>
              ₹{Math.round(metrics.avgOrderValue)}
            </div>
            <div style={{ fontSize: '11px', color: darkMode ? '#888888' : '#666666', marginTop: '4px' }}>Per order</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: darkMode ? '#ffffff' : '#000000' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate && onNavigate('gst')}
              style={{
                padding: '10px 20px',
                background: darkMode ? '#3b82f6' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              GST Reports
            </button>
            <button
              onClick={() => onNavigate && onNavigate('reports')}
              style={{
                padding: '10px 20px',
                background: darkMode ? '#10b981' : '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View Reports
            </button>
            <button
              onClick={() => onNavigate && onNavigate('orders')}
              style={{
                padding: '10px 20px',
                background: darkMode ? '#f59e0b' : '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Manage Orders
            </button>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: darkMode ? '#ffffff' : '#000000' }}>
            Recent Orders
          </h2>
          <div style={{
            background: darkMode ? '#2a2a2a' : '#ffffff',
            border: `1px solid ${darkMode ? '#333333' : '#dddddd'}`,
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? '#333333' : '#f5f5f5', borderBottom: `1px solid ${darkMode ? '#444444' : '#dddddd'}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#000000' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 5).map(order => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${darkMode ? '#333333' : '#eeeeee'}` }}>
                    <td style={{ padding: '12px', fontSize: '13px', color: darkMode ? '#cccccc' : '#333333' }}>{order.id}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: darkMode ? '#cccccc' : '#333333' }}>{new Date(order.createdAt).toLocaleTimeString()}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: darkMode ? '#cccccc' : '#333333' }}>{order.status}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: darkMode ? '#cccccc' : '#333333', textAlign: 'right', fontWeight: 'bold' }}>
                      ₹{(order.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: darkMode ? '#ffffff' : '#000000' }}>
            Inventory Alerts
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            <div style={{
              background: darkMode ? '#2a2a2a' : '#fff5f5',
              border: `1px solid ${darkMode ? '#dc2626' : '#feb2b2'}`,
              borderRadius: '4px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#ff8888' : '#c53030', marginBottom: '8px' }}>Out of Stock</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#c53030' }}>
                {metrics.outOfStockItems}
              </div>
            </div>
            <div style={{
              background: darkMode ? '#2a2a2a' : '#fffaf0',
              border: `1px solid ${darkMode ? '#ed8936' : '#fbd38d'}`,
              borderRadius: '4px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#f6ad55' : '#c05621', marginBottom: '8px' }}>Low Stock</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#c05621' }}>
                {metrics.lowStockItems}
              </div>
            </div>
            <div style={{
              background: darkMode ? '#2a2a2a' : '#f0fff4',
              border: `1px solid ${darkMode ? '#48bb78' : '#9ae6b4'}`,
              borderRadius: '4px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: darkMode ? '#68d391' : '#2f855a', marginBottom: '8px' }}>Active Menu Items</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#2f855a' }}>
                {metrics.activeMenuItems}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, trend, color, screenSize, darkMode, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: darkMode ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${darkMode ? '#333333' : '#e5e7eb'}`,
        borderRadius: '8px',
        padding: screenSize === 'small' ? '12px' : '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = darkMode ? '#333333' : '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: darkMode ? '#9ca3af' : '#64748b', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: color || (darkMode ? '#ffffff' : '#0a0a0a'), marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: darkMode ? '#8a8a8e' : '#94a3b8' }}>
        {change}
      </div>
    </div>
  );
}
