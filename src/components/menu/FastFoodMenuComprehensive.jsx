/**
 * FastFoodMenuComprehensive.jsx
 * Comprehensive Menu Management with images and modifiers
 */

import { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import {
  AccessibleMenu,
  AccessibleMenuGrid,
  AccessibleMenuCategory,
  AccessibleMenuSearch,
} from '../accessibility';

export default function FastFoodMenuComprehensive() {
  const [selectedCategory, setSelectedCategory] = useState('BURGERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Categories
  const categories = [
    { id: 'BURGERS', label: 'BURGERS', icon: '🍔' },
    { id: 'CHICKEN', label: 'CHICKEN', icon: '🍗' },
    { id: 'PIZZA', label: 'PIZZA', icon: '🍕' },
    { id: 'DRINKS', label: 'DRINKS', icon: '🥤' },
    { id: 'SIDES', label: 'SIDES', icon: '🍟' },
    { id: 'DESSERT', label: 'DESSERT', icon: '🍦' },
    { id: 'COMBOS', label: 'COMBOS', icon: '🎁' },
    { id: 'WRAPS', label: 'WRAPS', icon: '🥪' },
    { id: 'BOWLS', label: 'BOWLS', icon: '🥗' },
    { id: 'COFFEE', label: 'COFFEE', icon: '☕' },
    { id: 'BREAKFAST', label: 'BREAKFAST', icon: '🥞' },
    { id: 'SALADS', label: 'SALADS', icon: '🥗' },
    { id: 'COOKIES', label: 'COOKIES', icon: '🍪' },
    { id: 'PROMOS', label: 'PROMOS', icon: '🧁' },
  ];

  // Menu items data
  const menuData = useMemo(() => [
    {
      id: 'BM001',
      name: 'BIG MAC',
      category: 'BURGERS',
      price: 5.99,
      sku: 'BM001',
      stock: 45,
      status: 'IN_STOCK',
      description: 'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun',
      image: '🍔',
      modifiers: ['Size', 'Cheese', 'No Pickles', 'Extra Sauce'],
    },
    {
      id: 'QP001',
      name: 'QUARTER POUNDER',
      category: 'BURGERS',
      price: 6.49,
      sku: 'QP001',
      stock: 38,
      status: 'IN_STOCK',
      description: 'Fresh beef patty with cheese, onions, pickles, and mustard',
      image: '🍔',
      modifiers: ['Size', 'Cheese', 'No Onions', 'Extra Patty'],
    },
    {
      id: 'ZB001',
      name: 'ZINGER BURGER',
      category: 'CHICKEN',
      price: 5.99,
      sku: 'ZB001',
      stock: 52,
      status: 'IN_STOCK',
      description: 'Crispy chicken fillet with spicy mayo, lettuce, and mayo',
      image: '🍗',
      modifiers: ['Spice Level', 'No Mayo', 'Extra Lettuce', 'Add Cheese'],
    },
    {
      id: 'HW001',
      name: 'HOT WINGS 8PC',
      category: 'CHICKEN',
      price: 8.99,
      sku: 'HW001',
      stock: 25,
      status: 'IN_STOCK',
      description: '8 crispy chicken wings with choice of sauce',
      image: '🍗',
      modifiers: ['Sauce', 'Spice Level', 'Extra Crispy', 'Boneless'],
    },
    {
      id: 'PP001',
      name: 'PAN PIZZA',
      category: 'PIZZA',
      price: 12.99,
      sku: 'PP001',
      stock: 30,
      status: 'IN_STOCK',
      description: 'Classic pan pizza with your choice of toppings',
      image: '🍕',
      modifiers: ['Crust', 'Toppings', 'Size', 'Extra Cheese'],
    },
    {
      id: 'SC001',
      name: 'STUFFED CRUST',
      category: 'PIZZA',
      price: 14.99,
      sku: 'SC001',
      stock: 22,
      status: 'IN_STOCK',
      description: 'Pizza with cheese-stuffed crust',
      image: '🍕',
      modifiers: ['Toppings', 'Size', 'Extra Stuffed', 'Sauce'],
    },
    {
      id: 'CK001',
      name: 'COKE',
      category: 'DRINKS',
      price: 1.99,
      sku: 'CK001',
      stock: 100,
      status: 'IN_STOCK',
      description: 'Ice-cold Coca-Cola',
      image: '🥤',
      modifiers: ['Size', 'No Ice', 'Lemon', 'Extra Ice'],
    },
    {
      id: 'FR001',
      name: 'FRIES',
      category: 'SIDES',
      price: 2.99,
      sku: 'FR001',
      stock: 80,
      status: 'IN_STOCK',
      description: 'Classic golden fries',
      image: '🍟',
      modifiers: ['Size', 'Salted', 'No Salt', 'Cajun'],
    },
    {
      id: 'MF001',
      name: 'MCFLURRY',
      category: 'DESSERT',
      price: 4.99,
      sku: 'MF001',
      stock: 35,
      status: 'IN_STOCK',
      description: 'Soft serve ice cream with mix-ins',
      image: '🍦',
      modifiers: ['Flavor', 'Size', 'Extra Mix-in', 'No Mix-in'],
    },
    {
      id: 'FB001',
      name: 'FAMILY BUCKET',
      category: 'COMBOS',
      price: 24.99,
      sku: 'FB001',
      stock: 15,
      status: 'IN_STOCK',
      description: 'Family meal with chicken, fries, and drinks',
      image: '🎁',
      modifiers: ['Spice Level', 'Drink Choice', 'Extra Fries'],
    },
  ], []);

  // Filter menu items
  const filteredItems = useMemo(() => {
    let items = menuData;

    if (selectedCategory !== 'ALL') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return items;
  }, [menuData, selectedCategory, searchQuery]);

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
  const handleImport = () => {
    setAlertDialog({ isOpen: true, title: 'Import Menu', message: 'Importing menu items...', type: 'info' });
  };

  const handleExport = () => {
    setAlertDialog({ isOpen: true, title: 'Export Menu', message: 'Exporting menu items...', type: 'info' });
  };

  const handleUploadImage = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Upload Image', message: `Uploading image for item ${itemId}`, type: 'info' });
  };

  const handleEditItem = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Edit Item', message: `Editing item ${itemId}`, type: 'info' });
  };

  const handleStock = (itemId) => {
    setAlertDialog({ isOpen: true, title: 'Manage Stock', message: `Managing stock for item ${itemId}`, type: 'info' });
  };

  const handleDeleteItem = (itemId) => {
    if (confirm(`Delete item ${itemId}?`)) {
      setAlertDialog({ isOpen: true, title: 'Item Deleted', message: `Deleted item ${itemId}`, type: 'warning' });
    }
  };

  const handleAddNewItem = () => {
    setAlertDialog({ isOpen: true, title: 'Add Item', message: 'Opening add item form...', type: 'info' });
  };

  const handleBulkImport = () => {
    setAlertDialog({ isOpen: true, title: 'Bulk Import', message: 'Opening bulk import...', type: 'info' });
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
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
  };

  const menuGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  };

  const menuItemStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const menuItemImageStyle = {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '8px',
  };

  const menuItemNameStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: '6px',
  };

  const menuItemDescStyle = {
    fontSize: '11px',
    color: '#666666',
    marginBottom: '6px',
    minHeight: '24px',
  };

  const menuItemMetaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const priceStyle = {
    fontSize: '16px',
    fontWeight: '900',
    color: '#E63946',
  };

  const stockStyle = {
    fontSize: '11px',
    fontWeight: '700',
    color: '#666666',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const modifiersStyle = {
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
    padding: '5px 4px',
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
    <AccessibleMenu title="Menu Management">
      {/* Header */}
      <div style={headerStyle}>
        <span>🍔 MENU MANAGEMENT</span>
        <span>45 ITEMS │ 12:34 PM</span>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <AccessibleMenuSearch
          onSearch={setSearchQuery}
          placeholder="Search menu items..."
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleImport} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800', backgroundColor: '#E63946', color: '#FFFFFF', border: '2px solid #E63946', borderRadius: '4px', cursor: 'pointer' }}>
            📥 IMPORT
          </button>
          <button onClick={handleExport} style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '800', backgroundColor: '#FFD166', color: '#1A1A1A', border: '2px solid #E63946', borderRadius: '4px', cursor: 'pointer' }}>
            📤 EXPORT
          </button>
        </div>
      </div>

      {/* Category Bar */}
      <AccessibleMenuCategory
        categories={[
          ...categories,
          { id: 'ALL', label: 'ADD ITEM', icon: '➕' },
        ]}
        activeCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main Content */}
      <div style={mainContentStyle}>
        <AccessibleMenuGrid
          items={filteredItems}
          onItemAction={(action, itemId) => {
            if (action === 'edit') handleEditItem(itemId);
            if (action === 'delete') handleDeleteItem(itemId);
            if (action === 'toggle') handleStock(itemId);
            if (action === 'add') handleUploadImage(itemId);
          }}
        />
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button onClick={handleAddNewItem} style={footerButtonStyle}>➕ ADD NEW ITEM</button>
        <button onClick={handleBulkImport} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>📥 BULK IMPORT</button>
        <button onClick={handleStockReport} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>📊 STOCK REPORT</button>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </AccessibleMenu>
  );
}
