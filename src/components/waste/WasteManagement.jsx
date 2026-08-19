import React, { useState, useEffect } from 'react';

export default function WasteManagement({ inventory, onNavigate }) {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
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
    return true;
  });

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
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              Waste Management
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Track and manage inventory waste
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('inventory')}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f9fafb' }}>
        {showForm ? (
          <WasteForm
            record={editingRecord}
            inventory={inventory}
            onSave={handleSaveWaste}
            onCancel={() => {
              setShowForm(false);
              setEditingRecord(null);
            }}
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
              <StatCard label="Total Waste Cost" value={`₹${totalWasteCost.toFixed(2)}`} icon="💰" color="#dc2626" />
              <StatCard label="Total Records" value={wasteRecords.length} icon="📋" />
              <StatCard label="Total Quantity" value={`${totalWasteQuantity.toFixed(2)}`} icon="⚖️" />
              <StatCard label="This Month" value={`₹${wasteRecords.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).reduce((sum, r) => sum + r.totalCost, 0).toFixed(2)}`} icon="📅" />
            </div>

            {/* Filters */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Filters:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '10px 16px',
                  background: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
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
                  background: '#ffffff',
                  color: '#111827',
                  border: '1px solid #d1d5db',
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
                gap: '8px'
              }}
            >
              + Log Waste
            </button>

            {/* Waste by Reason Chart */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Waste by Reason
              </div>
              {Object.entries(wasteByReason).map(([reason, cost]) => {
                const percentage = totalWasteCost > 0 ? (cost / totalWasteCost * 100).toFixed(1) : 0;
                return (
                  <div key={reason} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>{reason}</span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{percentage}% (₹{cost.toFixed(2)})</span>
                    </div>
                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percentage}%`, background: '#dc2626' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Waste Records List */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Waste Records ({filteredRecords.length})
              </div>
              {filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No waste records found</div>
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

function StatCard({ label, value, icon, color = '#111827' }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color }}>{          value}
        </div>
      </div>
    </div>
  );
}

function WasteRecordCard({ record, onEdit, onDelete }) {
  const reasonColors = {
    expired: '#dc2626',
    spoiled: '#ea580c',
    damaged: '#d97706',
    overprepared: '#059669',
    quality: '#0891b2',
    mistake: '#7c3aed',
    other: '#6b7280'
  };

  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            padding: '4px 8px',
            background: reasonColors[record.reason] || '#6b7280',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {record.reason}
          </span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {record.itemName}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          {record.quantity} {record.unit} • {record.category}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {new Date(record.createdAt).toLocaleDateString()} • Cost: ₹{record.totalCost?.toFixed(2)}
        </div>
        {record.notes && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Note: {record.notes}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
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
            color: '#dc2626',
            border: '1px solid #d1d5db',
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

function WasteForm({ record, inventory, onSave, onCancel }) {
  const [inventoryId, setInventoryId] = useState(record?.inventoryId || '');
  const [quantity, setQuantity] = useState(record?.quantity || 1);
  const [unit, setUnit] = useState(record?.unit || 'kg');
  const [reason, setReason] = useState(record?.reason || 'expired');
  const [category, setCategory] = useState(record?.category || '');
  const [notes, setNotes] = useState(record?.notes || '');

  const selectedItem = inventory.find(i => i.id === inventoryId);
  const totalCost = selectedItem ? (selectedItem.cost || 0) * quantity : 0;

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
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
        {record ? 'Edit Waste Record' : 'Log New Waste'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Item *
          </label>
          <select
            value={inventoryId}
            onChange={(e) => setInventoryId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="">Select item</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>{item.name} (₹{item.cost}/unit)</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="">Select category</option>
            <option value="Bakery">Bakery</option>
            <option value="Dairy">Dairy</option>
            <option value="Meat">Meat</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Beverages">Beverages</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Unit *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Reason for Waste *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
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
          background: '#fef2f2',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Cost Impact
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Total Cost:</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>₹{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
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
              cursor: 'pointer'
            }}
          >
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
}
