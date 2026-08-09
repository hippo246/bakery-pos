import React from 'react';
import { useState, useCallback, useMemo } from "react";

const SETTINGS_CATEGORIES = [
  { key: "home", label: "Home", icon: "🏠", description: "Overview & Quick Actions" },
  { key: "general", label: "General", icon: "⚙️", description: "Language, Timezone, Currency" },
  { key: "business", label: "Business Profile", icon: "🏢", description: "Cafe Information" },
  { key: "branding", label: "Branding", icon: "🎨", description: "Logo & Theme" },
  { key: "theme", label: "Theme", icon: "🎭", description: "Appearance & Display" },
  { key: "taxes", label: "Taxes", icon: "📊", description: "GST & Service Charge" },
  { key: "payments", label: "Payments", icon: "💳", description: "Payment Methods" },
  { key: "payment-gateways", label: "Payment Gateways", icon: "🔗", description: "Razorpay, Stripe, PhonePe" },
  { key: "orders", label: "Orders", icon: "🍽️", description: "Order Configuration" },
  { key: "hours", label: "Operating Hours", icon: "🕐", description: "Schedule & Templates" },
  { key: "kitchen", label: "Kitchen", icon: "👨‍🍳", description: "KDS Configuration" },
  { key: "menu", label: "Menu", icon: "📋", description: "Menu Defaults" },
  { key: "receipts", label: "Receipts & Printing", icon: "🧾", description: "Layout & Routing" },
  { key: "delivery", label: "Delivery", icon: "🚚", description: "Delivery Configuration" },
  { key: "reservations", label: "Reservations", icon: "📅", description: "Reservation Rules" },
  { key: "terminals", label: "Terminals", icon: "🖥️", description: "Multi-POS Configuration" },
  { key: "hardware", label: "Hardware & Devices", icon: "🖨️", description: "Printers & Displays" },
  { key: "staff", label: "Team & Permissions", icon: "👥", description: "Role Management" },
  { key: "integrations", label: "Integrations", icon: "🔌", description: "Third-Party Services" },
  { key: "security", label: "Security", icon: "🔒", description: "Access & Protection" },
  { key: "notifications", label: "Notifications", icon: "🔔", description: "Alerts & Updates" },
  { key: "backups", label: "Data & Backups", icon: "💾", description: "Backup & Restore" },
  { key: "support", label: "Support & Remote", icon: "🛠️", description: "Diagnostics, Help & Remote Access" },
  { key: "advanced", label: "Advanced", icon: "⚡", description: "Developer Tools" },
  { key: "danger", label: "Danger Zone", icon: "⚠️", description: "Destructive Actions" },
  { key: "about", label: "About", icon: "ℹ️", description: "Version & Credits" }
];

export default function SettingsLayout({ activeCategory, onCategoryChange, children, isMobile, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SETTINGS_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return SETTINGS_CATEGORIES.filter(cat => 
      cat.label.toLowerCase().includes(query) || 
      cat.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleCategoryClick = useCallback((key) => {
    onCategoryChange(key);
  }, [onCategoryChange]);

  const styles = {
    container: { 
      display: 'flex', 
      height: '100vh', 
      background: 'var(--cafe-bg)' 
    },
    sidebar: { 
      width: isMobile ? '70px' : '300px', 
      background: 'var(--cafe-bg-surface)', 
      borderRight: '1px solid var(--cafe-border-light)',
      overflowY: 'auto',
      padding: isMobile ? '12px 8px' : '24px 20px'
    },
    searchContainer: {
      marginBottom: '20px'
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 13,
      border: '1px solid var(--cafe-border-light)',
      borderRadius: 12,
      background: 'var(--cafe-bg)',
      color: 'var(--cafe-text-primary)',
      outline: 'none',
      transition: 'all 0.2s'
    },
    categoryList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    categoryButton: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: isMobile ? '12px' : '12px 16px',
      fontSize: 13,
      fontWeight: isActive ? 700 : 600,
      background: isActive ? 'var(--cafe-accent-bg)' : 'transparent',
      color: isActive ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
      border: isActive ? '1px solid var(--cafe-accent)' : '1px solid transparent',
      borderRadius: 10,
      cursor: 'pointer',
      justifyContent: isMobile ? 'center' : 'flex-start',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s ease'
    }),
    categoryIcon: {
      fontSize: '18px',
      minWidth: '24px',
      textAlign: 'center'
    },
    categoryLabel: {
      flex: 1,
      display: isMobile ? 'none' : 'block'
    },
    categoryDescription: {
      fontSize: 11,
      color: isMobile ? 'transparent' : 'var(--cafe-text-tertiary)',
      marginTop: '2px',
      fontWeight: 500
    },
    content: {
      flex: 1,
      overflow: 'auto',
      background: 'var(--cafe-bg)'
    },
    mobileHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: 'var(--cafe-bg-surface)',
      borderBottom: '1px solid var(--cafe-border-light)',
      gap: '12px'
    },
    backButton: {
      padding: '8px',
      background: 'transparent',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: 'var(--cafe-text-secondary)'
    },
    mobileTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--cafe-text-primary)',
      margin: 0,
      letterSpacing: '-0.01em'
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div style={styles.container}>
        {activeCategory === 'home' ? (
          <div style={styles.sidebar}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="🔍 Search settings..."
                value={searchQuery}
                onChange={handleSearch}
                style={styles.searchInput}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
              />
            </div>
            <div style={styles.categoryList}>
              {filteredCategories.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat.key)}
                  style={styles.categoryButton(activeCategory === cat.key)}
                  title={cat.description}
                  onMouseOver={e => { if (activeCategory !== cat.key) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
                  onMouseOut={e => { if (activeCategory !== cat.key) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <span style={styles.categoryIcon}>{cat.icon}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={styles.mobileHeader}>
              <button onClick={() => onCategoryChange('home')} style={styles.backButton}>
                ←
              </button>
              <h2 style={styles.mobileTitle}>
                {SETTINGS_CATEGORIES.find(c => c.key === activeCategory)?.label || 'Settings'}
              </h2>
            </div>
            <div style={styles.content}>
              {children}
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Search settings..."
            value={searchQuery}
            onChange={handleSearch}
            style={styles.searchInput}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}
          />
        </div>
        <div style={styles.categoryList}>
          {filteredCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              style={styles.categoryButton(activeCategory === cat.key)}
              onMouseOver={e => { if (activeCategory !== cat.key) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
              onMouseOut={e => { if (activeCategory !== cat.key) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <span style={styles.categoryIcon}>{cat.icon}</span>
              <div style={styles.categoryLabel}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{cat.label}</div>
                <div style={styles.categoryDescription}>{cat.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}
