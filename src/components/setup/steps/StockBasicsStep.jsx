import React from 'react';
// Stock Basics Step for Setup Wizard
// Full inventory management with categories, items, and stock tracking

import { useState, useCallback, useMemo } from "react";

const STOCK_CATEGORIES = [
  { id: 'beverages', name: 'Beverages', icon: '🥤' },
  { id: 'food', name: 'Food Items', icon: '🍔' },
  { id: 'ingredients', name: 'Ingredients', icon: '🧂' },
  { id: 'supplies', name: 'Supplies', icon: '📦' },
  { id: 'equipment', name: 'Equipment', icon: '🔧' }
];

const emptyFormData = () => ({
  name: '',
  category: 'beverages',
  sku: '',
  quantity: 0,
  minStock: 5,
  unit: 'pcs',
  costPrice: '',
  supplier: '',
  location: '',
  description: ''
});

export default function StockBasicsStep({ settings, onNext, onBack, onSkip, stepIndex, totalSteps, isMobile, isTablet, isLoading, error, setError }) {
  const [stockItems, setStockItems] = useState(settings?.stockItems || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  const [formData, setFormData] = useState(emptyFormData);

  const handleAddItem = useCallback(() => {
    if (isLoading) return;
    setError(null);
    if (!formData.name || formData.name.trim() === '') {
      setError({ title: 'Error', message: 'Item name is required' });
      return;
    }
    if (formData.quantity < 0) {
      setError({ title: 'Error', message: 'Quantity cannot be negative' });
      return;
    }
    if (formData.minStock < 0) {
      setError({ title: 'Error', message: 'Min stock alert cannot be negative' });
      return;
    }
    if (formData.costPrice && (isNaN(parseFloat(formData.costPrice)) || parseFloat(formData.costPrice) < 0)) {
      setError({ title: 'Error', message: 'Cost price must be a valid positive number' });
      return;
    }

    const trimmedSku = formData.sku.trim();
    if (trimmedSku) {
      const isDuplicateSku = stockItems.some(item => {
        if (editingItem && item.id === editingItem.id) return false;
        return item.sku && item.sku.trim().toLowerCase() === trimmedSku.toLowerCase();
      });
      if (isDuplicateSku) {
        setError({ title: 'Error', message: 'An item with this SKU already exists' });
        return;
      }
    }

    const newItem = {
      id: editingItem?.id || (crypto.randomUUID ? crypto.randomUUID() : `stock-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      name: formData.name.trim(),
      category: formData.category,
      sku: trimmedSku,
      quantity: parseInt(formData.quantity) || 0,
      minStock: parseInt(formData.minStock) || 5,
      unit: formData.unit,
      costPrice: formData.costPrice && !isNaN(parseFloat(formData.costPrice)) ? parseFloat(formData.costPrice) : 0,
      supplier: formData.supplier.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
      createdAt: editingItem?.createdAt || new Date().toISOString()
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = stockItems.map(item => item.id === editingItem.id ? newItem : item);
    } else {
      updatedItems = [...stockItems, newItem];
    }

    setStockItems(updatedItems);
    setFormData(emptyFormData());
    setShowAddForm(false);
    setEditingItem(null);
  }, [formData, stockItems, editingItem, setError, isLoading]);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku || '',
      quantity: item.quantity,
      minStock: item.minStock,
      unit: item.unit,
      costPrice: item.costPrice?.toString() || '',
      supplier: item.supplier || '',
      location: item.location || '',
      description: item.description || ''
    });
    setShowMoreDetails(Boolean(item.sku || item.costPrice || item.supplier || item.location || item.description));
    setShowAddForm(true);
  }, []);

  const handleDeleteItem = useCallback((itemId) => {
    setStockItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleStockUpdate = useCallback((itemId, delta) => {
    setStockItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ));
  }, []);

  const categoryById = useMemo(() => {
    const map = {};
    STOCK_CATEGORIES.forEach(cat => { map[cat.id] = cat; });
    return map;
  }, []);

  const lowStockCount = useMemo(
    () => stockItems.filter(item => item.quantity <= item.minStock).length,
    [stockItems]
  );

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      stockItems
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
    }
    onNext({ stockItems });
  }, [stockItems, settings, onNext]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <style>{`
        .stock-field {
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .stock-field:hover {
          border-color: var(--cafe-text-tertiary) !important;
        }
        .stock-field:focus {
          border-color: var(--cafe-accent) !important;
          box-shadow: 0 0 0 3px var(--cafe-accent-bg);
        }
        .stock-toggle-details:hover {
          color: var(--cafe-text-primary) !important;
        }
      `}</style>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Stock Management
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Add inventory items, track stock levels, and set reorder thresholds.
        </p>
      </div>

      {error && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          marginBottom: 20,
          background: "var(--cafe-danger-bg)",
          border: "1px solid var(--cafe-danger-border)",
          borderRadius: 10
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-danger)" }}>
              {error.title || 'Error'}
            </div>
            {error.message && (
              <div style={{ fontSize: 13, color: "var(--cafe-danger)", marginTop: 2 }}>
                {error.message}
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            style={{
              background: "none",
              border: "none",
              color: "var(--cafe-danger)",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Stock Items List */}
      <div style={{
        background: "var(--cafe-bg-surface)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>📦</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              Inventory Items ({stockItems.length})
            </h4>
            {lowStockCount > 0 && (
              <span style={{
                padding: "3px 10px",
                background: "#f59e0b20",
                border: "1px solid #f59e0b40",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: "#f59e0b"
              }}>
                {lowStockCount} low stock
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData(emptyFormData());
              setShowMoreDetails(false);
              setShowAddForm(true);
            }}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              background: "var(--cafe-accent)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            + Add Item
          </button>
        </div>

        {stockItems.length === 0 ? (
          <div style={{
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--cafe-text-tertiary)",
            background: "var(--cafe-bg)",
            borderRadius: 12,
            border: "1px dashed var(--cafe-border)"
          }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>📦</span>
            <p style={{ fontSize: 14, margin: 0 }}>
              No inventory items yet. Click "Add Item" to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {stockItems.map(item => {
              const category = categoryById[item.category];
              const isLowStock = item.quantity <= item.minStock;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "16px",
                    background: isLowStock ? "#fef3c7" : "var(--cafe-bg)",
                    border: isLowStock ? "1px solid #f59e0b" : "1px solid var(--cafe-border)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: "var(--cafe-accent-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24
                    }}>
                      {category?.icon || '📦'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {item.name}
                        {item.sku && <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginLeft: 8 }}>SKU: {item.sku}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                        {category?.name || item.category} • {item.quantity} {item.unit}
                      </div>
                      {item.supplier && (
                        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4 }}>
                          Supplier: {item.supplier}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleStockUpdate(item.id, -1)}
                      disabled={isLoading || item.quantity <= 0}
                      aria-label={`Decrease ${item.name} quantity`}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 6,
                        fontSize: 16,
                        color: "var(--cafe-text-primary)",
                        cursor: (isLoading || item.quantity <= 0) ? "not-allowed" : "pointer",
                        opacity: (isLoading || item.quantity <= 0) ? 0.5 : 1
                      }}
                    >
                      -
                    </button>
                    <div style={{
                      padding: "8px 16px",
                      background: isLowStock ? "#f59e0b20" : "var(--cafe-info-bg)",
                      border: isLowStock ? "1px solid #f59e0b40" : "1px solid var(--cafe-info-border)",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: isLowStock ? "#f59e0b" : "var(--cafe-info)",
                      minWidth: 60,
                      textAlign: "center"
                    }}>
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => handleStockUpdate(item.id, 1)}
                      disabled={isLoading}
                      aria-label={`Increase ${item.name} quantity`}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 6,
                        fontSize: 16,
                        color: "var(--cafe-text-primary)",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      disabled={isLoading}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-info-bg)",
                        border: "1px solid var(--cafe-info-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--cafe-info)",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove "${item.name}" from inventory? This can't be undone.`)) {
                          handleDeleteItem(item.id);
                        }
                      }}
                      disabled={isLoading}
                      style={{
                        padding: "8px 12px",
                        background: "var(--cafe-danger-bg)",
                        border: "1px solid var(--cafe-danger-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--cafe-danger)",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.5 : 1
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
        <div style={{
          background: "var(--cafe-bg-surface)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>{editingItem ? '✏️' : '➕'}</span>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
              {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h4>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
              Item Name <span style={{ color: "var(--cafe-danger)" }}>*</span>
            </label>
            <input className="stock-field"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Coffee Beans"
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

          <div style={{ display: "grid", gridTemplateColumns: (isMobile || isTablet) ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16, minWidth: 0 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Category
              </label>
              <select className="stock-field"
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
                {STOCK_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Quantity <span style={{ color: "var(--cafe-danger)" }}>*</span>
              </label>
              <input className="stock-field"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))}
                min="0"
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

          <div style={{ display: "grid", gridTemplateColumns: (isMobile || isTablet) ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 20, minWidth: 0 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Min Stock Alert
              </label>
              <input className="stock-field"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))}
                min="0"
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
            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                Unit
              </label>
              <select className="stock-field"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
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
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="l">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="box">Boxes</option>
              </select>
            </div>
          </div>

          {!showMoreDetails && (
            <button
              type="button"
              className="stock-toggle-details"
              onClick={() => setShowMoreDetails(true)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--cafe-text-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              + Add SKU, cost price, supplier & more
            </button>
          )}

          {showMoreDetails && (
            <div style={{
              borderTop: "1px solid var(--cafe-border)",
              paddingTop: 20,
              marginBottom: 4
            }}>
              <div style={{ display: "grid", gridTemplateColumns: (isMobile || isTablet) ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16, minWidth: 0 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    SKU
                  </label>
                  <input className="stock-field"
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., COF-001"
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
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Cost Price (₹)
                  </label>
                  <input className="stock-field"
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
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

              <div style={{ display: "grid", gridTemplateColumns: (isMobile || isTablet) ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 16, minWidth: 0 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Supplier
                  </label>
                  <input className="stock-field"
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g., Coffee Co."
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
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    Storage Location
                  </label>
                  <input className="stock-field"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Shelf A1"
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

              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                  Description
                </label>
                <textarea className="stock-field"
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
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingItem(null);
                setFormData(emptyFormData());
                setShowMoreDetails(false);
              }}
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
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
