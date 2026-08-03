import React from 'react';
import { useState, useMemo } from "react";
import { SHIFT_STATUS } from "../../domain/shiftModel.js";
import { formatCurrency } from "../../domain/money.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function ShiftHistory({ shifts, onViewShift, onExport }) {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    manager: '',
    cashier: '',
    register: '',
    status: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const isMobile = useIsMobile();

  // Get unique values for filters
  const uniqueManagers = useMemo(() => {
    const managers = new Set(shifts?.map(s => s.managerName).filter(Boolean) || []);
    return Array.from(managers);
  }, [shifts]);

  const uniqueCashiers = useMemo(() => {
    const cashiers = new Set(shifts?.map(s => s.cashierName).filter(Boolean) || []);
    return Array.from(cashiers);
  }, [shifts]);

  const uniqueRegisters = useMemo(() => {
    const registers = new Set(shifts?.map(s => s.registerId).filter(Boolean) || []);
    return Array.from(registers);
  }, [shifts]);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    if (!shifts) return [];

    return shifts.filter(shift => {
      // Date range filter
      if (filters.dateRange === 'today') {
        const today = new Date().toDateString();
        const shiftDate = new Date(shift.openedAt).toDateString();
        if (shiftDate !== today) return false;
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(shift.openedAt) < weekAgo) return false;
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (new Date(shift.openedAt) < monthAgo) return false;
      }

      // Manager filter
      if (filters.manager && shift.managerName !== filters.manager) return false;

      // Cashier filter
      if (filters.cashier && shift.cashierName !== filters.cashier) return false;

      // Register filter
      if (filters.register && shift.registerId !== filters.register) return false;

      // Status filter
      if (filters.status && shift.status !== filters.status) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${shift.id} ${shift.managerName} ${shift.cashierName} ${shift.registerId}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt));
  }, [shifts, filters, searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      manager: '',
      cashier: '',
      register: '',
      status: ''
    });
    setSearchQuery('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Shift History
        </div>
        <button
          onClick={onExport}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer'
          }}
        >
          Export All
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '20px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)'
          }}>
            Filters
          </div>
          <button
            onClick={clearFilters}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              background: 'var(--cafe-bg-elevated)',
              color: 'var(--cafe-text-primary)',
              border: '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-sm)',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <FilterSelect
            label="Date Range"
            value={filters.dateRange}
            onChange={(v) => handleFilterChange('dateRange', v)}
            options={[
              { value: 'all', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' }
            ]}
          />
          <FilterSelect
            label="Manager"
            value={filters.manager}
            onChange={(v) => handleFilterChange('manager', v)}
            options={[{ value: '', label: 'All Managers' }, ...uniqueManagers.map(m => ({ value: m, label: m }))]}
          />
          <FilterSelect
            label="Cashier"
            value={filters.cashier}
            onChange={(v) => handleFilterChange('cashier', v)}
            options={[{ value: '', label: 'All Cashiers' }, ...uniqueCashiers.map(c => ({ value: c, label: c }))]}
          />
          <FilterSelect
            label="Register"
            value={filters.register}
            onChange={(v) => handleFilterChange('register', v)}
            options={[{ value: '', label: 'All Registers' }, ...uniqueRegisters.map(r => ({ value: r, label: r }))]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => handleFilterChange('status', v)}
            options={[
              { value: '', label: 'All Status' },
              { value: SHIFT_STATUS.OPEN, label: 'Open' },
              { value: SHIFT_STATUS.CLOSED, label: 'Closed' },
              { value: SHIFT_STATUS.VOIDED, label: 'Voided' }
            ]}
          />
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, manager, cashier, or register..."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-md)',
              background: 'var(--cafe-bg-elevated)',
              color: 'var(--cafe-text-primary)'
            }}
          />
        </div>
      </div>

      {/* Results Count */}
      <div style={{
        fontSize: '14px',
        color: 'var(--cafe-text-secondary)'
      }}>
        Showing {filteredShifts.length} of {shifts?.length || 0} shifts
      </div>

      {/* Shift List */}
      {filteredShifts.length === 0 ? (
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '40px',
          border: '1px solid var(--cafe-border-light)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: '16px', color: 'var(--cafe-text-secondary)' }}>
            No shifts found matching your filters
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {filteredShifts.map(shift => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              isMobile={isMobile}
              onView={() => onViewShift?.(shift)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '6px'
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: '13px',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 'var(--cafe-radius-md)',
          background: 'var(--cafe-bg-elevated)',
          color: 'var(--cafe-text-primary)'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ShiftCard({ shift, onView, isMobile = false }) {
  const getStatusColor = (status) => {
    switch (status) {
      case SHIFT_STATUS.OPEN: return '#27ae60';
      case SHIFT_STATUS.CLOSED: return '#7f8c8d';
      case SHIFT_STATUS.VOIDED: return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const duration = shift.closedAt 
    ? Math.floor((new Date(shift.closedAt) - new Date(shift.openedAt)) / 60000)
    : Math.floor((new Date() - new Date(shift.openedAt)) / 60000);

  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
      gap: '20px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    onClick={onView}
    onMouseEnter={(e) => e.target.style.borderColor = 'var(--cafe-primary)'}
    onMouseLeave={(e) => e.target.style.borderColor = 'var(--cafe-border-light)'}
    >
      {/* Status Indicator */}
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: getStatusColor(shift.status),
        flexShrink: 0
      }} />

      {/* Main Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)'
          }}>
            {shift.id}
          </span>
          <span style={{
            padding: '4px 8px',
            background: `${getStatusColor(shift.status)}20`,
            color: getStatusColor(shift.status),
            borderRadius: 'var(--cafe-radius-sm)',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {shift.status}
          </span>
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--cafe-text-secondary)',
          marginBottom: '4px'
        }}>
          {shift.managerName} • {shift.cashierName} • {shift.registerId}
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--cafe-text-tertiary)'
        }}>
          {new Date(shift.openedAt).toLocaleString()} • {duration}m
        </div>
      </div>

      {/* Metrics */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: isMobile ? 'space-between' : 'flex-start',
        textAlign: isMobile ? 'left' : 'right'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '2px' }}>
            Net Sales
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)'
          }}>
            {formatCurrency(shift.netSales)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)', marginBottom: '2px' }}>
            Orders
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)'
          }}>
            {shift.orderCount}
          </div>
        </div>
      </div>

      {/* Arrow */}
      {!isMobile && (
        <div style={{
          fontSize: '20px',
          color: 'var(--cafe-text-tertiary)'
        }}>
          →
        </div>
      )}
    </div>
  );
}

export default ShiftHistory;
