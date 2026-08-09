/**
 * FastFoodCRMComprehensive.jsx
 * Comprehensive CRM with loyalty and customer management
 */

import React, { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';

export default function FastFoodCRMComprehensive({ customers = [], setCustomers }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Customer data with loyalty tiers
  const customerData = useMemo(() => [
    {
      id: 'C001',
      name: 'RAHUL SHARMA',
      phone: '+91 9876543210',
      email: 'rahul@email.com',
      visits: 15,
      totalSpent: 12450,
      points: 1245,
      tier: 'GOLD',
      lastVisit: '2024-08-05',
      favoriteItems: ['Big Mac Meal', 'McFlurry'],
    },
    {
      id: 'C002',
      name: 'PRIYA PATEL',
      phone: '+91 9123456789',
      email: 'priya@email.com',
      visits: 8,
      totalSpent: 6780,
      points: 678,
      tier: 'SILVER',
      lastVisit: '2024-08-04',
      favoriteItems: ['Zinger Burger', 'Coke'],
    },
    {
      id: 'C003',
      name: 'AMIT KUMAR',
      phone: '+91 8899776655',
      email: 'amit@email.com',
      visits: 5,
      totalSpent: 3450,
      points: 345,
      tier: 'BRONZE',
      lastVisit: '2024-08-03',
      favoriteItems: ['Pan Pizza', 'Buffalo Wings'],
    },
    {
      id: 'C004',
      name: 'NEHA GUPTA',
      phone: '+91 7766554433',
      email: 'neha@email.com',
      visits: 22,
      totalSpent: 18900,
      points: 1890,
      tier: 'GOLD',
      lastVisit: '2024-08-06',
      favoriteItems: ['Family Bucket', 'Combo Meal'],
    },
    {
      id: 'C005',
      name: 'VIKRAM REDDY',
      phone: '+91 5544332211',
      email: 'vikram@email.com',
      visits: 3,
      totalSpent: 1890,
      points: 189,
      tier: 'BRONZE',
      lastVisit: '2024-08-02',
      favoriteItems: ['McFlurry', 'Sundae'],
    },
  ], []);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let customers = customerData;

    if (selectedFilter !== 'ALL') {
      customers = customers.filter(c => c.tier === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }

    return customers;
  }, [customerData, selectedFilter, searchQuery]);

  // Get tier style
  const getTierStyle = (tier) => {
    switch (tier) {
      case 'GOLD':
        return { backgroundColor: '#FFD700', color: '#1A1A1A' };
      case 'SILVER':
        return { backgroundColor: '#C0C0C0', color: '#1A1A1A' };
      case 'BRONZE':
        return { backgroundColor: '#CD7F32', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  // Handler functions
  const handleViewHistory = (customerId) => {
    setAlertDialog({ isOpen: true, title: 'Order History', message: `Viewing order history for customer ${customerId}`, type: 'info' });
  };

  const handleEditCustomer = (customerId) => {
    setAlertDialog({ isOpen: true, title: 'Edit Customer', message: `Editing customer ${customerId}`, type: 'info' });
  };

  const handleRewardCustomer = (customerId) => {
    setAlertDialog({ isOpen: true, title: 'Add Reward', message: `Adding reward for customer ${customerId}`, type: 'success' });
  };

  const handleAddNewGuest = () => {
    setAlertDialog({ isOpen: true, title: 'New Guest', message: 'Opening new guest form...', type: 'info' });
  };

  const handleImportCSV = () => {
    setAlertDialog({ isOpen: true, title: 'Import CSV', message: 'Importing customers from CSV...', type: 'info' });
  };

  const handleRewardSettings = () => {
    setAlertDialog({ isOpen: true, title: 'Reward Settings', message: 'Opening reward settings...', type: 'info' });
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

  const toolbarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const searchInputStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '4px',
    width: '250px',
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

  const customerGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  };

  const customerCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
  };

  const customerHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const customerNameStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1A1A1A',
  };

  const tierBadgeStyle = (tier) => ({
    ...getTierStyle(tier),
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const contactInfoStyle = {
    fontSize: '11px',
    color: '#666666',
    marginBottom: '6px',
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  };

  const statItemStyle = {
    backgroundColor: '#F8F9FA',
    padding: '8px',
    borderRadius: '4px',
    textAlign: 'center',
  };

  const statLabelStyle = {
    fontSize: '9px',
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '3px',
  };

  const statValueStyle = {
    fontSize: '12px',
    fontWeight: '900',
    color: '#E63946',
  };

  const favoriteItemsStyle = {
    fontSize: '10px',
    color: '#666666',
    marginBottom: '8px',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const actionButtonStyle = {
    flex: 1,
    padding: '6px 4px',
    fontSize: '9px',
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

  const footerStyle = {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderTop: '2px solid #E63946',
  };

  const footerButtonStyle = {
    padding: '8px 16px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>👥 CUSTOMER MANAGEMENT</span>
        <span>🔍 SEARCH GUEST...</span>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <input
          type="text"
          placeholder="Search guest name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {/* Filter Bar */}
      <div style={filterBarStyle}>
        <button onClick={() => setSelectedFilter('ALL')} style={filterButtonStyle(selectedFilter === 'ALL')}>
          ⭐ LOYALTY MEMBERS
        </button>
        <button onClick={() => setSelectedFilter('GOLD')} style={filterButtonStyle(selectedFilter === 'GOLD')}>
          🥇 GOLD
        </button>
        <button onClick={() => setSelectedFilter('SILVER')} style={filterButtonStyle(selectedFilter === 'SILVER')}>
          🥈 SILVER
        </button>
        <button onClick={() => setSelectedFilter('BRONZE')} style={filterButtonStyle(selectedFilter === 'BRONZE')}>
          🥉 BRONZE
        </button>
        <button onClick={() => setSelectedFilter('ALL')} style={filterButtonStyle(selectedFilter === 'ALL')}>
          📋 ALL GUESTS
        </button>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        <div style={customerGridStyle}>
          {filteredCustomers.map(customer => (
            <div key={customer.id} style={customerCardStyle}>
              <div style={customerHeaderStyle}>
                <div style={customerNameStyle}>👤 {customer.name}</div>
                <div style={tierBadgeStyle(customer.tier)}>⭐ {customer.tier} MEMBER</div>
              </div>

              <div style={contactInfoStyle}>
                📞 {customer.phone} │ 📧 {customer.email}
              </div>
              <div style={contactInfoStyle}>
                🎂 {customer.visits} visits │ 📅 Last: {customer.lastVisit}
              </div>

              <div style={statsStyle}>
                <div style={statItemStyle}>
                  <div style={statLabelStyle}>TOTAL SPENT</div>
                  <div style={statValueStyle}>₹{customer.totalSpent.toLocaleString('en-IN')}</div>
                </div>
                <div style={statItemStyle}>
                  <div style={statLabelStyle}>POINTS</div>
                  <div style={statValueStyle}>{customer.points}</div>
                </div>
              </div>

              <div style={favoriteItemsStyle}>
                <strong>Favorite Items:</strong> {customer.favoriteItems.join(', ')}
              </div>

              <div style={actionButtonsStyle}>
                <button onClick={() => handleViewHistory(customer.id)} style={actionButtonStyle}>📋 VIEW HISTORY</button>
                <button onClick={() => handleEditCustomer(customer.id)} style={secondaryButtonStyle}>✏️ EDIT</button>
                <button onClick={() => handleRewardCustomer(customer.id)} style={secondaryButtonStyle}>🎁 REWARD</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button onClick={handleAddNewGuest} style={footerButtonStyle}>➕ ADD NEW GUEST</button>
        <button onClick={handleImportCSV} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>📥 IMPORT CSV</button>
        <button onClick={handleRewardSettings} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>🎁 REWARD SETTINGS</button>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
