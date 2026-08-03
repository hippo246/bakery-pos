import React from 'react';
import { useState, useMemo } from "react";
import { searchInsights } from "../../utils/intelligenceEngine.js";

function GlobalSearch({ insights, orders, menuItems, inventory, staff, onNavigate }) {
  const [query, setQuery] = useState('');
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Search across all data
  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search insights
    if (insights) {
      const matchingInsights = insights.filter(i =>
        i.title?.toLowerCase().includes(lowerQuery) ||
        i.description?.toLowerCase().includes(lowerQuery) ||
        i.category?.toLowerCase().includes(lowerQuery)
      );
      matchingInsights.forEach(i => {
        results.push({
          type: 'INSIGHT',
          id: i.id,
          title: i.title,
          description: i.description,
          category: i.category,
          priority: i.priority,
          data: i
        });
      });
    }

    // Search orders
    if (orders) {
      const matchingOrders = orders.filter(o =>
        o.id?.toLowerCase().includes(lowerQuery) ||
        o.customerName?.toLowerCase().includes(lowerQuery) ||
        o.tableId?.toLowerCase().includes(lowerQuery)
      );
      matchingOrders.forEach(o => {
        results.push({
          type: 'ORDER',
          id: o.id,
          title: `Order ${o.id}`,
          description: `${o.customerName || 'Guest'} • ${formatCurrency(o.total)}`,
          data: o
        });
      });
    }

    // Search menu items
    if (menuItems) {
      const matchingItems = menuItems.filter(m =>
        m.name?.toLowerCase().includes(lowerQuery) ||
        m.category?.toLowerCase().includes(lowerQuery)
      );
      matchingItems.forEach(m => {
        results.push({
          type: 'MENU',
          id: m.id,
          title: m.name,
          description: `${m.category} • ${formatCurrency(m.price)}`,
          data: m
        });
      });
    }

    // Search inventory
    if (inventory) {
      const matchingInventory = inventory.filter(i =>
        i.name?.toLowerCase().includes(lowerQuery) ||
        i.category?.toLowerCase().includes(lowerQuery)
      );
      matchingInventory.forEach(i => {
        results.push({
          type: 'INVENTORY',
          id: i.id,
          title: i.name,
          description: `${i.quantity} units • ${i.category}`,
          data: i
        });
      });
    }

    // Search staff
    if (staff) {
      const matchingStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(lowerQuery) ||
        s.role?.toLowerCase().includes(lowerQuery)
      );
      matchingStaff.forEach(s => {
        results.push({
          type: 'STAFF',
          id: s.id,
          title: s.name,
          description: s.role,
          data: s
        });
      });
    }

    return results.slice(0, 20);
  }, [query, insights, orders, menuItems, inventory, staff]);

  const handleResultClick = (result) => {
    switch (result.type) {
      case 'INSIGHT':
        onNavigate?.('intelligence');
        break;
      case 'ORDER':
        onNavigate?.('orders');
        break;
      case 'MENU':
        onNavigate?.('menu');
        break;
      case 'INVENTORY':
        onNavigate?.('inventory');
        break;
      case 'STAFF':
        onNavigate?.('staff');
        break;
      default:
        break;
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      INSIGHT: '💡',
      ORDER: '📋',
      MENU: '📜',
      INVENTORY: '📦',
      STAFF: '👥'
    };
    return icons[type] || '🔍';
  };

  const getTypeColor = (type) => {
    const colors = {
      INSIGHT: '#3498db',
      ORDER: '#9b59b6',
      MENU: '#e67e22',
      INVENTORY: '#27ae60',
      STAFF: '#f39c12'
    };
    return colors[type] || '#95a5a6';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Search Input */}
      <div style={{
        position: 'relative'
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search insights, orders, menu, inventory, staff..."
          autoFocus
          style={{
            width: '100%',
            padding: '16px 16px 16px 48px',
            fontSize: '16px',
            border: '1px solid var(--cafe-border-light)',
            borderRadius: 'var(--cafe-radius-lg)',
            background: 'var(--cafe-bg-elevated)',
            color: 'var(--cafe-text-primary)'
          }}
        />
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '20px',
          opacity: 0.5
        }}>
          🔍
        </div>
      </div>

      {/* Results */}
      {query && query.length >= 2 && (
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-lg)',
          border: '1px solid var(--cafe-border-light)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {results.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cafe-bg-elevated)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    fontSize: '20px'
                  }}>
                    {getTypeIcon(result.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--cafe-text-primary)',
                      marginBottom: '2px'
                    }}>
                      {result.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--cafe-text-secondary)'
                    }}>
                      {result.description}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    background: `${getTypeColor(result.type)}20`,
                    color: getTypeColor(result.type),
                    borderRadius: 'var(--cafe-radius-sm)',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {result.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--cafe-text-secondary)'
            }}>
              No results found
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {!query && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          <QuickAction
            icon="💰"
            label="Revenue"
            onClick={() => onNavigate?.('analytics')}
          />
          <QuickAction
            icon="📦"
            label="Inventory"
            onClick={() => onNavigate?.('inventory')}
          />
          <QuickAction
            icon="👨‍🍳"
            label="Kitchen"
            onClick={() => onNavigate?.('kitchen')}
          />
          <QuickAction
            icon="📋"
            label="Orders"
            onClick={() => onNavigate?.('orders')}
          />
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '20px',
        background: 'var(--cafe-bg-surface)',
        border: '1px solid var(--cafe-border-light)',
        borderRadius: 'var(--cafe-radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--cafe-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--cafe-border-light)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--cafe-text-primary)'
      }}>
        {label}
      </div>
    </button>
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

export default GlobalSearch;
