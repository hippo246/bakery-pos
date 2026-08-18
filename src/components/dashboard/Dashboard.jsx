import React, { useState, useMemo } from 'react';

export default function SimpleDashboard({ orders = [], setOrders, menuItems = [], inventory = [], onNavigate }) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

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
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
        {/* Top Row - Circular Progress Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <CircularStatCard
            label="Revenue"
            value={`₹${metrics.totalSales.toLocaleString()}`}
            icon="💰"
            color="#3b82f6"
            percentage={83}
          />
          <CircularStatCard
            label="Orders"
            value={metrics.totalOrders}
            icon="📦"
            color="#10b981"
            percentage={78}
          />
          <CircularStatCard
            label="Items"
            value={metrics.topItems.reduce((sum, item) => sum + item.qty, 0)}
            icon="🛒"
            color="#f59e0b"
            percentage={92}
          />
          <CircularStatCard
            label="Customers"
            value={new Set(orders.map(o => o.customerId)).size}
            icon="👥"
            color="#8b5cf6"
            percentage={46}
          />
          <CircularStatCard
            label="Avg Time"
            value="2.3h"
            icon="⏱️"
            color="#ef4444"
            percentage={77}
          />
        </div>

        {/* Middle Row - Donut Chart + Top Items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Donut Chart */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              📊 Category Breakdown
            </div>
            
            {metrics.categoryBreakdown.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontSize: '13px' }}>No category data yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                  width: '180px',
                  height: '180px',
                  position: 'relative'
                }}>
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    {metrics.categoryBreakdown.map((cat, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                      const startAngle = index === 0 ? 0 : metrics.categoryBreakdown.slice(0, index).reduce((sum, c) => sum + parseFloat(c.percentage), 0) * 3.6;
                      const endAngle = startAngle + parseFloat(cat.percentage) * 3.6;
                      const largeArcFlag = parseFloat(cat.percentage) > 50 ? 1 : 0;
                      
                      const x1 = 90 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                      const y1 = 90 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                      const x2 = 90 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                      const y2 = 90 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                      
                      return (
                        <path
                          key={cat.category}
                          d={`M 90 90 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                          opacity="0.9"
                        />
                      );
                    })}
                    <circle cx="90" cy="90" r="50" fill="#ffffff" />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                      {metrics.categoryBreakdown.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Categories
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  {metrics.categoryBreakdown.map((cat, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                    return (
                      <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: colors[index % colors.length]
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                            {cat.category}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {cat.percentage}%
                          </div>
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
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              🥧 Top Selling Items
            </div>
            
            {metrics.topItems.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥐</div>
                <div style={{ fontSize: '13px' }}>No sales data yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {metrics.topItems.map((item, index) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#e2e8f0',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                      <div style={{ 
                        height: '8px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(item.qty / (metrics.topItems[0]?.qty || 1)) * 100}%`,
                          background: '#3b82f6',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', minWidth: '50px', textAlign: 'right' }}>
                      {item.qty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Recent Orders Compact Cards */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              ⏰ Recent Orders
            </span>
            <button
              onClick={() => onNavigate?.('orders')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>No orders yet today</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                    {order.orderNumber || order.id.slice(-6)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
                    ₹{(order.total || 0).toFixed(0)}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: order.status === 'COMPLETED' ? '#dcfce7' : order.status === 'PENDING' ? '#fef3c7' : '#dbeafe',
                    color: order.status === 'COMPLETED' ? '#16a34a' : order.status === 'PENDING' ? '#d97706' : '#2563eb',
                    fontSize: '12px',
                    marginBottom: '4px'
                  }}>
                    {order.status === 'COMPLETED' ? '✓' : order.status === 'PENDING' ? '⏳' : '⚡'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {order.tableName || 'Walk'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          <QuickActionCard
            label="New Order"
            icon="🛒"
            color="#3b82f6"
            onClick={() => onNavigate?.('orders')}
          />
          <QuickActionCard
            label="View Menu"
            icon="📋"
            color="#10b981"
            onClick={() => onNavigate?.('menu')}
          />
          <QuickActionCard
            label="Inventory"
            icon="📦"
            color="#f59e0b"
            onClick={() => onNavigate?.('inventory')}
          />
          <QuickActionCard
            label="Reports"
            icon="📊"
            color="#8b5cf6"
            onClick={() => onNavigate?.('reports')}
          />
        </div>
        
        {metrics.lowStockItems > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
                Low Stock Alert
              </div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>
                {metrics.lowStockItems} items need restocking
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CircularStatCard({ label, value, icon, color, percentage }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative'
    }}>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '24px'
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '2px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: color }}>
        {percentage}%
      </div>
    </div>
  );
}

function QuickActionCard({ label, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px',
        background: '#ffffff',
        color: '#1e293b',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        textAlign: 'left',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = color + '10';
        e.target.style.borderColor = color;
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = '#ffffff';
        e.target.style.borderColor = '#e2e8f0';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <span style={{ fontSize: '14px', fontWeight: '600' }}>{label}</span>
    </button>
  );
}
