/**
 * Order Workflow Component
 * Allows waiters to take, modify, and manage orders for their assigned tables
 * Integrates with Orders module and Kitchen module
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { C, card, btn, input, label, statusBadge } from '../../styles/theme';
import moduleEventPublisher from '../../dashboard/liveEngine/ModuleEventPublisher.js';

function OrderWorkflow({
  selectedTable,
  selectedOrder,
  orders,
  setOrders,
  menuItems,
  kdsCards,
  setKdsCards,
  tables,
  setTables,
  inventory,
  setInventory,
  customers,
  setCustomers,
  currentShift
}) {
  const [cart, setCart] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [allergies, setAllergies] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [showItemModal, setShowItemModal] = useState(null);
  const [itemNotes, setItemNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize cart when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setCart(selectedOrder.items || []);
      setOrderNotes(selectedOrder.notes || '');
      setSpecialRequests(selectedOrder.specialRequests || '');
      setAllergies(selectedOrder.allergies || '');
      setCustomerName(selectedOrder.customerName || '');
      setGuestCount(selectedOrder.guests || 1);
    } else if (selectedTable) {
      setCart([]);
      setOrderNotes('');
      setSpecialRequests('');
      setAllergies('');
      setCustomerName(selectedTable.reservationName || '');
      setGuestCount(selectedTable.guests || 1);
    }
  }, [selectedOrder, selectedTable]);

  // Filter menu items
  const filteredMenuItems = useMemo(() => {
    let items = menuItems || [];
    
    if (categoryFilter !== 'All') {
      items = items.filter(item => item.category === categoryFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    return items;
  }, [menuItems, categoryFilter, searchQuery]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Add item to cart
  const handleAddToCart = useCallback((menuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        notes: '',
        category: menuItem.category
      }];
    });
  }, []);

  // Remove item from cart
  const handleRemoveFromCart = useCallback((itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Update item quantity
  const handleUpdateQuantity = useCallback((itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, []);

  // Update item notes
  const handleUpdateItemNotes = useCallback((itemId, notes) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  }, []);

  // Submit order to kitchen
  const handleSubmitOrder = useCallback(async () => {
    if (cart.length === 0) return;
    
    setIsSubmitting(true);

    const newOrder = {
      id: Date.now(),
      tableId: selectedTable.id,
      items: cart,
      total: cartTotal,
      notes: orderNotes,
      specialRequests: specialRequests,
      allergies: allergies,
      customerName: customerName,
      guests: guestCount,
      staffId: currentShift?.staffId,
      staffName: currentShift?.staffName,
      status: 'NEW',
      paymentStatus: 'UNPAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to orders
    setOrders(prev => [...prev, newOrder]);

    // Update table status
    setTables(prev => prev.map(table => 
      table.id === selectedTable.id 
        ? { ...table, status: 'OCCUPIED', occupiedAt: Date.now(), guests: guestCount }
        : table
    ));

    // Create KDS tickets
    const kdsTickets = cart.map(item => ({
      id: Date.now() + Math.random(),
      orderId: newOrder.id,
      itemId: item.id,
      itemName: item.name,
      quantity: item.quantity,
      notes: item.notes,
      station: getStationForCategory(item.category),
      status: 'PENDING',
      createdAt: Date.now()
    }));

    setKdsCards(prev => [...prev, ...kdsTickets]);

    // Publish events for real-time synchronization
    moduleEventPublisher.publishOrderEvent('order.created', {
      orderId: newOrder.id,
      tableId: selectedTable.id,
      amount: cartTotal,
      staffId: currentShift?.staffId
    });

    moduleEventPublisher.publishTableEvent('table.occupied', {
      tableId: selectedTable.id,
      orderId: newOrder.id,
      guests: guestCount
    });

    moduleEventPublisher.publishKitchenEvent('kitchen.started', {
      orderId: newOrder.id,
      tickets: kdsTickets
    });

    // Clear cart
    setCart([]);
    setOrderNotes('');
    setSpecialRequests('');
    setAllergies('');
    setIsSubmitting(false);
  }, [
    cart, 
    cartTotal, 
    orderNotes, 
    specialRequests, 
    allergies, 
    customerName, 
    guestCount, 
    selectedTable, 
    currentShift, 
    setOrders, 
    setTables, 
    setKdsCards
  ]);

  // Modify existing order
  const handleModifyOrder = useCallback(async () => {
    if (!selectedOrder || cart.length === 0) return;
    
    setIsSubmitting(true);

    const updatedOrder = {
      ...selectedOrder,
      items: cart,
      total: cartTotal,
      notes: orderNotes,
      specialRequests: specialRequests,
      allergies: allergies,
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => prev.map(order => 
      order.id === selectedOrder.id ? updatedOrder : order
    ));

    // Update KDS cards if order status is not completed
    if (selectedOrder.status !== 'COMPLETED') {
      const existingKdsCards = kdsCards.filter(card => card.orderId === selectedOrder.id);
      
      // Remove old KDS cards
      setKdsCards(prev => prev.filter(card => card.orderId !== selectedOrder.id));
      
      // Create new KDS tickets
      const newKdsTickets = cart.map(item => ({
        id: Date.now() + Math.random(),
        orderId: selectedOrder.id,
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        notes: item.notes,
        station: getStationForCategory(item.category),
        status: 'PENDING',
        createdAt: Date.now()
      }));

      setKdsCards(prev => [...prev, ...newKdsTickets]);
    }

    setIsSubmitting(false);
  }, [
    selectedOrder, 
    cart, 
    cartTotal, 
    orderNotes, 
    specialRequests, 
    allergies, 
    orders, 
    setOrders, 
    kdsCards, 
    setKdsCards
  ]);

  // Cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrder) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    setOrders(prev => prev.map(order => 
      order.id === selectedOrder.id 
        ? { ...order, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
        : order
    ));

    // Cancel KDS cards
    setKdsCards(prev => prev.map(card => 
      card.orderId === selectedOrder.id 
        ? { ...card, status: 'CANCELLED' }
        : card
    ));
  }, [selectedOrder, setOrders, setKdsCards]);

  // Helper function to determine kitchen station
  const getStationForCategory = (category) => {
    const stationMap = {
      'Coffee': 'hot',
      'Food': 'grill',
      'Special': 'prep',
      'Popular': 'hot'
    };
    return stationMap[category] || 'prep';
  };

  // Get unique categories from menu
  const categories = useMemo(() => {
    const cats = new Set(menuItems?.map(item => item.category) || []);
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Order Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid var(--cafe-border)',
        background: 'var(--cafe-bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
              {selectedOrder ? `Modify Order #${selectedOrder.id}` : 'New Order'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
              Table {selectedTable?.id} • {guestCount} guests
            </div>
          </div>
          
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)' }}>
            ₹{cartTotal}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--cafe-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginBottom: 4, display: 'block' }}>
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid var(--cafe-border)',
                background: 'var(--cafe-bg-primary)',
                color: 'var(--cafe-text-primary)',
                fontSize: 13
              }}
            />
          </div>
          
          <div>
            <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginBottom: 4, display: 'block' }}>
              Guests
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid var(--cafe-border)',
                background: 'var(--cafe-bg-primary)',
                color: 'var(--cafe-text-primary)',
                fontSize: 13
              }}
            />
          </div>
        </div>
        
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginBottom: 4, display: 'block' }}>
            Allergies
          </label>
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Allergies or dietary restrictions"
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              border: '1px solid var(--cafe-border)',
              background: 'var(--cafe-bg-primary)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13
            }}
          />
        </div>
      </div>

      {/* Cart */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
          Order Items ({cart.length})
        </div>
        
        {cart.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--cafe-text-tertiary)',
            fontSize: 14
          }}>
            No items in order
          </div>
        ) : (
          cart.map(item => (
            <div
              key={item.id}
              style={{
                padding: 12,
                marginBottom: 8,
                background: 'var(--cafe-bg-surface)',
                border: '1px solid var(--cafe-border)',
                borderRadius: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                    ₹{item.price} × {item.quantity}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      border: '1px solid var(--cafe-border)',
                      background: 'var(--cafe-bg-primary)',
                      color: 'var(--cafe-text-primary)',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', minWidth: 24, textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      border: '1px solid var(--cafe-border)',
                      background: 'var(--cafe-bg-primary)',
                      color: 'var(--cafe-text-primary)',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                  
                  <button
                    onClick={() => setShowItemModal(item)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--cafe-border)',
                      background: 'var(--cafe-bg-primary)',
                      color: 'var(--cafe-text-secondary)',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Note
                  </button>
                  
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      border: '1px solid var(--cafe-danger-border)',
                      background: 'var(--cafe-danger-bg)',
                      color: 'var(--cafe-danger)',
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Menu Items */}
      <div style={{ 
        height: 200, 
        borderTop: '1px solid var(--cafe-border)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Menu Header */}
        <div style={{
          padding: 12,
          borderBottom: '1px solid var(--cafe-border)',
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: 6,
              borderRadius: 6,
              border: '1px solid var(--cafe-border)',
              background: 'var(--cafe-bg-primary)',
              color: 'var(--cafe-text-primary)',
              fontSize: 12
            }}
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: '1px solid var(--cafe-border)',
              background: 'var(--cafe-bg-primary)',
              color: 'var(--cafe-text-primary)',
              fontSize: 12
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        {/* Menu Grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {filteredMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                style={{
                  padding: 12,
                  background: 'var(--cafe-bg-surface)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-accent)', marginTop: 4 }}>
                  ₹{item.price}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Notes & Actions */}
      <div style={{
        padding: 16,
        borderTop: '1px solid var(--cafe-border)',
        background: 'var(--cafe-bg-surface)'
      }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginBottom: 4, display: 'block' }}>
            Special Requests
          </label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requests for this order..."
            rows={2}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 6,
              border: '1px solid var(--cafe-border)',
              background: 'var(--cafe-bg-primary)',
              color: 'var(--cafe-text-primary)',
              fontSize: 13,
              resize: 'none'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedOrder ? (
            <>
              <button
                onClick={handleModifyOrder}
                disabled={isSubmitting || cart.length === 0}
                style={{
                  flex: 1,
                  padding: 12,
                  background: isSubmitting || cart.length === 0 
                    ? 'var(--cafe-bg-tertiary)' 
                    : 'var(--cafe-accent)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Updating...' : 'Update Order'}
              </button>
              
              <button
                onClick={handleCancelOrder}
                style={{
                  padding: 12,
                  background: 'var(--cafe-danger-bg)',
                  border: '1px solid var(--cafe-danger-border)',
                  borderRadius: 6,
                  color: 'var(--cafe-danger)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cart.length === 0}
              style={{
                flex: 1,
                padding: 12,
                background: isSubmitting || cart.length === 0 
                  ? 'var(--cafe-bg-tertiary)' 
                  : 'var(--cafe-success)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting || cart.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Send to Kitchen'}
            </button>
          )}
        </div>
      </div>

      {/* Item Notes Modal */}
      {showItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--cafe-bg-surface)',
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxWidth: '90%'
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
              Add Note for {showItemModal.name}
            </div>
            
            <textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Special instructions for this item..."
              rows={3}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--cafe-border)',
                background: 'var(--cafe-bg-primary)',
                color: 'var(--cafe-text-primary)',
                fontSize: 14,
                resize: 'none',
                marginBottom: 16
              }}
            />
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  handleUpdateItemNotes(showItemModal.id, itemNotes);
                  setShowItemModal(null);
                  setItemNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--cafe-accent)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              
              <button
                onClick={() => {
                  setShowItemModal(null);
                  setItemNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  background: 'var(--cafe-bg-tertiary)',
                  border: '1px solid var(--cafe-border)',
                  borderRadius: 6,
                  color: 'var(--cafe-text-primary)',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderWorkflow;
