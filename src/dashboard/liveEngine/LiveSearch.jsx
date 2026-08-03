/**
 * Live Search
 * Global operational search across all data sources
 */

import React, { useState, useMemo, memo } from 'react';
import liveOperationsEngine from './LiveOperationsEngine.js';

function LiveSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const allData = useMemo(() => {
    return liveOperationsEngine.getAllData();
  }, []);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const searchResults = [];

    // Search orders
    if (allData.orders) {
      Object.entries(allData.orders).forEach(([key, value]) => {
        if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'order',
            label: key,
            value: value,
            icon: '📋'
          });
        }
      });
    }

    // Search tables
    if (allData.tables) {
      Object.entries(allData.tables).forEach(([key, value]) => {
        if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'table',
            label: key,
            value: value,
            icon: '🪑'
          });
        }
      });
    }

    // Search reservations
    if (allData.reservations?.upcoming) {
      allData.reservations.upcoming.forEach(res => {
        if (res.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'reservation',
            label: res.name,
            value: `${res.time} - ${res.guests} guests`,
            icon: '📅'
          });
        }
      });
    }

    // Search inventory
    if (allData.inventory) {
      ['critical', 'low', 'out', 'expiring'].forEach(category => {
        if (allData.inventory[category]) {
          allData.inventory[category].forEach(item => {
            if (item.name.toLowerCase().includes(lowerQuery)) {
              searchResults.push({
                type: 'inventory',
                label: item.name,
                value: `${item.quantity} ${item.unit}`,
                icon: '📦'
              });
            }
          });
        }
      });
    }

    // Search staff
    if (allData.staff?.staffList) {
      allData.staff.staffList.forEach(staff => {
        if (staff.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'staff',
            label: staff.name,
            value: `${staff.role} - ${staff.status}`,
            icon: '👤'
          });
        }
      });
    }

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
  };

  const handleResultClick = (result) => {
    // Handle navigation to the relevant section
    console.log('Navigate to:', result);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--cafe-bg-card)',
        border: '1px solid var(--cafe-border)',
        borderRadius: 16,
        padding: 20,
        maxWidth: 600,
        width: '90%',
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Search Input */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search orders, tables, reservations, staff, inventory..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'var(--cafe-bg-surface)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              fontSize: 16,
              color: 'var(--cafe-text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {query && results.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: 'var(--cafe-text-tertiary)',
              fontSize: 14
            }}>
              No results found for "{query}"
            </div>
          )}

          {!query && (
            <div style={{ 
              textAlign: 'center', 
              padding: 40, 
              color: 'var(--cafe-text-tertiary)',
              fontSize: 14
            }}>
              Start typing to search...
            </div>
          )}

          {results.map((result, index) => (
            <div
              key={`${result.type}-${index}`}
              onClick={() => handleResultClick(result)}
              style={{
                padding: 12,
                background: 'var(--cafe-bg-surface)',
                border: '1px solid var(--cafe-border)',
                borderRadius: 8,
                marginBottom: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--cafe-accent)';
                e.currentTarget.style.background = 'var(--cafe-accent-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--cafe-border)';
                e.currentTarget.style.background = 'var(--cafe-bg-surface)';
              }}
            >
              <span style={{ fontSize: 24 }}>{result.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                  {result.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                  {result.value}
                </div>
              </div>
              <div style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-bg-card)',
                borderRadius: 4,
                fontSize: 11,
                textTransform: 'capitalize',
                color: 'var(--cafe-text-secondary)'
              }}>
                {result.type}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 16, 
          paddingTop: 16, 
          borderTop: '1px solid var(--cafe-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'var(--cafe-text-tertiary)'
        }}>
          <div>Press ESC to close</div>
          <div>Use ↑↓ to navigate</div>
        </div>
      </div>
    </div>
  );
}

export default memo(LiveSearch);
