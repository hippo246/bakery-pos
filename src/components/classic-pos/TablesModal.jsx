import { useMemo, useEffect, useState } from 'react';

export default function TablesModal({ tables, onSelectTable, onClose }) {
  const [realTables, setRealTables] = useState([]);

  useEffect(() => {
    if (!tables || tables.length === 0) {
      try {
        const storedTables = localStorage.getItem('cafeos_tables');
        if (storedTables) {
          const parsedTables = JSON.parse(storedTables);
          setRealTables(parsedTables);
        }
      } catch (error) {
        console.error('[TablesModal] Failed to load tables:', error);
      }
    }
  }, [tables]);

  const displayTables = tables && tables.length > 0 ? tables : realTables;

  const tableData = useMemo(() => {
    if (displayTables.length > 0) {
      return displayTables;
    }
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      number: `T${i + 1}`,
      active: i % 3 === 0,
      customer: i % 3 === 0 ? `Customer ${i + 1}` : null,
      amount: i % 3 === 0 ? ((i * 50 + 100).toFixed(2)) : null,
      seats: (i % 4) + 2,
    }));
  }, [displayTables]);

  const modalOverlayStyle = {
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
  };

  const modalStyle = {
    background: 'var(--classic-pos-modal-bg)',
    border: '2px solid var(--classic-pos-modal-border)',
    borderRadius: '8px',
    width: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle = {
    background: 'var(--classic-pos-modal-header-bg)',
    padding: '16px 20px',
    borderBottom: '2px solid var(--classic-pos-modal-header-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
  };

  const closeButtonStyle = {
    background: 'var(--classic-pos-close-btn-bg)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const contentStyle = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
  };

  const tableCardStyle = {
    background: 'var(--classic-pos-table-avail-bg)',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'var(--classic-pos-card-border)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: '100px',
  };

  const tableNumberStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
    marginBottom: '8px',
  };

  const tableStatusStyle = {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '4px',
  };

  const tableInfoStyle = {
    fontSize: '11px',
    color: 'var(--classic-pos-code-color)',
    marginTop: '8px',
  };

  const activeStyle = {
    ...tableCardStyle,
    background: 'var(--classic-pos-table-active-bg)',
    borderColor: 'var(--classic-pos-table-active-border)',
  };

  const activeStatusStyle = {
    ...tableStatusStyle,
    background: 'var(--classic-pos-status-active-bg)',
    color: 'var(--classic-pos-status-active-text)',
  };

  const inactiveStatusStyle = {
    ...tableStatusStyle,
    background: 'var(--classic-pos-status-inactive-bg)',
    color: 'var(--classic-pos-status-inactive-text)',
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Tables</span>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-hover)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-bg)'; }}
          >
            Close
          </button>
        </div>
        <div style={contentStyle}>
          <div style={gridStyle}>
            {tableData.map((table) => (
              <div
                key={table.id}
                style={table.active ? activeStyle : tableCardStyle}
                onClick={() => onSelectTable(table)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={tableNumberStyle}>{table.number}</div>
                <div style={table.active ? activeStatusStyle : inactiveStatusStyle}>
                  {table.active ? 'OCCUPIED' : 'AVAILABLE'}
                </div>
                {table.active && (
                  <div style={tableInfoStyle}>
                    {table.customer && <div>{table.customer}</div>}
                    {table.amount && <div>₹{table.amount}</div>}
                  </div>
                )}
                <div style={tableInfoStyle}>{table.seats} seats</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
