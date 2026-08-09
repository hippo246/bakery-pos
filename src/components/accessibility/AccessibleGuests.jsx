/**
 * AccessibleGuests.jsx
 * Accessibility wrapper for Guest/Customer Management components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for guest operations
 */

import { useState } from 'react';
import {
  AccessibleCard,
  AccessibleList,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleGuests - Main guests wrapper with full accessibility
 */
export const AccessibleGuests = ({ children, title = "Guest Management" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="guests-content" />
      <div role="main" id="guests-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleGuestCard - Guest card with accessibility
 */
export const AccessibleGuestCard = ({ 
  guest, 
  onClick, 
  onEdit, 
  onDelete,
  isSelected = false 
}) => {
  const ariaLabel = `${guest.name}, phone ${guest.phone}, ${guest.email ? `email ${guest.email}, ` : ''}${guest.visits} visits, loyalty tier ${guest.loyaltyTier}`;

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
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: '900' }}>
          {guest.name}
        </div>
        <AccessibleStatus 
          status={guest.loyaltyTier === 'GOLD' ? 'success' : guest.loyaltyTier === 'SILVER' ? 'info' : 'warning'}
          ariaLabel={`Loyalty tier: ${guest.loyaltyTier}`}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Phone: ${guest.phone}`}>
        📱 {guest.phone}
      </div>
      {guest.email && (
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Email: ${guest.email}`}>
          ✉️ {guest.email}
        </div>
      )}
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }} aria-label={`${guest.visits} visits`}>
          👤 {guest.visits} visits
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onEdit && (
          <AccessibleButton
            onClick={() => onEdit(guest.id)}
            ariaLabel={`Edit guest ${guest.name}`}
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
            onClick={() => onDelete(guest.id)}
            ariaLabel={`Delete guest ${guest.name}`}
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
 * AccessibleGuestList - List of guests with accessibility
 */
export const AccessibleGuestList = ({ guests, onGuestAction, ariaLabel = "Guests" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={false}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {guests.map(guest => (
        <AccessibleGuestCard
          key={guest.id}
          guest={guest}
          onClick={() => onGuestAction?.('select', guest.id)}
          onEdit={() => onGuestAction?.('edit', guest.id)}
          onDelete={() => onGuestAction?.('delete', guest.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleGuestFilter - Filter controls for guests
 */
export const AccessibleGuestFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter guests" 
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
 * AccessibleGuestForm - Guest form with accessibility
 */
export const AccessibleGuestForm = ({ 
  guest, 
  onSave, 
  onCancel,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState(guest || {
    name: '',
    phone: '',
    email: '',
    address: '',
    loyaltyTier: 'BRONZE',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit guest' : 'Add new guest'}>
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="guest-name" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Name <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="guest-name"
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
          placeholder="Enter guest name"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="guest-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Phone <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="guest-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter phone number"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="guest-email" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Email
        </label>
        <input
          id="guest-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter email address"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="guest-loyalty" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Loyalty Tier
        </label>
        <select
          id="guest-loyalty"
          value={formData.loyaltyTier}
          onChange={(e) => setFormData({ ...formData, loyaltyTier: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
          <option value="PLATINUM">Platinum</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <AccessibleButton
          type="submit"
          ariaLabel={isEditing ? 'Update guest' : 'Add guest'}
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
          {isEditing ? 'Update' : 'Add Guest'}
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
 * AccessibleGuestStats - Guest statistics with accessibility
 */
export const AccessibleGuestStats = ({ stats }) => {
  return (
    <section
      aria-label="Guest statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Total guests: ${stats.total}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL GUESTS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.total}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`New this month: ${stats.newThisMonth}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>NEW THIS MONTH</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.newThisMonth}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Gold members: ${stats.goldMembers}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>GOLD MEMBERS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD166' }} aria-live="polite">
          {stats.goldMembers}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Active today: ${stats.activeToday}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>ACTIVE TODAY</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#3498DB' }} aria-live="polite">
          {stats.activeToday}
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleGuestAnnouncer - Live region for guest updates
 */
export const AccessibleGuestAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Guest update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleGuestSearch - Search input with accessibility
 */
export const AccessibleGuestSearch = ({ 
  onSearch, 
  placeholder = "Search guests...",
  ariaLabel = "Search guests" 
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor="guest-search" className="sr-only">
        {ariaLabel}
      </label>
      <input
        id="guest-search"
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

export default {
  AccessibleGuests,
  AccessibleGuestCard,
  AccessibleGuestList,
  AccessibleGuestFilter,
  AccessibleGuestForm,
  AccessibleGuestStats,
  AccessibleGuestAnnouncer,
  AccessibleGuestSearch,
};
