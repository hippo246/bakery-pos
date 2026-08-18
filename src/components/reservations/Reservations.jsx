import React, { useState, useEffect } from 'react';

export default function Reservations({ tables, customers, onNavigate }) {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Load reservations from localStorage
    try {
      const savedReservations = localStorage.getItem('bakerypos_reservations');
      if (savedReservations) {
        setReservations(JSON.parse(savedReservations));
      }
    } catch (e) {
      console.error('Failed to load reservations:', e);
    }
  }, []);

  const saveReservations = (newReservations) => {
    setReservations(newReservations);
    localStorage.setItem('bakerypos_reservations', JSON.stringify(newReservations));
  };

  const handleAddReservation = () => {
    setEditingReservation(null);
    setShowForm(true);
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  const handleDeleteReservation = (reservationId) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      saveReservations(reservations.filter(r => r.id !== reservationId));
    }
  };

  const handleSaveReservation = (reservationData) => {
    if (editingReservation) {
      saveReservations(reservations.map(r => r.id === editingReservation.id ? { ...reservationData, id: editingReservation.id } : r));
    } else {
      saveReservations([...reservations, { ...reservationData, id: Date.now(), createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
    setEditingReservation(null);
  };

  const handleStatusChange = (reservationId, newStatus) => {
    saveReservations(reservations.map(r => r.id === reservationId ? { ...r, status: newStatus } : r));
  };

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    const matchesDate = r.date === selectedDate;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  // Calculate statistics
  const todayReservations = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const confirmedToday = todayReservations.filter(r => r.status === 'confirmed').length;
  const pendingToday = todayReservations.filter(r => r.status === 'pending').length;
  const totalGuestsToday = todayReservations.reduce((sum, r) => sum + (r.guests || 0), 0);

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
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Reservations
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Manage table bookings and reservations
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('orders')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
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
          <ReservationForm
            reservation={editingReservation}
            tables={tables}
            customers={customers}
            onSave={handleSaveReservation}
            onCancel={() => {
              setShowForm(false);
              setEditingReservation(null);
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
              <StatCard label="Today's Reservations" value={todayReservations.length} icon="📅" />
              <StatCard label="Confirmed" value={confirmedToday} icon="✅" color="#059669" />
              <StatCard label="Pending" value={pendingToday} icon="⏳" color="#d97706" />
              <StatCard label="Total Guests" value={totalGuestsToday} icon="👥" />
            </div>

            {/* Controls */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      padding: '10px 16px',
                      background: '#ffffff',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
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
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="seated">Seated</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddReservation}
                style={{
                  padding: '12px 24px',
                  background: '#111827',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                + New Reservation
              </button>
            </div>

            {/* Reservations List */}
            <div style={{
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Reservations for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {filteredReservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>No reservations found</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>Create a new reservation to get started</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {filteredReservations.map(reservation => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      onEdit={() => handleEditReservation(reservation)}
                      onDelete={() => handleDeleteReservation(reservation.id)}
                      onStatusChange={handleStatusChange}
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
        <div style={{ fontSize: '18px', fontWeight: '600', color }}>{value}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ reservation, onEdit, onDelete, onStatusChange }) {
  const statusColors = {
    pending: '#d97706',
    confirmed: '#059669',
    seated: '#0891b2',
    completed: '#6b7280',
    cancelled: '#dc2626'
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
            background: statusColors[reservation.status] || '#6b7280',
            color: '#ffffff',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            textTransform: 'capitalize'
          }}>
            {reservation.status}
          </span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {reservation.customerName}
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          {reservation.time} • {reservation.guests} guests • Table {reservation.tableName}
        </div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {reservation.phone} {reservation.email ? `• ${reservation.email}` : ''}
        </div>
        {reservation.notes && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Note: {reservation.notes}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={reservation.status}
          onChange={(e) => onStatusChange(reservation.id, e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="seated">Seated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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

function ReservationForm({ reservation, tables, customers, onSave, onCancel }) {
  const [customerName, setCustomerName] = useState(reservation?.customerName || '');
  const [phone, setPhone] = useState(reservation?.phone || '');
  const [email, setEmail] = useState(reservation?.email || '');
  const [date, setDate] = useState(reservation?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(reservation?.time || '12:00');
  const [guests, setGuests] = useState(reservation?.guests || 2);
  const [tableId, setTableId] = useState(reservation?.tableId || '');
  const [notes, setNotes] = useState(reservation?.notes || '');
  const [status, setStatus] = useState(reservation?.status || 'pending');

  const selectedTable = tables.find(t => t.id === parseInt(tableId));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      customerName,
      phone,
      email,
      date,
      time,
      guests,
      tableId: parseInt(tableId),
      tableName: selectedTable?.name || 'T1',
      notes,
      status,
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
        {reservation ? 'Edit Reservation' : 'New Reservation'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Customer Name *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
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
            placeholder="Enter customer name"
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              placeholder="Phone number"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Email address"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Number of Guests *
            </label>
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              required
              min="1"
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
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Table *
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
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
              <option value="">Select table</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.name} (Capacity: {table.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
            placeholder="Special requests or notes"
          />
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
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Save Reservation
          </button>
        </div>
      </form>
    </div>
  );
}
