/**
 * AccessibleMenu.jsx
 * Accessibility wrapper for Menu Management components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for menu operations
 */

import { useState } from 'react';
import {
  AccessibleCard,
  AccessibleList,
  AccessibleListItem,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleMenu - Main menu wrapper with full accessibility
 */
export const AccessibleMenu = ({ children, title = "Menu Management" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="menu-content" />
      <div role="main" id="menu-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleMenuItem - Menu item card with accessibility
 */
export const AccessibleMenuItem = ({ 
  item, 
  onClick, 
  onEdit, 
  onDelete,
  onToggleAvailability,
  isSelected = false 
}) => {
  const ariaLabel = `${item.name}, category ${item.category}, price ₹${item.price}, ${item.available ? 'available' : 'unavailable'}, ${item.isVegetarian ? 'vegetarian' : 'non-vegetarian'}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: item.available ? 1 : 0.6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: '900' }}>
          {item.isVegetarian && <span aria-hidden="true" style={{ marginRight: '4px' }}>🥬</span>}
          {item.name}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AccessibleStatus 
            status={item.available ? 'success' : 'error'}
            ariaLabel={item.available ? 'Available' : 'Unavailable'}
          />
          {item.isSpicy && (
            <span aria-label="Spicy" style={{ fontSize: '16px' }}>🌶️</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Category: ${item.category}`}>
        📁 {item.category}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '900', color: '#E63946', marginBottom: '8px' }} aria-label={`Price: ₹${item.price}`}>
        ₹{item.price}
      </div>
      {item.description && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }} aria-label={`Description: ${item.description}`}>
          {item.description}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        {onToggleAvailability && (
          <AccessibleButton
            onClick={() => onToggleAvailability(item.id)}
            ariaLabel={item.available ? `Make ${item.name} unavailable` : `Make ${item.name} available`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: item.available ? '#FFD166' : '#2ECC71',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {item.available ? '⏸️ Unavailable' : '▶️ Available'}
          </AccessibleButton>
        )}
        {onEdit && (
          <AccessibleButton
            onClick={() => onEdit(item.id)}
            ariaLabel={`Edit menu item ${item.name}`}
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
            ariaLabel={`Delete menu item ${item.name}`}
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
 * AccessibleMenuGrid - Grid of menu items with accessibility
 */
export const AccessibleMenuGrid = ({ items, onItemAction, ariaLabel = "Menu items" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={true}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px',
      }}
    >
      {items.map(item => (
        <AccessibleMenuItem
          key={item.id}
          item={item}
          onClick={() => onItemAction?.('select', item.id)}
          onEdit={() => onItemAction?.('edit', item.id)}
          onDelete={() => onItemAction?.('delete', item.id)}
          onToggleAvailability={() => onItemAction?.('toggle', item.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleMenuCategory - Category filter with accessibility
 */
export const AccessibleMenuCategory = ({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  ariaLabel = "Filter by category" 
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
      {categories.map(category => (
        <AccessibleButton
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          ariaLabel={`Show ${category.label} items`}
          aria-pressed={activeCategory === category.id}
          style={{
            padding: '8px 16px',
            backgroundColor: activeCategory === category.id ? '#E63946' : '#FFFFFF',
            color: activeCategory === category.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {category.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{category.icon}</span>}
          {category.label}
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessibleMenuForm - Menu item form with accessibility
 */
export const AccessibleMenuForm = ({ 
  item, 
  onSave, 
  onCancel,
  categories,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState(item || {
    name: '',
    category: '',
    price: '',
    description: '',
    isVegetarian: false,
    isSpicy: false,
    available: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit menu item' : 'Add new menu item'}>
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="menu-name" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Item Name <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="menu-name"
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
        <label htmlFor="menu-category" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Category <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <select
          id="menu-category"
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

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="menu-price" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Price (₹) <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="menu-price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter price"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="menu-description" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Description
        </label>
        <textarea
          id="menu-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
          }}
          placeholder="Enter item description"
        />
      </div>

      <div style={{ marginBottom: '12px', display: 'flex', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={formData.isVegetarian}
            onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
            aria-label="Vegetarian"
          />
          <span aria-hidden="true">🥬</span> Vegetarian
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={formData.isSpicy}
            onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
            aria-label="Spicy"
          />
          <span aria-hidden="true">🌶️</span> Spicy
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={formData.available}
            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
            aria-label="Available"
          />
          Available
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <AccessibleButton
          type="submit"
          ariaLabel={isEditing ? 'Update menu item' : 'Add menu item'}
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
 * AccessibleMenuStats - Menu statistics with accessibility
 */
export const AccessibleMenuStats = ({ stats }) => {
  return (
    <section
      aria-label="Menu statistics"
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
        ariaLabel={`Available: ${stats.available}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>AVAILABLE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.available}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Vegetarian: ${stats.vegetarian}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>VEGETARIAN</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.vegetarian}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Categories: ${stats.categories}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>CATEGORIES</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#3498DB' }} aria-live="polite">
          {stats.categories}
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleMenuAnnouncer - Live region for menu updates
 */
export const AccessibleMenuAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Menu update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleMenuSearch - Search input with accessibility
 */
export const AccessibleMenuSearch = ({ 
  onSearch, 
  placeholder = "Search menu items...",
  ariaLabel = "Search menu items" 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor="menu-search" className="sr-only">
        {ariaLabel}
      </label>
      <input
        id="menu-search"
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
 * AccessibleMenuModifier - Modifier selection with accessibility
 */
export const AccessibleMenuModifier = ({ 
  modifiers, 
  selectedModifiers, 
  onToggle,
  ariaLabel = "Item modifiers" 
}) => {
  return (
    <section aria-label={ariaLabel}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
        Modifiers
      </h4>
      <AccessibleList ariaLabel="Available modifiers" isGrid={false}>
        {modifiers.map(modifier => (
          <AccessibleListItem
            key={modifier.id}
            ariaLabel={`${modifier.name}, ${modifier.price > 0 ? `additional ₹${modifier.price}` : 'no extra charge'}`}
            isInteractive={true}
            onClick={() => onToggle(modifier.id)}
            isSelected={selectedModifiers.includes(modifier.id)}
            style={{
              padding: '8px',
              backgroundColor: selectedModifiers.includes(modifier.id) ? '#E63946' : '#F8F9FA',
              color: selectedModifiers.includes(modifier.id) ? '#FFFFFF' : '#1A1A1A',
              borderRadius: '4px',
              marginBottom: '4px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{modifier.name}</span>
            {modifier.price > 0 && (
              <span>+₹{modifier.price}</span>
            )}
          </AccessibleListItem>
        ))}
      </AccessibleList>
    </section>
  );
};

export default {
  AccessibleMenu,
  AccessibleMenuItem,
  AccessibleMenuGrid,
  AccessibleMenuCategory,
  AccessibleMenuForm,
  AccessibleMenuStats,
  AccessibleMenuAnnouncer,
  AccessibleMenuSearch,
  AccessibleMenuModifier,
};
