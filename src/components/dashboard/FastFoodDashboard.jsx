/**
 * Fast Food Dashboard - Fast Food POS Theme
 *
 * High-velocity dashboard optimized for fast food operations with:
 * - Quick order entry and payment processing
 * - Kitchen display system integration
 * - Drive-thru and takeaway focus
 * - Speed-oriented metrics and KPIs
 */

import React, { useState, useMemo, useCallback } from 'react';

export default function FastFoodDashboard({
  orders = [],
  customers = [],
  inventory = [],
  kdsCards = [],
  tables = [],
  staff = [],
  waitlist = [],
  onNavigate,
}) {
  const [selectedView, setSelectedView] = useState('overview');

  // Calculate fast food specific metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    
    const totalSales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = todayOrders.length > 0 ? totalSales / todayOrders.length : 0;
    const pendingKDS = kdsCards.filter(k => k.status === 'PENDING').length;
    const inProgressKDS = kdsCards.filter(k => k.status === 'IN_PROGRESS').length;
    
    // Calculate average order time (completed orders today)
    const completedToday = todayOrders.filter(o => o.status === 'COMPLETED');
    const avgOrderTime = completedToday.length > 0 
      ? completedToday.reduce((sum, o) => {
          const created = new Date(o.createdAt).getTime();
          const completed = o.completedAt ? new Date(o.completedAt).getTime() : Date.now();
          return sum + (completed - created);
        }, 0) / completedToday.length
      : 0;

    return {
      totalSales,
      orderCount: todayOrders.length,
      avgOrderValue,
      pendingKDS,
      inProgressKDS,
      avgOrderTime: Math.round(avgOrderTime / 1000 / 60), // in minutes
      waitlistCount: waitlist.length,
    };
  }, [orders, kdsCards, waitlist]);

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fast Food Dashboard</h1>
        <p className="text-gray-600">Real-time operations overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(metrics.totalSales)}
          color="bg-green-500"
        />
        <StatCard
          label="Orders"
          value={metrics.orderCount}
          color="bg-blue-500"
        />
        <StatCard
          label="Avg Order"
          value={formatCurrency(metrics.avgOrderValue)}
          color="bg-purple-500"
        />
        <StatCard
          label="Pending KDS"
          value={metrics.pendingKDS}
          color="bg-orange-500"
        />
        <StatCard
          label="In Progress"
          value={metrics.inProgressKDS}
          color="bg-yellow-500"
        />
        <StatCard
          label="Waitlist"
          value={metrics.waitlistCount}
          color="bg-red-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <QuickActionButton
          label="New Order"
          icon="📝"
          onClick={() => onNavigate && onNavigate('orders')}
          color="bg-red-500 hover:bg-red-600"
        />
        <QuickActionButton
          label="Kitchen"
          icon="👨‍🍳"
          onClick={() => onNavigate && onNavigate('kitchen')}
          color="bg-orange-500 hover:bg-orange-600"
        />
        <QuickActionButton
          label="Tables"
          icon="🪑"
          onClick={() => onNavigate && onNavigate('tables')}
          color="bg-blue-500 hover:bg-blue-600"
        />
        <QuickActionButton
          label="Menu"
          icon="🍔"
          onClick={() => onNavigate && onNavigate('menu')}
          color="bg-green-500 hover:bg-green-600"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
        <div className="space-y-3">
          {orders.slice(0, 5).map(order => (
            <OrderRow key={order.id} order={order} formatCurrency={formatCurrency} />
          ))}
          {orders.length === 0 && (
            <p className="text-gray-500 text-center py-4">No orders today</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`${color} text-white rounded-lg p-4 shadow`}>
      <div className="text-sm opacity-90">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickActionButton({ label, icon, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-lg p-4 shadow-lg flex flex-col items-center justify-center min-h-24 transition-colors`}
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function OrderRow({ order, formatCurrency }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-semibold">#{order.id?.slice(-6) || 'Unknown'}</div>
        <div className="text-sm text-gray-600">
          {new Date(order.createdAt).toLocaleTimeString()}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold">{formatCurrency(order.total || 0)}</div>
        <span className={`text-xs px-2 py-1 rounded ${statusColors[order.status] || 'bg-gray-100'}`}>
          {order.status}
        </span>
      </div>
    </div>
  );
}
