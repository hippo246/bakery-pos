import React, { useState, useEffect } from 'react';
import { getMultiStoreManager } from '../../services/multistore/MultiStoreManager.js';

export default function MultiStoreSettings({ settings, setSettings }) {
  const multiStoreManager = getMultiStoreManager();
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [selectedStoreForPricing, setSelectedStoreForPricing] = useState(null);
  const [screenSize, setScreenSize] = useState('large');

  // Form state
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    fssaiLicense: '',
    isActive: true
  });

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    fromStoreId: '',
    toStoreId: '',
    itemId: '',
    quantity: ''
  });

  // Pricing form state
  const [pricingForm, setPricingForm] = useState({
    itemId: '',
    price: ''
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('small');
      else if (width < 1200) setScreenSize('medium');
      else setScreenSize('large');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadStores();
    setCurrentStore(multiStoreManager.getCurrentStore());

    const removeListener = multiStoreManager.addListener((event, data) => {
      if (event === 'store_added' || event === 'store_updated' || event === 'store_deleted') {
        loadStores();
      }
      if (event === 'current_store_changed') {
        setCurrentStore(data);
      }
    });

    return () => removeListener();
  }, [multiStoreManager]);

  const loadStores = () => {
    setStores(multiStoreManager.getAllStores());
  };

  const handleAddStore = () => {
    setEditingStore(null);
    setStoreForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
      fssaiLicense: '',
      isActive: true
    });
    setShowStoreModal(true);
  };

  const handleEditStore = (store) => {
    setEditingStore(store);
    setStoreForm({
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email,
      gstin: store.gstin,
      fssaiLicense: store.fssaiLicense,
      isActive: store.isActive
    });
    setShowStoreModal(true);
  };

  const handleSaveStore = () => {
    if (!storeForm.name.trim()) {
      alert('Store name is required');
      return;
    }

    if (editingStore) {
      multiStoreManager.updateStore(editingStore.id, storeForm);
    } else {
      multiStoreManager.addStore(storeForm);
    }

    setShowStoreModal(false);
    loadStores();
  };

  const handleDeleteStore = (storeId) => {
    if (confirm('Are you sure you want to delete this store?')) {
      multiStoreManager.deleteStore(storeId);
      loadStores();
    }
  };

  const handleSetCurrentStore = (storeId) => {
    multiStoreManager.setCurrentStore(storeId);
    setCurrentStore(multiStoreManager.getStore(storeId));
  };

  const handleTransferStock = () => {
    if (!transferForm.fromStoreId || !transferForm.toStoreId) {
      alert('Please select both source and destination stores');
      return;
    }
    if (transferForm.fromStoreId === transferForm.toStoreId) {
      alert('Source and destination stores must be different');
      return;
    }
    if (!transferForm.itemId || !transferForm.quantity) {
      alert('Please select item and quantity');
      return;
    }

    try {
      multiStoreManager.transferStock(
        transferForm.fromStoreId,
        transferForm.toStoreId,
        { [transferForm.itemId]: parseInt(transferForm.quantity) }
      );
      alert('Stock transferred successfully');
      setShowTransferModal(false);
      setTransferForm({ fromStoreId: '', toStoreId: '', itemId: '', quantity: '' });
    } catch (error) {
      alert(`Transfer failed: ${error.message}`);
    }
  };

  const handleSetPricing = () => {
    if (!selectedStoreForPricing || !pricingForm.itemId || !pricingForm.price) {
      alert('Please fill all fields');
      return;
    }

    multiStoreManager.setItemPrice(
      selectedStoreForPricing.id,
      pricingForm.itemId,
      parseFloat(pricingForm.price)
    );
    alert('Price updated successfully');
    setShowPricingModal(false);
    setPricingForm({ itemId: '', price: '' });
  };

  const handleAssignStaff = (storeId, staffIds) => {
    multiStoreManager.assignStaffToStore(storeId, staffIds);
    loadStores();
  };

  const stats = multiStoreManager.getStoreStatistics();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
          🏪 Multi-Store Management
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Manage multiple store locations, inventory, pricing, and staff assignments
        </p>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Stores</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stats.totalStores}</div>
        </div>
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Active Stores</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{stats.activeStores}</div>
        </div>
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Inventory Items</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{stats.totalInventoryItems}</div>
        </div>
        <div style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Staff</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.totalStaff}</div>
        </div>
      </div>

      {/* Current Store Indicator */}
      {currentStore && (
        <div style={{
          background: '#dbeafe',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #93c5fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Current Store:</span>
            <span style={{ fontSize: '14px', color: '#1e40af', marginLeft: '8px', fontWeight: '700' }}>
              {currentStore.name}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#1e40af' }}>
            {currentStore.address}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleAddStore}
          style={{
            padding: '12px 24px',
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ➕ Add Store
        </button>
        <button
          onClick={() => setShowTransferModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Transfer Stock
        </button>
        <button
          onClick={() => setShowPricingModal(true)}
          style={{
            padding: '12px 24px',
            background: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          💰 Set Location Pricing
        </button>
      </div>

      {/* Stores List */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '16px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          Store Locations
        </div>
        {stores.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
            <div style={{ fontSize: '14px' }}>No stores added yet</div>
          </div>
        ) : (
          <div>
            {stores.map((store, index) => (
              <div
                key={store.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < stores.length - 1 ? '1px solid #f3f4f6' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: currentStore?.id === store.id ? '#f0fdf4' : 'transparent'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                      {store.name}
                    </span>
                    {store.isActive ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: '#10b981',
                        color: '#ffffff'
                      }}>
                        Active
                      </span>
                    ) : (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: '#9ca3af',
                        color: '#ffffff'
                      }}>
                        Inactive
                      </span>
                    )}
                    {currentStore?.id === store.id && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: '#6366f1',
                        color: '#ffffff'
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    {store.address}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Phone: {store.phone} | GSTIN: {store.gstin || 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSetCurrentStore(store.id)}
                    disabled={currentStore?.id === store.id}
                    style={{
                      padding: '6px 12px',
                      background: currentStore?.id === store.id ? '#9ca3af' : '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: currentStore?.id === store.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Set Current
                  </button>
                  <button
                    onClick={() => handleEditStore(store)}
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store Modal */}
      {showStoreModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
              {editingStore ? 'Edit Store' : 'Add New Store'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Store Name *
                </label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  placeholder="Enter store name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  placeholder="Enter address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Phone
                </label>
                <input
                  type="text"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={storeForm.email}
                  onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  placeholder="Enter email"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  GSTIN
                </label>
                <input
                  type="text"
                  value={storeForm.gstin}
                  onChange={(e) => setStoreForm({ ...storeForm, gstin: e.target.value })}
                  placeholder="Enter GSTIN"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  FSSAI License
                </label>
                <input
                  type="text"
                  value={storeForm.fssaiLicense}
                  onChange={(e) => setStoreForm({ ...storeForm, fssaiLicense: e.target.value })}
                  placeholder="Enter FSSAI license"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={storeForm.isActive}
                  onChange={(e) => setStoreForm({ ...storeForm, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label style={{ fontSize: '14px', color: '#1e293b' }}>Active Store</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowStoreModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStore}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {editingStore ? 'Update' : 'Add'} Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
              🔄 Transfer Stock Between Stores
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  From Store
                </label>
                <select
                  value={transferForm.fromStoreId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromStoreId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select source store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  To Store
                </label>
                <select
                  value={transferForm.toStoreId}
                  onChange={(e) => setTransferForm({ ...transferForm, toStoreId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select destination store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Item ID
                </label>
                <input
                  type="text"
                  value={transferForm.itemId}
                  onChange={(e) => setTransferForm({ ...transferForm, itemId: e.target.value })}
                  placeholder="Enter item ID"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTransferModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferStock}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Pricing Modal */}
      {showPricingModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
              💰 Set Location-Specific Pricing
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Store
                </label>
                <select
                  value={selectedStoreForPricing?.id || ''}
                  onChange={(e) => {
                    const store = stores.find(s => s.id === e.target.value);
                    setSelectedStoreForPricing(store);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Item ID
                </label>
                <input
                  type="text"
                  value={pricingForm.itemId}
                  onChange={(e) => setPricingForm({ ...pricingForm, itemId: e.target.value })}
                  placeholder="Enter item ID"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Price
                </label>
                <input
                  type="number"
                  value={pricingForm.price}
                  onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })}
                  placeholder="Enter price"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPricingModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetPricing}
                style={{
                  padding: '12px 24px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Set Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
