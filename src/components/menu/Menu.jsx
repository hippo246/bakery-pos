import React, { useState, useMemo } from 'react';

function InventoryContent({ inventory = [], setInventory }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ingredients',
    quantity: '',
    unit: 'pieces',
    minStock: '',
    cost: ''
  });

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
    if (confirm('Are you sure you want to delete this inventory item?')) {
      setInventory(inventory.filter(item => item.id !== itemId));
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
        background: '#ffffff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <input
          type="text"
          placeholder="Search inventory items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            background: '#ffffff',
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
            padding: '12px 24px',
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
            Total Items
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{inventory.length}</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
            Low Stock
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{lowStockCount}</div>
        </div>
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
            Total Value
          </div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>₹{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        overflow: 'auto'
      }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              {search || categoryFilter !== 'ALL' ? 'No items found matching your search' : 'No inventory items yet. Add your first item!'}
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
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '6px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                    📂 {item.category}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: isLowStock ? '#d97706' : '#059669', 
                    fontWeight: '500',
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: isLowStock ? '#fef3c7' : '#f0fdf4',
                    marginBottom: '4px'
                  }}>
                    Qty: {item.quantity} {item.unit} • Min: {item.minStock} {item.unit}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    💰 Value: ₹{itemValue.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAdjustStock(item, -1)}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleAdjustStock(item, 1)}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleEditItem(item)}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
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
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedItem ? 'Edit Item' : 'Add Item'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Min Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Cost
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f9fafb',
                      color: '#111827',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#111827',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SimpleMenu({ menuItems = [], setMenuItems, inventory = [], setInventory, onNavigate }) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'stock'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Coffee',
    description: '',
    emoji: '☕',
    code: '',
    hsnCode: '',
    allergens: ''
  });

  const categories = ['ALL', 'Breads', 'Pastries', 'Cakes', 'Coffee', 'Beverages'];

  const filteredItems = useMemo(() => {
    let filtered = menuItems;
    
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
  }, [menuItems, categoryFilter, search]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({ name: '', price: '', category: 'Coffee', description: '', emoji: '☕', code: '', hsnCode: '', allergens: '' });
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category: item.category || 'Coffee',
      description: item.description || '',
      emoji: item.emoji || '☕',
      code: item.code || '',
      hsnCode: item.hsnCode || '',
      allergens: item.allergens || ''
    });
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!formData.name.trim() || !formData.price) return;

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) return;

    if (selectedItem) {
      setMenuItems(menuItems.map(item => 
        item.id === selectedItem.id 
          ? { 
              ...item, 
              ...formData, 
              price,
              updatedAt: new Date().toISOString() 
            }
          : item
      ));
    } else {
      const newItem = {
        id: `m${Date.now()}`,
        ...formData,
        price,
        code: formData.code || '',
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

  const activeItemsCount = menuItems.filter(i => i.active && !i.eightySixed).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Menu & Stock Management
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Manage your menu items and inventory
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        background: '#ffffff',
        padding: '8px',
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: activeTab === 'menu' ? '#111827' : '#ffffff',
            color: activeTab === 'menu' ? '#ffffff' : '#111827',
            border: activeTab === 'menu' ? 'none' : '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Menu
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            flex: 1,
            padding: '12px 24px',
            background: activeTab === 'stock' ? '#111827' : '#ffffff',
            color: activeTab === 'stock' ? '#ffffff' : '#111827',
            border: activeTab === 'stock' ? 'none' : '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Stock
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px 24px 24px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'menu' ? (
          <>
            {/* Controls */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#ffffff',
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
                    padding: '12px 24px',
                    background: '#111827',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                  Total Items
                </div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{menuItems.length}</div>
              </div>
              <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
                  Active Items
                </div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{activeItemsCount}</div>
              </div>
            </div>

            {/* Menu Grid */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              overflow: 'auto'
            }}>
              {filteredItems.length === 0 ? (
                <div style={{
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {search || categoryFilter !== 'ALL' ? 'No items found matching your search' : 'No menu items yet. Add your first item!'}
                  </div>
                </div>
              ) : (
                filteredItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => handleEditItem(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleActive={() => handleToggleActive(item)}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <InventoryContent inventory={inventory} setInventory={setInventory} />
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
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden'
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedItem ? 'Edit Item' : 'Add Item'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    {categories.filter(c => c !== 'ALL').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    maxLength={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Quick Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., A1, 101"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    HSN/SAC Code (GST Compliance)
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., 19059000"
                    maxLength={8}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    8-digit HSN/SAC code for GST invoicing
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Allergens (FSSAI Compliance)
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="e.g., Milk, Nuts, Gluten"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Comma-separated allergen information
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#111827',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {selectedItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, onEdit, onDelete, onToggleActive }) {
  const isActive = item.active && !item.eightySixed;
  
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity: isActive ? 1 : 0.6
    }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '6px' }}>
          {item.emoji || '🍽'} {item.name}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          📂 {item.category} • 🔖 Code: {item.code || 'N/A'}
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          ₹{(item.price || 0).toFixed(2)}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onToggleActive}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

