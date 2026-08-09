/**
 * AccessibleKitchen.jsx
 * Accessibility wrapper for Kitchen Display System (KDS) components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for kitchen operations
 */

import { useState, useEffect, useRef } from 'react';
import {
  AccessibleCard,
  AccessibleList,
  AccessibleListItem,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleProgress,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleKitchen - Main kitchen wrapper with full accessibility
 */
export const AccessibleKitchen = ({ children, title = "Kitchen Display System" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="kitchen-content" />
      <div role="main" id="kitchen-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleKitchenOrder - Kitchen order ticket with full accessibility
 */
export const AccessibleKitchenOrder = ({ 
  order, 
  onStart, 
  onComplete, 
  onPriorityChange,
  isSelected = false,
  isUrgent = false 
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (order.status === 'IN_PROGRESS') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [order.status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusLabels = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  const ariaLabel = `Order ${order.id}, table ${order.tableNumber}, ${order.items.length} items, status ${statusLabels[order.status]}, ${isUrgent ? 'urgent' : 'normal priority'}, elapsed time ${formatTime(elapsedTime)}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={true}
      onClick={() => onStart?.(order.id)}
      isSelected={isSelected}
      style={{
        backgroundColor: isUrgent ? '#FEF2F2' : '#FFFFFF',
        border: `2px solid ${isUrgent ? '#E63946' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>
            Order #{order.id}
          </h3>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Table {order.tableNumber} • {order.orderType}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <AccessibleStatus 
            status={isUrgent ? 'warning' : 'info'} 
            ariaLabel={isUrgent ? 'Urgent order' : 'Normal priority'}
          />
          <div style={{ fontSize: '12px', marginTop: '4px' }} aria-live="polite">
            ⏱️ {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      <AccessibleList ariaLabel={`Order ${order.id} items`} isGrid={false}>
        {order.items.map((item, index) => (
          <AccessibleListItem
            key={index}
            ariaLabel={`${item.name}, quantity ${item.quantity}, ${item.modifications ? 'with modifications' : 'no modifications'}`}
            isInteractive={false}
            style={{
              padding: '8px',
              backgroundColor: '#F8F9FA',
              borderRadius: '4px',
              marginBottom: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name}</span>
              {item.modifications && (
                <span aria-label="Has modifications">✏️</span>
              )}
            </div>
            {item.modifications && (
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {item.modifications}
              </div>
            )}
          </AccessibleListItem>
        ))}
      </AccessibleList>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {order.status === 'PENDING' && (
          <AccessibleButton
            onClick={() => onStart(order.id)}
            ariaLabel={`Start order ${order.id}`}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#E63946',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ▶️ Start
          </AccessibleButton>
        )}
        {order.status === 'IN_PROGRESS' && (
          <AccessibleButton
            onClick={() => onComplete(order.id)}
            ariaLabel={`Complete order ${order.id}`}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2ECC71',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✓ Complete
          </AccessibleButton>
        )}
        <AccessibleButton
          onClick={() => onPriorityChange?.(order.id)}
          ariaLabel={`Change priority for order ${order.id}`}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FFD166',
            color: '#1A1A1A',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ⚡ Priority
        </AccessibleButton>
      </div>
    </AccessibleCard>
  );
};

/**
 * AccessibleKitchenStation - Kitchen station with accessibility
 */
export const AccessibleKitchenStation = ({ 
  station, 
  orders, 
  onOrderAction,
  isActive = true 
}) => {
  const ariaLabel = `${station.name} station, ${orders.length} orders, ${isActive ? 'active' : 'inactive'}`;

  return (
    <section
      aria-label={ariaLabel}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>
          {station.icon} {station.name}
        </h2>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {orders.length} orders
        </div>
      </div>

      <AccessibleList ariaLabel={`${station.name} orders`} isGrid={false}>
        {orders.map(order => (
          <AccessibleKitchenOrder
            key={order.id}
            order={order}
            onStart={onOrderAction}
            onComplete={onOrderAction}
            onPriorityChange={onOrderAction}
          />
        ))}
      </AccessibleList>
    </section>
  );
};

/**
 * AccessibleKitchenTimer - Countdown timer with accessibility
 */
export const AccessibleKitchenTimer = ({ 
  timeRemaining, 
  totalTime, 
  label = "Time remaining" 
}) => {
  const percentage = (timeRemaining / totalTime) * 100;
  const isCritical = percentage < 20;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${label}: ${Math.floor(timeRemaining / 60)} minutes ${timeRemaining % 60} seconds remaining`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <AccessibleProgress
        value={totalTime - timeRemaining}
        max={totalTime}
        ariaLabel={label}
      />
      <div 
        style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: isCritical ? '#E63946' : '#1A1A1A' 
        }}
      >
        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};

/**
 * AccessibleKitchenFilter - Filter controls with accessibility
 */
export const AccessibleKitchenFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter orders" 
}) => {
  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}
    >
      {filters.map(filter => (
        <AccessibleButton
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          ariaLabel={`Filter by ${filter.label}`}
          aria-pressed={activeFilter === filter.id}
          style={{
            padding: '8px 16px',
            backgroundColor: activeFilter === filter.id ? '#E63946' : '#FFFFFF',
            color: activeFilter === filter.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {filter.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{filter.icon}</span>}
          {filter.label}
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessibleKitchenAnnouncer - Live region for kitchen updates
 */
export const AccessibleKitchenAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="assertive" ariaLabel="Kitchen update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleKitchenStats - Kitchen statistics with accessibility
 */
export const AccessibleKitchenStats = ({ stats }) => {
  return (
    <section
      aria-label="Kitchen statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Pending orders: ${stats.pending}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>PENDING</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.pending}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`In progress: ${stats.inProgress}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>IN PROGRESS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD166' }} aria-live="polite">
          {stats.inProgress}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Completed: ${stats.completed}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>COMPLETED</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.completed}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Average prep time: ${stats.avgPrepTime}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>AVG PREP TIME</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#3498DB' }} aria-live="polite">
          {stats.avgPrepTime}
        </div>
      </AccessibleCard>
    </section>
  );
};

export default {
  AccessibleKitchen,
  AccessibleKitchenOrder,
  AccessibleKitchenStation,
  AccessibleKitchenTimer,
  AccessibleKitchenFilter,
  AccessibleKitchenAnnouncer,
  AccessibleKitchenStats,
};
