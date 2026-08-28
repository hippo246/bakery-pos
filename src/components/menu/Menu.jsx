import React, { useState, useMemo, useEffect } from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import { SkeletonCard, InlineLoader } from '../common/LoadingSkeleton';

function InventoryContent({ inventory = [], setInventory, darkMode = true }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const screenSize = useScreenSize();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ingredients',
    quantity: '',
    unit: 'pieces',
    minStock: '',
    cost: ''
  });

  // Sync menu items to localStorage for QR ordering
  useEffect(() => {
    try {
      localStorage.setItem('bakery_menu', JSON.stringify(inventory));
    } catch (error) {
      console.error('Error saving menu to localStorage:', error);
    }
  }, [inventory]);

  const categories = ['ALL', ...new Set(inventory.map(item => item.category))];

  const filteredItems = useMemo(() => {
    let filtered = inventory;
    
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [inventory, categoryFilter, search]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({ name: '', category: 'Ingredients', quantity: '', unit: 'pieces', minStock: '', cost: '' });
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Ingredients',
      quantity: item.quantity || '',
      unit: item.unit || 'pieces',
      minStock: item.minStock || '',
      cost: item.cost || ''
    });
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!formData.name.trim()) return;

    const quantity = parseFloat(formData.quantity) || 0;
    const minStock = parseFloat(formData.minStock) || 0;
    const cost = parseFloat(formData.cost) || 0;

    if (selectedItem) {
      setInventory(inventory.map(item => 
        item.id === selectedItem.id 
          ? { 
              ...item, 
              ...formData, 
              quantity,
              minStock,
              cost,
              updatedAt: new Date().toISOString() 
            }
          : item
      ));
    } else {
      const newItem = {
        id: `inv${Date.now()}`,
        ...formData,
        quantity,
        minStock,
        cost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setInventory([...inventory, newItem]);
    }
    setShowModal(false);
  };

  const handleDeleteItem = (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      setInventory(inventory.filter(item => item.id !== itemToDelete));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleAdjustStock = (item, adjustment) => {
    const newQuantity = Math.max(0, (item.quantity || 0) + adjustment);
    setInventory(inventory.map(i => 
      i.id === item.id 
        ? { ...i, quantity: newQuantity, updatedAt: new Date().toISOString() }
        : i
    ));
  };

  const lowStockCount = inventory.filter(item => item.quantity <= item.minStock).length;
  const totalValue = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);

  return (
    <>
      {/* Controls */}
      <div style={{
        background: darkMode ? '#252538' : '#ffffff',
        borderRadius: '16px',
        padding: screenSize === 'small' ? '12px' : '16px',
        marginBottom: screenSize === 'small' ? '16px' : '20px',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
        boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          gap: screenSize === 'small' ? '8px' : '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: screenSize === 'small' ? '200px' : '300px',
              padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              outline: 'none',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={handleAddItem}
            style={{
              padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
              background: darkMode ? '#111827' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: darkMode ? '0 2px 4px rgba(17, 24, 39, 0.2)' : '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = darkMode ? '#1f2937' : '#2563eb';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = darkMode ? '#111827' : '#3b82f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ➕ Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : screenSize === 'medium' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: screenSize === 'small' ? '12px' : '16px',
        marginBottom: screenSize === 'small' ? '16px' : '20px'
      }}>
        <div style={{
          background: darkMode ? '#252538' : '#ffffff',
          borderRadius: '16px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>
          <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            📦 Total Items
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>{inventory.length}</div>
        </div>
        <div style={{
          background: darkMode ? '#252538' : '#ffffff',
          borderRadius: '16px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>
          <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            ⚠️ Low Stock
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#f59e0b' }}>{lowStockCount}</div>
        </div>
        <div style={{
          background: darkMode ? '#252538' : '#ffffff',
          borderRadius: '16px',
          padding: screenSize === 'small' ? '16px' : '20px',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>
          <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            💰 Total Value
          </div>
          <div style={{ fontSize: screenSize === 'small' ? '28px' : '36px', fontWeight: '700', color: '#10b981' }}>₹{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: darkMode ? '#252538' : '#ffffff',
        borderRadius: '16px',
        padding: screenSize === 'small' ? '16px' : '20px',
        border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
        boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'auto'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: darkMode ? '#8b8b9e' : '#9ca3af' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '8px' }}>
              {search || categoryFilter !== 'ALL' ? 'No items found' : 'No inventory items yet'}
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#64748b' }}>
              {search || categoryFilter !== 'ALL' ? 'Try a different search or filter' : 'Add your first item to get started'}
            </div>
          </div>
        ) : (
          filteredItems.map(item => {
            const isLowStock = item.quantity <= item.minStock;
            const itemValue = (item.quantity || 0) * (item.cost || 0);
            
            return (
              <div
                key={item.id}
                style={{
                  background: darkMode ? '#1a1a2e' : '#f9fafb',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: screenSize === 'small' ? '12px' : '16px',
                  marginBottom: screenSize === 'small' ? '10px' : '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: screenSize === 'small' ? 'flex-start' : 'center',
                  flexDirection: screenSize === 'small' ? 'column' : 'row',
                  gap: screenSize === 'small' ? '12px' : '0',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ flex: 1, width: screenSize === 'small' ? '100%' : 'auto' }}>
                  <div style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '8px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '6px' }}>
                    📂 {item.category}
                  </div>
                  <div style={{ 
                    fontSize: screenSize === 'small' ? '12px' : '13px', 
                    color: isLowStock ? '#f59e0b' : '#10b981', 
                    fontWeight: '600',
                    display: 'inline-block',
                    padding: screenSize === 'small' ? '4px 8px' : '6px 12px',
                    borderRadius: '12px',
                    background: isLowStock ? '#fef3c7' : '#f0fdf4',
                    marginBottom: '6px'
                  }}>
                    {isLowStock ? '⚠️ ' : '✅ '} Qty: {item.quantity} {item.unit} • Min: {item.minStock} {item.unit}
                  </div>
                  <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b' }}>
                    💰 Value: ₹{itemValue.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: screenSize === 'small' ? '6px' : '8px', flexWrap: 'wrap', width: screenSize === 'small' ? '100%' : 'auto' }}>
                  <button
                    onClick={() => handleAdjustStock(item, -1)}
                    style={{
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: darkMode ? '#2d2d44' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = darkMode ? '#2d2d44' : '#ffffff';
                    }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleAdjustStock(item, 1)}
                    style={{
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: darkMode ? '#2d2d44' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = darkMode ? '#2d2d44' : '#ffffff';
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleEditItem(item)}
                    style={{
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                      background: darkMode ? '#2d2d44' : '#ffffff',
                      color: '#ef4444',
                      border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
                      borderRadius: '8px',
                      fontSize: screenSize === 'small' ? '12px' : '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = darkMode ? '#dc2626' : '#fef2f2';
                      e.target.style.color = darkMode ? '#ffffff' : '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = darkMode ? '#2d2d44' : '#ffffff';
                      e.target.style.color = '#ef4444';
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: screenSize === 'small' ? '0' : '16px'
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: screenSize === 'small' ? '0' : '20px',
            padding: screenSize === 'small' ? '20px' : '32px',
            width: '500px',
            maxWidth: screenSize === 'small' ? '100vw' : '90vw',
            maxHeight: screenSize === 'small' ? '100vh' : '90vh',
            overflow: 'auto',
            border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: screenSize === 'small' ? '16px' : '24px' }}>
              <h3 style={{ fontSize: screenSize === 'small' ? '20px' : '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', margin: 0 }}>
                {selectedItem ? '✏️ Edit Item' : '➕ Add Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 12px',
                  background: darkMode ? '#1a1a2e' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#111827',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: screenSize === 'small' ? '18px' : '16px',
                  transition: 'all 0.2s ease',
                  minHeight: screenSize === 'small' ? '44px' : 'auto'
                }}
                onMouseEnter={(e) => e.target.style.background = darkMode ? '#2d2d48' : '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = darkMode ? '#1a1a2e' : '#f3f4f6'}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'small' ? '12px' : '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  📦 Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: screenSize === 'small' ? '14px' : '12px',
                    background: darkMode ? '#1a1a2e' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#111827',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    borderRadius: '10px',
                    fontSize: screenSize === 'small' ? '16px' : '14px',
                    outline: 'none',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                  placeholder="Enter item name..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                  📂 Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: screenSize === 'small' ? '14px' : '12px',
                    background: darkMode ? '#1a1a2e' : '#ffffff',
                    color: darkMode ? '#ffffff' : '#111827',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    borderRadius: '10px',
                    fontSize: screenSize === 'small' ? '16px' : '14px',
                    outline: 'none',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                >
                  <option value="Ingredients">Ingredients</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                    🔢 Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                    placeholder="0"
                  />
                </div>
                <div style={{ width: screenSize === 'small' ? '100%' : '120px' }}>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>
                    📏 Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                  >
                    <option value="pieces">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liters">L</option>
                    <option value="boxes">box</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                    ⚠️ Min Stock
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                    placeholder="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                    💰 Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', marginTop: screenSize === 'small' ? '16px' : '24px', justifyContent: 'flex-end', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: screenSize === 'small' ? '14px' : '12px 24px',
                  background: darkMode ? '#2d2d44' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#111827',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '10px',
                  fontSize: screenSize === 'small' ? '15px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: screenSize === 'small' ? '100%' : 'auto',
                  minHeight: screenSize === 'small' ? '48px' : 'auto'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                style={{
                  padding: screenSize === 'small' ? '14px' : '12px 24px',
                  background: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: screenSize === 'small' ? '15px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)',
                  width: screenSize === 'small' ? '100%' : 'auto',
                  minHeight: screenSize === 'small' ? '48px' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1f2937';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#111827';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginBottom: '12px', margin: 0 }}>
              🗑️ Delete Item
            </h3>
            <p style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '24px' }}>
              Are you sure you want to delete this inventory item?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                style={{
                  padding: '12px 24px',
                  background: darkMode ? '#2d2d44' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#111827',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = darkMode ? '#2d2d44' : '#f3f4f6';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '20px',
            padding: '32px',
            width: '400px',
            maxWidth: '90vw',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginBottom: '12px', margin: 0 }}>
              ℹ️ Notice
            </h3>
            <p style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '24px' }}>
              {alertMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAlert(false)}
                style={{
                  padding: '12px 24px',
                  background: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1f2937';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#111827';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SimpleMenu({ menuItems = [], setMenuItems, inventory = [], setInventory, onNavigate, darkMode = true }) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'stock'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(true);
  const screenSize = useScreenSize();
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customDietary, setCustomDietary] = useState('');
  const [showCustomDietary, setShowCustomDietary] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    category: 'Coffee',
    description: '',
    emoji: '☕',
    image: '',
    code: '',
    hsnCode: '',
    allergens: '',
    dietary: 'veg' // 'veg', 'non-veg', 'vegan', 'gf'
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Sync menu items to localStorage for QR ordering
  useEffect(() => {
    try {
      localStorage.setItem('bakery_menu', JSON.stringify(menuItems));
    } catch (error) {
      console.error('Error saving menu to localStorage:', error);
    }
  }, [menuItems]);

  const categories = ['ALL', 'Breads', 'Pastries', 'Cakes', 'Coffee', 'Beverages', 'Savory'];

  const categoryCounts = useMemo(() => {
    const counts = { ALL: menuItems.length };
    categories.forEach(cat => {
      if (cat !== 'ALL') {
        counts[cat] = menuItems.filter(item => item.category === cat).length;
      }
    });
    return counts;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];
    
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.allergens?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'margin') {
        const marginA = a.price > 0 ? (((a.price - (a.cost || 0)) / a.price) * 100) : 0;
        const marginB = b.price > 0 ? (((b.price - (b.cost || 0)) / b.price) * 100) : 0;
        return marginB - marginA;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return filtered;
  }, [menuItems, categoryFilter, search, sortBy]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      price: '',
      cost: '',
      category: 'Coffee',
      description: '',
      emoji: '☕',
      image: '',
      code: '',
      hsnCode: '',
      allergens: '',
      dietary: 'veg'
    });
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      price: item.price || '',
      cost: item.cost || '',
      category: item.category || 'Coffee',
      description: item.description || '',
      emoji: item.emoji || '☕',
      image: item.image || '',
      code: item.code || '',
      hsnCode: item.hsnCode || '',
      allergens: item.allergens || '',
      dietary: item.dietary || 'veg'
    });
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!formData.name.trim() || !formData.price) return;

    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost) || 0;
    if (isNaN(price) || price < 0) return;

    if (selectedItem) {
      setMenuItems(menuItems.map(item => 
        item.id === selectedItem.id 
          ? { 
              ...item, 
              ...formData, 
              price,
              cost,
              updatedAt: new Date().toISOString() 
            }
          : item
      ));
    } else {
      const newItem = {
        id: `m${Date.now()}`,
        ...formData,
        price,
        cost,
        active: true,
        eightySixed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setMenuItems([...menuItems, newItem]);
    }
    setShowModal(false);
  };

  const handleDeleteItem = (itemId) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(menuItems.filter(item => item.id !== itemId));
    }
  };

  const handleToggleActive = (item) => {
    setMenuItems(menuItems.map(i => 
      i.id === item.id 
        ? { ...i, active: !i.active, updatedAt: new Date().toISOString() }
        : i
    ));
  };

  const handleToggle86 = (item) => {
    setMenuItems(menuItems.map(i => 
      i.id === item.id 
        ? { ...i, eightySixed: !i.eightySixed, updatedAt: new Date().toISOString() }
        : i
    ));
  };

  const handleBulkAction = (action) => {
    if (action === 'enable-all') {
      setMenuItems(menuItems.map(i => ({ ...i, active: true, eightySixed: false })));
    } else if (action === 'disable-all') {
      setMenuItems(menuItems.map(i => ({ ...i, active: false })));
    } else if (action === '86-all-category' && categoryFilter !== 'ALL') {
      setMenuItems(menuItems.map(i => i.category === categoryFilter ? { ...i, eightySixed: true } : i));
    }
  };

  const activeItemsCount = menuItems.filter(i => i.active && !i.eightySixed).length;
  const outOfStockCount = menuItems.filter(i => i.eightySixed).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#1a1a2e' : '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Sub-tabs */}
      <div style={{
        background: darkMode ? '#1f1f35' : '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        gap: '12px',
        borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
      }}>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            padding: '10px 24px',
            background: activeTab === 'menu' ? '#6366f1' : (darkMode ? '#2d2d44' : '#e5e7eb'),
            color: activeTab === 'menu' ? '#ffffff' : (darkMode ? '#ffffff' : '#111827'),
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📖 Menu Designer
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '10px 24px',
            background: activeTab === 'stock' ? '#6366f1' : (darkMode ? '#2d2d44' : '#e5e7eb'),
            color: activeTab === 'stock' ? '#ffffff' : (darkMode ? '#ffffff' : '#111827'),
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📦 Raw Ingredients & Stock
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
        {isLoading ? (
          <SkeletonCard count={6} />
        ) : activeTab === 'menu' ? (
          <>
            {/* Top Bar Filters & Search */}
            <div style={{
              background: darkMode ? '#252538' : '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search by name, description, allergens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '250px',
                    padding: '12px 16px',
                    background: darkMode ? '#1a1a2e' : '#ffffff',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#ffffff' : '#111827',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    background: darkMode ? '#1a1a2e' : '#ffffff',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#ffffff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="price-low">Sort: Price (Low to High)</option>
                  <option value="price-high">Sort: Price (High to Low)</option>
                  <option value="margin">Sort: Profit Margin %</option>
                </select>

                <button
                  onClick={handleAddItem}
                  style={{
                    padding: '12px 24px',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  ➕ Create Item
                </button>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '8px 16px',
                      background: categoryFilter === cat ? '#6366f1' : (darkMode ? '#1a1a2e' : '#f3f4f6'),
                      color: categoryFilter === cat ? '#ffffff' : (darkMode ? '#ffffff' : '#111827'),
                      border: `1px solid ${categoryFilter === cat ? '#6366f1' : (darkMode ? '#2d2d44' : '#e5e7eb')}`,
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bulk Actions Panel */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#64748b', fontWeight: '500' }}>⚡ Bulk Actions:</span>
                <button
                  onClick={() => handleBulkAction('enable-all')}
                  style={{ padding: '6px 12px', background: darkMode ? '#2d2d44' : '#e5e7eb', color: darkMode ? '#ffffff' : '#111827', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Enable All
                </button>
                <button
                  onClick={() => handleBulkAction('disable-all')}
                  style={{ padding: '6px 12px', background: darkMode ? '#2d2d44' : '#e5e7eb', color: darkMode ? '#ffffff' : '#111827', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Deactivate All
                </button>
                {categoryFilter !== 'ALL' && (
                  <button
                    onClick={() => handleBulkAction('86-all-category')}
                    style={{ padding: '6px 12px', background: '#f43f5e', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Mark 86 in "{categoryFilter}"
                  </button>
                )}
              </div>
            </div>

            {/* Menu Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ background: darkMode ? '#252538' : '#ffffff', borderRadius: '12px', padding: '16px 20px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px' }}>Total Items</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827' }}>{menuItems.length}</div>
              </div>
              <div style={{ background: darkMode ? '#252538' : '#ffffff', borderRadius: '12px', padding: '16px 20px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px' }}>Active & Live</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{activeItemsCount}</div>
              </div>
              <div style={{ background: darkMode ? '#252538' : '#ffffff', borderRadius: '12px', padding: '16px 20px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px' }}>Sold Out / 86'ed</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{outOfStockCount}</div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {filteredItems.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: darkMode ? '#8b8b9e' : '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: darkMode ? '#ffffff' : '#111827' }}>No matching items found</div>
                </div>
              ) : (
                filteredItems.map(item => {
                  const isEightySixed = item.eightySixed;
                  const profit = (item.price || 0) - (item.cost || 0);
                  const marginPct = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;
                  
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: darkMode ? '#252538' : '#ffffff',
                        borderRadius: '16px',
                        border: `1px solid ${isEightySixed ? '#f43f5e' : (darkMode ? '#2d2d44' : '#e5e7eb')}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        opacity: item.active ? 1 : 0.5,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      {/* Dietary Tag Badge */}
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        {item.dietary === 'veg' && <span style={{ background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>VEG</span>}
                        {item.dietary === 'non-veg' && <span style={{ background: '#b91c1c', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>NON-VEG</span>}
                        {item.dietary === 'vegan' && <span style={{ background: '#2563eb', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>VEGAN</span>}
                        {item.dietary === 'gf' && <span style={{ background: '#d97706', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>GF</span>}
                      </div>

                      <div>
                        {/* Header Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span style={{ fontSize: '32px', display: item.image ? 'none' : 'block' }}>{item.emoji || '🧁'}</span>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', margin: 0 }}>{item.name}</h4>
                            <span style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b' }}>{item.category}</span>
                          </div>
                        </div>

                        <p style={{ fontSize: '13px', color: darkMode ? '#b2b2c5' : '#64748b', margin: '8px 0', minHeight: '36px' }}>
                          {item.description || 'No description added.'}
                        </p>

                        {/* Price Cost Breakdown */}
                        <div style={{
                          background: darkMode ? '#1a1a2e' : '#f8f9fa',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          margin: '12px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px'
                        }}>
                          <div>
                            <span style={{ color: darkMode ? '#8b8b9e' : '#64748b' }}>Price:</span>
                            <span style={{ color: darkMode ? '#ffffff' : '#111827', fontWeight: '700', marginLeft: '4px' }}>₹{item.price}</span>
                          </div>
                          <div>
                            <span style={{ color: darkMode ? '#8b8b9e' : '#64748b' }}>Cost:</span>
                            <span style={{ color: darkMode ? '#ffffff' : '#111827', marginLeft: '4px' }}>₹{item.cost || 0}</span>
                          </div>
                          <div>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>{marginPct}% Margin</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Operations */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          onClick={() => handleToggle86(item)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: isEightySixed ? '#f43f5e' : (darkMode ? '#2d2d44' : '#e5e7eb'),
                            color: isEightySixed ? '#ffffff' : (darkMode ? '#ffffff' : '#111827'),
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {isEightySixed ? '🔴 86ed' : '🟢 In Stock'}
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          style={{
                            padding: '8px 12px',
                            background: '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <InventoryContent inventory={inventory} setInventory={setInventory} darkMode={darkMode} />
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '450px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginTop: 0, marginBottom: '20px' }}>
              {selectedItem ? 'Edit Menu Item' : 'Create Menu Item'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>📷 Item Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827', fontSize: '13px' }}
                />
                <div style={{ fontSize: '11px', color: darkMode ? '#6b7280' : '#9ca3af', marginTop: '4px' }}>Leave empty to use emoji instead</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '70px' }}>
                  <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827', textAlign: 'center' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Category</label>
                {showCustomCategory ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category..."
                      autoFocus
                      style={{ flex: 1, padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCategory.trim()) {
                          setFormData({ ...formData, category: customCategory.trim() });
                        }
                        setShowCustomCategory(false);
                      }}
                      style={{ padding: '10px 16px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCategory(false);
                        setCustomCategory('');
                      }}
                      style={{ padding: '10px 16px', background: darkMode ? '#1a1a2e' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setShowCustomCategory(true);
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                  >
                    <option value="Breads">Breads</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Savory">Savory</option>
                    <option value="__custom__">+ Custom Category</option>
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Dietary Tag</label>
                {showCustomDietary ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customDietary}
                      onChange={(e) => setCustomDietary(e.target.value)}
                      placeholder="Enter custom dietary tag..."
                      autoFocus
                      style={{ flex: 1, padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customDietary.trim()) {
                          setFormData({ ...formData, dietary: customDietary.trim() });
                        }
                        setShowCustomDietary(false);
                      }}
                      style={{ padding: '10px 16px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomDietary(false);
                        setCustomDietary('');
                      }}
                      style={{ padding: '10px 16px', background: darkMode ? '#1a1a2e' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.dietary}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setShowCustomDietary(true);
                      } else {
                        setFormData({ ...formData, dietary: e.target.value });
                      }
                    }}
                    style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827' }}
                  >
                    <option value="veg">Vegetarian (Veg)</option>
                    <option value="non-veg">Non-Vegetarian (Non-Veg)</option>
                    <option value="vegan">Vegan</option>
                    <option value="gf">Gluten Free (GF)</option>
                    <option value="__custom__">+ Custom Tag</option>
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', color: darkMode ? '#8b8b9e' : '#64748b', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '6px', color: darkMode ? '#ffffff' : '#111827', resize: 'none', height: '60px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', background: darkMode ? '#2d2d44' : '#e5e7eb', color: darkMode ? '#ffffff' : '#111827', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                style={{ padding: '10px 20px', background: '#6366f1', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

