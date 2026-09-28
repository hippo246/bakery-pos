import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function NewDashboard({ orders = [], menuItems = [], darkMode = false }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const completedOrders = todayOrders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID');
    
    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Calculate hourly sales for chart
    const hourlySales = Array.from({ length: 7 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      revenue: Math.floor(Math.random() * 5000) + 2000,
      percentage: Math.floor(Math.random() * 30) - 15
    }));
    
    // Top selling items
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
    
    // Category breakdown
    const categorySales = {
      'Take Away': 4898,
      'Reservation': 4587,
      'Dine In': 3200,
      'Delivery': 2100
    };
    const totalCategorySales = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const categoryData = Object.entries(categorySales).map(([category, sales]) => ({
      name: category,
      value: sales,
      percentage: (sales / totalCategorySales * 100).toFixed(1)
    }));
    
    // Active orders
    const activeOrders = todayOrders
      .filter(o => o.status === 'PREPARING' || o.status === 'PENDING')
      .slice(0, 5);
    
    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      reservations: 496,
      hourlySales,
      topItems,
      categoryData,
      activeOrders
    };
  }, [orders]);

  const theme = darkMode ? {
    bg: '#0f0f0f',
    card: '#1a1a1a',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    chartGrid: '#334155',
    chartText: '#94a3b8'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    chartGrid: '#e2e8f0',
    chartText: '#64748b'
  };

  return (
    <div style={{
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: theme.bg,
      minHeight: '100vh',
      color: theme.text
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              const settings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
              settings.dashboardLayout = 'default';
              localStorage.setItem('cafeos_settings', JSON.stringify(settings));
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Switch to Standard Layout
          </button>
          <button style={{
            padding: '10px 20px',
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            color: theme.text,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Sync Data
          </button>
          <button style={{
            padding: '10px 20px',
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            color: theme.text,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Export
          </button>
          <div style={{
            padding: '10px 16px',
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            color: theme.textSecondary,
            fontSize: '14px'
          }}>
            15 Nov, 2025 - 15 Dec, 2025
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📦
          </div>
          <div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>
              {metrics.totalOrders}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
              +12.5%
            </div>
          </div>
        </div>

        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            💰
          </div>
          <div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
              Total Sales
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>
              ₹{metrics.totalSales.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
              +12.5%
            </div>
          </div>
        </div>

        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📊
          </div>
          <div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
              Average Value
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>
              ₹{metrics.avgOrderValue.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              -8.5%
            </div>
          </div>
        </div>

        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📅
          </div>
          <div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
              Reservations
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: theme.text }}>
              {metrics.reservations}
            </div>
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
              -12.7%
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Total Revenue Chart */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Total Revenue
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: '6px 12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                color: theme.text,
                fontSize: '14px'
              }}
            >
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px' }}>
            ₹{metrics.hourlySales.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics.hourlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
              <XAxis dataKey="day" stroke={theme.chartText} fontSize={12} />
              <YAxis stroke={theme.chartText} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: theme.card, 
                  border: `1px solid ${theme.border}`,
                  color: theme.text 
                }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Selling Item */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Top Selling Item
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                color: theme.text,
                fontSize: '14px'
              }}
            >
              <option>All</option>
              <option>Food</option>
              <option>Beverages</option>
              <option>Desserts</option>
            </select>
          </div>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '16px' }}>
            Most Ordered: {metrics.topItems[0]?.name || 'No data'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.topItems.map((item, index) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: theme.text 
                }}>
                  #{index + 1} {item.name}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: theme.text,
                  minWidth: '80px',
                  textAlign: 'right'
                }}>
                  {item.qty}
                </div>
                <div style={{ 
                  width: '100px', 
                  height: '8px', 
                  background: theme.bg, 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${(item.qty / metrics.topItems[0].qty) * 100}%`,
                      background: '#6366f1',
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Category Statistics */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Category Statistics
            </h3>
            <button style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.text,
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={metrics.categoryData}
                  cx="75"
                  cy="75"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {metrics.categoryData.map((item, index) => (
                <div 
                  key={item.name} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: theme.text
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: COLORS[index % COLORS.length]
                  }} />
                  <span>{item.name}: {item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Active Orders
            </h3>
            <button style={{
              padding: '8px 16px',
              background: '#6366f1',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Add New
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.activeOrders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px', 
                color: theme.textSecondary,
                fontSize: '14px' 
              }}>
                No active orders
              </div>
            ) : (
              metrics.activeOrders.map((order, index) => (
                <div
                  key={order.id || index}
                  style={{
                    padding: '12px',
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
                      {order.customerName || 'Guest'}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                      {order.orderType || 'Dine In'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: order.status === 'PREPARING' ? '#fef3c7' : '#dbeafe',
                    color: order.status === 'PREPARING' ? '#92400e' : '#059669'
                  }}>
                    {order.status === 'PREPARING' ? 'In Kitchen' : 'Pending'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sales Performance */}
      <div style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Sales Performance
          </h3>
          <button style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            color: theme.text,
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            View Report
          </button>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <ResponsiveContainer width={200} height={200}>
            <RadialBarChart cx="100" cy="100" innerRadius="60" outerRadius="80">
              <RadialBar
                data={[{ name: 'Sales', value: 40 }]}
                startAngle={90}
                endAngle={270}
                dataKey="value"
                fill="#6366f1"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: theme.text, marginBottom: '8px' }}>
              40%
            </div>
            <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
              Sales This Month
            </div>
            <div style={{ fontSize: '14px', color: theme.textSecondary }}>
              Total Orders: {metrics.totalOrders} <span style={{ color: '#10b981', marginLeft: '8px' }}>+6%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}