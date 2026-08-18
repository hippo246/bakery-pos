// Kitchen Display System (KDS)
// Real-time display of Kitchen Order Tickets for kitchen staff

import React, { useState, useEffect } from 'react';
import { getKOTManager } from '../../operations/KOTManager.js';
import { KOTStatus, KOTPriority, KitchenStation } from '../../domain/kotTypes.js';

export default function KitchenDisplaySystem() {
  const [kotManager] = useState(() => getKOTManager());
  const [kots, setKots] = useState([]);
  const [selectedStation, setSelectedStation] = useState(KitchenStation.BAKERY);
  const [selectedStatus, setSelectedStatus] = useState(KOTStatus.PENDING);
  const [statistics, setStatistics] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadKOTs = () => {
    const filteredKOTs = kotManager.getKOTsForStation(selectedStation, {
      status: selectedStatus
    });
    setKots(filteredKOTs);
  };

  const loadStatistics = () => {
    const stats = kotManager.getStatistics();
    setStatistics(stats);
  };

  useEffect(() => {
    loadKOTs();
    loadStatistics();

    // Subscribe to KOT events
    const handleKOTUpdate = () => {
      loadKOTs();
      loadStatistics();
    };

    kotManager.on('kotCreated', handleKOTUpdate);
    kotManager.on('kotItemUpdated', handleKOTUpdate);
    kotManager.on('kotStatusUpdated', handleKOTUpdate);
    kotManager.on('kotPriorityUpdated', handleKOTUpdate);
    kotManager.on('kotCancelled', handleKOTUpdate);

    // Auto refresh interval
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        loadKOTs();
        loadStatistics();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      kotManager.off('kotCreated', handleKOTUpdate);
      kotManager.off('kotItemUpdated', handleKOTUpdate);
      kotManager.off('kotStatusUpdated', handleKOTUpdate);
      kotManager.off('kotPriorityUpdated', handleKOTUpdate);
      kotManager.off('kotCancelled', handleKOTUpdate);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [selectedStation, selectedStatus, autoRefresh, kotManager]);

  const handleItemStatusChange = (kotId, kotItemId, newStatus) => {
    kotManager.updateItemStatus(kotId, kotItemId, newStatus);
  };

  const handleKOTStatusChange = (kotId, newStatus) => {
    kotManager.updateKOTStatus(kotId, newStatus);
  };

  const handleMarkUrgent = (kotId) => {
    kotManager.markAsUrgent(kotId);
  };

  const handleCancelKOT = (kotId) => {
    const reason = prompt('Enter cancellation reason:');
    if (reason) {
      kotManager.cancelKOT(kotId, reason);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case KOTStatus.PENDING: return '#f59e0b';
      case KOTStatus.PREPARING: return '#3b82f6';
      case KOTStatus.READY: return '#10b981';
      case KOTStatus.SERVED: return '#6b7280';
      case KOTStatus.CANCELLED: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case KOTPriority.URGENT: return '#ef4444';
      case KOTPriority.HIGH: return '#f97316';
      case KOTPriority.NORMAL: return '#3b82f6';
      case KOTPriority.LOW: return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStationLabel = (station) => {
    const labels = {
      [KitchenStation.BAKERY]: 'Bakery',
      [KitchenStation.KITCHEN]: 'Kitchen',
      [KitchenStation.BEVERAGE]: 'Beverage',
      [KitchenStation.DESSERT]: 'Dessert',
      [KitchenStation.GRILL]: 'Grill',
      [KitchenStation.FRYER]: 'Fryer',
      [KitchenStation.COLD]: 'Cold',
      [KitchenStation.GENERAL]: 'General'
    };
    return labels[station] || station;
  };

  return (
    <div style={{
      background: '#f9fafb',
      minHeight: '100vh',
      color: '#111827',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            🍳 Kitchen Display System
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>
            Real-time order management
          </p>
        </div>
        
        {/* Statistics */}
        {statistics && (
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>
                {statistics.active}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>
                {statistics.byStatus.pending}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>
                {statistics.overdue}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Overdue</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        background: '#ffffff',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Station Filter */}
        <div>
          <label style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px', fontWeight: '500' }}>
            Station:
          </label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
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
            <option value={KitchenStation.BAKERY}>Bakery</option>
            <option value={KitchenStation.KITCHEN}>Kitchen</option>
            <option value={KitchenStation.BEVERAGE}>Beverage</option>
            <option value={KitchenStation.DESSERT}>Dessert</option>
            <option value={KitchenStation.GRILL}>Grill</option>
            <option value={KitchenStation.FRYER}>Fryer</option>
            <option value={KitchenStation.COLD}>Cold</option>
            <option value={KitchenStation.GENERAL}>General</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px', fontWeight: '500' }}>
            Status:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            <option value={KOTStatus.PENDING}>Pending</option>
            <option value={KOTStatus.PREPARING}>Preparing</option>
            <option value={KOTStatus.READY}>Ready</option>
            <option value={KOTStatus.SERVED}>Served</option>
            <option value={KOTStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Auto Refresh:</label>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '10px 20px',
              background: autoRefresh ? '#111827' : '#f9fafb',
              color: autoRefresh ? '#ffffff' : '#111827',
              border: autoRefresh ? 'none' : '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {autoRefresh ? 'On' : 'Off'}
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            loadKOTs();
            loadStatistics();
          }}
          style={{
            padding: '10px 20px',
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {/* KOT Grid */}
      <div style={{ padding: '24px' }}>
        {kots.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>No orders for this station</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {kots.map(kot => (
              <KOTCard
                key={kot.kotId}
                kot={kot}
                onItemStatusChange={handleItemStatusChange}
                onKOTStatusChange={handleKOTStatusChange}
                onMarkUrgent={handleMarkUrgent}
                onCancelKOT={handleCancelKOT}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// KOT Card Component
function KOTCard({ kot, onItemStatusChange, onKOTStatusChange, onMarkUrgent, onCancelKOT, getStatusColor, getPriorityColor }) {
  const [expanded, setExpanded] = useState(false);

  const timeElapsed = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 60000);
  const isOverdue = new Date() > new Date(kot.estimatedReadyAt) && kot.status !== KOTStatus.SERVED;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${isOverdue ? '#ef4444' : kot.priority === KOTPriority.URGENT ? '#ef4444' : '#e5e7eb'}`,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Card Header */}
      <div style={{
        padding: '16px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>#{kot.orderNumber}</span>
            {kot.token && (
              <span style={{
                padding: '4px 10px',
                background: '#dbeafe',
                color: '#1e40af',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {kot.token}
              </span>
            )}
            <span style={{
              padding: '4px 10px',
              background: kot.priority === KOTPriority.URGENT ? '#fef2f2' : '#f3f4f6',
              color: kot.priority === KOTPriority.URGENT ? '#dc2626' : '#6b7280',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {kot.priority}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {timeElapsed} min ago
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{kot.customer.name}</div>
            {kot.customer.table && (
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Table {kot.customer.table}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Est: {new Date(kot.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {isOverdue && (
              <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                OVERDUE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '16px' }}>
        {kot.items.map(item => (
          <KOTItem
            key={item.kotItemId}
            item={item}
            onStatusChange={(status) => onItemStatusChange(kot.kotId, item.kotItemId, status)}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

      {/* Actions */}
      <div style={{
        padding: '12px 16px',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.PREPARING)}
          disabled={kot.status === KOTStatus.PREPARING || kot.status === KOTStatus.READY || kot.status === KOTStatus.SERVED}
          style={{
            flex: 1,
            padding: '10px',
            background: kot.status === KOTStatus.PREPARING ? '#111827' : '#ffffff',
            color: kot.status === KOTStatus.PREPARING ? '#ffffff' : '#111827',
            border: kot.status === KOTStatus.PREPARING ? 'none' : '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: kot.status === KOTStatus.PREPARING ? 'default' : 'pointer',
            opacity: kot.status === KOTStatus.PREPARING ? 0.5 : 1
          }}
        >
          Start Preparing
        </button>
        <button
          onClick={() => onKOTStatusChange(kot.kotId, KOTStatus.READY)}
          disabled={kot.status === KOTStatus.READY || kot.status === KOTStatus.SERVED}
          style={{
            flex: 1,
            padding: '10px',
            background: kot.status === KOTStatus.READY ? '#111827' : '#ffffff',
            color: kot.status === KOTStatus.READY ? '#ffffff' : '#111827',
            border: kot.status === KOTStatus.READY ? 'none' : '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: kot.status === KOTStatus.READY ? 'default' : 'pointer',
            opacity: kot.status === KOTStatus.READY ? 0.5 : 1
          }}
        >
          Mark Ready
        </button>
        <button
          onClick={() => onMarkUrgent(kot.kotId)}
          disabled={kot.priority === KOTPriority.URGENT}
          style={{
            padding: '10px 12px',
            background: kot.priority === KOTPriority.URGENT ? '#fef2f2' : '#ffffff',
            color: kot.priority === KOTPriority.URGENT ? '#dc2626' : '#111827',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: kot.priority === KOTPriority.URGENT ? 'default' : 'pointer',
            opacity: kot.priority === KOTPriority.URGENT ? 0.5 : 1
          }}
        >
          ⚠️ Urgent
        </button>
        <button
          onClick={() => onCancelKOT(kot.kotId)}
          style={{
            padding: '10px 12px',
            background: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// KOT Item Component
function KOTItem({ item, onStatusChange, getStatusColor }) {
  return (
    <div style={{
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${getStatusColor(item.status)}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{item.quantity}x</span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{item.name}</span>
        </div>
        <select
          value={item.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{
            padding: '6px 12px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {item.notes && (
        <div style={{ fontSize: '13px', color: '#d97706', marginTop: '4px' }}>
          📝 {item.notes}
        </div>
      )}

      {item.modifications && item.modifications.length > 0 && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {item.modifications.map((mod, i) => (
            <span key={i}>• {mod} </span>
          ))}
        </div>
      )}
    </div>
  );
}
