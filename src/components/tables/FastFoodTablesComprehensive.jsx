/**
 * FastFoodTablesComprehensive.jsx
 * Comprehensive Tables/Floor Plan for dine-in capacity
 */

import { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import {
  AccessibleTables,
  AccessibleTableGrid,
  AccessibleTableFilter,
  AccessibleTableStats,
} from '../accessibility';

export default function FastFoodTablesComprehensive() {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Table data
  const tableData = useMemo(() => [
    { id: 'T1', capacity: 4, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T2', capacity: 2, status: 'OCCUPIED', guests: 2, time: '0:15' },
    { id: 'T3', capacity: 6, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T4', capacity: 4, status: 'OCCUPIED', guests: 3, time: '0:45' },
    { id: 'T5', capacity: 4, status: 'RESERVED', guests: 0, time: null },
    { id: 'T6', capacity: 2, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T7', capacity: 8, status: 'OCCUPIED', guests: 6, time: '1:20' },
    { id: 'T8', capacity: 4, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T9', capacity: 6, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T10', capacity: 4, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T11', capacity: 4, status: 'AVAILABLE', guests: 0, time: null },
    { id: 'T12', capacity: 8, status: 'AVAILABLE', guests: 0, time: null },
  ], []);

  // Filter tables
  const filteredTables = useMemo(() => {
    if (selectedFilter === 'ALL') return tableData;
    return tableData.filter(table => table.status === selectedFilter);
  }, [tableData, selectedFilter]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: tableData.length,
    available: tableData.filter(t => t.status === 'AVAILABLE').length,
    occupied: tableData.filter(t => t.status === 'OCCUPIED').length,
    reserved: tableData.filter(t => t.status === 'RESERVED').length,
    totalCapacity: tableData.reduce((sum, t) => sum + t.capacity, 0),
    currentGuests: tableData.filter(t => t.status === 'OCCUPIED').reduce((sum, t) => sum + t.guests, 0),
  }), [tableData]);

  // Handler functions
  const handleNewGuest = () => {
    setAlertDialog({ isOpen: true, title: 'New Guest', message: 'Opening new guest form...', type: 'info' });
  };

  const handleCallWaiter = () => {
    setAlertDialog({ isOpen: true, title: 'Call Waiter', message: 'Calling waiter...', type: 'info' });
  };

  const handleCleanTable = () => {
    setAlertDialog({ isOpen: true, title: 'Clean Table', message: 'Marking table for cleaning...', type: 'info' });
  };

  const handleViewReservations = () => {
    setAlertDialog({ isOpen: true, title: 'Reservations', message: 'Opening reservations...', type: 'info' });
  };

  const handleTableClick = (table) => {
    setAlertDialog({ isOpen: true, title: 'Table Status', message: `Table ${table.id}: ${table.status}`, type: 'info' });
  };
  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { backgroundColor: '#2ECC71', color: '#FFFFFF' };
      case 'OCCUPIED':
        return { backgroundColor: '#E63946', color: '#FFFFFF' };
      case 'RESERVED':
        return { backgroundColor: '#FFD166', color: '#1A1A1A' };
      case 'DIRTY':
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF', color: '#1A1A1A' };
    }
  };

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
    fontFamily: 'Inter, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '900',
    fontSize: '12px',
  };

  const statsBarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const statCardStyle = {
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
  };

  const statLabelStyle = {
    fontSize: '10px',
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  const statValueStyle = {
    fontSize: '18px',
    fontWeight: '900',
    color: '#E63946',
  };

  const filterBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFD166',
    borderBottom: '2px solid #E63946',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
  };

  const tablesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '8px',
  };

  const tableCardStyle = (status) => ({
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const tableNumberStyle = {
    fontSize: '24px',
    fontWeight: '900',
    color: '#E63946',
  };

  const tableIconStyle = {
    fontSize: '20px',
    marginBottom: '4px',
  };

  const tableCapacityStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: '#666666',
    marginBottom: '6px',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const guestInfoStyle = {
    fontSize: '11px',
    color: '#666666',
    marginTop: '4px',
  };

  const timeStyle = {
    fontSize: '9px',
    color: '#999999',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderTop: '2px solid #E63946',
  };

  const actionButtonStyle = {
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const secondaryButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#FFD166',
    color: '#1A1A1A',
  };

  return (
    <AccessibleTables title="Floor Plan - Dine-in Capacity">
      {/* Header */}
      <div style={headerStyle}>
        <span>🍽️ FLOOR PLAN - DINE-IN CAPACITY</span>
        <span>8/12 TABLES OCCUPIED</span>
      </div>

      {/* Stats Bar */}
      <AccessibleTableStats stats={stats} />

      {/* Filter Bar */}
      <AccessibleTableFilter
        filters={[
          { id: 'ALL', label: 'AVAILABLE', icon: '🟢' },
          { id: 'OCCUPIED', label: 'OCCUPIED', icon: '🔴' },
          { id: 'RESERVED', label: 'RESERVED', icon: '🟡' },
          { id: 'DIRTY', label: 'DIRTY', icon: '⚪' },
        ]}
        activeFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Main Content */}
      <div style={mainContentStyle}>
        <AccessibleTableGrid
          tables={filteredTables}
          onTableAction={(action, tableId) => {
            const table = tableData.find(t => t.id === tableId);
            if (table) handleTableClick(table);
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        <button onClick={handleNewGuest} style={actionButtonStyle}>➕ NEW GUEST</button>
        <button onClick={handleCallWaiter} style={secondaryButtonStyle}>🔔 CALL WAITER</button>
        <button onClick={handleCleanTable} style={secondaryButtonStyle}>🧹 CLEAN TABLE</button>
        <button onClick={handleViewReservations} style={secondaryButtonStyle}>📋 VIEW RESERVATIONS</button>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </AccessibleTables>
  );
}
