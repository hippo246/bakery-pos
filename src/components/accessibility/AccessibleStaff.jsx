/**
 * AccessibleStaff.jsx
 * Accessibility wrapper for Staff Management components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for staff operations
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
 * AccessibleStaff - Main staff wrapper with full accessibility
 */
export const AccessibleStaff = ({ children, title = "Staff Management" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="staff-content" />
      <div role="main" id="staff-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleStaffCard - Staff card with accessibility
 */
export const AccessibleStaffCard = ({ 
  staff, 
  onClick, 
  onEdit, 
  onDelete,
  onSchedule,
  isSelected = false 
}) => {
  const ariaLabel = `${staff.name}, ${staff.role}, ${staff.department} department, status ${staff.status}, ${staff.hoursWorked} hours worked this week`;

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
          {staff.name}
        </div>
        <AccessibleStatus 
          status={staff.status === 'ACTIVE' ? 'success' : staff.status === 'ON_BREAK' ? 'warning' : 'error'}
          ariaLabel={`Status: ${staff.status}`}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Role: ${staff.role}`}>
        👔 {staff.role}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Department: ${staff.department}`}>
        🏢 {staff.department}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }} aria-label={`${staff.hoursWorked} hours worked this week`}>
        ⏰ {staff.hoursWorked}h this week
      </div>
      <AccessibleProgress
        value={staff.hoursWorked}
        max={40}
        ariaLabel={`Weekly hours: ${staff.hoursWorked} of 40`}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {onEdit && (
          <AccessibleButton
            onClick={() => onEdit(staff.id)}
            ariaLabel={`Edit staff ${staff.name}`}
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
        {onSchedule && (
          <AccessibleButton
            onClick={() => onSchedule(staff.id)}
            ariaLabel={`View schedule for ${staff.name}`}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              backgroundColor: '#FFD166',
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            📅 Schedule
          </AccessibleButton>
        )}
        {onDelete && (
          <AccessibleButton
            onClick={() => onDelete(staff.id)}
            ariaLabel={`Delete staff ${staff.name}`}
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
 * AccessibleStaffList - List of staff with accessibility
 */
export const AccessibleStaffList = ({ staff, onStaffAction, ariaLabel = "Staff members" }) => {
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
      {staff.map(member => (
        <AccessibleStaffCard
          key={member.id}
          staff={member}
          onClick={() => onStaffAction?.('select', member.id)}
          onEdit={() => onStaffAction?.('edit', member.id)}
          onSchedule={() => onStaffAction?.('schedule', member.id)}
          onDelete={() => onStaffAction?.('delete', member.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleStaffFilter - Filter controls for staff
 */
export const AccessibleStaffFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter staff" 
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
 * AccessibleStaffForm - Staff form with accessibility
 */
export const AccessibleStaffForm = ({ 
  staff, 
  onSave, 
  onCancel,
  isEditing = false 
}) => {
  const [formData, setFormData] = useState(staff || {
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} aria-label={isEditing ? 'Edit staff member' : 'Add new staff member'}>
      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="staff-name" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Name <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="staff-name"
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
          placeholder="Enter staff name"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="staff-role" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Role <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <input
          id="staff-role"
          type="text"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          required
          aria-required="true"
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
          placeholder="Enter role (e.g., Server, Chef)"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="staff-department" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Department <span aria-hidden="true" style={{ color: '#E63946' }}>*</span>
        </label>
        <select
          id="staff-department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
          <option value="">Select department</option>
          <option value="Kitchen">Kitchen</option>
          <option value="Front of House">Front of House</option>
          <option value="Management">Management</option>
          <option value="Cleaning">Cleaning</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label htmlFor="staff-email" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Email
        </label>
        <input
          id="staff-email"
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
        <label htmlFor="staff-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Phone
        </label>
        <input
          id="staff-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
        <label htmlFor="staff-status" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
          Status
        </label>
        <select
          id="staff-status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #E5E7EB',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="ACTIVE">Active</option>
          <option value="ON_BREAK">On Break</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <AccessibleButton
          type="submit"
          ariaLabel={isEditing ? 'Update staff member' : 'Add staff member'}
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
          {isEditing ? 'Update' : 'Add Staff'}
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
 * AccessibleStaffStats - Staff statistics with accessibility
 */
export const AccessibleStaffStats = ({ stats }) => {
  return (
    <section
      aria-label="Staff statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Total staff: ${stats.total}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL STAFF</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.total}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Active now: ${stats.activeNow}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>ACTIVE NOW</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#2ECC71' }} aria-live="polite">
          {stats.activeNow}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`On break: ${stats.onBreak}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>ON BREAK</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#FFD166' }} aria-live="polite">
          {stats.onBreak}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Avg hours this week: ${stats.avgHours}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>AVG HOURS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#3498DB' }} aria-live="polite">
          {stats.avgHours}h
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleStaffAnnouncer - Live region for staff updates
 */
export const AccessibleStaffAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Staff update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleStaffSchedule - Schedule view with accessibility
 */
export const AccessibleStaffSchedule = ({ schedule, onShiftClick }) => {
  return (
    <section
      aria-label="Staff schedule"
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900' }}>
        📅 Today's Schedule
      </h3>
      <AccessibleList ariaLabel="Scheduled shifts" isGrid={false}>
        {schedule.map((shift, index) => (
          <AccessibleListItem
            key={index}
            ariaLabel={`${shift.name}, ${shift.role}, ${shift.startTime} to ${shift.endTime}`}
            isInteractive={!!onShiftClick}
            onClick={() => onShiftClick?.(shift)}
            style={{
              padding: '12px',
              backgroundColor: '#F8F9FA',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: onShiftClick ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{shift.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{shift.role}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{shift.startTime}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{shift.endTime}</div>
              </div>
            </div>
          </AccessibleListItem>
        ))}
      </AccessibleList>
    </section>
  );
};

export default {
  AccessibleStaff,
  AccessibleStaffCard,
  AccessibleStaffList,
  AccessibleStaffFilter,
  AccessibleStaffForm,
  AccessibleStaffStats,
  AccessibleStaffAnnouncer,
  AccessibleStaffSchedule,
};
