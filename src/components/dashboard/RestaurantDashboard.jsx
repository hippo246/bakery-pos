import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import OrderEventManager from '../../services/OrderEventManager';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function RestaurantDashboard({ orders = [], setOrders, menuItems = [], customers = [], tables = [], tokens = [], staff = [], darkMode = false }) {
  const [incomePeriod, setIncomePeriod] = useState('Monthly');
  const [ordersPeriod, setOrdersPeriod] = useState('Daily');
  const [localOrders, setLocalOrders] = useState(orders);
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [localTables, setLocalTables] = useState(tables);
  const [localTokens, setLocalTokens] = useState(tokens);
  const [localStaff, setLocalStaff] = useState(staff);

  // Sync props with local state
  useEffect(() => {
    setLocalOrders(orders);
    setLocalCustomers(customers);
    setLocalTables(tables);
    setLocalTokens(tokens);
    setLocalStaff(staff);
  }, [orders, customers, tables, tokens, staff]);

  // Subscribe to all real-time events
  useEffect(() => {
    const unsubscribeOrderCreated = OrderEventManager.on('order:created', (order) => {
      console.log('[RestaurantDashboard] Order created:', order.id);
      setLocalOrders(prev => [...prev, order]);
    });

    const unsubscribeOrderUpdated = OrderEventManager.on('order:updated', (order) => {
      console.log('[RestaurantDashboard] Order updated:', order.id);
      setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o));
    });

    const unsubscribeOrderFired = OrderEventManager.on('order:fired', ({ order, kotData }) => {
      console.log('[RestaurantDashboard] Order fired:', order.id);
      setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, kotData } : o));
    });

    const unsubscribeOrderItemStatus = OrderEventManager.on('order:item:status', ({ order, itemId, newStatus }) => {
      console.log('[RestaurantDashboard] Order item status changed:', order.id, itemId, newStatus);
      setLocalOrders(prev => prev.map(o => {
        if (o.id === order.id) {
          const updatedItems = o.items?.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
          );
          return { ...o, items: updatedItems };
        }
        return o;
      }));
    });

    const unsubscribeOrderCompleted = OrderEventManager.on('order:completed', (order) => {
      console.log('[RestaurantDashboard] Order completed:', order.id);
      setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'COMPLETED' } : o));
    });

    const unsubscribeOrderPaid = OrderEventManager.on('order:paid', ({ order, paymentData }) => {
      console.log('[RestaurantDashboard] Order paid:', order.id);
      setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'PAID', payment: paymentData } : o));
    });

    const unsubscribeOrderCancelled = OrderEventManager.on('order:cancelled', ({ order, reason }) => {
      console.log('[RestaurantDashboard] Order cancelled:', order.id);
      setLocalOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CANCELLED', cancelReason: reason } : o));
    });

    const unsubscribeTableStatus = OrderEventManager.on('table:status', ({ tableId, newStatus, tableData }) => {
      console.log('[RestaurantDashboard] Table status changed:', tableId, newStatus);
      setLocalTables(prev => prev.map(t => 
        t.id === tableId || t.number === parseInt(tableId)
          ? { ...t, status: newStatus, ...tableData }
          : t
      ));
    });

    const unsubscribeTableOrder = OrderEventManager.on('table:order', ({ tableId, orderData }) => {
      console.log('[RestaurantDashboard] Table order updated:', tableId);
      setLocalTables(prev => prev.map(t => 
        t.id === tableId || t.number === parseInt(tableId)
          ? { ...t, orderId: orderData.orderId, orderData }
          : t
      ));
    });

    const unsubscribeKOTReceived = OrderEventManager.on('kitchen:kot:received', (kotData) => {
      console.log('[RestaurantDashboard] KOT received:', kotData);
    });

    const unsubscribeKitchenItemStarted = OrderEventManager.on('kitchen:item:started', ({ kotId, itemId }) => {
      console.log('[RestaurantDashboard] Kitchen item started:', kotId, itemId);
    });

    const unsubscribeKitchenItemCompleted = OrderEventManager.on('kitchen:item:completed', ({ kotId, itemId }) => {
      console.log('[RestaurantDashboard] Kitchen item completed:', kotId, itemId);
    });

    const unsubscribeWaiterAssigned = OrderEventManager.on('waiter:assigned', ({ orderId, waiterId, tableId }) => {
      console.log('[RestaurantDashboard] Waiter assigned:', orderId, waiterId, tableId);
      setLocalOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, waiterId, tableId } : o
      ));
    });

    const unsubscribeTokenGenerated = OrderEventManager.on('token:generated', ({ orderId, tokenNumber }) => {
      console.log('[RestaurantDashboard] Token generated:', orderId, tokenNumber);
      setLocalTokens(prev => [...prev, { orderId, tokenNumber, status: 'active', createdAt: new Date().toISOString() }]);
    });

    const unsubscribeTokenStatus = OrderEventManager.on('token:status', ({ tokenNumber, newStatus }) => {
      console.log('[RestaurantDashboard] Token status changed:', tokenNumber, newStatus);
      setLocalTokens(prev => prev.map(t => 
        t.tokenNumber === tokenNumber ? { ...t, status: newStatus } : t
      ));
    });

    return () => {
      unsubscribeOrderCreated();
      unsubscribeOrderUpdated();
      unsubscribeOrderFired();
      unsubscribeOrderItemStatus();
      unsubscribeOrderCompleted();
      unsubscribeOrderPaid();
      unsubscribeOrderCancelled();
      unsubscribeTableStatus();
      unsubscribeTableOrder();
      unsubscribeKOTReceived();
      unsubscribeKitchenItemStarted();
      unsubscribeKitchenItemCompleted();
      unsubscribeWaiterAssigned();
      unsubscribeTokenGenerated();
      unsubscribeTokenStatus();
    };
  }, []);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = localOrders.filter(o => new Date(o.createdAt).toDateString() === today);
    const completedOrders = todayOrders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID');
    const activeOrders = todayOrders.filter(o => o.status === 'PREPARING' || o.status === 'PENDING');
    
    const todayRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const yesterdayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === yesterday);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0;
    const ordersChange = yesterdayOrders.length > 0 ? ((completedOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1) : 0;
    
    const monthlyIncome = [
      { month: 'Jan', income: 28000 },
      { month: 'Feb', income: 32000 },
      { month: 'Mar', income: 29000 },
      { month: 'Apr', income: 35000 },
      { month: 'May', income: 31000 },
      { month: 'Jun', income: 39000 },
      { month: 'Jul', income: 33000 },
      { month: 'Aug', income: 36000 }
    ];
    
    const totalMonthlyIncome = monthlyIncome.reduce((sum, m) => sum + m.income, 0);
    
    const categorySales = {};
    completedOrders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.category || 'Other';
        categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity || 0);
      });
    });
    
    const totalCategorySales = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const topCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: totalCategorySales > 0 ? (sales / totalCategorySales * 100).toFixed(0) : 0
      }));
    
    const totalBills = completedOrders.length;
    const avgValue = totalBills > 0 ? todayRevenue / totalBills : 0;
    
    const paymentMethods = {};
    completedOrders.forEach(order => {
      const method = order.paymentMethod || 'CASH';
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.total || 0);
    });
    
    const totalPayment = Object.values(paymentMethods).reduce((sum, val) => sum + val, 0);
    const paymentData = Object.entries(paymentMethods).map(([method, amount]) => ({
      name: method,
      value: amount,
      percentage: totalPayment > 0 ? (amount / totalPayment * 100).toFixed(0) : 0
    }));
    
    const recentOrders = todayOrders
      .slice(0, 6)
      .map(order => ({
        id: order.id,
        name: order.items?.[0]?.name || 'Order',
        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: order.status
      }));
    
    return {
      todayRevenue,
      totalOrders: completedOrders.length,
      activeOrders: activeOrders.length,
      revenueChange,
      ordersChange,
      monthlyIncome,
      totalMonthlyIncome,
      topCategories,
      totalBills,
      avgValue,
      paymentData,
      totalPayment,
      recentOrders
    };
  }, [localOrders]);

  const theme = darkMode ? {
    bg: '#0f0f0f',
    card: '#1a1a1a',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    chartGrid: '#334155',
    chartText: '#94a3b8',
    accent: '#6366f1'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    chartGrid: '#e2e8f0',
    chartText: '#64748b',
    accent: '#6366f1'
  };

  return (
    <div style={{
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: theme.bg,
      minHeight: '100vh',
      color: theme.text,
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Restaurant Management Dashboard
        </h1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            Today's Revenue
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text, marginBottom: '4px' }}>
            {'₹' + metrics.todayRevenue.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: parseFloat(metrics.revenueChange) >= 0 ? '#10b981' : '#ef4444' }}>
            {(parseFloat(metrics.revenueChange) >= 0 ? '+' : '') + metrics.revenueChange + '%'}
          </div>
        </div>

        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text, marginBottom: '4px' }}>
            {metrics.totalOrders}
          </div>
          <div style={{ fontSize: '14px', color: parseFloat(metrics.ordersChange) >= 0 ? '#10b981' : '#ef4444' }}>
            {(parseFloat(metrics.ordersChange) >= 0 ? '+' : '') + metrics.ordersChange + '%'}
          </div>
        </div>

        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '8px' }}>
            Active Orders
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: theme.text, marginBottom: '4px' }}>
            {metrics.activeOrders}
          </div>
          <div style={{ fontSize: '14px', color: '#ef4444' }}>
            -19%
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
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
              Average Monthly Income
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIncomePeriod('Monthly')}
                style={{
                  padding: '6px 12px',
                  background: incomePeriod === 'Monthly' ? theme.accent : 'transparent',
                  color: incomePeriod === 'Monthly' ? '#ffffff' : theme.text,
                  border: incomePeriod === 'Monthly' ? 'none' : '1px solid ' + theme.border,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIncomePeriod('Yearly')}
                style={{
                  padding: '6px 12px',
                  background: incomePeriod === 'Yearly' ? theme.accent : 'transparent',
                  color: incomePeriod === 'Yearly' ? '#ffffff' : theme.text,
                  border: incomePeriod === 'Yearly' ? 'none' : '1px solid ' + theme.border,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Yearly
              </button>
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
            {'₹' + metrics.totalMonthlyIncome.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '16px' }}>
            76.09% as previous month
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={metrics.monthlyIncome}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
              <XAxis dataKey="month" stroke={theme.chartText} fontSize={12} />
              <YAxis stroke={theme.chartText} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: theme.card, 
                  border: '1px solid ' + theme.border,
                  color: theme.text 
                }}
              />
              <Bar dataKey="income" fill={theme.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Top Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.topCategories.map((cat, index) => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: theme.text 
                }}>
                  {cat.name}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: theme.text,
                  minWidth: '50px',
                  textAlign: 'right'
                }}>
                  {cat.percentage + '%'}
                </div>
                <div style={{ 
                  width: '80px', 
                  height: '8px', 
                  background: theme.bg, 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: cat.percentage + '%',
                      background: COLORS[index % COLORS.length],
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            POS Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                Total Bill
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                {metrics.totalBills}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                AVG Value
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                {'₹' + metrics.avgValue.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '4px' }}>
                Pick Hour
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: theme.text }}>
                9:00 AM
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={metrics.paymentData}
                  cx="75"
                  cy="75"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.paymentData.map((entry, index) => (
                    <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: theme.text, marginBottom: '8px' }}>
                {'₹' + metrics.totalPayment.toFixed(2)}
              </div>
              <div style={{ fontSize: '14px', color: theme.textSecondary, marginBottom: '4px' }}>
                Total Payment
              </div>
              {metrics.paymentData.map((item, index) => (
                <div 
                  key={item.name} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: theme.text
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: COLORS[index % COLORS.length]
                  }} />
                  <span>{item.name + ' ' + item.percentage + '%'}</span>
                </div>
              ))}
            </div>
          </div>
          <button style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px solid ' + theme.border,
            borderRadius: '6px',
            color: theme.text,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '16px'
          }}>
            View Details
          </button>
        </div>

        <div style={{
          background: theme.card,
          border: '1px solid ' + theme.border,
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
              Recent Orders
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setOrdersPeriod('Daily')}
                style={{
                  padding: '6px 12px',
                  background: ordersPeriod === 'Daily' ? theme.accent : 'transparent',
                  color: ordersPeriod === 'Daily' ? '#ffffff' : theme.text,
                  border: ordersPeriod === 'Daily' ? 'none' : '1px solid ' + theme.border,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setOrdersPeriod('Weekly')}
                style={{
                  padding: '6px 12px',
                  background: ordersPeriod === 'Weekly' ? theme.accent : 'transparent',
                  color: ordersPeriod === 'Weekly' ? '#ffffff' : theme.text,
                  border: ordersPeriod === 'Weekly' ? 'none' : '1px solid ' + theme.border,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Weekly
              </button>
              <button
                onClick={() => setOrdersPeriod('Monthly')}
                style={{
                  padding: '6px 12px',
                  background: ordersPeriod === 'Monthly' ? theme.accent : 'transparent',
                  color: ordersPeriod === 'Monthly' ? '#ffffff' : theme.text,
                  border: ordersPeriod === 'Monthly' ? 'none' : '1px solid ' + theme.border,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Monthly
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid ' + theme.border }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                  ORDER ID
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                  ORDER NAME
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                  TIME
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid ' + theme.border }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: theme.text }}>
                    {'#' + order.id}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: theme.text }}>
                    {order.name}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: theme.text }}>
                    {order.time}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: order.status === 'COMPLETED' ? '#d1fae5' : order.status === 'CANCELLED' ? '#fee2e2' : '#dbeafe',
                      color: order.status === 'COMPLETED' ? '#065f46' : order.status === 'CANCELLED' ? '#991b1b' : '#059669'
                    }}>
                      {order.status === 'COMPLETED' ? 'Completed' : order.status === 'CANCELLED' ? 'Cancelled' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: theme.card,
        border: '1px solid ' + theme.border,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Staff On Duty
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { name: 'Albert Flores', role: 'Lead Operations', rating: 9 },
            { name: 'Sarah Johnson', role: 'Head Chef', rating: 8 },
            { name: 'Mike Chen', role: 'Server', rating: 7 },
            { name: 'Emma Wilson', role: 'Manager', rating: 9 }
          ].map((staff) => (
            <div
              key={staff.name}
              style={{
                padding: '16px',
                background: theme.bg,
                border: '1px solid ' + theme.border,
                borderRadius: '8px',
                minWidth: '200px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
                {staff.name}
              </div>
              <div style={{ fontSize: '12px', color: theme.textSecondary, marginBottom: '8px' }}>
                {staff.role}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: theme.accent }}>
                {staff.rating + '/10'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
