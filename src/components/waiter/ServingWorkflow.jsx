/**
 * Serving Workflow Component
 * Allows waiters to track order delivery from collection to customer confirmation
 * Tracks timestamps for collected, serving, delivered, customer confirmed, and completed
 */

import React, { useState, useCallback, useMemo } from 'react';
import { statusBadge } from '../../styles/theme';
import moduleEventPublisher from '../../dashboard/liveEngine/ModuleEventPublisher.js';

function ServingWorkflow({
  selectedTable,
  selectedOrder,
  orders,
  setOrders,
  kdsCards,
  currentShift
}) {
  // Serving state for the selected order
  const [servingState, setServingState] = useState({
    collected: false,
    collectedAt: null,
    serving: false,
    servingAt: null,
    delivered: false,
    deliveredAt: null,
    customerConfirmed: false,
    customerConfirmedAt: null,
    completed: false,
    completedAt: null
  });

  // Initialize serving state when order changes
  React.useEffect(() => {
    if (selectedOrder) {
      setServingState({
        collected: selectedOrder.servingState?.collected || false,
        collectedAt: selectedOrder.servingState?.collectedAt || null,
        serving: selectedOrder.servingState?.serving || false,
        servingAt: selectedOrder.servingState?.servingAt || null,
        delivered: selectedOrder.servingState?.delivered || false,
        deliveredAt: selectedOrder.servingState?.deliveredAt || null,
        customerConfirmed: selectedOrder.servingState?.customerConfirmed || false,
        customerConfirmedAt: selectedOrder.servingState?.customerConfirmedAt || null,
        completed: selectedOrder.servingState?.completed || false,
        completedAt: selectedOrder.servingState?.completedAt || null
      });
    }
  }, [selectedOrder]);

  // Calculate service time
  const serviceTime = useMemo(() => {
    if (!servingState.collectedAt || !servingState.completedAt) return null;
    return Math.round((servingState.completedAt - servingState.collectedAt) / 1000 / 60); // minutes
  }, [servingState]);

  // Handle serving state transitions
  const handleCollected = useCallback(() => {
    const newState = {
      ...servingState,
      collected: true,
      collectedAt: Date.now()
    };
    setServingState(newState);
    
    if (selectedOrder) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, servingState: newState, updatedAt: new Date().toISOString() }
          : order
      ));
    }

    // Publish event for real-time synchronization
    moduleEventPublisher.publishWaiterEvent('waiter.collected', {
      orderId: selectedOrder?.id,
      tableId: selectedTable?.id,
      staffId: currentShift?.staffId
    });
  }, [servingState, selectedOrder, selectedTable, currentShift, setOrders]);

  const handleServing = useCallback(() => {
    const newState = {
      ...servingState,
      serving: true,
      servingAt: Date.now()
    };
    setServingState(newState);
    
    if (selectedOrder) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, servingState: newState, updatedAt: new Date().toISOString() }
          : order
      ));
    }

    // Publish event for real-time synchronization
    moduleEventPublisher.publishWaiterEvent('waiter.serving', {
      orderId: selectedOrder?.id,
      tableId: selectedTable?.id,
      staffId: currentShift?.staffId
    });
  }, [servingState, selectedOrder, selectedTable, currentShift, setOrders]);

  const handleDelivered = useCallback(() => {
    const newState = {
      ...servingState,
      delivered: true,
      deliveredAt: Date.now()
    };
    setServingState(newState);
    
    if (selectedOrder) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, servingState: newState, updatedAt: new Date().toISOString() }
          : order
      ));
    }

    // Publish event for real-time synchronization
    moduleEventPublisher.publishWaiterEvent('waiter.delivered', {
      orderId: selectedOrder?.id,
      tableId: selectedTable?.id,
      staffId: currentShift?.staffId
    });
  }, [servingState, selectedOrder, selectedTable, currentShift, setOrders]);

  const handleCustomerConfirmed = useCallback(() => {
    const newState = {
      ...servingState,
      customerConfirmed: true,
      customerConfirmedAt: Date.now()
    };
    setServingState(newState);
    
    if (selectedOrder) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, servingState: newState, updatedAt: new Date().toISOString() }
          : order
      ));
    }

    // Publish event for real-time synchronization
    moduleEventPublisher.publishWaiterEvent('waiter.customer_confirmed', {
      orderId: selectedOrder?.id,
      tableId: selectedTable?.id,
      staffId: currentShift?.staffId
    });
  }, [servingState, selectedOrder, selectedTable, currentShift, setOrders]);

  const handleCompleted = useCallback(() => {
    const newState = {
      ...servingState,
      completed: true,
      completedAt: Date.now()
    };
    setServingState(newState);
    
    if (selectedOrder) {
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              servingState: newState, 
              status: 'COMPLETED',
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : order
      ));
    }

    // Publish events for real-time synchronization
    moduleEventPublisher.publishOrderEvent('order.served', {
      orderId: selectedOrder?.id,
      tableId: selectedTable?.id,
      staffId: currentShift?.staffId
    });

    moduleEventPublisher.publishTableEvent('table.available', {
      tableId: selectedTable?.id,
      orderId: selectedOrder?.id
    });
  }, [servingState, selectedOrder, selectedTable, currentShift, setOrders]);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Get current step
  const currentStep = useMemo(() => {
    if (servingState.completed) return 'completed';
    if (servingState.customerConfirmed) return 'customerConfirmed';
    if (servingState.delivered) return 'delivered';
    if (servingState.serving) return 'serving';
    if (servingState.collected) return 'collected';
    return 'pending';
  }, [servingState]);

  const steps = [
    { key: 'collected', label: 'Collected', icon: '📦' },
    { key: 'serving', label: 'Serving', icon: '🚶' },
    { key: 'delivered', label: 'Delivered', icon: '🍽️' },
    { key: 'customerConfirmed', label: 'Confirmed', icon: '✓' },
    { key: 'completed', label: 'Completed', icon: '✅' }
  ];

  if (!selectedOrder) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--cafe-text-tertiary)',
        fontSize: 14
      }}>
        Select an order to track serving
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--cafe-border)',
        background: 'var(--cafe-bg-surface)'
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
          Serving Workflow
        </div>
        <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
          Order #{selectedOrder.id} • Table {selectedTable?.id}
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {steps.map((step, index) => {
            const isCompleted = servingState[step.key];
            const isCurrent = currentStep === step.key;
            const isPending = !isCompleted && !isCurrent;
            
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: isCompleted 
                      ? 'var(--cafe-success)' 
                      : isCurrent 
                        ? 'var(--cafe-accent)' 
                        : 'var(--cafe-bg-tertiary)',
                    border: isCurrent ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    marginBottom: 8
                  }}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCompleted 
                      ? 'var(--cafe-success)' 
                      : isCurrent 
                        ? 'var(--cafe-accent)' 
                        : 'var(--cafe-text-tertiary)',
                    textAlign: 'center'
                  }}>
                    {step.label}
                  </div>
                  {isCompleted && (
                    <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                      {formatTime(servingState[step.key + 'At'])}
                    </div>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    background: isCompleted ? 'var(--cafe-success)' : 'var(--cafe-border)',
                    margin: '0 8px 20px 8px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current Action */}
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{
          padding: 24,
          background: 'var(--cafe-bg-surface)',
          border: '1px solid var(--cafe-border)',
          borderRadius: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {steps.find(s => s.key === currentStep)?.icon}
          </div>
          
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 8 }}>
            {steps.find(s => s.key === currentStep)?.label}
          </div>
          
          <div style={{ fontSize: 14, color: 'var(--cafe-text-tertiary)', marginBottom: 24 }}>
            {currentStep === 'pending' && 'Ready to collect from kitchen'}
            {currentStep === 'collected' && 'Order collected, ready to serve'}
            {currentStep === 'serving' && 'On the way to table'}
            {currentStep === 'delivered' && 'Order delivered to table'}
            {currentStep === 'customerConfirmed' && 'Customer confirmed receipt'}
            {currentStep === 'completed' && 'Order completed successfully'}
          </div>

          {/* Action Buttons */}
          {!servingState.collected && (
            <button
              onClick={handleCollected}
              style={{
                padding: 12,
                background: 'var(--cafe-accent)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Mark as Collected
            </button>
          )}

          {servingState.collected && !servingState.serving && (
            <button
              onClick={handleServing}
              style={{
                padding: 12,
                background: 'var(--cafe-accent)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Start Serving
            </button>
          )}

          {servingState.serving && !servingState.delivered && (
            <button
              onClick={handleDelivered}
              style={{
                padding: 12,
                background: 'var(--cafe-accent)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Mark as Delivered
            </button>
          )}

          {servingState.delivered && !servingState.customerConfirmed && (
            <button
              onClick={handleCustomerConfirmed}
              style={{
                padding: 12,
                background: 'var(--cafe-accent)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Customer Confirmed
            </button>
          )}

          {servingState.customerConfirmed && !servingState.completed && (
            <button
              onClick={handleCompleted}
              style={{
                padding: 12,
                background: 'var(--cafe-success)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Complete Order
            </button>
          )}

          {servingState.completed && (
            <div style={{
              padding: 12,
              background: 'var(--cafe-success-bg)',
              border: '1px solid var(--cafe-success-border)',
              borderRadius: 8,
              color: 'var(--cafe-success)',
              fontSize: 14,
              fontWeight: 600
            }}>
              ✓ Order Completed
            </div>
          )}
        </div>

        {/* Service Time */}
        {serviceTime && (
          <div style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--cafe-bg-surface)',
            border: '1px solid var(--cafe-border)',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                Total Service Time
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                {serviceTime} minutes
              </div>
            </div>
            <div style={{ fontSize: 24 }}>
              ⏱️
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServingWorkflow;
