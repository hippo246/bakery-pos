/**
 * FastFoodInventoryComprehensive.jsx
 * Comprehensive Inventory with stock management
 */

import { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import {
  AccessibleStock,
  AccessibleStockGrid,
  AccessibleStockFilter,
  AccessibleStockStats,
  AccessibleStockSearch,
} from '../accessibility';

export default function FastFoodInventoryComprehensive() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Inventory data
  const inventoryData = useMemo(() => [
    {
      id: 'INV001',
      name: 'BEEF PATTIES',
      category: 'BURGERS',
      quantity: 45,
      unit: 'KG',
      reorderLevel: 20,
      costPerUnit: 280,
      status: 'IN_STOCK',
      lastRestocked: '2024-08-05',
      supplier: 'Fresh Meat Co.',
    },
    {
      id: 'INV002',
      name: 'COKE SYRUP',
      category: 'DRINKS',
      quantity: 12,
      unit: 'L',
      reorderLevel: 20,
      costPerUnit: 450,
      status: 'LOW_STOCK',
      lastRestocked: '2024-08-01',
      supplier: 'Coca-Cola',
    },
    {
      id: 'INV003',
      name: 'CHICKEN FILLET',
      category: 'CHICKEN',
      quantity: 35,
      unit: 'KG',
      reorderLevel: 15,
      costPerUnit: 320,
      status: 'IN_STOCK',
      lastRestocked: '2024-08-04',
      supplier: 'Poultry Farms',
    },
    {
      id: 'INV004',
      name: 'FRIES',
      category: 'SIDES',
      quantity: 50,
      unit: 'KG',
      reorderLevel: 25,
      costPerUnit: 180,
      status: 'IN_STOCK',
      lastRestocked: '2024-08-03',
      supplier: 'Potato Suppliers',
    },
    {
      id: 'INV005',
      name: 'CHEESE SLICES',
      category: 'BURGERS',
      quantity: 8,
      unit: 'PACKS',
      reorderLevel: 20,
      costPerUnit: 450,
      status: 'LOW_STOCK',
      lastRestocked: '2024-08-02',
      supplier: 'Dairy Co.',
    },
    {
      id: 'INV006',
      name: 'ICE CREAM MIX',
      category: 'DESSERT',
      quantity: 25,
      unit: 'L',
      reorderLevel: 10,
      costPerUnit: 380,
      status: 'IN_STOCK',
      lastRestocked: '2024-08-05',
      supplier: 'Dairy Co.',
    },
    {
      id: 'INV007',
      name: 'BUNS',
      category: 'BURGERS',
      quantity: 200,
      unit: 'PCS',
      reorderLevel: 100,
      costPerUnit: 8,
      status: 'IN_STOCK',
      lastRestocked: '2024-08-06',
      supplier: 'Bakery Supplies',
    },
    {
      id: 'INV008',
      name: 'PEPSI SYRUP',
      category: 'DRINKS',
      quantity: 15,
      unit: 'L',
      reorderLevel: 20,
      costPerUnit: 420,
      status: 'LOW_STOCK',
      lastRestocked: '2024-08-04',
      supplier: 'PepsiCo',
    },
  ], []);

  // Categories
  const categories = [
    { id: 'BURGERS', label: 'BURGERS', icon: '🍔' },
    { id: 'CHICKEN', label: 'CHICKEN', icon: '🍗' },
    { id: 'DRINKS', label: 'DRINKS', icon: '🥤' },
    { id: 'SIDES', label: 'SIDES', icon: '🍟' },
    { id: 'DESSERT', label: 'DESSERT', icon: '🍦' },
  ];

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let items = inventoryData;

    if (selectedCategory !== 'ALL') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (selectedFilter !== 'ALL') {
      items = items.filter(item => item.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query)
      );
    }

    return items;
  }, [inventoryData, selectedCategory, selectedFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => ({
    totalValue: inventoryData.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0),
    lowStock: inventoryData.filter(item => item.status === 'LOW_STOCK').length,
    outOfStock: inventoryData.filter(item => item.status === 'OUT_OF_STOCK').length,
    totalItems: inventoryData.length,
  }), [inventoryData]);

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'IN_STOCK':
        return { backgroundColor: '#2ECC71', color: '#FFFFFF' };
      case 'LOW_STOCK':
        return { backgroundColor: '#FFD166', color: '#1A1A1A' };
      case 'OUT_OF_STOCK':
        return { backgroundColor: '#E63946', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  // Handler functions
  const handleAddStock = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Add Stock', message: `Adding stock for item ${itemId}`, type: 'info' });
  };

  const handleEditItem = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Edit Item', message: `Editing item ${itemId}`, type: 'info' });
  };

  const handleHistory = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Item History', message: `Viewing history for item ${itemId}`, type: 'info' });
  };

  const handleLogStockArrival = () => {
    setAlertDialog({ isOpen: true, title: 'Stock Arrival', message: 'Logging stock arrival...', type: 'info' });
  };

  const handleRecordWastage = () => {
    setAlertDialog({ isOpen: true, title: 'Record Wastage', message: 'Recording wastage...', type: 'warning' });
  };

  const handleStockReport = () => {
    setAlertDialog({ isOpen: true, title: 'Stock Report', message: 'Generating stock report...', type: 'info' });
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

  const categoryBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFD166',
    borderBottom: '2px solid #E63946',
    overflow: 'auto',
  };

  const categoryButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });

  const filterBarStyle = {
    display: 'flex',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#F8F9FA',
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

  const inventoryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  };

  const inventoryCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
  };

  const itemCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
  };

  const itemHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const itemNameStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1A1A1A',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const categoryStyle = {
    fontSize: '10px',
    color: '#666666',
    marginBottom: '6px',
    fontWeight: '700',
  };

  const quantityStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#E63946',
    marginBottom: '6px',
  };

  const metaStyle = {
    fontSize: '10px',
    color: '#666666',
    marginBottom: '4px',
  };

  const totalValueStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#E63946',
    marginTop: '6px',
    padding: '6px',
    backgroundColor: '#F8F9FA',
    borderRadius: '4px',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
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
    <AccessibleStock title="Inventory Management">
      {/* Header */}
      <div style={headerStyle}>
        <span>📦 INVENTORY MANAGEMENT</span>
        <span>🔴 3 LOW STOCK │ 12:34 PM</span>
      </div>

      {/* Stats Bar */}
      <AccessibleStockStats stats={stats} />

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <AccessibleStockSearch
          onSearch={setSearchQuery}
          placeholder="Search inventory..."
        />
      </div>

      {/* Category Bar */}
      <AccessibleStockFilter
        filters={[
          ...categories,
          { id: 'ALL', label: 'ALL ITEMS', icon: '📦' },
        ]}
        activeFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        ariaLabel="Filter by category"
      />

      {/* Filter Bar */}
      <AccessibleStockFilter
        filters={[
          { id: 'ALL', label: 'ALL', icon: '📦' },
          { id: 'IN_STOCK', label: 'IN STOCK', icon: '✅' },
          { id: 'LOW_STOCK', label: 'LOW STOCK', icon: '⚠️' },
          { id: 'OUT_OF_STOCK', label: 'OUT OF STOCK', icon: '❌' },
        ]}
        activeFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        ariaLabel="Filter by stock status"
      />

      {/* Main Content */}
      <div style={mainContentStyle}>
        <AccessibleStockGrid
          items={filteredInventory}
          onItemAction={(action, itemId) => {
            if (action === 'add') handleAddStock(itemId);
            if (action === 'edit') handleEditItem(itemId);
            if (action === 'delete') handleHistory(itemId);
          }}
        />
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button onClick={handleLogStockArrival} style={footerButtonStyle}>➕ LOG STOCK ARRIVAL</button>
        <button onClick={handleRecordWastage} style={{...footerButtonStyle, backgroundColor: '#E63946', color: '#FFFFFF'}}>❌ RECORD WASTAGE</button>
        <button onClick={handleStockReport} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>📊 STOCK REPORT</button>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </AccessibleStock>
  );
}
