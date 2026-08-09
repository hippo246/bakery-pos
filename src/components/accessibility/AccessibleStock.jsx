/**
 * AccessibleStock.jsx
 * Accessibility wrapper for Stock/Inventory Management components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for inventory operations
 */

import { useState } from 'react';
import {
  AccessibleCard,
  AccessibleList,
  AccessibleListItem,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleProgress,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleStock - Main stock wrapper with full accessibility
 */
export const AccessibleStock = ({ children, title = "Stock Management" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="stock-content" />
      <div role="main" id="stock-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleStockItem - Stock item card with accessibility
 */
export const AccessibleStockItem = ({ 
  item, 
  onClick, 
  onEdit, 
  onDelete,
  onAddStock,
  isSelected = false 
}) => {
  const statusLabels = {
    IN_STOCK: 'In stock',
    LOW_STOCK: 'Low stock',
    OUT_OF_STOCK: 'Out of stock',
  };

  const _stockPercentage = (item.quantity / item.reorderLevel) * 100;
  const isLowStock = item.quantity <= item.reorderLevel;

  const ariaLabel = `${item.name}, category ${item.category}, ${item.quantity} ${item.unit}, status ${statusLabels[item.status]}, reorder level ${item.reorderLevel} ${item.unit}, cost ₹${item.costPerUnit} per ${item.unit}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#FFFFFF',
        border: `2px solid ${isLowStock ? '#FFD166' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: '900' }}>
          {item.name}
        </div>
        <AccessibleStatus 
          status={item.status === 'IN_STOCK' ? 'success' : item.status === 'LOW_STOCK' ? 'warning' : 'error'}
          ariaLabel={`Status: ${statusLabels[item.status]}`}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Category: ${item.category}`}>
        📁 {item.category}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '900', color: '#E63946', marginBottom: '8px' }} aria-label={`${item.quantity} ${item.unit}`}>
        {item.quantity} {item.unit}
      </div>
      <AccessibleProgress
        value={item.quantity}
        max={item.reorderLevel * 2}
        ariaLabel={`Stock level: ${item.quantity} of ${item.reorderLevel * 2}`}
      />
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }} aria-label={`Reorder level: ${item.reorderLevel} ${item.unit}`}>
        🔄 Reorder at: {item.reorderLevel} {item.unit}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }} aria-label={`Cost: ₹${item.costPerUnit} per ${item.unit}`}>
        💰 ₹{item.costPerUnit}/{item.unit}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }} aria-label={`Supplier: ${item.supplier}`}>
        🏭 {item.supplier}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onAddStock && (
          <AccessibleButton
            onClick={() => onAddStock(item.id)}
            ariaLabel={`Add stock for ${item.name}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#2ECC71',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ➕ Add Stock
          </AccessibleButton>
        )}
        {onEdit && (
          <AccessibleButton
            onClick={() => onEdit(item.id)}
            ariaLabel={`Edit stock item ${item.name}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#3498DB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✏️ Edit
          </AccessibleButton>
        )}
        {onDelete && (
          <AccessibleButton
            onClick={() => onDelete(item.id)}
            ariaLabel={`Delete stock item ${item.name}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#E63946',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🗑️ Delete
          </AccessibleButton>
        )}
      </div>
    </AccessibleCard>
  );
};

/**
 * AccessibleStockGrid - Grid of stock items with accessibility
 */
