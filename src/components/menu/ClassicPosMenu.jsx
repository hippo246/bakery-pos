/**
 * ClassicPosMenu.jsx
 * Desktop-first Menu & Catalog Management for Classic POS Theme
 * Administrative catalog management module - no POS/billing features
 */

import React, { useState, useMemo } from 'react';

export default function ClassicPosMenu({ menuItems = [], setMenuItems }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Menu Catalog Structure
  const menuCatalog = useMemo(() => [
    {
      id: 'FOOD_MAIN',
      name: 'FOOD (MAIN)',
      iconName: 'Utensils',
      subCategories: [
        { id: 'PASTA', name: 'Pasta' },
        { id: 'PIZZA', name: 'Pizza' },
        { id: 'SANDWICHES', name: 'Sandwiches' },
        { id: 'BOWLS', name: 'Bowls' },
      ],
    },
    {
      id: 'BEVERAGES',
      name: 'BEVERAGES',
      iconName: 'Coffee',
      subCategories: [
        { id: 'COFFEE', name: 'Coffee' },
        { id: 'SHAKES', name: 'Shakes' },
        { id: 'TEA', name: 'Tea' },
        { id: 'BOBA', name: 'Boba Tea' },
      ],
    },
    {
      id: 'DESSERTS',
      name: 'DESSERTS',
      iconName: 'IceCream',
      subCategories: [
        { id: 'CAKES', name: 'Cakes' },
        { id: 'ICE_CREAM', name: 'Ice Cream' },
        { id: 'PASTRIES', name: 'Pastries' },
      ],
    },
  ], []);

  // Dummy Menu Items Data
  const dummyMenuItems = useMemo(() => [
    {
      id: '100139',
      name: 'Alfredo Pasta Chicken',
      categoryId: 'FOOD_MAIN',
      subCategoryId: 'PASTA',
      imageUrl: '🍝',
      sellingPrice: 156.45,
      costPrice: 95.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100140',
      name: 'Margherita Pizza',
      categoryId: 'FOOD_MAIN',
      subCategoryId: 'PIZZA',
      imageUrl: '🍕',
      sellingPrice: 245.00,
      costPrice: 150.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100141',
      name: 'Club Sandwich',
      categoryId: 'FOOD_MAIN',
      subCategoryId: 'SANDWICHES',
      imageUrl: '🥪',
      sellingPrice: 180.00,
      costPrice: 110.00,
      gstPercentage: 5,
      stockStatus: 'LOW_STOCK',
      isActive: true,
    },
    {
      id: '100142',
      name: 'Buddha Bowl',
      categoryId: 'FOOD_MAIN',
      subCategoryId: 'BOWLS',
      imageUrl: '🥗',
      sellingPrice: 220.00,
      costPrice: 135.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100143',
      name: 'Cappuccino',
      categoryId: 'BEVERAGES',
      subCategoryId: 'COFFEE',
      imageUrl: '☕',
      sellingPrice: 85.00,
      costPrice: 45.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100144',
      name: 'Chocolate Shake',
      categoryId: 'BEVERAGES',
      subCategoryId: 'SHAKES',
      imageUrl: '🥤',
      sellingPrice: 120.00,
      costPrice: 70.00,
      gstPercentage: 5,
      stockStatus: 'OUT_OF_STOCK',
      isActive: false,
    },
    {
      id: '100145',
      name: 'Masala Chai',
      categoryId: 'BEVERAGES',
      subCategoryId: 'TEA',
      imageUrl: '🍵',
      sellingPrice: 45.00,
      costPrice: 25.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100146',
      name: 'Taro Boba Tea',
      categoryId: 'BEVERAGES',
      subCategoryId: 'BOBA',
      imageUrl: '🧋',
      sellingPrice: 150.00,
      costPrice: 85.00,
      gstPercentage: 5,
      stockStatus: 'LOW_STOCK',
      isActive: true,
    },
    {
      id: '100147',
      name: 'Chocolate Cake',
      categoryId: 'DESSERTS',
      subCategoryId: 'CAKES',
      imageUrl: '🎂',
      sellingPrice: 280.00,
      costPrice: 170.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100148',
      name: 'Vanilla Ice Cream',
      categoryId: 'DESSERTS',
      subCategoryId: 'ICE_CREAM',
      imageUrl: '🍦',
      sellingPrice: 95.00,
      costPrice: 55.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100149',
      name: 'Croissant',
      categoryId: 'DESSERTS',
      subCategoryId: 'PASTRIES',
      imageUrl: '🥐',
      sellingPrice: 65.00,
      costPrice: 35.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
    {
      id: '100150',
      name: 'Carbonara Pasta',
      categoryId: 'FOOD_MAIN',
      subCategoryId: 'PASTA',
      imageUrl: '🍝',
      sellingPrice: 175.00,
      costPrice: 105.00,
      gstPercentage: 5,
      stockStatus: 'IN_STOCK',
      isActive: true,
    },
  ], []);

  // Combine real menu items with dummy data
  const allMenuItems = useMemo(() => {
    if (menuItems.length > 0) {
      return menuItems.map(item => ({
        id: item.id,
        name: item.name,
        categoryId: 'FOOD_MAIN',
        subCategoryId: item.cat?.toUpperCase().replace(/ /g, '_') || null,
        imageUrl: item.emoji || '🍽️',
        sellingPrice: item.price || 0,
        costPrice: Math.round((item.price || 0) * 0.6),
        gstPercentage: 5,
        stockStatus: item.active ? 'IN_STOCK' : 'OUT_OF_STOCK',
        isActive: item.active || true,
      }));
    }
    return dummyMenuItems;
  }, [menuItems, dummyMenuItems]);

  // Filter menu items based on selection
  const filteredItems = useMemo(() => {
    let items = allMenuItems;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      items = items.filter(item => item.categoryId === selectedCategory);
    }

    // Filter by sub-category
    if (selectedSubCategory) {
      items = items.filter(item => item.subCategoryId === selectedSubCategory);
    }

    // Filter by active status
    if (showActiveOnly) {
      items = items.filter(item => item.isActive);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.id.includes(query)
      );
    }

    return items;
  }, [allMenuItems, selectedCategory, selectedSubCategory, showActiveOnly, searchQuery]);

  // Calculate profit margin
  const calculateProfitMargin = (sellingPrice, costPrice) => {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  // Get stock status badge style
  const getStockStatusStyle = (status) => {
    switch (status) {
      case 'IN_STOCK':
        return { backgroundColor: '#10B981', color: '#000000' };
      case 'LOW_STOCK':
        return { backgroundColor: '#F59E0B', color: '#000000' };
      case 'OUT_OF_STOCK':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  // Icon mapping
  const getIcon = (iconName) => {
    const icons = {
      Utensils: '🍽️',
      Coffee: '☕',
      IceCream: '🍦',
      Pizza: '🍕',
      Sandwich: '🥪',
    };
    return icons[iconName] || '📋';
  };

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    overflow: 'hidden',
  };

  const sidebarStyle = {
    width: '25%',
    backgroundColor: '#1A1A1A',
    borderRight: '3px solid #FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const mainContentStyle = {
    width: '75%',
    backgroundColor: '#000000',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const sidebarHeaderStyle = {
    padding: '16px',
    borderBottom: '3px solid #FFFFFF',
  };

  const sidebarTitleStyle = {
    fontSize: '18px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '12px',
  };

  const filterTogglesStyle = {
    display: 'flex',
    gap: '8px',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '800',
    backgroundColor: isActive ? '#22C55E' : '#333333',
    color: isActive ? '#000000' : '#FFFFFF',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const categoryTreeStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  };

  const categoryItemStyle = (isActive) => ({
    padding: '12px 16px',
    marginBottom: '4px',
    backgroundColor: isActive ? '#22C55E' : 'transparent',
    borderLeft: isActive ? '4px solid #FFFFFF' : '4px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: '800',
  });

  const subCategoryStyle = (isActive) => ({
    padding: '10px 16px 10px 40px',
    backgroundColor: isActive ? '#333333' : 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFFFFF',
  });

  const sidebarFooterStyle = {
    padding: '12px',
    borderTop: '3px solid #FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const addButtonStyle = (color) => ({
    padding: '14px',
    fontSize: '13px',
    fontWeight: '900',
    backgroundColor: color,
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  });

  const headerStyle = {
    padding: '16px 20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const breadcrumbStyle = {
    fontSize: '14px',
    fontWeight: '800',
    color: '#FFFFFF',
  };

  const breadcrumbActiveStyle = {
    color: '#22C55E',
  };

  const toolbarStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  };

  const searchInputStyle = {
    padding: '12px 16px 12px 44px',
    backgroundColor: '#000000',
    border: '2px solid #FFFFFF',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    width: '320px',
  };

  const toolbarButtonStyle = {
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: '800',
    backgroundColor: '#333333',
    color: '#FFFFFF',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const tableContainerStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#000000',
    border: '3px solid #FFFFFF',
  };

  const headerCellStyle = {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    padding: '14px',
    fontWeight: '900',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #FFFFFF',
    cursor: 'pointer',
  };

  const cellStyle = {
    padding: '12px',
    borderBottom: '2px solid #333333',
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFFFFF',
  };

  const priceCellStyle = {
    ...cellStyle,
    color: '#22C55E',
    fontWeight: '900',
    fontFamily: 'monospace',
    fontSize: '14px',
  };

  const costCellStyle = {
    ...cellStyle,
    color: '#888888',
    fontFamily: 'monospace',
  };

  const gstBadgeStyle = {
    padding: '6px 10px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '900',
  };

  const stockBadgeStyle = (status) => ({
    ...getStockStatusStyle(status),
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '900',
    textTransform: 'uppercase',
  });

  const toggleStyle = {
    width: '48px',
    height: '26px',
    backgroundColor: '#333333',
    borderRadius: '13px',
    position: 'relative',
    cursor: 'pointer',
    border: '2px solid #FFFFFF',
  };

  const toggleActiveStyle = {
    ...toggleStyle,
    backgroundColor: '#22C55E',
  };

  const toggleKnobStyle = {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '22px',
    height: '22px',
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
  };

  const toggleKnobActiveStyle = {
    ...toggleKnobStyle,
    transform: 'translateX(22px)',
  };

  const actionButtonStyle = {
    padding: '8px',
    backgroundColor: '#333333',
    border: '2px solid #FFFFFF',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#FFFFFF',
    marginRight: '6px',
    fontSize: '16px',
  };

  return (
    <div style={containerStyle}>
      {/* LEFT SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <div style={sidebarTitleStyle}>CATALOG NAVIGATION</div>
          <div style={filterTogglesStyle}>
            <button
              onClick={() => setShowActiveOnly(false)}
              style={filterButtonStyle(!showActiveOnly)}
            >
              SHOW ALL
            </button>
            <button
              onClick={() => setShowActiveOnly(true)}
              style={filterButtonStyle(showActiveOnly)}
            >
              ACTIVE ONLY
            </button>
          </div>
        </div>

        <div style={categoryTreeStyle}>
          {/* All Items */}
          <div
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubCategory(null);
            }}
            style={categoryItemStyle(selectedCategory === 'ALL')}
          >
            <span>📋</span>
            <span style={{ fontWeight: '700' }}>ALL ITEMS</span>
          </div>

          {/* Categories */}
          {menuCatalog.map(category => (
            <div key={category.id}>
              <div
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubCategory(null);
                }}
                style={categoryItemStyle(selectedCategory === category.id && !selectedSubCategory)}
              >
                <span>{getIcon(category.iconName)}</span>
                <span style={{ fontWeight: '700' }}>{category.name}</span>
              </div>
              
              {/* Sub Categories */}
              {selectedCategory === category.id && category.subCategories.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub.id)}
                  style={subCategoryStyle(selectedSubCategory === sub.id)}
                >
                  {sub.name}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={sidebarFooterStyle}>
          <button style={addButtonStyle('#059669')}>
            + ADD NEW CATEGORY
          </button>
          <button style={addButtonStyle('#475569')}>
            + ADD NEW ITEM
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={mainContentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={breadcrumbStyle}>
            Catalog <span style={{ margin: '0 8px' }}>›</span>
            {selectedCategory === 'ALL' ? (
              <span style={breadcrumbActiveStyle}>All Items</span>
            ) : (
              <>
                <span style={breadcrumbActiveStyle}>
                  {menuCatalog.find(c => c.id === selectedCategory)?.name || selectedCategory}
                </span>
                {selectedSubCategory && (
                  <>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span style={breadcrumbActiveStyle}>
                      {menuCatalog.find(c => c.id === selectedCategory)?.subCategories.find(s => s.id === selectedSubCategory)?.name || selectedSubCategory}
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          <div style={toolbarStyle}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>🔍</span>
              <input
                type="text"
                placeholder="Search item name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>
            <button style={toolbarButtonStyle}>FILTER DATES</button>
            <button style={toolbarButtonStyle}>EXPORT CATALOG</button>
          </div>
        </div>

        {/* Data Grid */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>IMAGE</th>
                <th style={headerCellStyle}>ITEM NAME</th>
                <th style={headerCellStyle}>ITEM CODE / SKU</th>
                <th style={headerCellStyle}>PRICE (₹)</th>
                <th style={headerCellStyle}>COST (₹)</th>
                <th style={headerCellStyle}>PROFIT MARGIN</th>
                <th style={headerCellStyle}>GST</th>
                <th style={headerCellStyle}>STOCK STATUS</th>
                <th style={headerCellStyle}>ACTIVE</th>
                <th style={headerCellStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => {
                const profitMargin = calculateProfitMargin(item.sellingPrice, item.costPrice);
                return (
                  <tr key={item.id} style={{ backgroundColor: '#1E293B' }}>
                    <td style={cellStyle}>
                      <span style={{ fontSize: '24px' }}>{item.imageUrl}</span>
                    </td>
                    <td style={{...cellStyle, fontWeight: '800', color: '#FFFFFF' }}>
                      {item.name}
                    </td>
                    <td style={{...cellStyle, fontFamily: 'monospace', color: '#94A3B8' }}>
                      {item.id}
                    </td>
                    <td style={priceCellStyle}>₹{item.sellingPrice.toFixed(2)}</td>
                    <td style={costCellStyle}>₹{item.costPrice.toFixed(2)}</td>
                    <td style={{...cellStyle, color: profitMargin > 50 ? '#10B981' : '#F59E0B', fontWeight: '800' }}>
                      {profitMargin.toFixed(1)}%
                    </td>
                    <td style={cellStyle}>
                      <span style={gstBadgeStyle}>{item.gstPercentage}% CGST/SGST</span>
                    </td>
                    <td style={cellStyle}>
                      <span style={stockBadgeStyle(item.stockStatus)}>
                        {item.stockStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div style={item.isActive ? toggleActiveStyle : toggleStyle}>
                        <div style={item.isActive ? toggleKnobActiveStyle : toggleKnobStyle}></div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <button style={actionButtonStyle}>✏️</button>
                      <button style={actionButtonStyle}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748B',
              fontSize: '16px',
              fontWeight: '700',
            }}>
              No items found in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
