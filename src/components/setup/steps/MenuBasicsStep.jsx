import React from 'react';
// Menu Basics Step for Setup Wizard
// Full menu management with categories, items, pricing, and modifiers

import { useState, useCallback, useMemo } from "react";

const CATEGORIES = [
  { id: 'coffee', name: 'Coffee & Tea', icon: '☕' },
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'drinks', name: 'Cold Drinks', icon: '🥤' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'snacks', name: 'Snacks', icon: '🍿' }
];

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`);

// A function, not a shared object literal — formData.modifiers is an array,
// and reusing one literal across resets would let every "empty" form share
// (and accidentally mutate) the same array reference.
const getDefaultFormData = () => ({
  name: '',
  category: 'coffee',
  price: '',
  description: '',
  available: true,
  modifiers: []
});

export default function MenuBasicsStep({ settings, onNext, onBack, onSkip, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [menuItems, setMenuItems] = useState(settings?.menuItems || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // renderFieldCard() below reads showHelp/toggleHelp, but neither existed
  // anywhere in this component — calling it would throw immediately. Adding
  // the piece that was missing rather than deleting the (otherwise correct,
  // TablesStep-matching) helper.
  const [showHelp, setShowHelp] = useState({});
  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState(getDefaultFormData);
  const [modifierDraft, setModifierDraft] = useState({ name: '', price: '' });

  const handleAddItem = useCallback(() => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError({ title: 'Error', message: 'Item name is required' });
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (!formData.price || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError({ title: 'Error', message: 'Valid price is required' });
      return;
    }
    if (parsedPrice > 100000) {
      setError({ title: 'Error', message: 'That price looks too high — double-check it' });
      return;
    }
    const dupe = menuItems.find(item =>
      item.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
      item.id !== editingItem?.id
    );
    if (dupe) {
      setError({ title: 'Error', message: `"${trimmedName}" is already on the menu` });
      return;
    }

    const newItem = {
      id: editingItem?.id || makeId(),
      name: trimmedName,
      category: formData.category,
      price: parsedPrice,
      description: formData.description.trim(),
      available: formData.available,
      modifiers: formData.modifiers,
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = menuItems.map(item => item.id === editingItem.id ? newItem : item);
    } else {
      updatedItems = [...menuItems, newItem];
    }

    setMenuItems(updatedItems);
    setFormData(getDefaultFormData());
    setModifierDraft({ name: '', price: '' });
    setShowAddForm(false);
    setEditingItem(null);
  }, [formData, menuItems, editingItem, setError]);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || '',
      available: item.available !== false,
      modifiers: item.modifiers || []
    });
    setModifierDraft({ name: '', price: '' });
    setShowAddForm(true);
  }, []);

  const handleDeleteItem = useCallback((itemId) => {
    const item = menuItems.find(i => i.id === itemId);
    if (item && !window.confirm(`Remove "${item.name}" from the menu? This can't be undone.`)) return;
    setMenuItems(menuItems.filter(item => item.id !== itemId));
  }, [menuItems]);

  const handleAddModifier = useCallback(() => {
    const name = modifierDraft.name.trim();
    if (!name) return;
    const dupe = formData.modifiers.some(m => m.name.toLowerCase() === name.toLowerCase());
    if (dupe) {
      setError({ title: 'Error', message: `"${name}" is already a modifier on this item` });
      return;
    }
    const priceDelta = Math.max(0, parseFloat(modifierDraft.price) || 0);
    setFormData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { id: makeId(), name, priceDelta }]
    }));
    setModifierDraft({ name: '', price: '' });
  }, [modifierDraft, formData.modifiers, setError]);

  const handleRemoveModifier = useCallback((modifierId) => {
    setFormData(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter(m => m.id !== modifierId)
    }));
  }, []);

  const handleToggleAvailable = useCallback((itemId) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
  }, [menuItems]);

  const itemsByCategory = useMemo(() => menuItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {}), [menuItems]);

  const menuStats = useMemo(() => {
    const availableCount = menuItems.filter(item => item.available !== false).length;
    const avgPrice = menuItems.length
      ? menuItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0) / menuItems.length
      : 0;
    return {
      total: menuItems.length,
      available: availableCount,
      unavailable: menuItems.length - availableCount,
      categoriesUsed: Object.keys(itemsByCategory).length,
      avgPrice
    };
  }, [menuItems, itemsByCategory]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    });
  }, [menuItems, categoryFilter, searchQuery]);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      menuItems
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // Private browsing, storage quota, or disabled storage shouldn't block
      // wizard progress — menuItems is still passed up to the parent via onNext.
      console.warn('Could not persist brewcrm_settings to localStorage:', e);
    }
    onNext({ menuItems });
  }, [menuItems, settings, onNext]);

  const renderFieldCard = (title, icon, children, helpText) => (
    <div style={{
      background: "var(--cafe-bg-surface)",
      border: "1px solid var(--cafe-border-light)",
      borderRadius: 16,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            {title}
          </h3>
        </div>
        {helpText && (
          <button
            onClick={() => toggleHelp(title)}
            aria-label={`${showHelp[title] ? 'Hide' : 'Show'} help for ${title}`}
            aria-expanded={!!showHelp[title]}
            style={{
              padding: "6px 10px",
              background: "var(--cafe-accent-bg)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-accent)",
              cursor: "pointer"
            }}
          >
            ?
          </button>
        )}
      </div>
      {showHelp[title] && helpText && (
        <div style={{
          padding: 12,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: "var(--cafe-info)"
        }}>
          {helpText}
        </div>
      )}
      {children}
    </div>
  );

  const renderStatTile = (label, value, accentColor) => (
    <div style={{
      flex: "1 1 120px",
      padding: "12px 16px",
      background: "var(--cafe-bg)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 10
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: accentColor || "var(--cafe-text-primary)", lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Menu Setup
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Add menu items, set prices, and organize by categories.
        </p>
      </div>

      {/* Menu Items List */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📋</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              Menu Items ({menuItems.length})
            </h4>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData(getDefaultFormData());
              setModifierDraft({ name: '', price: '' });
              setShowAddForm(true);
            }}
            style={{
              padding: "10px 20px",
              background: "var(--cafe-accent)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            + Add Item
          </button>
        </div>

        {menuItems.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {renderStatTile('Menu items', menuStats.total)}
            {renderStatTile('Available', menuStats.available, '#10b981')}
            {menuStats.unavailable > 0 && renderStatTile('Unavailable', menuStats.unavailable, '#f59e0b')}
            {renderStatTile('Categories', menuStats.categoriesUsed)}
            {renderStatTile('Avg. price', `₹${menuStats.avgPrice.toFixed(2)}`, 'var(--cafe-accent)')}
          </div>
        )}

        {menuItems.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {CATEGORIES.filter(cat => itemsByCategory[cat.id]).map(cat => {
              const isActive = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(isActive ? 'all' : cat.id)}
                  aria-pressed={isActive}
                  title={isActive ? `Clear ${cat.name} filter` : `Filter to ${cat.name}`}
                  style={{
                    padding: "6px 12px",
                    background: isActive ? "var(--cafe-accent)" : "var(--cafe-accent-bg)",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "#fff" : "var(--cafe-accent)",
                    border: "1px solid var(--cafe-accent)",
                    cursor: "pointer"
                  }}
                >
                  {cat.icon} {cat.name}: {itemsByCategory[cat.id]}
                </button>
              );
            })}
          </div>
        )}

        {menuItems.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                placeholder="Search menu items..."
                style={{
                  width: "100%",
                  padding: "10px 32px 10px 14px",
                  fontSize: 13,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: 14,
                    color: "var(--cafe-text-tertiary)",
                    cursor: "pointer",
                    padding: 4,
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {menuItems.length === 0 ? (
          <div style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--cafe-text-tertiary)",
            background: "var(--cafe-bg)",
            borderRadius: 12,
            border: "1px dashed var(--cafe-border)"
          }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>📋</span>
            <p style={{ fontSize: 14, margin: 0 }}>
              No menu items yet. Click "Add Item" to get started.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--cafe-text-tertiary)",
            background: "var(--cafe-bg)",
            borderRadius: 12,
            border: "1px dashed var(--cafe-border)"
          }}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>🔍</span>
            <p style={{ fontSize: 14, margin: 0 }}>
              No items match "{searchQuery}"{categoryFilter !== 'all' ? ` in ${CATEGORIES.find(c => c.id === categoryFilter)?.name}` : ''}.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredItems.map(item => {
              const category = CATEGORIES.find(c => c.id === item.category);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "16px",
                    background: "var(--cafe-bg)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    opacity: item.available === false ? 0.6 : 1,
                    transition: "opacity 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24
                    }}>
                      {category?.icon || '🍽️'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                          {item.name}
                        </span>
                        {item.available === false && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#f59e0b20",
                            color: "#f59e0b"
                          }}>
                            Unavailable
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                        {category?.name || item.category}
                        {item.modifiers?.length > 0 && ` • ${item.modifiers.length} modifier${item.modifiers.length > 1 ? 's' : ''}`}
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: 12,
                          color: "var(--cafe-text-tertiary)",
                          marginTop: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--cafe-accent)", whiteSpace: "nowrap" }}>
                      ₹{Number(item.price || 0).toFixed(2)}
                    </div>
                    <button
                      onClick={() => handleToggleAvailable(item.id)}
                      role="switch"
                      aria-checked={item.available !== false}
                      aria-label={item.available !== false ? `Mark ${item.name} unavailable` : `Mark ${item.name} available`}
                      title={item.available !== false ? 'Available — click to mark unavailable' : 'Unavailable — click to mark available'}
                      style={{
                        position: "relative",
                        width: 40,
                        height: 22,
                        borderRadius: 999,
                        border: "none",
                        background: item.available !== false ? "#10b981" : "var(--cafe-border)",
                        cursor: "pointer",
                        flexShrink: 0,
                        padding: 0
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: 2,
                        left: item.available !== false ? 20 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.15s ease",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.25)"
                      }} />
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      aria-label={`Edit ${item.name}`}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-info-bg)",
                        border: "1px solid var(--cafe-info-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--cafe-info)",
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label={`Delete ${item.name}`}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-danger-bg)",
                        border: "1px solid var(--cafe-danger-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--cafe-danger)",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Item Form */}
      {showAddForm && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowAddForm(false);
              setEditingItem(null);
              setFormData(getDefaultFormData());
              setModifierDraft({ name: '', price: '' });
            }
          }}
          style={{
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border-light)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>{editingItem ? '✏️' : '➕'}</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h4>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Item Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Cappuccino"
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Price (₹) <span style={{ color: "var(--cafe-danger)" }}>*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 10,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the item..."
              rows={3}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg)",
                color: "var(--cafe-text-primary)",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 4, display: "block" }}>
              Modifiers
            </label>
            <p style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", margin: "0 0 10px" }}>
              Optional add-ons with their own price, like Extra Shot or Oat Milk.
            </p>

            {formData.modifiers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {formData.modifiers.map(mod => (
                  <div
                    key={mod.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 6px 6px 12px",
                      background: "var(--cafe-bg)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 999,
                      fontSize: 13
                    }}
                  >
                    <span style={{ color: "var(--cafe-text-primary)" }}>
                      {mod.name}
                      {mod.priceDelta > 0 && <span style={{ color: "var(--cafe-text-secondary)" }}> +₹{mod.priceDelta.toFixed(2)}</span>}
                    </span>
                    <button
                      onClick={() => handleRemoveModifier(mod.id)}
                      aria-label={`Remove ${mod.name} modifier`}
                      title={`Remove ${mod.name}`}
                      style={{
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--cafe-danger-bg)",
                        border: "1px solid var(--cafe-danger-border)",
                        borderRadius: "50%",
                        fontSize: 12,
                        lineHeight: 1,
                        color: "var(--cafe-danger)",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={modifierDraft.name}
                onChange={(e) => setModifierDraft(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddModifier(); } }}
                placeholder="Modifier name (e.g. Extra Shot)"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
              <input
                type="number"
                value={modifierDraft.price}
                onChange={(e) => setModifierDraft(prev => ({ ...prev, price: e.target.value }))}
                onKeyDown={(e) => {
                  if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault();
                  if (e.key === 'Enter') { e.preventDefault(); handleAddModifier(); }
                }}
                placeholder="+₹"
                min="0"
                step="0.01"
                style={{
                  width: 90,
                  padding: "10px 12px",
                  fontSize: 13,
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 8,
                  background: "var(--cafe-bg)",
                  color: "var(--cafe-text-primary)",
                  outline: "none"
                }}
              />
              <button
                type="button"
                onClick={handleAddModifier}
                disabled={!modifierDraft.name.trim()}
                style={{
                  padding: "10px 16px",
                  background: modifierDraft.name.trim() ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                  border: "1px solid var(--cafe-accent)",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--cafe-accent)",
                  cursor: modifierDraft.name.trim() ? "pointer" : "not-allowed",
                  opacity: modifierDraft.name.trim() ? 1 : 0.5
                }}
              >
                + Add
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                style={{ width: 20, height: 20 }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-primary)" }}>
                Available immediately
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setFormData(getDefaultFormData());
                setModifierDraft({ name: '', price: '' });
              }}
              style={{
                padding: "12px 24px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
