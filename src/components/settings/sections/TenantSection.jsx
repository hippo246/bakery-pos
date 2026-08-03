// Tenant Section
// Workspace and subscription information

import React, { useState, useEffect } from 'react';
import { card } from '../../../styles/theme';

export default function TenantSection({ isMobile }) {
  const [tenantInfo, setTenantInfo] = useState({
    tenantId: 'TEN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    businessName: '',
    workspace: 'Default',
    cloudProvider: 'None',
    storageAllocation: { used: 0, total: 10737418240 }, // 10GB default
    createdDate: new Date().toISOString(),
    platformVersion: '1.0.0',
    subscription: {
      plan: 'Free',
      status: 'Active',
      expiresAt: null
    }
  });

  useEffect(() => {
    loadTenantInfo();
  }, []);

  const loadTenantInfo = () => {
    try {
      const saved = localStorage.getItem('cafeos_tenant_info');
      if (saved) {
        setTenantInfo(JSON.parse(saved));
      } else {
        // Initialize with default values
        const settings = localStorage.getItem('cafeos_settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setTenantInfo(prev => ({ ...prev, businessName: parsed.businessName || '' }));
        }
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const storagePercentage = (tenantInfo.storageAllocation.used / tenantInfo.storageAllocation.total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tenant Information */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Tenant Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Tenant ID</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
              {tenantInfo.tenantId}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Business Name</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.businessName || 'Not Set'}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Workspace</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.workspace}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Cloud Provider</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.cloudProvider}
            </div>
          </div>
        </div>
      </div>

      {/* Storage Allocation */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Storage Allocation
        </h3>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Used</span>
            <span style={{ fontSize: 12, color: 'var(--cafe-text-primary)' }}>
              {formatBytes(tenantInfo.storageAllocation.used)} / {formatBytes(tenantInfo.storageAllocation.total)}
            </span>
          </div>
          <div style={{ 
            height: 8, 
            background: 'var(--cafe-bg)', 
            borderRadius: 4, 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${storagePercentage}%`, 
              background: storagePercentage > 80 ? 'var(--cafe-danger)' : storagePercentage > 60 ? 'var(--cafe-warning)' : 'var(--cafe-success)',
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
            {storagePercentage.toFixed(1)}% used
          </div>
        </div>
      </div>

      {/* Subscription Information */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Subscription Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Plan</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.subscription.plan}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: tenantInfo.subscription.status === 'Active' ? 'var(--cafe-success)' : 'var(--cafe-warning)' }}>
              {tenantInfo.subscription.status}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Expires</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.subscription.expiresAt ? formatDate(tenantInfo.subscription.expiresAt) : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Information */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Platform Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Platform Version</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {tenantInfo.platformVersion}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Created Date</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {formatDate(tenantInfo.createdDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
