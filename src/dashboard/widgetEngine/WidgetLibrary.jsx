/**
 * Widget Library
 * Marketplace for browsing and adding widgets to the dashboard
 */

import React, { useState, useMemo, memo } from 'react';
import widgetRegistry from './WidgetRegistry.js';
import { WidgetCategories } from './WidgetTypes.js';

function WidgetLibrary({ onAddWidget, availableWidgets, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState(new Set());

  const categories = useMemo(() => {
    return ['all', ...widgetRegistry.getCategories()];
  }, []);

  const filteredWidgets = useMemo(() => {
    let widgets = selectedCategory === 'all' 
      ? widgetRegistry.getAllWidgets()
      : widgetRegistry.getWidgetsByCategory(selectedCategory);

    if (searchQuery) {
      widgets = widgetRegistry.searchWidgets(searchQuery);
    }

    // Filter out already added widgets
    const addedWidgetIds = new Set(availableWidgets.map(w => w.widgetId));
    widgets = widgets.filter(w => !addedWidgetIds.has(w.id));

    return widgets;
  }, [selectedCategory, searchQuery, availableWidgets]);

  const toggleFavorite = (widgetId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(widgetId)) {
        newFavorites.delete(widgetId);
      } else {
        newFavorites.add(widgetId);
      }
      return newFavorites;
    });
  };

  const handleAddWidget = (widgetId) => {
    if (onAddWidget) {
      onAddWidget(widgetId);
    }
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
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        background: 'var(--cafe-bg-card)',
        border: '1px solid var(--cafe-border)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 900,
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)', margin: 0 }}>
              Widget Library
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', margin: '4px 0 0' }}>
              Add widgets to your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: 'var(--cafe-text-secondary)',
              borderRadius: 8
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--cafe-bg-surface)',
              border: '1px solid var(--cafe-border)',
              borderRadius: 8,
              fontSize: 14,
              color: 'var(--cafe-text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 20, 
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                background: selectedCategory === category 
                  ? 'var(--cafe-accent-bg)' 
                  : 'var(--cafe-bg-surface)',
                border: selectedCategory === category 
                  ? '1px solid var(--cafe-accent)' 
                  : '1px solid var(--cafe-border)',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                color: selectedCategory === category 
                  ? 'var(--cafe-accent)' 
                  : 'var(--cafe-text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize'
              }}
            >
              {category === 'all' ? 'All Widgets' : category}
            </button>
          ))}
        </div>

        {/* Widget Grid */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 16
        }}>
          {filteredWidgets.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1',
              textAlign: 'center', 
              padding: 40,
              color: 'var(--cafe-text-tertiary)'
            }}>
              No widgets found
            </div>
          ) : (
            filteredWidgets.map(widget => (
              <div
                key={widget.id}
                style={{
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{widget.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: 'var(--cafe-text-primary)'
                    }}>
                      {widget.name}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      color: 'var(--cafe-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {widget.category}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(widget.id)}
                    style={{
                      padding: 4,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      opacity: favorites.has(widget.id) ? 1 : 0.5
                    }}
                  >
                    {favorites.has(widget.id) ? '⭐' : '☆'}
                  </button>
                </div>

                <div style={{ 
                  fontSize: 13, 
                  color: 'var(--cafe-text-secondary)',
                  lineHeight: 1.4
                }}>
                  {widget.description}
                </div>

                <button
                  onClick={() => handleAddWidget(widget.id)}
                  style={{
                    padding: '10px 16px',
                    background: 'var(--cafe-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  Add to Dashboard
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(WidgetLibrary);
