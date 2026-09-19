import React, { useState, useEffect } from 'react';

export default function WasteManagement({ inventory, onNavigate, darkMode = true }) {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'cost-desc', 'cost-asc'
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

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

  useEffect(() => {
    // Load waste records from localStorage
    try {
      const savedWaste = localStorage.getItem('bakerypos_waste');
      if (savedWaste) {
        setWasteRecords(JSON.parse(savedWaste));
      }
    } catch (e) {
      console.error('Failed to load waste records:', e);
    }
  }, []);

  const saveWasteRecords = (newRecords) => {
    setWasteRecords(newRecords);
    localStorage.setItem('bakerypos_waste', JSON.stringify(newRecords));
  };

  const handleAddWaste = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEditWaste = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDeleteWaste = (recordId) => {
    if (window.confirm('Are you sure you want to delete this waste record?')) {
      saveWasteRecords(wasteRecords.filter(r => r.id !== recordId));
    }
  };

  const handleSaveWaste = (wasteData) => {
    if (editingRecord) {
      saveWasteRecords(wasteRecords.map(r => r.id === editingRecord.id ? { ...wasteData, id: editingRecord.id } : r));
    } else {
      saveWasteRecords([...wasteRecords, { ...wasteData, id: Date.now(), createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
    setEditingRecord(null);
  };

  // Calculate waste statistics
  const totalWasteCost = wasteRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalWasteQuantity = wasteRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const wasteByReason = {};
  wasteRecords.forEach(r => {
    wasteByReason[r.reason] = (wasteByReason[r.reason] || 0) + r.totalCost;
  });

  // Filter records
  const filteredRecords = wasteRecords.filter(r => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterReason !== 'all' && r.reason !== filterReason) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (r.itemName && r.itemName.toLowerCase().includes(query)) ||
        (r.category && r.category.toLowerCase().includes(query)) ||
        (r.reason && r.reason.toLowerCase().includes(query)) ||
        (r.notes && r.notes.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const recordDate = new Date(r.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateRange === 'today') {
        if (recordDate < today) return false;
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (recordDate < weekAgo) return false;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (recordDate < monthAgo) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sorting
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    
    if (sortBy === 'date-desc') return dateB - dateA;
    if (sortBy === 'date-asc') return dateA - dateB;
    if (sortBy === 'cost-desc') return (b.totalCost || 0) - (a.totalCost || 0);
    if (sortBy === 'cost-asc') return (a.totalCost || 0) - (b.totalCost || 0);
    return 0;
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#000000' : '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: darkMode ? '#14142a' : '#f9fafb' }}>
        {showForm ? (
          <WasteForm
            record={editingRecord}
            inventory={inventory}
            onSave={handleSaveWaste}
            onCancel={() => {
              setShowForm(false);
              setEditingRecord(null);
            }}
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <StatCard label="Total Waste Cost" value={`₹${totalWasteCost.toFixed(2)}`} icon="💰" color="#dc2626" darkMode={darkMode} />
              <StatCard label="Total Records" value={wasteRecords.length} icon="📋" darkMode={darkMode} />
              <StatCard label="Total Quantity" value={`${totalWasteQuantity.toFixed(2)}`} icon="⚖️" darkMode={darkMode} />
              <StatCard label="This Month" value={`₹${wasteRecords.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`} icon="📅" darkMode={darkMode} />
            </div>

            {/* Filters */}
            <div style={{
              background: darkMode ? '#111111' : '#ffffff',
              border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#888888' }}>Filters:</span>
              
              <input
                type="text"
                placeholder="Search items, reasons, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                <option value="Bakery">Bakery</option>
                <option value="Dairy">Dairy</option>
                <option value="Meat">Meat</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Beverages">Beverages</option>
              </select>
              
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Reasons</option>
                <option value="expired">Expired</option>
                <option value="spoiled">Spoiled</option>
                <option value="damaged">Damaged</option>
                <option value="overprepared">Overprepared</option>
                <option value="quality">Quality Issue</option>
                <option value="mistake">Mistake</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="cost-desc">Highest Cost</option>
                <option value="cost-asc">Lowest Cost</option>
              </select>
            </div>

            {/* Add Waste Button */}
            <button
              onClick={handleAddWaste}
              style={{
                padding: '12px 24px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#dc2626';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              + Log Waste
            </button>

            {/* Waste by Reason Chart */}
            <div style={{
              background: darkMode ? '#111111' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              padding: '20px',
              marginBottom: '24px',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '16px' }}>
                Waste by Reason
              </div>
              {Object.entries(wasteByReason).map(([reason, cost]) => {
                const percentage = totalWasteCost > 0 ? (cost / totalWasteCost * 100).toFixed(1) : 0;
                return (
                  <div key={reason} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a', textTransform: 'capitalize' }}>{reason}</span>
                      <span style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888' }}>{percentage}% (₹{cost.toFixed(2)})</span>
                    </div>
                    <div style={{ height: '8px', background: darkMode ? '#111111' : '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: '#dc2626' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Waste Records List */}
            <div style={{
              background: darkMode ? '#111111' : '#ffffff',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
              padding: '20px',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '16px' }}>
                Waste Records ({filteredRecords.length})
              </div>
              {filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: darkMode ? '#888888' : '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>No waste records found</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>Log your first waste record to get started</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filteredRecords.map(record => (
                    <WasteRecordCard
                      key={record.id}
                      record={record}
                      onEdit={() => handleEditWaste(record)}
                      onDelete={() => handleDeleteWaste(record.id)}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = '#0a0a0a', darkMode = true }) {
  return (
    <div style={{
      background: darkMode ? '#111111' : '#ffffff',
      border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#888888', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color }}>{          value}
        </div>
      </div>
    </div>
  );
}

function WasteRecordCard({ record, onEdit, onDelete, darkMode = true }) {
  const reasonColors = {
    expired: '#dc2626',
    spoiled: '#ea580c',
    damaged: '#d97706',
    overprepared: '#059669',
    quality: '#0891b2',
    mistake: '#3b82f6',
    other: '#888888'
  };

  return (
    <div style={{
      background: darkMode ? '#000000' : '#f9fafb',
      border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = darkMode ? '0 8px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)';
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            padding: '4px 8px',
            background: reasonColors[record.reason] || '#888888',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {record.reason}
          </span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
            {record.itemName}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888', marginBottom: '4px' }}>
          {record.quantity} {record.unit} • {record.category}
        </div>
        <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888' }}>
          {new Date(record.createdAt).toLocaleDateString()} • Cost: ₹{record.totalCost?.toFixed(2)}
        </div>
        {record.notes && (
          <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#9ca3af', marginTop: '4px' }}>
            Note: {record.notes}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onEdit}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#000000' : '#ffffff',
            color: darkMode ? '#ffffff' : '#0a0a0a',
            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = darkMode ? '#111111' : '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.background = darkMode ? '#000000' : '#ffffff'}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#000000' : '#ffffff',
            color: '#dc2626',
            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = darkMode ? '#111111' : '#fef2f2';
            e.target.style.borderColor = darkMode ? '#dc2626' : '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = darkMode ? '#000000' : '#ffffff';
            e.target.style.borderColor = darkMode ? '#222222' : '#d1d5db';
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function WasteForm({ record, inventory, onSave, onCancel, darkMode = true }) {
  const [inventoryId, setInventoryId] = useState(record?.inventoryId || '');
  const [quantity, setQuantity] = useState(record?.quantity || 1);
  const [unit, setUnit] = useState(record?.unit || 'kg');
  const [reason, setReason] = useState(record?.reason || 'expired');
  const [category, setCategory] = useState(record?.category || '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const selectedItem = inventory.find(i => i.id === inventoryId);
  const totalCost = selectedItem ? (selectedItem.cost || 0) * quantity : 0;

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const categories = ['Bakery', 'Dairy', 'Meat', 'Vegetables', 'Fruits', 'Dry Goods', 'Beverages', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      inventoryId,
      itemName: selectedItem?.name || 'Unknown',
      quantity,
      unit,
      reason,
      category,
      notes,
      totalCost,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div style={{
      background: darkMode ? '#111111' : '#ffffff',
      borderRadius: '8px',
      border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '24px' }}>
        {record ? 'Edit Waste Record' : 'Log New Waste'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
            Item *
          </label>
          <input
            type="text"
            value={selectedItem ? selectedItem.name : itemSearch}
            onChange={(e) => {
              setItemSearch(e.target.value);
              setShowItemDropdown(true);
            }}
            onFocus={() => setShowItemDropdown(true)}
            onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
            placeholder="Search items..."
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#000000' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {showItemDropdown && filteredInventory.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              background: darkMode ? '#111111' : '#ffffff',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '6px',
              marginTop: '4px',
              zIndex: 1000,
              boxShadow: darkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
              {filteredInventory.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setInventoryId(item.id);
                    setItemSearch(item.name);
                    setShowItemDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? '#000000' : '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#64748b' }}>
                    {item.category} • ₹{item.cost}/unit
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
            Category *
          </label>
          {showCustomCategory ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customCategory.trim()) {
                    setCategory(customCategory.trim());
                  }
                  setShowCustomCategory(false);
                }}
                style={{
                  padding: '12px 16px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomCategory(false);
                  setCustomCategory('');
                }}
                style={{
                  padding: '12px 16px',
                  background: darkMode ? '#000000' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setShowCustomCategory(true);
                } else {
                  setCategory(e.target.value);
                }
              }}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#000000' : '#ffffff',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Custom Category</option>
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#000000' : '#ffffff',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
              Unit *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#000000' : '#ffffff',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="pcs">pcs</option>
              <option value="dozen">dozen</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
            Reason for Waste *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#000000' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="expired">Expired</option>
            <option value="spoiled">Spoiled</option>
            <option value="damaged">Damaged</option>
            <option value="overprepared">Overprepared</option>
            <option value="quality">Quality Issue</option>
            <option value="mistake">Mistake</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '8px' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#000000' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Additional details about the waste"
          />
        </div>

        {/* Cost Summary */}
        <div style={{
          background: darkMode ? '#000000' : '#fef2f2',
          border: `1px solid ${darkMode ? '#222222' : '#dc2626'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '8px' }}>
            Cost Impact
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: darkMode ? '#888888' : '#888888' }}>Total Cost:</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>₹{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: darkMode ? '#000000' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = darkMode ? '#111111' : '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = darkMode ? '#000000' : '#ffffff'}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#b91c1c';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#dc2626';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
}
