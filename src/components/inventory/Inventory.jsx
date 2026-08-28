import React, { useState, useMemo, useEffect } from 'react';
import SpeakButton from '../voice/SpeakButton';
import textToSpeechService from '../../services/voice/TextToSpeechService';
import useScreenSize from '../../hooks/useScreenSize';

export default function SimpleInventory({ inventory = [], setInventory, onNavigate, darkMode = true }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(false);
  const [showFefoSuggestions, setShowFefoSuggestions] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showWasteReport, setShowWasteReport] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showVendorList, setShowVendorList] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showPOList, setShowPOList] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editingPO, setEditingPO] = useState(null);
  const screenSize = useScreenSize();
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ingredients',
    quantity: '',
    unit: 'pieces',
    minStock: '',
    cost: '',
    expiryDate: '',
    batchNumber: ''
  });

  // Load waste records from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('waste_records');
      if (stored) {
        setWasteRecords(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading waste records:', error);
    }
  }, []);

  // Load vendors from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vendors');
      if (stored) {
        setVendors(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }, []);

  // Load purchase orders from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('purchase_orders');
      if (stored) {
        setPurchaseOrders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  }, []);

  // Offline mode: handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOperations();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending operations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pending_operations');
      if (stored) {
        setPendingOperations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }, []);

  const savePendingOperations = (ops) => {
    setPendingOperations(ops);
    localStorage.setItem('pending_operations', JSON.stringify(ops));
  };

  const syncPendingOperations = () => {
    if (pendingOperations.length === 0) return;
    
    // In a real app, this would sync with a backend
    console.log('Syncing pending operations:', pendingOperations);
    savePendingOperations([]);
  };

  const queueOperation = (operation) => {
    if (isOnline) {
      // Execute immediately if online
      return false;
    }
    // Queue for later sync if offline
    const newOps = [...pendingOperations, { ...operation, timestamp: new Date().toISOString() }];
    savePendingOperations(newOps);
    return true;
  };

  const saveWasteRecords = (records) => {
    setWasteRecords(records);
    localStorage.setItem('waste_records', JSON.stringify(records));
  };

  const saveVendors = (vendorList) => {
    setVendors(vendorList);
    localStorage.setItem('vendors', JSON.stringify(vendorList));
  };

  const savePurchaseOrders = (poList) => {
    setPurchaseOrders(poList);
    localStorage.setItem('purchase_orders', JSON.stringify(poList));
  };

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
    setFormData({ name: '', category: 'Ingredients', quantity: '', unit: 'pieces', minStock: '', cost: '', expiryDate: '', batchNumber: '' });
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
      cost: item.cost || '',
      expiryDate: item.expiryDate || '',
      batchNumber: item.batchNumber || ''
    });
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!formData.name.trim() || !formData.quantity) {
      alert('Please fill in required fields');
      return;
    }

    const itemData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      cost: parseFloat(formData.cost) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      updatedAt: new Date().toISOString()
    };

    if (selectedItem) {
      setInventory(inventory.map(item => 
        item.id === selectedItem.id ? { ...itemData, id: selectedItem.id } : item
      ));
    } else {
      setInventory([...inventory, { ...itemData, id: `item-${Date.now()}` }]);
    }

    // Queue operation if offline
    queueOperation({
      type: selectedItem ? 'update' : 'create',
      entity: 'inventory',
      data: itemData
    });

    setShowModal(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      setInventory(inventory.filter(item => item.id !== itemId));
      
      // Queue operation if offline
      queueOperation({
        type: 'delete',
        entity: 'inventory',
        data: { id: itemId }
      });
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

  // Expiry tracking functions
  const getExpiringItems = (daysThreshold = 7) => {
    const today = new Date();
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + daysThreshold);

    return inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threshold && expiryDate >= today;
    }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  };

  const getExpiredItems = () => {
    const today = new Date();
    return inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate < today;
    });
  };

  const getFefoSuggestions = () => {
    // FEFO: First-Expire-First-Out - suggest using items with earliest expiry first
    const itemsWithExpiry = inventory.filter(item => item.expiryDate && item.quantity > 0);
    return itemsWithExpiry.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  };

  const handleRemoveExpiredItems = () => {
    const expiredItems = getExpiredItems();
    if (expiredItems.length === 0) {
      alert('No expired items to remove');
      return;
    }

    if (window.confirm(`Remove ${expiredItems.length} expired items from inventory?`)) {
      const expiredIds = expiredItems.map(item => item.id);
      setInventory(inventory.filter(item => !expiredIds.includes(item.id)));
      alert(`Removed ${expiredItems.length} expired items`);
    }
  };

  const lowStockCount = inventory.filter(item => item.quantity <= item.minStock).length;
  const totalValue = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);
  const expiringSoonCount = getExpiringItems().length;
  const expiredCount = getExpiredItems().length;

  // Waste management functions
  const handleLogWaste = (itemId, quantity, reason, staffId) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const wasteRecord = {
      id: `waste-${Date.now()}`,
      itemId,
      itemName: item.name,
      quantity,
      unit: item.unit,
      cost: item.cost || 0,
      totalCost: quantity * (item.cost || 0),
      reason,
      staffId,
      timestamp: new Date().toISOString()
    };

    saveWasteRecords([...wasteRecords, wasteRecord]);

    // Reduce inventory
    const newQuantity = Math.max(0, item.quantity - quantity);
    setInventory(inventory.map(i => 
      i.id === itemId 
        ? { ...i, quantity: newQuantity, updatedAt: new Date().toISOString() }
        : i
    ));

    // Queue operation if offline
    queueOperation({
      type: 'create',
      entity: 'waste',
      data: wasteRecord
    });
  };

  const getWasteAnalytics = () => {
    const totalWasteCost = wasteRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const wasteByReason = {};
    const wasteByItem = {};
    const wasteByStaff = {};

    wasteRecords.forEach(record => {
      wasteByReason[record.reason] = (wasteByReason[record.reason] || 0) + record.totalCost;
      wasteByItem[record.itemName] = (wasteByItem[record.itemName] || 0) + record.totalCost;
      if (record.staffId) {
        wasteByStaff[record.staffId] = (wasteByStaff[record.staffId] || 0) + record.totalCost;
      }
    });

    return {
      totalWasteCost,
      totalWasteRecords: wasteRecords.length,
      wasteByReason,
      wasteByItem,
      wasteByStaff
    };
  };

  // Vendor management functions
  const handleAddVendor = () => {
    setEditingVendor(null);
    setShowVendorModal(true);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setShowVendorModal(true);
  };

  const handleSaveVendor = (vendorData) => {
    if (editingVendor) {
      saveVendors(vendors.map(v => v.id === editingVendor.id ? { ...vendorData, id: editingVendor.id } : v));
    } else {
      saveVendors([...vendors, { ...vendorData, id: `vendor-${Date.now()}`, rating: 0, totalOrders: 0 }]);
    }
    setShowVendorModal(false);
    setEditingVendor(null);

    // Queue operation if offline
    queueOperation({
      type: editingVendor ? 'update' : 'create',
      entity: 'vendor',
      data: vendorData
    });
  };

  const handleDeleteVendor = (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      saveVendors(vendors.filter(v => v.id !== vendorId));
      
      // Queue operation if offline
      queueOperation({
        type: 'delete',
        entity: 'vendor',
        data: { id: vendorId }
      });
    }
  };

  const handleRateVendor = (vendorId, rating) => {
    saveVendors(vendors.map(v => 
      v.id === vendorId 
        ? { ...v, rating, totalOrders: v.totalOrders + 1 }
        : v
    ));
  };

  // Purchase order management functions
  const handleAddPO = () => {
    setEditingPO(null);
    setShowPOModal(true);
  };

  const handleEditPO = (po) => {
    setEditingPO(po);
    setShowPOModal(true);
  };

  const handleSavePO = (poData) => {
    if (editingPO) {
      savePurchaseOrders(purchaseOrders.map(po => po.id === editingPO.id ? { ...poData, id: editingPO.id } : po));
    } else {
      savePurchaseOrders([...purchaseOrders, { ...poData, id: `po-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() }]);
    }
    setShowPOModal(false);
    setEditingPO(null);

    // Queue operation if offline
    queueOperation({
      type: editingPO ? 'update' : 'create',
      entity: 'purchaseOrder',
      data: poData
    });
  };

  const handleDeletePO = (poId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      savePurchaseOrders(purchaseOrders.filter(po => po.id !== poId));
      
      // Queue operation if offline
      queueOperation({
        type: 'delete',
        entity: 'purchaseOrder',
        data: { id: poId }
      });
    }
  };

  const handleApprovePO = (poId) => {
    savePurchaseOrders(purchaseOrders.map(po => 
      po.id === poId 
        ? { ...po, status: 'approved', approvedAt: new Date().toISOString() }
        : po
    ));

    // Queue operation if offline
    queueOperation({
      type: 'update',
      entity: 'purchaseOrder',
      data: { id: poId, status: 'approved' }
    });
  };

  const handleReceivePO = (poId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // Add items to inventory
    po.items.forEach(item => {
      const invItem = inventory.find(i => i.name === item.itemName);
      if (invItem) {
        const newQuantity = invItem.quantity + item.quantity;
        setInventory(inventory.map(i => 
          i.id === invItem.id 
            ? { ...i, quantity: newQuantity, updatedAt: new Date().toISOString() }
            : i
        ));
      }
    });

    // Update PO status
    savePurchaseOrders(purchaseOrders.map(po => 
      po.id === poId 
        ? { ...po, status: 'received', receivedAt: new Date().toISOString() }
        : po
    ));

    // Queue operation if offline
    queueOperation({
      type: 'update',
      entity: 'purchaseOrder',
      data: { id: poId, status: 'received' }
    });
  };

  // Advanced analytics functions
  const getInventoryAnalytics = () => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);
    const expiredItems = getExpiredItems();
    const expiringItems = getExpiringItems();
    
    const categoryBreakdown = {};
    inventory.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + ((item.quantity || 0) * (item.cost || 0));
    });

    const wasteCost = wasteRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const poTotal = purchaseOrders.reduce((sum, po) => sum + (po.totalCost || 0), 0);

    return {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
      expiringCount: expiringItems.length,
      categoryBreakdown,
      wasteCost,
      poTotal,
      wastePercentage: totalValue > 0 ? (wasteCost / totalValue) * 100 : 0
    };
  };

  // Theme colors
  const t = {
    bg:       darkMode ? '#1a1a2e' : '#f5f7fa',
    bgEle:    darkMode ? '#1f1f35' : '#ffffff',
    bgCard:   darkMode ? '#252538' : '#ffffff',
    bgInput:  darkMode ? '#1a1a2e' : '#f8fafc',
    border:   darkMode ? '#2d2d44' : '#d1d5db',
    text:     darkMode ? '#ffffff' : '#1f2937',
    textSub:  darkMode ? '#e0e0e0' : '#4b5563',
    textMute: darkMode ? '#8b8b9e' : '#6b7280',
    accent:   '#6366f1',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: t.bg,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: darkMode ? '#1f1f35' : '#ffffff',
        borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
        padding: screenSize === 'small' ? '16px 20px' : '20px 32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          gap: '12px',
          flexWrap: 'wrap',
          flexDirection: screenSize === 'small' ? 'column' : 'row'
        }}>
          <h2 style={{ margin: 0, fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: '#ffffff' }}>📦 Inventory Management</h2>
          <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '10px', alignItems: 'center', flexWrap: 'wrap', width: screenSize === 'small' ? '100%' : 'auto', justifyContent: screenSize === 'small' ? 'flex-end' : 'flex-start' }}>
            {!isOnline && (
              <div style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: screenSize === 'small' ? '4px 8px' : '4px 10px',
                fontSize: screenSize === 'small' ? '10px' : '11px',
                fontWeight: 'bold',
                borderRadius: '6px'
              }}>
                ⚡ OFFLINE
              </div>
            )}
            {pendingOperations.length > 0 && (
              <div style={{
                background: '#f59e0b',
                color: '#ffffff',
                padding: screenSize === 'small' ? '4px 8px' : '4px 10px',
                fontSize: screenSize === 'small' ? '10px' : '11px',
                fontWeight: 'bold',
                borderRadius: '6px'
              }}>
                {pendingOperations.length} PENDING SYNC
              </div>
            )}
            <SpeakButton
              onGenerateText={() => {
                const analytics = getInventoryAnalytics();
                return textToSpeechService.generateInventoryAlertSpeechText({
                  name: 'Inventory',
                  quantity: analytics.lowStockCount,
                  unit: 'items'
                });
              }}
              size={screenSize === 'small' ? 'small' : 'small'}
            />
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              style={{
                background: '#2d2d48',
                border: 'none',
                color: '#ffffff',
                fontSize: screenSize === 'small' ? '12px' : '13px',
                fontWeight: '600',
                padding: screenSize === 'small' ? '8px 12px' : '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                minHeight: screenSize === 'small' ? '36px' : 'auto'
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px 20px' : '24px 32px', overflow: 'auto', flex: 1 }}>
        {/* Controls */}
        <div style={{
          background: darkMode ? '#1f1f35' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          borderRadius: '12px',
          padding: screenSize === 'small' ? '12px 16px' : '16px 20px',
          marginBottom: screenSize === 'small' ? '16px' : '20px',
          display: 'flex',
          gap: screenSize === 'small' ? '8px' : '10px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          flexDirection: screenSize === 'small' ? 'column' : 'row'
        }}>
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: screenSize === 'small' ? '1' : '1',
              minWidth: screenSize === 'small' ? '100%' : '180px',
              padding: screenSize === 'small' ? '12px' : '8px 12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#cbd5e1'}`,
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '16px' : '13px',
              background: darkMode ? '#252538' : '#ffffff',
              color: darkMode ? '#ffffff' : '#1f2937',
              outline: 'none',
              minHeight: screenSize === 'small' ? '44px' : 'auto'
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: screenSize === 'small' ? '12px' : '8px 12px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#cbd5e1'}`,
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '16px' : '13px',
              background: darkMode ? '#252538' : '#ffffff',
              color: darkMode ? '#ffffff' : '#1f2937',
              cursor: 'pointer',
              outline: 'none',
              minHeight: screenSize === 'small' ? '44px' : 'auto',
              minWidth: screenSize === 'small' ? '100%' : 'auto'
            }}
          >
            {categories.map(cat => {
              return <option key={cat} value={cat}>{cat}</option>;
            })}
          </select>
          <button onClick={handleAddItem} style={{ background: darkMode ? '#6366f1' : '#3b82f6', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>+ Add Item</button>
          <button onClick={() => setShowExpiryAlerts(true)} style={{ background: expiredCount > 0 ? '#ef4444' : '#f59e0b', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>⏰ Expiry ({expiredCount})</button>
          <button onClick={() => setShowFefoSuggestions(true)} style={{ background: '#10b981', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>📋 FEFO</button>
          <button onClick={() => setShowWasteModal(true)} style={{ background: '#8b5cf6', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>🗑 Log Waste</button>
          <button onClick={() => setShowWasteReport(true)} style={{ background: '#ef4444', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>📊 Waste Report</button>
          <button onClick={() => setShowVendorList(true)} style={{ background: '#3b82f6', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>🏭 Vendors ({vendors.length})</button>
          <button onClick={() => setShowPOList(true)} style={{ background: '#f59e0b', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>🛒 POs ({purchaseOrders.length})</button>
          <button onClick={() => setShowAnalytics(true)} style={{ background: '#7c3aed', color: '#fff', border: 'none', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '600', padding: screenSize === 'small' ? '12px 16px' : '8px 16px', borderRadius: '8px', cursor: 'pointer', minHeight: screenSize === 'small' ? '44px' : 'auto', flex: screenSize === 'small' ? '1' : 'none' }}>📈 Analytics</button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: screenSize === 'small' ? '10px' : '12px',
          marginBottom: screenSize === 'small' ? '16px' : '20px'
        }}>
          <div style={{ background: darkMode ? '#252538' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Total Items</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{inventory.length}</div>
          </div>
          <div style={{ background: darkMode ? '#252538' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: lowStockCount > 0 ? '#f59e0b' : '#10b981' }}>{lowStockCount}</div>
          </div>
          <div style={{ background: darkMode ? '#252538' : '#ffffff', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Expiring Soon</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: expiringSoonCount > 0 ? '#f59e0b' : '#10b981' }}>{expiringSoonCount}</div>
          </div>
          <div style={{
            background: darkMode ? '#1a1a2e' : '#f8f9fa',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            padding: '8px'
          }}>
            <div style={{ fontSize: '10px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: '2px' }}>TOTAL VALUE</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827' }}>₹{totalValue.toLocaleString()}</div>
          </div>
        </div>

        {/* Inventory Table */}
        <div style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          padding: screenSize === 'small' ? '6px' : '8px',
          overflow: 'auto'
        }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: screenSize === 'small' ? '16px' : '20px', textAlign: 'center', color: darkMode ? '#8b8b9e' : '#64748b', fontSize: screenSize === 'small' ? '13px' : '14px' }}>
              {search || categoryFilter !== 'ALL' ? 'No items found' : 'No inventory items yet. Add your first item!'}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isLowStock = item.quantity <= item.minStock;
              const itemValue = (item.quantity || 0) * (item.cost || 0);
              
              return (
                <div
                  key={item.id}
                  style={{
                    background: darkMode ? '#1a1a2e' : '#f8f9fa',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                    padding: screenSize === 'small' ? '10px' : '8px',
                    marginBottom: screenSize === 'small' ? '8px' : '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: screenSize === 'small' ? 'flex-start' : 'center',
                    flexDirection: screenSize === 'small' ? 'column' : 'row',
                    gap: screenSize === 'small' ? '8px' : '0'
                  }}
                >
                  <div style={{ flex: 1, minWidth: screenSize === 'small' ? '0' : 'auto' }}>
                    <div style={{ fontSize: screenSize === 'small' ? '13px' : '12px', fontWeight: 'bold', marginBottom: screenSize === 'small' ? '4px' : '2px', color: darkMode ? '#ffffff' : '#111827' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '11px' : '10px', color: darkMode ? '#8b8b9e' : '#64748b', marginBottom: screenSize === 'small' ? '4px' : '2px' }}>
                      {item.category}
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '11px' : '10px', color: isLowStock ? '#ff8c00' : '#10b981', fontWeight: 'bold' }}>
                      Qty: {item.quantity} {item.unit} • Min: {item.minStock} {item.unit}
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '11px' : '10px', color: darkMode ? '#8b8b9e' : '#64748b' }}>
                      Value: ₹{itemValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: screenSize === 'small' ? '6px' : '4px', alignSelf: screenSize === 'small' ? 'flex-start' : 'center' }}>
                    <button
                      onClick={() => handleAdjustStock(item, -1)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '4px 8px',
                        background: darkMode ? '#252538' : '#e5e7eb',
                        border: 'none',
                        color: darkMode ? '#ffffff' : '#111827',
                        fontSize: screenSize === 'small' ? '14px' : '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        minHeight: screenSize === 'small' ? '36px' : 'auto'
                      }}
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustStock(item, 1)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '4px 8px',
                        background: darkMode ? '#252538' : '#e5e7eb',
                        border: 'none',
                        color: darkMode ? '#ffffff' : '#111827',
                        fontSize: screenSize === 'small' ? '14px' : '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        minHeight: screenSize === 'small' ? '36px' : 'auto'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleEditItem(item)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '4px 8px',
                        background: darkMode ? '#252538' : '#e5e7eb',
                        border: 'none',
                        color: darkMode ? '#ffffff' : '#111827',
                        fontSize: screenSize === 'small' ? '14px' : '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        minHeight: screenSize === 'small' ? '36px' : 'auto'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '4px 8px',
                        background: darkMode ? '#252538' : '#e5e7eb',
                        border: 'none',
                        color: darkMode ? '#ffffff' : '#111827',
                        fontSize: screenSize === 'small' ? '14px' : '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        minHeight: screenSize === 'small' ? '36px' : 'auto'
                      }}
                    >
                      🗑
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
          zIndex: 1000,
          padding: screenSize === 'small' ? '0' : '16px'
        }}>
          <div style={{
            background: darkMode ? '#252538' : '#ffffff',
            border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            padding: screenSize === 'small' ? '0' : '4px',
            maxWidth: screenSize === 'small' ? '100vw' : '450px',
            width: screenSize === 'small' ? '100vw' : '90%',
            maxHeight: screenSize === 'small' ? '100vh' : '90vh',
            overflow: 'auto',
            borderRadius: screenSize === 'small' ? '0' : '8px'
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#6366f1',
              color: '#ffffff',
              padding: screenSize === 'small' ? '16px 20px' : '4px 8px',
              fontSize: screenSize === 'small' ? '16px' : '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedItem ? 'EDIT ITEM' : 'ADD ITEM'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: screenSize === 'small' ? '20px' : '10px',
                  fontWeight: 'bold',
                  padding: screenSize === 'small' ? '8px 16px' : '2px 6px',
                  cursor: 'pointer',
                  minWidth: screenSize === 'small' ? '40px' : '16px',
                  minHeight: screenSize === 'small' ? '40px' : 'auto'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: screenSize === 'small' ? '20px' : '12px', background: darkMode ? '#252538' : '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'small' ? '14px' : '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '4px',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      fontSize: screenSize === 'small' ? '16px' : '12px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                    Category *
                  </label>
                  {showCustomCategory ? (
                    <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '4px' }}>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category..."
                        autoFocus
                        style={{
                          flex: 1,
                          padding: screenSize === 'small' ? '14px' : '4px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          fontSize: screenSize === 'small' ? '16px' : '12px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#111827',
                          minHeight: screenSize === 'small' ? '48px' : 'auto'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customCategory.trim()) {
                            setFormData({ ...formData, category: customCategory.trim() });
                          }
                          setShowCustomCategory(false);
                        }}
                        style={{ padding: '4px 8px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setCustomCategory('');
                        }}
                        style={{ padding: '4px 8px', background: darkMode ? '#1a1a2e' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
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
                      style={{
                        width: '100%',
                        padding: '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827'
                      }}
                    >
                      {categories.filter(c => c !== 'ALL').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">+ Custom Category</option>
                    </select>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '8px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '14px' : '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: screenSize === 'small' ? '16px' : '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        minHeight: screenSize === 'small' ? '48px' : 'auto'
                      }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                      Unit *
                    </label>
                    {showCustomUnit ? (
                      <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '4px' }}>
                        <input
                          type="text"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          placeholder="Enter custom unit..."
                          autoFocus
                          style={{
                            flex: 1,
                            padding: screenSize === 'small' ? '14px' : '4px',
                            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                            fontSize: screenSize === 'small' ? '16px' : '12px',
                            background: darkMode ? '#1a1a2e' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#111827',
                            minHeight: screenSize === 'small' ? '48px' : 'auto'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customUnit.trim()) {
                              setFormData({ ...formData, unit: customUnit.trim() });
                            }
                            setShowCustomUnit(false);
                          }}
                          style={{ padding: screenSize === 'small' ? '10px 16px' : '4px 8px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: screenSize === 'small' ? '14px' : '12px', cursor: 'pointer', minHeight: screenSize === 'small' ? '48px' : 'auto' }}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomUnit(false);
                            setCustomUnit('');
                          }}
                          style={{ padding: screenSize === 'small' ? '10px 16px' : '4px 8px', background: darkMode ? '#1a1a2e' : '#ffffff', color: darkMode ? '#ffffff' : '#111827', border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`, borderRadius: '4px', fontSize: screenSize === 'small' ? '14px' : '12px', cursor: 'pointer', minHeight: screenSize === 'small' ? '48px' : 'auto' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.unit}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setShowCustomUnit(true);
                          } else {
                            setFormData({ ...formData, unit: e.target.value });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px' : '4px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          fontSize: screenSize === 'small' ? '16px' : '12px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#111827',
                          minHeight: screenSize === 'small' ? '48px' : 'auto'
                        }}
                      >
                        <option value="pieces">pieces</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="liters">liters</option>
                        <option value="ml">ml</option>
                        <option value="boxes">boxes</option>
                        <option value="packs">packs</option>
                        <option value="bottles">bottles</option>
                        <option value="dozens">dozens</option>
                        <option value="__custom__">+ Custom Unit</option>
                      </select>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '8px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                      Min Stock
                    </label>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '14px' : '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: screenSize === 'small' ? '16px' : '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        minHeight: screenSize === 'small' ? '48px' : 'auto'
                      }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
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
                        padding: screenSize === 'small' ? '14px' : '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: screenSize === 'small' ? '16px' : '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        minHeight: screenSize === 'small' ? '48px' : 'auto'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '8px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '14px' : '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: screenSize === 'small' ? '16px' : '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        minHeight: screenSize === 'small' ? '48px' : 'auto'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '11px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#111827', marginBottom: screenSize === 'small' ? '6px' : '4px' }}>
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="Optional"
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '14px' : '4px',
                        border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                        fontSize: screenSize === 'small' ? '16px' : '12px',
                        background: darkMode ? '#1a1a2e' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#111827',
                        minHeight: screenSize === 'small' ? '48px' : 'auto'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '8px', marginTop: screenSize === 'small' ? '20px' : '8px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: screenSize === 'small' ? '14px' : '6px',
                    background: darkMode ? '#252538' : '#e5e7eb',
                    border: 'none',
                    color: darkMode ? '#ffffff' : '#111827',
                    fontSize: screenSize === 'small' ? '15px' : '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  style={{
                    flex: 1,
                    padding: screenSize === 'small' ? '14px' : '6px',
                    background: '#6366f1',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: screenSize === 'small' ? '15px' : '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                >
                  {selectedItem ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Alerts Modal */}
      {showExpiryAlerts && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: expiredCount > 0 ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠️ EXPIRY ALERTS</span>
              <button
                onClick={() => setShowExpiryAlerts(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#ef4444' }}>
                  Expired Items ({getExpiredItems().length})
                </div>
                {getExpiredItems().length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#10b981' }}>No expired items</div>
                ) : (
                  getExpiredItems().map(item => (
                    <div key={item.id} style={{
                      background: '#ffcccc',
                      border: '1px solid #ff0000',
                      padding: '8px',
                      marginBottom: '4px',
                      fontSize: '11px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ color: '#ef4444' }}>Expired: {new Date(item.expiryDate).toLocaleDateString()}</div>
                      <div>Qty: {item.quantity} {item.unit} • Batch: {item.batchNumber || 'N/A'}</div>
                    </div>
                  ))
                )}
                {getExpiredItems().length > 0 && (
                  <button
                    onClick={handleRemoveExpiredItems}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Remove All Expired Items
                  </button>
                )}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>
                  Expiring Soon (within 7 days) ({getExpiringItems().length})
                </div>
                {getExpiringItems().length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#10b981' }}>No items expiring soon</div>
                ) : (
                  getExpiringItems().map(item => {
                    const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={item.id} style={{
                        background: daysUntilExpiry <= 2 ? '#ffcccc' : '#fff4cc',
                        border: '1px solid #ff6600',
                        padding: '8px',
                        marginBottom: '4px',
                        fontSize: '11px'
                      }}>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ color: '#f59e0b' }}>
                          Expires: {new Date(item.expiryDate).toLocaleDateString()} ({daysUntilExpiry} days)
                        </div>
                        <div>Qty: {item.quantity} {item.unit} • Batch: {item.batchNumber || 'N/A'}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEFO Suggestions Modal */}
      {showFefoSuggestions && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📋 FEFO SUGGESTIONS (First-Expire-First-Out)</span>
              <button
                onClick={() => setShowFefoSuggestions(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '12px' }}>
                Use items with earliest expiry dates first to minimize waste
              </div>
              {getFefoSuggestions().length === 0 ? (
                <div style={{ fontSize: '11px', color: '#8b8b9e' }}>No items with expiry dates</div>
              ) : (
                getFefoSuggestions().map((item, index) => {
                  const daysUntilExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntilExpiry <= 3;
                  return (
                    <div key={item.id} style={{
                      background: isUrgent ? '#ffcccc' : '#ccffcc',
                      border: `1px solid ${isUrgent ? '#ef4444' : '#10b981'}`,
                      padding: '8px',
                      marginBottom: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          #{index + 1} {item.name}
                        </div>
                        <div style={{ color: isUrgent ? '#ef4444' : '#10b981' }}>
                          Expires: {new Date(item.expiryDate).toLocaleDateString()} ({daysUntilExpiry} days)
                        </div>
                        <div>Qty: {item.quantity} {item.unit} • Batch: {item.batchNumber || 'N/A'}</div>
                      </div>
                      <div style={{
                        background: isUrgent ? '#ef4444' : '#10b981',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {isUrgent ? 'URGENT' : 'USE FIRST'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Waste Log Modal */}
      {showWasteModal && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              background: '#8b5cf6',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🗑️ LOG WASTE</span>
              <button
                onClick={() => setShowWasteModal(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <WasteLogForm
                inventory={inventory}
                onLogWaste={(itemId, quantity, reason, staffId) => {
                  handleLogWaste(itemId, quantity, reason, staffId);
                  setShowWasteModal(false);
                }}
                onCancel={() => setShowWasteModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Waste Report Modal */}
      {showWasteReport && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#ef4444',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📊 WASTE REPORT</span>
              <button
                onClick={() => setShowWasteReport(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <WasteReport analytics={getWasteAnalytics()} records={wasteRecords} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WasteLogForm({ inventory, onLogWaste, onCancel }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [staffId, setStaffId] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!selectedItemId || !quantity || !reason) {
      alert('Please fill all required fields');
      return;
    }
    onLogWaste(selectedItemId, parseFloat(quantity), reason, staffId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Item *
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px',
              background: '#1a1a2e'
            }}
          >
            <option value="">Select item</option>
            {inventory.filter(item => item.quantity > 0).map(item => (
              <option key={item.id} value={item.id}>{item.name} (Qty: {item.quantity} {item.unit})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Quantity *
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px',
              background: '#1a1a2e'
            }}
          >
            <option value="">Select reason</option>
            <option value="Expired">Expired</option>
            <option value="Spoiled">Spoiled</option>
            <option value="Preparation Error">Preparation Error</option>
            <option value="Overstock">Overstock</option>
            <option value="Damaged">Damaged</option>
            <option value="Quality Issue">Quality Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Staff ID
          </label>
          <input
            type="text"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="Optional"
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px',
            background: '#252538',
            border: 'none',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '6px',
            background: '#8b5cf6',
            color: '#ffffff',
            border: 'none',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Log Waste
        </button>
      </div>
    </form>
  );
}

function WasteReport({ analytics, records }) {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Summary</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Total Waste Cost</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#800000' }}>₹{analytics.totalWasteCost.toFixed(2)}</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Total Records</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{analytics.totalWasteRecords}</div>
          </div>
        </div>
      </div>

      {Object.keys(analytics.wasteByReason).length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Waste by Reason</div>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
            {Object.entries(analytics.wasteByReason).map(([reason, cost]) => (
              <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>{reason}</span>
                <span style={{ fontWeight: 'bold', color: '#800000' }}>₹{cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(analytics.wasteByItem).length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Waste by Item</div>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
            {Object.entries(analytics.wasteByItem)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([item, cost]) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>{item}</span>
                <span style={{ fontWeight: 'bold', color: '#800000' }}>₹{cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Recent Waste Records</div>
          <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
            {records.slice(-10).reverse().map(record => (
              <div key={record.id} style={{
                borderBottom: '1px solid #c0c0c0',
                padding: '8px',
                fontSize: '11px'
              }}>
                <div style={{ fontWeight: 'bold' }}>{record.itemName}</div>
                <div style={{ color: '#8b8b9e' }}>
                  Qty: {record.quantity} {record.unit} • Cost: ₹{record.totalCost.toFixed(2)}
                </div>
                <div style={{ color: '#800000' }}>Reason: {record.reason}</div>
                <div style={{ fontSize: '10px', color: '#8b8b9e' }}>
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor List Modal */}
      {showVendorList && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>🏭 VENDOR MANAGEMENT</span>
              <button
                onClick={() => setShowVendorList(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <button
                onClick={handleAddVendor}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                + Add Vendor
              </button>

              {vendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8b8b9e' }}>
                  No vendors added yet
                </div>
              ) : (
                <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
                  {vendors.map(vendor => (
                    <div key={vendor.id} style={{
                      borderBottom: '1px solid #c0c0c0',
                      padding: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{vendor.name}</div>
                        <div style={{ fontSize: '11px', color: '#8b8b9e' }}>
                          Phone: {vendor.phone} • Email: {vendor.email || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#8b8b9e' }}>
                          Payment Terms: {vendor.paymentTerms || 'N/A'}
                        </div>
                        <div style={{ fontSize: '11px' }}>
                          Rating: {'★'.repeat(Math.round(vendor.rating || 0))}{'☆'.repeat(5 - Math.round(vendor.rating || 0))} ({vendor.totalOrders || 0} orders)
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                          value={vendor.rating || 0}
                          onChange={(e) => handleRateVendor(vendor.id, parseFloat(e.target.value))}
                          style={{ padding: '4px', fontSize: '11px' }}
                        >
                          <option value="0">Rate</option>
                          <option value="1">1★</option>
                          <option value="2">2★</option>
                          <option value="3">3★</option>
                          <option value="4">4★</option>
                          <option value="5">5★</option>
                        </select>
                        <button
                          onClick={() => handleEditVendor(vendor)}
                          style={{
                            padding: '4px 8px',
                            background: '#252538',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              background: '#3b82f6',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</span>
              <button
                onClick={() => setShowVendorModal(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <VendorForm
                vendor={editingVendor}
                onSave={handleSaveVendor}
                onCancel={() => {
                  setShowVendorModal(false);
                  setEditingVendor(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order List Modal */}
      {showPOList && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#f59e0b',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📦 PURCHASE ORDERS</span>
              <button
                onClick={() => setShowPOList(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <button
                onClick={handleAddPO}
                style={{
                  padding: '6px 12px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                + Create Purchase Order
              </button>

              {purchaseOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8b8b9e' }}>
                  No purchase orders yet
                </div>
              ) : (
                <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
                  {purchaseOrders.map(po => {
                    const vendor = vendors.find(v => v.id === po.vendorId);
                    return (
                      <div key={po.id} style={{
                        borderBottom: '1px solid #c0c0c0',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>PO #{po.id.slice(-6)}</div>
                          <div style={{ fontSize: '11px', color: '#8b8b9e' }}>
                            Vendor: {vendor?.name || 'Unknown'} • Total: ₹{po.totalCost?.toFixed(2) || '0.00'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8b8b9e' }}>
                            Items: {po.items?.length || 0} • Expected: {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'N/A'}
                          </div>
                          <div style={{ fontSize: '11px' }}>
                            Status: <span style={{
                              background: po.status === 'received' ? '#10b981' : po.status === 'approved' ? '#0066cc' : '#f59e0b',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>{po.status?.toUpperCase() || 'PENDING'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {po.status === 'pending' && (
                            <button
                              onClick={() => handleApprovePO(po.id)}
                              style={{
                                padding: '4px 8px',
                                background: '#3b82f6',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {po.status === 'approved' && (
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              style={{
                                padding: '4px 8px',
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Receive
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPO(po)}
                            style={{
                              padding: '4px 8px',
                              background: '#252538',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePO(po.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#ef4444',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showPOModal && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#f59e0b',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}</span>
              <button
                onClick={() => setShowPOModal(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <PurchaseOrderForm
                po={editingPO}
                vendors={vendors}
                inventory={inventory}
                onSave={handleSavePO}
                onCancel={() => {
                  setShowPOModal(false);
                  setEditingPO(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
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
            background: '#252538',
            border: 'none',
            padding: '4px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              background: '#7c3aed',
              color: '#ffffff',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📊 INVENTORY ANALYTICS</span>
              <button
                onClick={() => setShowAnalytics(false)}
                style={{
                  background: '#252538',
                  border: 'none',
                  color: '#ffffff',
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
            
            <div style={{ padding: '12px', background: '#252538' }}>
              <InventoryAnalytics analytics={getInventoryAnalytics()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorForm({ vendor, onSave, onCancel }) {
  const [name, setName] = useState(vendor?.name || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [address, setAddress] = useState(vendor?.address || '');
  const [paymentTerms, setPaymentTerms] = useState(vendor?.paymentTerms || '');
  const [gstin, setGstin] = useState(vendor?.gstin || '');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and Phone are required');
      return;
    }
    onSave({ name, phone, email, address, paymentTerms, gstin });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Vendor Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="e.g., ABC Supplies"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Phone *
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="e.g., 9876543210"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="e.g., vendor@example.com"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="Vendor address"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Payment Terms
          </label>
          <input
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="e.g., Net 30, COD"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            GSTIN
          </label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="GSTIN number"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px',
            background: '#252538',
            border: 'none',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '6px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {vendor ? 'Update' : 'Add'} Vendor
        </button>
      </div>
    </form>
  );
}

function PurchaseOrderForm({ po, vendors, inventory, onSave, onCancel }) {
  const [vendorId, setVendorId] = useState(po?.vendorId || '');
  const [items, setItems] = useState(po?.items || [{ itemName: '', quantity: 1, unit: '', cost: 0 }]);
  const [expectedDate, setExpectedDate] = useState(po?.expectedDate || '');
  const [notes, setNotes] = useState(po?.notes || '');

  const addItem = () => {
    setItems([...items, { itemName: '', quantity: 1, unit: '', cost: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!vendorId || items.length === 0 || items.some(i => !i.itemName)) {
      alert('Please select a vendor and add at least one item');
      return;
    }
    onSave({
      vendorId,
      items,
      expectedDate,
      notes,
      totalCost: calculateTotal()
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Vendor *
          </label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px',
              background: '#1a1a2e'
            }}
          >
            <option value="">Select vendor</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
              Items
            </label>
            <button
              type="button"
              onClick={addItem}
              style={{
                padding: '4px 8px',
                background: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              + Add Item
            </button>
          </div>
          {items.map((item, index) => (
            <div key={index} style={{
              background: '#f9f9f9',
              border: '1px solid #c0c0c0',
              padding: '8px',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>
                    Item Name
                  </label>
                  <select
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #2d2d44',
                      fontSize: '11px',
                      background: '#1a1a2e'
                    }}
                  >
                    <option value="">Select item</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #2d2d44',
                      fontSize: '11px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #2d2d44',
                      fontSize: '11px'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>
                    Cost
                  </label>
                  <input
                    type="number"
                    value={item.cost}
                    onChange={(e) => updateItem(index, 'cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '4px',
                      border: '1px solid #2d2d44',
                      fontSize: '11px'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{
                    padding: '4px 8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Expected Delivery Date
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '4px',
              border: '1px solid #2d2d44',
              fontSize: '12px'
            }}
            placeholder="Additional notes"
          />
        </div>

        <div style={{
          background: '#f0f0f0',
          padding: '8px',
          border: '1px solid #2d2d44',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          Total Cost: ₹{calculateTotal().toFixed(2)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px',
            background: '#252538',
            border: 'none',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '6px',
            background: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {po ? 'Update' : 'Create'} PO
        </button>
      </div>
    </form>
  );
}

function InventoryAnalytics({ analytics }) {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Overview</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Total Items</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{analytics.totalItems}</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Total Value</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066cc' }}>₹{analytics.totalValue.toFixed(2)}</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Low Stock</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>{analytics.lowStockCount}</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Expired</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{analytics.expiredCount}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Category Breakdown</div>
        <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
          {Object.entries(analytics.categoryBreakdown).length === 0 ? (
            <div style={{ fontSize: '11px', color: '#8b8b9e' }}>No data</div>
          ) : (
            Object.entries(analytics.categoryBreakdown).map(([category, value]) => (
              <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>{category}</span>
                <span style={{ fontWeight: 'bold' }}>₹{value.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Financial Summary</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Waste Cost</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#800000' }}>₹{analytics.wasteCost.toFixed(2)}</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>Waste %</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#800000' }}>{analytics.wastePercentage.toFixed(1)}%</div>
          </div>
          <div style={{
            background: '#1a1a2e',
            border: '1px solid #2d2d44',
            padding: '8px',
            flex: 1,
            minWidth: '120px'
          }}>
            <div style={{ fontSize: '10px', color: '#8b8b9e', marginBottom: '2px' }}>PO Total</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#cc6600' }}>₹{analytics.poTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Alerts</div>
        <div style={{ background: '#1a1a2e', border: '1px solid #2d2d44' }}>
          {analytics.expiringCount > 0 && (
            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#f59e0b' }}>
              ⚠️ {analytics.expiringCount} items expiring soon
            </div>
          )}
          {analytics.expiredCount > 0 && (
            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#ef4444' }}>
              ⛔ {analytics.expiredCount} expired items
            </div>
          )}
          {analytics.lowStockCount > 0 && (
            <div style={{ marginBottom: '4px', fontSize: '11px', color: '#f59e0b' }}>
              📉 {analytics.lowStockCount} items low on stock
            </div>
          )}
          {analytics.expiringCount === 0 && analytics.expiredCount === 0 && analytics.lowStockCount === 0 && (
            <div style={{ fontSize: '11px', color: '#10b981' }}>
              ✓ No alerts - inventory is healthy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