export const AccessibleStockGrid = ({ items, onItemAction, ariaLabel = "Stock items" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={true}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px',
      }}
    >
      {items.map(item => (
        <AccessibleStockItem
          key={item.id}
          item={item}
          onClick={() => onItemAction?.('select', item.id)}
          onEdit={() => onItemAction?.('edit', item.id)}
          onDelete={() => onItemAction?.('delete', item.id)}
          onAddStock={() => onItemAction?.('add', item.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleStockFilter - Filter controls for stock
 */
export const AccessibleStockFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter stock items" 
}) => {
  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}
    >
      {filters.map(filter => (
        <AccessibleButton
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          ariaLabel={`Filter by ${filter.label}`}
          aria-pressed={activeFilter === filter.id}
          style={{
            padding: '8px 16px',
            backgroundColor: activeFilter === filter.id ? '#E63946' : '#FFFFFF',
            color: activeFilter === filter.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {filter.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{filter.icon}</span>}
          {filter.label}
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessibleStockForm - Stock item form with accessibility
 */
export const AccessibleStockForm = ({ 
  item, 
  onSave, 
  onCancel,
  categories,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState(item || {
    name: '',
    category: '',
    quantity: '',
    unit: '',
    reorderLevel: '',
    costPerUnit: '',
    supplier: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit stock item' : 'Add new stock item'}>
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="stock-name" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Item Name <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="stock-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter item name"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="stock-category" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Category <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <select
          id="stock-category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="stock-quantity" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Quantity <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
          </label>
          <input
            id="stock-quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
            aria-required="true"
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #E5E7EB',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            placeholder="Enter quantity"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="stock-unit" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Unit <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
          </label>
          <input
            id="stock-unit"
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
            aria-required="true"
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #E5E7EB',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            placeholder="e.g., kg, L, pcs"
          />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="stock-reorder" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Reorder Level <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="stock-reorder"
          type="number"
          value={formData.reorderLevel}
          onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter reorder level"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="stock-cost" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Cost per Unit (₹) <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="stock-cost"
          type="number"
          step="0.01"
          value={formData.costPerUnit}
          onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter cost per unit"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="stock-supplier" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Supplier
        </label>
        <input
          id="stock-supplier"
          type="text"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter supplier name"
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <AccessibleButton
          type="submit"
          ariaLabel={isEditing ? 'Update stock item' : 'Add stock item'}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#E63946',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isEditing ? 'Update' : 'Add Item'}
        </AccessibleButton>
        {onCancel && (
          <AccessibleButton
            type="button"
            onClick={onCancel}
            ariaLabel="Cancel"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Cancel
          </AccessibleButton>
        )}
      </div>
    </form>
  );
};

/**
 * AccessibleStockStats - Stock statistics with accessibility
 */
export const AccessibleStockStats = ({ stats }) => {
  return (
    <section
      aria-label="Stock statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Total items: ${stats.total}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL ITEMS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.total}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Low stock: ${stats.lowStock}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>LOW STOCK</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD166' }} aria-live="polite">
          {stats.lowStock}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Out of stock: ${stats.outOfStock}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>OUT OF STOCK</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.outOfStock}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Total value: ₹${stats.totalValue}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL VALUE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          ₹{stats.totalValue?.toLocaleString('en-IN')}
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleStockAnnouncer - Live region for stock updates
 */
export const AccessibleStockAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Stock update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleStockSearch - Search input with accessibility
 */
export const AccessibleStockSearch = ({ 
  onSearch, 
  placeholder = "Search stock items...",
  ariaLabel = "Search stock items" 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor="stock-search" className="sr-only">
        {ariaLabel}
      </label>
      <input
        id="stock-search"
        type="search"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #E5E7EB',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
    </div>
  );
};

/**
 * AccessibleStockAlert - Low stock alert with accessibility
 */
export const AccessibleStockAlert = ({ items, onRestock }) => {
  return (
    <section
      aria-label="Low stock alerts"
      style={{
        backgroundColor: '#FEF2F2',
        border: '2px solid #E63946',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900', color: '#E63946' }}>
        ⚠️ Low Stock Alerts
      </h3>
      <AccessibleList ariaLabel="Items needing restock" isGrid={false}>
        {items.map(item => (
          <AccessibleListItem
            key={item.id}
            ariaLabel={`${item.name}, ${item.quantity} ${item.unit} remaining, reorder level ${item.reorderLevel} ${item.unit}`}
            isInteractive={!!onRestock}
            onClick={() => onRestock?.(item.id)}
            style={{
              padding: '8px',
              backgroundColor: '#FFFFFF',
              borderRadius: '4px',
              marginBottom: '4px',
              cursor: onRestock ? 'pointer' : 'default',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>
                {item.quantity} {item.unit} / {item.reorderLevel} {item.unit}
              </div>
            </div>
            {onRestock && (
              <AccessibleButton
                onClick={() => onRestock(item.id)}
                ariaLabel={`Restock ${item.name}`}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  backgroundColor: '#E63946',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Restock
              </AccessibleButton>
            )}
          </AccessibleListItem>
        ))}
      </AccessibleList>
    </section>
  );
};

export default {
  AccessibleStock,
  AccessibleStockItem,
  AccessibleStockGrid,
  AccessibleStockFilter,
  AccessibleStockForm,
  AccessibleStockStats,
  AccessibleStockAnnouncer,
  AccessibleStockSearch,
  AccessibleStockAlert,
};
