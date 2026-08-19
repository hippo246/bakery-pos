import React, { useState, useMemo, useEffect } from 'react';

export default function SimpleInventory({ inventory = [], setInventory, onNavigate }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ingredients',
    quantity: '',
    unit: 'pieces',
    minStock: '',
    cost: ''
  });

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: 'MS Sans Serif, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#c0c0c0',
        border: screenSize === 'small' ? '1px outset #ffffff' : '2px outset #ffffff',
        padding: screenSize === 'small' ? '8px' : '4px',
        marginBottom: screenSize === 'small' ? '12px' : '8px'
      }}>
        <div style={{
          background: '#000080',
          color: '#ffffff',
          padding: screenSize === 'small' ? '6px 12px' : '4px 8px',
          fontSize: screenSize === 'small' ? '11px' : '12px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '8px' : '0'
        }}>
          <span>INVENTORY MANAGEMENT</span>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              background: '#c0c0c0',
              border: screenSize === 'small' ? '1px outset #ffffff' : '2px outset #ffffff',
              color: '#000000',
              fontSize: screenSize === 'small' ? '10px' : '10px',
              fontWeight: 'bold',
              padding: screenSize === 'small' ? '4px 12px' : '2px 6px',
              cursor: 'pointer'
            }}
          >
            BACK
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '12px' : '8px', overflow: 'auto', flex: 1 }}>
        {/* Controls */}
        <div style={{
          background: '#c0c0c0',
          border: screenSize === 'small' ? '1px inset #808080' : '2px inset #808080',
          padding: screenSize === 'small' ? '12px' : '8px',
          marginBottom: screenSize === 'small' ? '12px' : '8px',
          display: 'flex',
          gap: screenSize === 'small' ? '8px' : '8px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: screenSize === 'small' ? '150px' : '200px',
              padding: screenSize === 'small' ? '6px 8px' : '4px',
              border: screenSize === 'small' ? '1px inset #808080' : '2px inset #808080',
              fontSize: screenSize === 'small' ? '11px' : '12px'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: screenSize === 'small' ? '6px 8px' : '4px',
              border: screenSize === 'small' ? '1px inset #808080' : '2px inset #808080',
              fontSize: screenSize === 'small' ? '11px' : '12px',
              background: '#ffffff',
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
              background: '#000080',
              color: '#ffffff',
              border: screenSize === 'small' ? '1px outset #ffffff' : '2px outset #ffffff',
              fontSize: screenSize === 'small' ? '11px' : '12px',
              fontWeight: 'bold',
              padding: screenSize === 'small' ? '6px 12px' : '4px 8px',
              cursor: 'pointer'
            }}
          >
            ADD ITEM
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '2px inset #808080',
            padding: '8px',
            flex: 1
          }}>
            <div style={{ fontSize: '10px', color: '#808080', marginBottom: '2px' }}>TOTAL ITEMS</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{inventory.length}</div>
          </div>
          <div style={{
            background: '#ffffff',
            border: '2px inset #808080',
            padding: '8px',
            flex: 1
          }}>
            <div style={{ fontSize: '10px', color: '#808080', marginBottom: '2px' }}>LOW STOCK</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: lowStockCount > 0 ? '#ff8c00' : '#008000' }}>{lowStockCount}</div>
          </div>
          <div style={{
            background: '#ffffff',
            border: '2px inset #808080',
            padding: '8px',
            flex: 1
          }}>
            <div style={{ fontSize: '10px', color: '#808080', marginBottom: '2px' }}>TOTAL VALUE</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>₹{totalValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Inventory Table */}
        <div style={{
          background: '#ffffff',
          border: '2px inset #808080',
          padding: '8px',
          overflow: 'auto'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#808080' }}>
              {search || categoryFilter !== 'ALL' ? 'No items found' : 'No inventory items yet. Add your first item!'}
            </div>
          ) : (
            filteredItems.map(item => {
              const isLowStock = item.quantity <= item.minStock;
              const itemValue = (item.quantity || 0) * (item.cost || 0);
              
              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #c0c0c0',
                    padding: '8px',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#808080', marginBottom: '2px' }}>
                      {item.category}
                    </div>
                    <div style={{ fontSize: '10px', color: isLowStock ? '#ff8c00' : '#008000', fontWeight: 'bold' }}>
                      Qty: {item.quantity} {item.unit} • Min: {item.minStock} {item.unit}
                    </div>
                    <div style={{ fontSize: '10px', color: '#808080' }}>
                      Value: ₹{itemValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleAdjustStock(item, -1)}
                      style={{
                        padding: '4px 8px',
                        background: '#c0c0c0',
                        border: '2px outset #ffffff',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustStock(item, 1)}
                      style={{
                        padding: '4px 8px',
                        background: '#c0c0c0',
                        border: '2px outset #ffffff',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      style={{
                        padding: '4px 8px',
                        background: '#c0c0c0',
                        border: '2px outset #ffffff',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#c0c0c0',
                        border: '2px outset #ffffff',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      DEL
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#c0c0c0',
            border: '2px outset #ffffff',
            padding: '4px',
            maxWidth: '450px',
            width: '90%'
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#000080',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedItem ? 'EDIT ITEM' : 'ADD ITEM'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#c0c0c0',
                  border: '2px outset #ffffff',
                  color: '#000000',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  minWidth: '16px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '12px', background: '#c0c0c0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '2px inset #808080',
                      fontSize: '12px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '2px inset #808080',
                      fontSize: '12px',
                      background: '#ffffff'
                    }}
                  >
                    {categories.filter(c => c !== 'ALL').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '2px inset #808080',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                      Unit *
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="pcs, kg, L"
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '2px inset #808080',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                      Min Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '2px inset #808080',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#000000', marginBottom: '4px' }}>
                      Cost per Unit (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: '2px inset #808080',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#c0c0c0',
                    border: '2px outset #ffffff',
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#c0c0c0',
                    border: '2px outset #ffffff',
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 'bold',
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

