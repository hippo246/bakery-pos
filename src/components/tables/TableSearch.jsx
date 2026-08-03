/**
 * Table Search Component
 * Instant search for tables, customers, reservations, waiters, orders
 */

import React, { useState, useMemo } from 'react';

function TableSearch({ 
  tables = [], 
  customers = [], 
  reservations = [], 
  waiters = [],
  orders = [],
  onResultClick
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all'); // all, tables, customers, reservations, waiters, orders

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    if (category === 'all' || category === 'tables') {
      const tableResults = tables.filter(table => 
        table.number.toString().includes(q) ||
        table.area?.toLowerCase().includes(q) ||
        table.type?.toLowerCase().includes(q) ||
        table.notes?.toLowerCase().includes(q)
      ).map(table => ({
        type: 'table',
        id: table.id,
        title: `Table #${table.number}`,
        subtitle: `${table.type} • ${table.area} • ${table.status}`,
        data: table
      }));

      if (category === 'tables') return tableResults;
      return [...tableResults];
    }

    if (category === 'all' || category === 'customers') {
      const customerResults = customers.filter(customer =>
        customer.name?.toLowerCase().includes(q) ||
        customer.phone?.includes(q) ||
        customer.email?.toLowerCase().includes(q)
      ).map(customer => ({
        type: 'customer',
        id: customer.id,
        title: customer.name,
        subtitle: customer.phone || 'No phone',
        data: customer
      }));

      if (category === 'customers') return customerResults;
      return [...(category === 'all' ? [] : []), ...customerResults];
    }

    if (category === 'all' || category === 'reservations') {
      const reservationResults = reservations.filter(reservation =>
        reservation.guestName?.toLowerCase().includes(q) ||
        reservation.phone?.includes(q) ||
        reservation.tableId?.toLowerCase().includes(q)
      ).map(reservation => ({
        type: 'reservation',
        id: reservation.id,
        title: reservation.guestName,
        subtitle: `${reservation.time} • ${reservation.partySize} guests`,
        data: reservation
      }));

      if (category === 'reservations') return reservationResults;
      return [...(category === 'all' ? [] : []), ...reservationResults];
    }

    if (category === 'all' || category === 'waiters') {
      const waiterResults = waiters.filter(waiter =>
        waiter.name?.toLowerCase().includes(q) ||
        waiter.id?.toLowerCase().includes(q)
      ).map(waiter => ({
        type: 'waiter',
        id: waiter.id,
        title: waiter.name,
        subtitle: waiter.active ? 'Active' : 'Inactive',
        data: waiter
      }));

      if (category === 'waiters') return waiterResults;
      return [...(category === 'all' ? [] : []), ...waiterResults];
    }

    if (category === 'all' || category === 'orders') {
      const orderResults = orders.filter(order =>
        order.id?.toLowerCase().includes(q) ||
        order.tableId?.toLowerCase().includes(q)
      ).map(order => ({
        type: 'order',
        id: order.id,
        title: order.id,
        subtitle: `${order.status} • ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.total || 0)}`,
        data: order
      }));

      if (category === 'orders') return orderResults;
      return [...(category === 'all' ? [] : []), ...orderResults];
    }

    return [];
  }, [query, category, tables, customers, reservations, waiters, orders]);

  const getCategoryIcon = (type) => {
    const icons = {
      table: '🪑',
      customer: '👤',
      reservation: '📅',
      waiter: '👨‍🍳',
      order: '📝'
    };
    return icons[type] || '🔍';
  };

  const getCategoryColor = (type) => {
    const colors = {
      table: 'var(--cafe-accent)',
      customer: 'var(--cafe-info)',
      reservation: 'var(--cafe-warning)',
      waiter: 'var(--cafe-success)',
      order: 'var(--cafe-purple)'
    };
    return colors[type] || 'var(--cafe-text-secondary)';
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 400
    }}>
      {/* Search Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tables, customers, reservations..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 'var(--cafe-radius-sm)',
            border: '1px solid var(--cafe-border-light)',
            background: 'var(--cafe-bg-card)',
            color: 'var(--cafe-text-primary)',
            fontSize: 13,
            outline: 'none'
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--cafe-radius-sm)',
            border: '1px solid var(--cafe-border-light)',
            background: 'var(--cafe-bg-card)',
            color: 'var(--cafe-text-primary)',
            fontSize: 12
          }}
        >
          <option value="all">All</option>
          <option value="tables">Tables</option>
          <option value="customers">Customers</option>
          <option value="reservations">Reservations</option>
          <option value="waiters">Waiters</option>
          <option value="orders">Orders</option>
        </select>
      </div>

      {/* Results Dropdown */}
      {query && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'var(--cafe-bg-card)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 'var(--cafe-radius-sm)',
          boxShadow: 'var(--cafe-shadow-lg)',
          maxHeight: 400,
          overflowY: 'auto',
          zIndex: 100
        }}>
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}-${index}`}
              onClick={() => {
                onResultClick && onResultClick(result);
                setQuery('');
              }}
              style={{
                padding: '10px 12px',
                borderBottom: index < results.length - 1 ? '1px solid var(--cafe-border-light)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cafe-bg-surface)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--cafe-bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}>
                {getCategoryIcon(result.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: getCategoryColor(result.type) 
                }}>
                  {result.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                  {result.subtitle}
                </div>
              </div>
              <div style={{
                padding: '2px 8px',
                borderRadius: 10,
                background: 'var(--cafe-bg-surface)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--cafe-text-tertiary)',
                textTransform: 'capitalize'
              }}>
                {result.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          padding: '16px',
          background: 'var(--cafe-bg-card)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 'var(--cafe-radius-sm)',
          boxShadow: 'var(--cafe-shadow-lg)',
          textAlign: 'center',
          color: 'var(--cafe-text-tertiary)',
          fontSize: 13
        }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

export default TableSearch;
