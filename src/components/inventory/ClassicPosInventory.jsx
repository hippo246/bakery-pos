/**
 * ClassicPosInventory.jsx
 * High-contrast Stock & Inventory Management for Classic POS Theme
 * Administrative inventory module - no POS/billing features
 */

import React, { useState, useMemo } from 'react';

export default function ClassicPosInventory({ inventory = [], setInventory }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);

  // Dummy Inventory Data
  const dummyInventory = useMemo(() => [
    {
      id: 'RAW-001',
      name: 'Durum Wheat Pasta',
      category: 'DRY_GOODS',
      currentStock: 18.5,
      unit: 'KG',
      reorderLevel: 5.0,
      costPerUnit: 110.00,
      supplierName: 'Goa Dairy & Dry Supplies',
      lastRestocked: '2024-08-01',
      status: 'OPTIMAL',
    },
    {
      id: 'RAW-002',
      name: 'Amul Fresh Cream',
      category: 'DAIRY',
      currentStock: 2.0,
      unit: 'LITERS',
      reorderLevel: 6.0,
      costPerUnit: 210.00,
      supplierName: 'Amul Goa Distributor',
      lastRestocked: '2024-08-05',
      status: 'LOW_STOCK',
    },
    {
      id: 'RAW-003',
      name: 'Vanilla Syrup (Monin)',
      category: 'BEVERAGES',
      currentStock: 0.0,
      unit: 'LITERS',
      reorderLevel: 2.0,
      costPerUnit: 850.00,
      supplierName: 'Premium Beverages Ltd',
      lastRestocked: '2024-07-28',
      status: 'OUT_OF_STOCK',
    },
    {
      id: 'RAW-004',
      name: 'Chicken Breast (Boneless)',
      category: 'PRODUCE',
      currentStock: 14.0,
      unit: 'KG',
      reorderLevel: 4.0,
      costPerUnit: 280.00,
      supplierName: 'Fresh Meat Suppliers',
      lastRestocked: '2024-08-06',
      status: 'OPTIMAL',
    },
    {
      id: 'RAW-005',
      name: 'Basmati Rice',
      category: 'DRY_GOODS',
      currentStock: 45.0,
      unit: 'KG',
      reorderLevel: 10.0,
      costPerUnit: 95.00,
      supplierName: 'Goa Dairy & Dry Supplies',
      lastRestocked: '2024-08-02',
      status: 'OPTIMAL',
    },
    {
      id: 'RAW-006',
      name: 'Mozzarella Cheese',
      category: 'DAIRY',
      currentStock: 3.5,
      unit: 'KG',
      reorderLevel: 5.0,
      costPerUnit: 450.00,
      supplierName: 'Amul Goa Distributor',
      lastRestocked: '2024-08-04',
      status: 'LOW_STOCK',
    },
    {
      id: 'RAW-007',
      name: 'Taro Boba Pearls',
      category: 'BEVERAGES',
      currentStock: 8.0,
      unit: 'PACKS',
      reorderLevel: 3.0,
      costPerUnit: 180.00,
      supplierName: 'Premium Beverages Ltd',
      lastRestocked: '2024-08-05',
      status: 'OPTIMAL',
    },
    {
      id: 'RAW-008',
      name: 'Fresh Tomatoes',
      category: 'PRODUCE',
      currentStock: 1.5,
      unit: 'KG',
      reorderLevel: 5.0,
      costPerUnit: 60.00,
      supplierName: 'Local Vegetable Market',
      lastRestocked: '2024-08-06',
      status: 'LOW_STOCK',
    },
    {
      id: 'RAW-009',
      name: 'Paper Cups (16oz)',
      category: 'PACKAGING',
      currentStock: 250,
      unit: 'UNITS',
      reorderLevel: 100,
      costPerUnit: 2.50,
      supplierName: 'Packaging Solutions',
      lastRestocked: '2024-08-03',
      status: 'OPTIMAL',
    },
    {
      id: 'RAW-010',
      name: 'Olive Oil',
      category: 'DRY_GOODS',
      currentStock: 0.0,
      unit: 'LITERS',
      reorderLevel: 5.0,
      costPerUnit: 320.00,
      supplierName: 'Goa Dairy & Dry Supplies',
      lastRestocked: '2024-07-25',
      status: 'OUT_OF_STOCK',
    },
  ], []);

  // Combine real inventory with dummy data
  const allInventory = useMemo(() => {
    if (inventory.length > 0) {
      return inventory.map(item => ({
        id: item.id || 'RAW-000',
        name: item.name || 'Unknown Item',
        category: item.category || 'DRY_GOODS',
        currentStock: item.quantity || 0,
        unit: item.unit || 'UNITS',
        reorderLevel: item.reorderLevel || 5,
        costPerUnit: item.cost || 0,
        supplierName: item.supplier || 'Unknown Supplier',
        lastRestocked: item.lastRestocked || new Date().toISOString().split('T')[0],
        status: item.status || 'OPTIMAL',
      }));
    }
    return dummyInventory;
  }, [inventory, dummyInventory]);

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    const totalValue = allInventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    const lowStockCount = allInventory.filter(item => item.status === 'LOW_STOCK').length;
    const outOfStockCount = allInventory.filter(item => item.status === 'OUT_OF_STOCK').length;
    const wastageValue = 4250; // Mock value

    return {
      totalValue,
      lowStockCount,
      outOfStockCount,
      wastageValue,
    };
  }, [allInventory]);

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let items = allInventory;

    // Category filter
    if (selectedCategory !== 'ALL') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Quick filter
    if (quickFilter === 'LOW_STOCK_ALERTS') {
      items = items.filter(item => item.status === 'LOW_STOCK');
    } else if (quickFilter === 'REORDER_NEEDED') {
      items = items.filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
    } else if (quickFilter === 'WASTAGE_LOGS') {
      // Would show wastage logs in real implementation
      items = [];
    }

    // Unit filter
    if (unitFilter !== 'ALL') {
      items = items.filter(item => item.unit === unitFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.supplierName.toLowerCase().includes(query)
      );
    }

    return items;
  }, [allInventory, selectedCategory, quickFilter, unitFilter, searchQuery]);

  // Get stock status style
  const getStockStatusStyle = (status) => {
    switch (status) {
      case 'OPTIMAL':
        return { backgroundColor: '#22C55E', color: '#000000' };
      case 'LOW_STOCK':
        return { backgroundColor: '#F59E0B', color: '#000000' };
      case 'OUT_OF_STOCK':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  // Category tree structure
  const categoryTree = [
    {
      id: 'DRY_GOODS',
      name: 'DRY GOODS & GRAINS',
      items: ['Pasta', 'Rice', 'Flour', 'Oils'],
    },
    {
      id: 'DAIRY',
      name: 'DAIRY & REFRIGERATED',
      items: ['Milk', 'Cheese', 'Cream', 'Butter'],
    },
    {
      id: 'BEVERAGES',
      name: 'BEVERAGE SYRUPS & CONCENTRATES',
      items: ['Shake mixes', 'Boba', 'Tea', 'Coffee'],
    },
    {
      id: 'PRODUCE',
      name: 'FRESH PRODUCE',
      items: ['Veggies', 'Herbs', 'Meat', 'Fruits'],
    },
    {
      id: 'PACKAGING',
      name: 'PACKAGING & DISPOSABLES',
      items: ['Boxes', 'Cups', 'Straws', 'Napkins'],
    },
  ];

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const kpiSectionStyle = {
    padding: '16px 20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  };

  const kpiCardStyle = {
    backgroundColor: '#000000',
    border: '3px solid #FFFFFF',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const kpiLabelStyle = {
    fontSize: '12px',
    fontWeight: '800',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const kpiValueStyle = {
    fontSize: '24px',
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  };

  const kpiIndicatorStyle = (color) => ({
    fontSize: '11px',
    fontWeight: '800',
    color: color,
  });

  const mainBodyStyle = {
    flex: 1,
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

  const contentStyle = {
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
    fontSize: '16px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '12px',
  };

  const quickFilterStyle = {
    display: 'flex',
    flexDirection: 'column',
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
    fontSize: '14px',
    fontWeight: '800',
  });

  const sidebarFooterStyle = {
    padding: '12px',
    borderTop: '3px solid #FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const actionButtonStyle = (color) => ({
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

  const toolbarStyle = {
    padding: '16px 20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const searchInputStyle = {
    padding: '12px 16px',
    backgroundColor: '#000000',
    border: '2px solid #FFFFFF',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    width: '320px',
  };

  const filterChipsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const chipStyle = (isActive) => ({
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: isActive ? '#22C55E' : '#333333',
    color: isActive ? '#000000' : '#FFFFFF',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const exportButtonsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const exportButtonStyle = {
    padding: '10px 16px',
    fontSize: '12px',
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

  const stockCellStyle = {
    ...cellStyle,
    fontWeight: '900',
    color: '#22C55E',
  };

  const costCellStyle = {
    ...cellStyle,
    fontFamily: 'monospace',
  };

  const statusBadgeStyle = (status) => ({
    ...getStockStatusStyle(status),
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '900',
    textTransform: 'uppercase',
  });

  const actionButtonSmallStyle = {
    padding: '6px 10px',
    backgroundColor: '#333333',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '800',
    marginRight: '4px',
    textTransform: 'uppercase',
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: '#1A1A1A',
    border: '3px solid #FFFFFF',
    padding: '24px',
    minWidth: '500px',
    maxWidth: '600px',
  };

  const modalTitleStyle = {
    fontSize: '18px',
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: '20px',
    textTransform: 'uppercase',
  };

  const modalInputStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000000',
    border: '2px solid #FFFFFF',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '12px',
  };

  const modalButtonStyle = {
    padding: '12px 24px',
    fontSize: '13px',
    fontWeight: '900',
    backgroundColor: '#22C55E',
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    marginRight: '8px',
  };

  const modalCancelButtonStyle = {
    padding: '12px 24px',
    fontSize: '13px',
    fontWeight: '900',
    backgroundColor: '#333333',
    color: '#FFFFFF',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      {/* KPI DASHBOARD */}
      <div style={kpiSectionStyle}>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>TOTAL INVENTORY VALUE</div>
          <div style={kpiValueStyle}>₹{metrics.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div style={kpiIndicatorStyle('#22C55E')}>+3.2% vs last week</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>LOW STOCK ALERTS</div>
          <div style={kpiValueStyle}>{metrics.lowStockCount} Items</div>
          <div style={kpiIndicatorStyle('#F59E0B')}>⚠️ REORDER NEEDED</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>OUT OF STOCK / CRITICAL</div>
          <div style={kpiValueStyle}>{metrics.outOfStockCount} Items</div>
          <div style={kpiIndicatorStyle('#EF4444')}>🚨 URGENT ACTION</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>MONTHLY WASTAGE VALUE</div>
          <div style={kpiValueStyle}>₹{metrics.wastageValue.toLocaleString('en-IN')}</div>
          <div style={kpiIndicatorStyle('#EF4444')}>-2.1% vs target</div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={mainBodyStyle}>
        {/* LEFT SIDEBAR */}
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={sidebarTitleStyle}>QUICK FILTERS</div>
            <div style={quickFilterStyle}>
              <button
                onClick={() => setQuickFilter('ALL')}
                style={filterButtonStyle(quickFilter === 'ALL')}
              >
                ALL ITEMS
              </button>
              <button
                onClick={() => setQuickFilter('LOW_STOCK_ALERTS')}
                style={filterButtonStyle(quickFilter === 'LOW_STOCK_ALERTS')}
              >
                LOW STOCK ALERTS
              </button>
              <button
                onClick={() => setQuickFilter('REORDER_NEEDED')}
                style={filterButtonStyle(quickFilter === 'REORDER_NEEDED')}
              >
                REORDER NEEDED
              </button>
              <button
                onClick={() => setQuickFilter('WASTAGE_LOGS')}
                style={filterButtonStyle(quickFilter === 'WASTAGE_LOGS')}
              >
                WASTAGE LOGS
              </button>
            </div>
          </div>

          <div style={sidebarHeaderStyle}>
            <div style={sidebarTitleStyle}>CATEGORIES</div>
          </div>

          <div style={categoryTreeStyle}>
            <div
              onClick={() => setSelectedCategory('ALL')}
              style={categoryItemStyle(selectedCategory === 'ALL')}
            >
              ALL CATEGORIES
            </div>
            {categoryTree.map(category => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={categoryItemStyle(selectedCategory === category.id)}
              >
                {category.name}
              </div>
            ))}
          </div>

          <div style={sidebarFooterStyle}>
            <button
              onClick={() => setShowStockInModal(true)}
              style={actionButtonStyle('#22C55E')}
            >
              + LOG STOCK ARRIVAL (GRN)
            </button>
            <button
              onClick={() => setShowWastageModal(true)}
              style={actionButtonStyle('#EF4444')}
            >
              + RECORD WASTAGE
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={contentStyle}>
          <div style={toolbarStyle}>
            <input
              type="text"
              placeholder="Search ingredient, SKU, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
            <div style={filterChipsStyle}>
              <button
                onClick={() => setUnitFilter('ALL')}
                style={chipStyle(unitFilter === 'ALL')}
              >
                ALL UNITS
              </button>
              <button
                onClick={() => setUnitFilter('KG')}
                style={chipStyle(unitFilter === 'KG')}
              >
                KG
              </button>
              <button
                onClick={() => setUnitFilter('LITERS')}
                style={chipStyle(unitFilter === 'LITERS')}
              >
                LITERS
              </button>
              <button
                onClick={() => setUnitFilter('PACKS')}
                style={chipStyle(unitFilter === 'PACKS')}
              >
                PACKS
              </button>
            </div>
            <div style={exportButtonsStyle}>
              <button style={exportButtonStyle}>EXPORT AUDIT REPORT (CSV)</button>
              <button style={exportButtonStyle}>GENERATE PURCHASE ORDER</button>
            </div>
          </div>

          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>ITEM CODE / SKU</th>
                  <th style={headerCellStyle}>INGREDIENT NAME</th>
                  <th style={headerCellStyle}>CATEGORY</th>
                  <th style={headerCellStyle}>CURRENT STOCK</th>
                  <th style={headerCellStyle}>REORDER LEVEL</th>
                  <th style={headerCellStyle}>UNIT COST (₹)</th>
                  <th style={headerCellStyle}>TOTAL VALUE (₹)</th>
                  <th style={headerCellStyle}>STOCK HEALTH</th>
                  <th style={headerCellStyle}>SUPPLIER</th>
                  <th style={headerCellStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const totalValue = item.currentStock * item.costPerUnit;
                  return (
                    <tr key={item.id}>
                      <td style={{...cellStyle, fontFamily: 'monospace'}}>{item.id}</td>
                      <td style={{...cellStyle, fontWeight: '900'}}>{item.name}</td>
                      <td style={cellStyle}>{item.category.replace(/_/g, ' ')}</td>
                      <td style={stockCellStyle}>
                        {item.currentStock.toFixed(1)} {item.unit}
                      </td>
                      <td style={cellStyle}>
                        {item.reorderLevel.toFixed(1)} {item.unit}
                      </td>
                      <td style={costCellStyle}>₹{item.costPerUnit.toFixed(2)}</td>
                      <td style={{...costCellStyle, color: '#22C55E', fontWeight: '900'}}>
                        ₹{totalValue.toFixed(2)}
                      </td>
                      <td style={cellStyle}>
                        <span style={statusBadgeStyle(item.status)}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={cellStyle}>{item.supplierName}</td>
                      <td style={cellStyle}>
                        <button style={actionButtonSmallStyle}>+ STOCK</button>
                        <button style={actionButtonSmallStyle}>EDIT</button>
                        <button style={{...actionButtonSmallStyle, backgroundColor: '#EF4444'}}>LOSS</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredInventory.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#888888',
                fontSize: '16px',
                fontWeight: '700',
              }}>
                No inventory items found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STOCK-IN MODAL */}
      {showStockInModal && (
        <div style={modalOverlayStyle} onClick={() => setShowStockInModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitleStyle}>LOG STOCK ARRIVAL (GRN)</div>
            <input
              type="text"
              placeholder="Select Item..."
              style={modalInputStyle}
            />
            <input
              type="number"
              placeholder="Quantity Added"
              style={modalInputStyle}
            />
            <input
              type="text"
              placeholder="Invoice #"
              style={modalInputStyle}
            />
            <input
              type="text"
              placeholder="Supplier"
              style={modalInputStyle}
            />
            <input
              type="number"
              placeholder="Total Paid (₹)"
              style={modalInputStyle}
            />
            <div style={{ marginTop: '16px' }}>
              <button style={modalButtonStyle}>CONFIRM STOCK-IN</button>
              <button style={modalCancelButtonStyle} onClick={() => setShowStockInModal(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WASTAGE MODAL */}
      {showWastageModal && (
        <div style={modalOverlayStyle} onClick={() => setShowWastageModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalTitleStyle}>RECORD WASTAGE / LOSS</div>
            <input
              type="text"
              placeholder="Select Item..."
              style={modalInputStyle}
            />
            <input
              type="number"
              placeholder="Quantity Lost"
              style={modalInputStyle}
            />
            <select style={modalInputStyle}>
              <option value="">Select Reason...</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="SPILLED">SPILLED</option>
              <option value="PREP_WASTE">PREP_WASTE</option>
              <option value="QUALITY_ISSUE">QUALITY_ISSUE</option>
            </select>
            <input
              type="text"
              placeholder="Notes (Optional)"
              style={modalInputStyle}
            />
            <div style={{ marginTop: '16px' }}>
              <button style={{...modalButtonStyle, backgroundColor: '#EF4444'}}>CONFIRM WASTAGE</button>
              <button style={modalCancelButtonStyle} onClick={() => setShowWastageModal(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
