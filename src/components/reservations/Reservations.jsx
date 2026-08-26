import React, { useState, useEffect } from 'react';

export default function Reservations({ tables, customers, onNavigate, darkMode = true }) {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingReservation, setViewingReservation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleViewReservation = (reservation) => {
    setViewingReservation(reservation);
    setShowViewModal(true);
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
      background: darkMode ? '#1a1a2e' : '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: darkMode ? '#14142a' : '#f1f5f9' }}>
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
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{
              marginBottom: screenSize === 'small' ? '20px' : '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h1 style={{
                  fontSize: screenSize === 'small' ? '24px' : '32px',
                  fontWeight: '700',
                  color: darkMode ? '#ffffff' : '#111827',
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  📅 Reservations
                </h1>
                <p style={{
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  color: darkMode ? '#8b8b9e' : '#8b8b9e',
                  margin: 0
                }}>
                  Manage table reservations and bookings
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '20px' : '28px'
            }}>
              <StatCard label="Today's Reservations" value={todayReservations.length} icon="📅" darkMode={darkMode} />
              <StatCard label="Confirmed" value={confirmedToday} icon="✅" color="#059669" darkMode={darkMode} />
              <StatCard label="Pending" value={pendingToday} icon="⏳" color="#d97706" darkMode={darkMode} />
              <StatCard label="Total Guests" value={totalGuestsToday} icon="👥" darkMode={darkMode} />
            </div>

            {/* Controls */}
            <div style={{
              background: darkMode ? '#252538' : '#ffffff',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              borderRadius: '16px',
              padding: screenSize === 'small' ? '16px' : '20px',
              marginBottom: screenSize === 'small' ? '20px' : '28px',
              display: 'flex',
              gap: screenSize === 'small' ? '12px' : '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
                      background: darkMode ? '#1a1a2e' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#111827',
                      border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                      borderRadius: '10px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
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
                  padding: screenSize === 'small' ? '12px 20px' : '14px 24px',
                  background: '#1a1a2e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1f2937';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#111827';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ➕ New Reservation
              </button>
            </div>

            {/* Reservations List */}
            <div style={{
              background: darkMode ? '#252538' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              padding: screenSize === 'small' ? '16px' : '24px',
              boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '16px' }}>
                Reservations for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              {filteredReservations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: darkMode ? '#8b8b9e' : '#9ca3af' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827', marginBottom: '8px' }}>No reservations found</div>
                  <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>Create a new reservation to get started</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {filteredReservations.map(reservation => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      onEdit={() => handleEditReservation(reservation)}
                      onView={() => handleViewReservation(reservation)}
                      onDelete={() => handleDeleteReservation(reservation.id)}
                      onStatusChange={handleStatusChange}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* View Reservation Modal */}
            {showViewModal && viewingReservation && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: '#252538',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    background: '#1a1a2e',
                    color: '#ffffff',
                    padding: '20px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>📅 Reservation Details</span>
                    <button
                      onClick={() => setShowViewModal(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '20px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ padding: '24px', overflow: 'auto' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
                        {viewingReservation.customerName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#8b8b9e', marginBottom: '16px' }}>
                        Reservation ID: {viewingReservation.id}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ background: '#1f1f35', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>📞 Phone</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {viewingReservation.phone || 'N/A'}
                        </div>
                      </div>
                      <div style={{ background: '#1f1f35', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '4px' }}>✉️ Email</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {viewingReservation.email || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>{viewingReservation.date}</div>
                        <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Date</div>
                      </div>
                      <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#065f46' }}>{viewingReservation.time}</div>
                        <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Time</div>
                      </div>
                      <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>{viewingReservation.guests}</div>
                        <div style={{ fontSize: '11px', color: '#8b8b9e' }}>Guests</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>🪑 Table</div>
                      <div style={{ 
                        background: '#1f1f35', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#111827'
                      }}>
                        {viewingReservation.tableName || 'Not assigned'}
                      </div>
                    </div>

                    {viewingReservation.notes && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '8px', fontWeight: '500' }}>📝 Notes</div>
                        <div style={{ 
                          background: '#1f1f35', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          color: '#e0e0e0',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {viewingReservation.notes}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditReservation(viewingReservation);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: '#1a1a2e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Edit Reservation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = '#111827', darkMode = true }) {
  return (
    <div style={{
      background: darkMode ? '#252538' : '#ffffff',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: '50%',
        opacity: 0.1
      }}></div>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '28px', fontWeight: '700', color: darkMode ? '#ffffff' : color }}>{value}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ reservation, onEdit, onView, onDelete, onStatusChange, darkMode = true }) {
  const statusColors = {
    pending: '#d97706',
    confirmed: '#059669',
    seated: '#0891b2',
    completed: '#8b8b9e',
    cancelled: '#dc2626'
  };

  return (
    <div style={{
      background: darkMode ? '#1a1a2e' : '#f9fafb',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            padding: '6px 12px',
            background: statusColors[reservation.status] || '#8b8b9e',
            color: '#ffffff',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {reservation.status}
          </span>
          <span style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#111827' }}>
            {reservation.customerName}
          </span>
        </div>
        <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e', marginBottom: '6px' }}>
          🕐 {reservation.time} • 👥 {reservation.guests} guests • 🪑 Table {reservation.tableName}
        </div>
        <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#8b8b9e' }}>
          📞 {reservation.phone} {reservation.email ? `• ✉️ ${reservation.email}` : ''}
        </div>
        {reservation.notes && (
          <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#9ca3af', marginTop: '6px' }}>
            📝 {reservation.notes}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onView}
          style={{
            padding: '10px 16px',
            background: darkMode ? '#2d2d44' : '#f3f4f6',
            color: darkMode ? '#ffffff' : '#e0e0e0',
            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = darkMode ? '#2d2d44' : '#f3f4f6';
          }}
        >
          👁️ View
        </button>
        <select
          value={reservation.status}
          onChange={(e) => onStatusChange(reservation.id, e.target.value)}
          style={{
            padding: '10px 14px',
            background: darkMode ? '#1a1a2e' : '#ffffff',
            color: darkMode ? '#ffffff' : '#111827',
            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
            borderRadius: '8px',
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
            padding: '10px 16px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#2563eb';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          ✏️ Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '10px 16px',
            background: darkMode ? '#2d2d44' : '#ffffff',
            color: '#dc2626',
            border: `1px solid ${darkMode ? '#dc2626' : '#d1d5db'}`,
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = darkMode ? '#dc2626' : '#fef2f2';
            e.target.style.color = darkMode ? '#ffffff' : '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = darkMode ? '#2d2d44' : '#ffffff';
            e.target.style.color = '#dc2626';
          }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

function ReservationForm({ reservation, tables, customers, onSave, onCancel, darkMode = true }) {
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
      background: darkMode ? '#252538' : '#ffffff',
      borderRadius: '16px',
      border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
      padding: '32px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#111827', marginBottom: '24px' }}>
        {reservation ? '✏️ Edit Reservation' : '➕ New Reservation'}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            👤 Customer Name *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none'
            }}
            placeholder="Enter customer name"
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              📞 Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Phone number"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              ✉️ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="Email address"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              📅 Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              🕐 Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              👥 Number of Guests *
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
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
              🪑 Table *
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1a1a2e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#111827',
                border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            📊 Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
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
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#8b8b9e' : '#e0e0e0', marginBottom: '8px' }}>
            📝 Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkMode ? '#1a1a2e' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
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
              background: darkMode ? '#2d2d44' : '#ffffff',
              color: darkMode ? '#ffffff' : '#111827',
              border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = darkMode ? '#2d2d44' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = darkMode ? '#2d2d44' : '#ffffff';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#1a1a2e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1f2937';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#111827';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {reservation ? 'Update Reservation' : 'Create Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
}
