/**
 * AccessibleTables.jsx
 * Accessibility wrapper for Table Management components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for table operations
 */

import {
  AccessibleCard,
  AccessibleList,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleTables - Main tables wrapper with full accessibility
 */
export const AccessibleTables = ({ children, title = "Table Management" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="tables-content" />
      <div role="main" id="tables-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleTableCard - Individual table card with accessibility
 */
export const AccessibleTableCard = ({ 
  table, 
  onClick, 
  onHold, 
  onReserve,
  isSelected = false 
}) => {
  const statusLabels = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    CLEANING: 'Cleaning',
    BILL_REQUESTED: 'Bill requested',
  };

  const statusColors = {
    AVAILABLE: '#2ECC71',
    OCCUPIED: '#E63946',
    RESERVED: '#FFD166',
    CLEANING: '#3498DB',
    BILL_REQUESTED: '#9B59B6',
  };

  const ariaLabel = `Table ${table.number}, capacity ${table.capacity} guests, status ${statusLabels[table.status] || table.status}${table.guests ? `, ${table.guests} guests seated` : ''}${table.time ? `, seated for ${table.time}` : ''}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#FFFFFF',
        border: `2px solid ${statusColors[table.status] || '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: table.status === 'CLEANING' ? 0.6 : 1,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div 
          style={{ 
            fontSize: '32px', 
            fontWeight: '900', 
            color: statusColors[table.status] || '#1A1A1A' 
          }}
          aria-label={`Table number ${table.number}`}
        >
          {table.number}
        </div>
        <AccessibleStatus 
          status={table.status === 'AVAILABLE' ? 'success' : table.status === 'OCCUPIED' ? 'error' : 'info'}
          ariaLabel={`Status: ${statusLabels[table.status] || table.status}`}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Capacity: {table.capacity}
        </div>
        {table.guests && (
          <div style={{ fontSize: '12px', color: '#666' }} aria-label={`${table.guests} guests`}>
            👥 {table.guests} guests
          </div>
        )}
        {table.time && (
          <div style={{ fontSize: '12px', color: '#666' }} aria-label={`Seated for ${table.time}`}>
            ⏱️ {table.time}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
        {table.status === 'AVAILABLE' && (
          <AccessibleButton
            onClick={() => onReserve?.(table.id)}
            ariaLabel={`Reserve table ${table.number}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#FFD166',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reserve
          </AccessibleButton>
        )}
        {table.status === 'OCCUPIED' && (
          <AccessibleButton
            onClick={() => onHold?.(table.id)}
            ariaLabel={`Hold table ${table.number}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#3498DB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Hold
          </AccessibleButton>
        )}
      </div>
    </AccessibleCard>
  );
};

/**
 * AccessibleTableGrid - Grid of tables with accessibility
 */
export const AccessibleTableGrid = ({ tables, onTableAction, ariaLabel = "Tables" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={true}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px',
      }}
    >
      {tables.map(table => (
        <AccessibleTableCard
          key={table.id}
          table={table}
          onClick={() => onTableAction?.('select', table.id)}
          onHold={() => onTableAction?.('hold', table.id)}
          onReserve={() => onTableAction?.('reserve', table.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleTableFilter - Filter controls for tables
 */
export const AccessibleTableFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter tables" 
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
          ariaLabel={`Show ${filter.label} tables`}
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
 * AccessibleTableStats - Table statistics with accessibility
 */
export const AccessibleTableStats = ({ stats }) => {
  return (
    <section
      aria-label="Table statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Total tables: ${stats.total}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL TABLES</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.total}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Available: ${stats.available}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>AVAILABLE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.available}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Occupied: ${stats.occupied}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>OCCUPIED</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.occupied}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Reserved: ${stats.reserved}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>RESERVED</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD166' }} aria-live="polite">
          {stats.reserved}
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleTableAnnouncer - Live region for table updates
 */
export const AccessibleTableAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Table update">
      {message}
    </AccessibleLiveRegion>
  );
};

export default {
  AccessibleTables,
  AccessibleTableCard,
  AccessibleTableGrid,
  AccessibleTableFilter,
  AccessibleTableStats,
  AccessibleTableAnnouncer,
};
