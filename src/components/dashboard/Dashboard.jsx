import React, { useState, useMemo, useEffect } from 'react';

export default function SimpleDashboard({ orders = [], setOrders, menuItems = [], inventory = [], onNavigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

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

  // Calculate key metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const completedOrders = todayOrders.filter(o => o.status === 'COMPLETED');
    
    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    const activeMenuItems = menuItems.filter(m => m.active && !m.eightySixed).length;
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStock).length;
    
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
    
    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      activeMenuItems,
      lowStockItems,
      topItems,
      categoryBreakdown
    };
  }, [orders, menuItems, inventory]);

  const recentOrders = orders
    .filter(o => o.status !== 'CANCELLED')
    .slice(0, 8)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
          <div style={{ display: 'flex', gap: '8px' }}>
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
              Billing & Orders
            </button>
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
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : screenSize === 'medium' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
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
                color="#22c55e"
                screenSize={screenSize}
              />
              <StatCard
                label="Avg Order"
                value={`₹${Math.round(metrics.avgOrderValue)}`}
                change="-2.1%"
                trend="down"
                color="#f59e0b"
                screenSize={screenSize}
              />
              <StatCard
                label="Active Items"
                value={metrics.activeMenuItems}
                change="+5"
                trend="up"
                color="#ec4899"
                screenSize={screenSize}
              />
            </div>

            {/* Middle Row - Category Chart + Top Items */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? '1fr' : '1fr 1fr',
              gap: screenSize === 'small' ? '16px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '28px'
            }}>
              {/* Category Chart */}
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
                  Sales by Category
                </div>
                
                {metrics.categoryBreakdown.length === 0 ? (
                  <div style={{ padding: screenSize === 'small' ? '40px 20px' : '60px 20px', textAlign: 'center', color: '#6b6b7e' }}>
                    <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px' }}>No data available</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '16px' : '32px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                    <div style={{
                      width: screenSize === 'small' ? '120px' : '160px',
                      height: screenSize === 'small' ? '120px' : '160px',
                      position: 'relative'
                    }}>
                      <svg width={screenSize === 'small' ? '120' : '160'} height={screenSize === 'small' ? '120' : '160'} viewBox="0 0 160 160">
                        {metrics.categoryBreakdown.map((cat, index) => {
                          const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
                          const startAngle = index === 0 ? 0 : metrics.categoryBreakdown.slice(0, index).reduce((sum, c) => sum + parseFloat(c.percentage), 0) * 3.6;
                          const endAngle = startAngle + parseFloat(cat.percentage) * 3.6;
                          const largeArcFlag = parseFloat(cat.percentage) > 50 ? 1 : 0;
                          
                          const x1 = 80 + 70 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 80 + 70 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 80 + 70 * Math.cos((endAngle - 90) * Math.PI / 180);
                          const y2 = 80 + 70 * Math.sin((endAngle - 90) * Math.PI / 180);
                          
                          return (
                            <path
                              key={cat.category}
                              d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={colors[index % colors.length]}
                              opacity="0.85"
                            />
                          );
                        })}
                        <circle cx="80" cy="80" r="40" fill="#252538" />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: screenSize === 'small' ? '16px' : '20px', fontWeight: '700', color: '#ffffff' }}>
                          {metrics.categoryBreakdown.length}
                        </div>
                        <div style={{ fontSize: screenSize === 'small' ? '10px' : '11px', color: '#8b8b9e' }}>
                          Cats
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, width: '100%' }}>
                      {metrics.categoryBreakdown.map((cat, index) => {
                        const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];
                        return (
                          <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '12px', marginBottom: screenSize === 'small' ? '10px' : '14px' }}>
                            <div style={{
                              width: screenSize === 'small' ? '10px' : '12px',
                              height: screenSize === 'small' ? '10px' : '12px',
                              borderRadius: '3px',
                              background: colors[index % colors.length]
                            }} />
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>{cat.category}</span>
                              <span style={{ fontSize: screenSize === 'small' ? '12px' : '14px', color: '#8b8b9e' }}>{cat.percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Items */}
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
                  Top Selling Items
                </div>
                
                {metrics.topItems.length === 0 ? (
                  <div style={{ padding: screenSize === 'small' ? '40px 20px' : '60px 20px', textAlign: 'center', color: '#6b6b7e' }}>
                    <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px' }}>No data available</div>
                  </div>
                ) : (
                  <div>
                    {metrics.topItems.map((item, index) => (
                      <div key={item.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: screenSize === 'small' ? '10px 0' : '14px 0',
                        borderBottom: index < metrics.topItems.length - 1 ? '1px solid #2d2d44' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '12px' }}>
                          <div style={{
                            width: screenSize === 'small' ? '28px' : '32px',
                            height: screenSize === 'small' ? '28px' : '32px',
                            borderRadius: '8px',
                            background: '#2d2d44',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: screenSize === 'small' ? '12px' : '14px',
                            fontWeight: '600',
                            color: '#8b8b9e'
                          }}>
                            {index + 1}
                          </div>
                          <span style={{ fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: screenSize === 'small' ? '14px' : '15px', fontWeight: '600', color: '#ffffff' }}>
                          {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                Recent Orders
              </div>
              
              {recentOrders.length === 0 ? (
                <div style={{ padding: screenSize === 'small' ? '40px 20px' : '60px 20px', textAlign: 'center', color: '#6b6b7e' }}>
                  <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px' }}>No recent orders</div>
                </div>
              ) : (
                <div>
                  {recentOrders.map(order => (
                    <div key={order.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: screenSize === 'small' ? '12px 0' : '16px 0',
                      borderBottom: '1px solid #2d2d44',
                      flexDirection: screenSize === 'small' ? 'column' : 'row',
                      alignItems: screenSize === 'small' ? 'flex-start' : 'center',
                      gap: screenSize === 'small' ? '8px' : '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '16px', width: screenSize === 'small' ? '100%' : 'auto' }}>
                        <div style={{
                          padding: screenSize === 'small' ? '6px 10px' : '8px 14px',
                          borderRadius: '8px',
                          background: order.status === 'COMPLETED' ? '#22c55e20' : '#f59e0b20',
                          color: order.status === 'COMPLETED' ? '#22c55e' : '#f59e0b',
                          fontSize: screenSize === 'small' ? '10px' : '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {order.status}
                        </div>
                        <div>
                          <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0', fontWeight: '500' }}>
                            Order #{order.id?.slice(-6)}
                          </div>
                          <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#8b8b9e', marginTop: '2px' }}>
                            {order.tableName || 'Counter'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: screenSize === 'small' ? 'left' : 'right', width: screenSize === 'small' ? '100%' : 'auto' }}>
                        <div style={{ fontSize: screenSize === 'small' ? '14px' : '15px', fontWeight: '600', color: '#ffffff' }}>
                          ₹{order.total?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#8b8b9e', marginTop: '2px' }}>
                          {formatTimeAgo(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <BillingTab orders={orders} screenSize={screenSize} />
        )}
      </div>
    </div>
  );
}

// Billing Tab Component
function BillingTab({ orders, screenSize }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handlePrintOrder = (order) => {
    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmt = order.discountAmount || (subtotal * (order.discount || 0)) / 100;
    const taxAmt = order.taxAmount || ((subtotal - discountAmt) * (order.gstRate || 0)) / 100;
    
    let receiptHTML = `
      <div style="
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        padding: 16px;
        background: #fff;
        max-width: 280px;
        margin: 0 auto;
      ">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: bold;">BakeryPOS</div>
          ${order.storeAddress ? `<div style="font-size: 10px;">${order.storeAddress}</div>` : ''}
          ${order.phone ? `<div style="font-size: 10px;">Tel: ${order.phone}</div>` : ''}
        </div>
        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Order #: ${order.id}</span>
            <span>Token: ${order.token || 'N/A'}</span>
          </div>
          <div style="font-size: 10px;">${new Date(order.createdAt).toLocaleString()}</div>
          ${order.tableNumber ? `<div>Table: ${order.tableNumber}</div>` : ''}
          <div>Customer: ${order.customerName || 'Walk-in'}</div>
        </div>
        <div style="margin-bottom: 8px;">
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <div>
                <div>${item.name}${item.isCustom ? ' (Custom)' : ''}</div>
                <div style="font-size: 10px;">${item.quantity} x ₹${item.price}</div>
              </div>
              <div>₹${item.quantity * item.price}</div>
            </div>
          `).join('')}
        </div>
        <div style="border-top: 1px dashed #000; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${(order.discount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Discount (${order.discount}%):</span>
              <span>-₹${discountAmt.toFixed(2)}</span>
            </div>
          ` : ''}
          ${(order.gstRate || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>GST (${order.gstRate}%):</span>
              <span>₹${taxAmt.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px;">
            <span>TOTAL:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
          <div style="margin-top: 4px; font-size: 10px;">
            Paid: ${order.splitPayments && order.splitPayments.length > 0 ? 'Split' : order.paymentMethod}
          </div>
        </div>
        <div style="text-align: center; margin-top: 12px; font-size: 10px;">
          <div>Thank you for your order!</div>
          <div>Visit us again soon</div>
        </div>
      </div>
    `;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>${receiptHTML}</body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div>
      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: screenSize === 'small' ? '12px' : '20px',
        marginBottom: screenSize === 'small' ? '16px' : '24px'
      }}>
        <div style={{
          background: '#252538',
          borderRadius: '12px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: '#ffffff' }}>
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>
        <div style={{
          background: '#252538',
          borderRadius: '12px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px' }}>
            Total Orders
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: '#ffffff' }}>
            {totalOrders}
          </div>
        </div>
        <div style={{
          background: '#252538',
          borderRadius: '12px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px' }}>
            Completed
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: '#22c55e' }}>
            {filteredOrders.filter(o => o.status === 'COMPLETED').length}
          </div>
        </div>
        <div style={{
          background: '#252538',
          borderRadius: '12px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: '1px solid #2d2d44'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px' }}>
            Pending
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: '#f59e0b' }}>
            {filteredOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: screenSize === 'small' ? '12px' : '16px',
        marginBottom: screenSize === 'small' ? '16px' : '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
            background: '#252538',
            border: '1px solid #2d2d44',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: screenSize === 'small' ? '12px' : '14px',
            outline: 'none'
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
            background: '#252538',
            border: '1px solid #2d2d44',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: screenSize === 'small' ? '12px' : '14px',
            outline: 'none'
          }}
        >
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={{
        background: '#252538',
        borderRadius: '16px',
        border: '1px solid #2d2d44',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: screenSize === 'small' ? '16px' : '20px',
          borderBottom: '1px solid #2d2d44',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '600', color: '#ffffff' }}>
            All Orders
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px', color: '#8b8b9e' }}>
            {filteredOrders.length} orders
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ padding: screenSize === 'small' ? '40px 20px' : '60px 20px', textAlign: 'center', color: '#6b6b7e' }}>
            <div style={{ fontSize: screenSize === 'small' ? '12px' : '14px' }}>No orders found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2d2d44' }}>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Order ID
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Date
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Customer
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Table
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Items
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Total
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Payment
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: screenSize === 'small' ? '12px' : '16px', textAlign: 'left', fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e', fontWeight: '600', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} style={{ borderBottom: index < filteredOrders.length - 1 ? '1px solid #2d2d44' : 'none' }}>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>
                      {order.id?.slice(-8) || 'N/A'}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#8b8b9e' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>
                      {order.customerName || 'Walk-in'}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>
                      {order.tableNumber || 'Counter'}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#8b8b9e' }}>
                      {order.items?.length || 0} items
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', fontWeight: '600', color: '#ffffff' }}>
                      ₹{order.total?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px', fontSize: screenSize === 'small' ? '12px' : '14px', color: '#e0e0e0' }}>
                      {order.splitPayments && order.splitPayments.length > 0 ? 'Split' : order.paymentMethod || 'N/A'}
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px' }}>
                      <span style={{
                        padding: screenSize === 'small' ? '4px 8px' : '6px 12px',
                        borderRadius: '6px',
                        fontSize: screenSize === 'small' ? '10px' : '11px',
                        fontWeight: '600',
                        background: order.status === 'COMPLETED' ? '#22c55e20' : order.status === 'CANCELLED' ? '#ef444420' : '#f59e0b20',
                        color: order.status === 'COMPLETED' ? '#22c55e' : order.status === 'CANCELLED' ? '#ef4444' : '#f59e0b'
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: screenSize === 'small' ? '12px' : '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleViewOrder(order)}
                          style={{
                            padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                            background: '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: screenSize === 'small' ? '11px' : '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handlePrintOrder(order)}
                          style={{
                            padding: screenSize === 'small' ? '6px 12px' : '8px 16px',
                            background: '#252538',
                            color: '#ffffff',
                            border: '1px solid #2d2d44',
                            borderRadius: '6px',
                            fontSize: screenSize === 'small' ? '11px' : '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '20px' : '32px',
            maxWidth: screenSize === 'small' ? '90%' : '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #2d2d44'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <div style={{ fontSize: screenSize === 'small' ? '18px' : '24px', fontWeight: '700', color: '#ffffff' }}>
                Order Details
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#252538',
                  color: '#ffffff',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Order ID</div>
              <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0', fontWeight: '500' }}>{selectedOrder.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: screenSize === 'small' ? '12px' : '16px', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Date</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Token</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>{selectedOrder.token || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Customer</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>{selectedOrder.customerName || 'Walk-in'}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Table</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>{selectedOrder.tableNumber || 'Counter'}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Payment Method</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>{selectedOrder.splitPayments && selectedOrder.splitPayments.length > 0 ? 'Split' : selectedOrder.paymentMethod || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Status</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: selectedOrder.status === 'COMPLETED' ? '#22c55e' : selectedOrder.status === 'CANCELLED' ? '#ef4444' : '#f59e0b', fontWeight: '600' }}>{selectedOrder.status}</div>
              </div>
            </div>

            <div style={{ marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', fontWeight: '600', color: '#ffffff', marginBottom: screenSize === 'small' ? '12px' : '16px' }}>Items</div>
              <div style={{ background: '#252538', borderRadius: '12px', padding: screenSize === 'small' ? '12px' : '16px', border: '1px solid #2d2d44' }}>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: screenSize === 'small' ? '10px 0' : '12px 0',
                    borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #2d2d44' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: '#e0e0e0' }}>{item.name}{item.isCustom ? ' (Custom)' : ''}</div>
                      <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: '#8b8b9e' }}>{item.quantity} x ₹{item.price}</div>
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '14px' : '15px', fontWeight: '600', color: '#ffffff' }}>₹{item.quantity * item.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: screenSize === 'small' ? '12px' : '16px', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Subtotal</div>
                <div style={{ fontSize: screenSize === 'small' ? '14px' : '16px', color: '#e0e0e0' }}>₹{(selectedOrder.subtotal || selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: '#8b8b9e', marginBottom: '4px' }}>Total</div>
                <div style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#22c55e' }}>₹{selectedOrder.total?.toFixed(2) || '0'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: screenSize === 'small' ? '16px' : '24px' }}>
              <button
                onClick={() => handlePrintOrder(selectedOrder)}
                style={{
                  flex: 1,
                  padding: screenSize === 'small' ? '12px' : '14px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  flex: 1,
                  padding: screenSize === 'small' ? '12px' : '14px',
                  background: '#252538',
                  color: '#ffffff',
                  border: '1px solid #2d2d44',
                  borderRadius: '8px',
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, change, trend, color, screenSize }) {
  return (
    <div style={{
      background: '#252538',
      borderRadius: '16px',
      padding: screenSize === 'small' ? '16px' : '24px',
      border: '1px solid #2d2d44'
    }}>
      <div style={{ fontSize: screenSize === 'small' ? '11px' : '13px', color: '#8b8b9e', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '24px' : '32px', fontWeight: '700', color: '#ffffff', marginBottom: screenSize === 'small' ? '8px' : '12px' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontSize: screenSize === 'small' ? '11px' : '13px',
          fontWeight: '600',
          color: trend === 'up' ? '#22c55e' : '#ef4444'
        }}>
          {change}
        </span>
        <span style={{ fontSize: screenSize === 'small' ? '10px' : '12px', color: '#6b6b7e' }}>
          vs yesterday
        </span>
      </div>
    </div>
  );
}
