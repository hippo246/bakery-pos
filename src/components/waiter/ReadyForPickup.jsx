/**
 * Ready for Pickup Component
 * Dedicated section for orders ready for collection from kitchen
 * Shows pickup timer, priority, table number, and kitchen notes
 */

import React, { useState, useCallback, useMemo } from 'react';
import { statusBadge } from '../../styles/theme';
import moduleEventPublisher from '../../dashboard/liveEngine/ModuleEventPublisher.js';

function ReadyForPickup({
  kdsCards,
  setKdsCards,
  orders,
  tables,
  currentShift
}) {
  // Filter ready cards for this waiter's tables
  const readyCards = useMemo(() => {
    if (!kdsCards || !orders || !tables || !currentShift) return [];
    
    const waiterTables = tables.filter(table => table.assignedStaffId === currentShift.staffId);
    const waiterTableIds = waiterTables.map(table => table.id);
    
    return kdsCards.filter(card => 
      card.status === 'READY' && 
      orders.some(order => 
        order.id === card.orderId && 
        waiterTableIds.includes(order.tableId)
      )
    );
  }, [kdsCards, orders, tables, currentShift]);

  // Handle card collection
  const handleCollect = useCallback((cardId) => {
    const card = kdsCards.find(c => c.id === cardId);
    if (!card) return;

    setKdsCards(prev => prev.map(card => 
      card.id === cardId 
        ? { ...card, status: 'COLLECTED', collectedAt: Date.now(), collectedBy: currentShift.staffId }
        : card
    ));

    // Publish events for real-time synchronization
    moduleEventPublisher.publishKitchenEvent('kitchen.collected', {
      cardId: cardId,
      orderId: card.orderId,
      collectedBy: currentShift.staffId
    });

    moduleEventPublisher.publishWaiterEvent('waiter.collected', {
      orderId: card.orderId,
      staffId: currentShift.staffId
    });
  }, [setKdsCards, currentShift, kdsCards]);

  // Calculate pickup timer
  const getPickupTime = useCallback((readyAt) => {
    if (!readyAt) return 0;
    return Math.floor((Date.now() - readyAt) / 1000 / 60); // minutes
  }, []);

  // Get priority based on wait time
  const getPriority = useCallback((readyAt) => {
    const minutes = getPickupTime(readyAt);
    if (minutes > 10) return 'critical';
    if (minutes > 5) return 'high';
    return 'normal';
  }, [getPickupTime]);

  // Get priority color
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'critical': return 'var(--cafe-danger)';
      case 'high': return 'var(--cafe-warning)';
      default: return 'var(--cafe-success)';
    }
  }, []);

  // Get order details
  const getOrderDetails = useCallback((cardId) => {
    const card = kdsCards.find(c => c.id === cardId);
    if (!card) return null;
    
    const order = orders.find(o => o.id === card.orderId);
    const table = tables.find(t => t.id === order?.tableId);
    
    return { order, table };
  }, [kdsCards, orders, tables]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--cafe-border)',
        background: 'var(--cafe-bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
              Ready for Pickup
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
              {readyCards.length} order{readyCards.length !== 1 ? 's' : ''} ready
            </div>
          </div>
          
          {readyCards.some(card => getPriority(card.readyAt) === 'critical') && (
            <div style={{
              padding: '4px 12px',
              background: 'var(--cafe-danger-bg)',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cafe-danger)'
            }}>
              Priority
            </div>
          )}
        </div>
      </div>

      {/* Ready Cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {readyCards.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--cafe-text-tertiary)',
            fontSize: 14
          }}>
            No orders ready for pickup
          </div>
        ) : (
          readyCards
            .sort((a, b) => {
              // Sort by priority (critical first), then by ready time (oldest first)
              const priorityA = getPriority(a.readyAt);
              const priorityB = getPriority(b.readyAt);
              const priorityOrder = { critical: 0, high: 1, normal: 2 };
              
              if (priorityOrder[priorityA] !== priorityOrder[priorityB]) {
                return priorityOrder[priorityA] - priorityOrder[priorityB];
              }
              
              return a.readyAt - b.readyAt;
            })
            .map(card => {
              const { order, table } = getOrderDetails(card.id);
              const priority = getPriority(card.readyAt);
              const pickupTime = getPickupTime(card.readyAt);
              
              return (
                <div
                  key={card.id}
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    background: priority === 'critical' 
                      ? 'var(--cafe-danger-bg)' 
                      : 'var(--cafe-success-bg)',
                    border: priority === 'critical' 
                      ? '1px solid var(--cafe-danger-border)' 
                      : '1px solid var(--cafe-success-border)',
                    borderRadius: 12,
                    animation: priority === 'critical' ? 'pulse 1s infinite' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                          Table {table?.id}
                        </div>
                        {statusBadge('READY')}
                      </div>
                      
                      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>
                        Order #{order?.id}
                      </div>
                      
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
                        {card.itemName} × {card.quantity}
                      </div>
                      
                      {card.notes && (
                        <div style={{
                          padding: 8,
                          background: 'var(--cafe-bg-surface)',
                          borderRadius: 6,
                          fontSize: 11,
                          color: 'var(--cafe-text-secondary)',
                          marginBottom: 8
                        }}>
                          <strong>Kitchen Note:</strong> {card.notes}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                          Station: {card.station}
                        </div>
                        <div style={{ 
                          padding: '2px 8px',
                          background: 'var(--cafe-bg-surface)',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                          color: getPriorityColor(priority)
                        }}>
                          {priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginLeft: 12 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: getPriorityColor(priority) }}>
                        {pickupTime}m
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>
                        waiting
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCollect(card.id)}
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: 'var(--cafe-success)',
                      border: 'none',
                      borderRadius: 8,
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    Collect Order
                  </button>
                </div>
              );
            })
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default ReadyForPickup;
