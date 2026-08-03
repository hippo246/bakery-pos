// Cloud Platform Settings Section
// Main entry point for all cloud platform configuration

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { card } from '../../../styles/theme';
import { isOwner, isManagerOrHigher, isAuthenticated, getCurrentRoleType } from '../../../utils/authService.js';
import { useSecurity } from '../../../hooks/useSecurity.js';
import StorageProvidersSection from './StorageProvidersSection.jsx';
import CredentialVaultSection from './CredentialVaultSection.jsx';
import BackupsSection from './BackupsSection.jsx';
import RestoreSection from './RestoreSection.jsx';
import SynchronizationSection from './SynchronizationSection.jsx';
import ImportExportSection from './ImportExportSection.jsx';
import CloudSecuritySection from './CloudSecuritySection.jsx';
import TenantSection from './TenantSection.jsx';

// Lazy-loaded sections
const CloudOverviewSection = lazy(() => import('./CloudOverviewSection.jsx'));
const MonitoringSection = lazy(() => import('./MonitoringSection.jsx'));
const DiagnosticsSection = lazy(() => import('./DiagnosticsSection.jsx'));
const AdvancedSection = lazy(() => import('./AdvancedSection.jsx'));

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '📊', description: 'Platform status and health', requiredRole: 'staff' },
  { id: 'providers', label: 'Storage Providers', icon: '☁️', description: 'Manage cloud storage providers', requiredRole: 'owner' },
  { id: 'credentials', label: 'Credential Vault', icon: '🔐', description: 'Secure credential management', requiredRole: 'owner' },
  { id: 'backups', label: 'Backups', icon: '💾', description: 'Backup configuration and history', requiredRole: 'owner' },
  { id: 'restore', label: 'Restore', icon: '🔄', description: 'Restore from recovery points', requiredRole: 'owner' },
  { id: 'sync', label: 'Synchronization', icon: '🔄', description: 'Sync rules and configuration', requiredRole: 'owner' },
  { id: 'import-export', label: 'Import & Export', icon: '📤', description: 'Data import/export settings', requiredRole: 'owner' },
  { id: 'monitoring', label: 'Monitoring', icon: '📈', description: 'Health monitoring and alerts', requiredRole: 'manager' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '🔧', description: 'System diagnostics and reports', requiredRole: 'manager' },
  { id: 'security', label: 'Security', icon: '🛡️', description: 'Security settings and policies', requiredRole: 'owner' },
  { id: 'tenant', label: 'Tenant Information', icon: '🏢', description: 'Workspace and subscription info', requiredRole: 'staff' },
  { id: 'advanced', label: 'Advanced', icon: '⚙️', description: 'Expert configuration', requiredRole: 'owner' }
];

export default function CloudPlatformSection({ settings, setSettings, isMobile }) {
  const { isOwner, isManager, isStaff } = useSecurity();
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const hasAccess = (section) => {
    const requiredRole = section.requiredRole;
    if (requiredRole === 'owner') return isOwner;
    if (requiredRole === 'manager') return isOwner || isManager;
    if (requiredRole === 'staff') return isOwner || isManager || isStaff;
    return false;
  };

  const accessibleSections = SECTIONS.filter(section => hasAccess(section));

  // Redirect away from a section the user has lost access to. This must run
  // as an effect, not during render — calling setState mid-render (as the
  // previous version did inside renderSection()) triggers React warnings
  // and can cause extra/inconsistent render passes.
  useEffect(() => {
    const activeSectionData = SECTIONS.find(s => s.id === activeSection);
    if (activeSectionData && !hasAccess(activeSectionData)) {
      const firstAccessible = accessibleSections[0];
      if (firstAccessible) {
        setActiveSection(firstAccessible.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isOwner, isManager, isStaff]);

  const renderSection = () => {
    // Pure guard: if the active section isn't accessible, render nothing.
    // No setState here — the effect above handles redirecting to a valid
    // section on the next render.
    const activeSectionData = SECTIONS.find(s => s.id === activeSection);
    if (activeSectionData && !hasAccess(activeSectionData)) {
      return null;
    }

    return (
      <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading section...</div>}>
        {(() => {
          switch (activeSection) {
            case 'overview':
              return <CloudOverviewSection isMobile={isMobile} />;
            case 'providers':
              return <StorageProvidersSection isMobile={isMobile} />;
            case 'credentials':
              return <CredentialVaultSection isMobile={isMobile} />;
            case 'backups':
              return <BackupsSection isMobile={isMobile} />;
            case 'restore':
              return <RestoreSection isMobile={isMobile} />;
            case 'sync':
              return <SynchronizationSection isMobile={isMobile} />;
            case 'import-export':
              return <ImportExportSection isMobile={isMobile} />;
            case 'monitoring':
              return <MonitoringSection isMobile={isMobile} />;
            case 'diagnostics':
              return <DiagnosticsSection isMobile={isMobile} />;
            case 'security':
              return <CloudSecuritySection isMobile={isMobile} />;
            case 'tenant':
              return <TenantSection isMobile={isMobile} />;
            case 'advanced':
              return <AdvancedSection isMobile={isMobile} />;
            default:
              return <CloudOverviewSection isMobile={isMobile} />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ ...card, padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>
          Cloud Platform
        </h2>
        <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)' }}>
          Complete cloud platform configuration and management
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 12 }}>
        {accessibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            disabled={isLoading}
            style={{
              ...card,
              padding: 16,
              textAlign: 'left',
              border: activeSection === section.id ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              background: activeSection === section.id ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{section.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                  {section.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 2 }}>
                  {section.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Section */}
      {renderSection()}
    </div>
  );
}
