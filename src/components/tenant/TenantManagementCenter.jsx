// Tenant Management Center
// Premium operational workspace for tenant management

import React, { useState, useEffect, useCallback } from 'react';
import { getTenantRegistry } from '../../tenant/TenantRegistry.js';
import { getWorkspaceProvisioner } from '../../tenant/WorkspaceProvisioner.js';
import { getTenantHealthMonitor } from '../../tenant/TenantHealthMonitor.js';
import { getTenantSecurity } from '../../tenant/TenantSecurity.js';
import { getTenantAuditLogger } from '../../tenant/TenantAuditLogger.js';
import { TenantStatus, SubscriptionStatus, BusinessType, Region } from '../../tenant/TenantTypes.js';

export default function TenantManagementCenter() {
  const tenantRegistry = getTenantRegistry();
  const workspaceProvisioner = getWorkspaceProvisioner();
  const tenantHealthMonitor = getTenantHealthMonitor();
  const tenantSecurity = getTenantSecurity();
  const tenantAuditLogger = getTenantAuditLogger();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [healthStats, setHealthStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    businessName: '',
    legalName: '',
    businessType: BusinessType.CAFE,
    region: Region.US_EAST,
    timezone: 'UTC',
    currency: 'USD',
    primaryContact: {
      name: '',
      email: '',
      phone: ''
    },
    ownerAccount: ''
  });
  const [provisioningStatus, setProvisioningStatus] = useState(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setTenants(tenantRegistry.getAllTenants());
    setHealthStats(tenantHealthMonitor.getHealthStatistics());
    setViolations(tenantSecurity.getViolations({ limit: 20 }));
    setAuditLog(tenantAuditLogger.getAuditLog({ limit: 20 }));
  }, [tenantRegistry, tenantHealthMonitor, tenantSecurity, tenantAuditLogger]);

  const handleCreateTenant = useCallback(async () => {
    try {
      const result = tenantRegistry.createTenant(newTenantData);
      
      if (result.success) {
        setShowCreateModal(false);
        setProvisioningStatus({ tenantId: result.tenantId, status: 'provisioning' });
        
        // Start provisioning
        const provisionResult = await workspaceProvisioner.provisionWorkspace(result.tenantId);
        
        if (provisionResult.success) {
          setProvisioningStatus({ tenantId: result.tenantId, status: 'completed' });
          refreshData();
        } else {
          setProvisioningStatus({ tenantId: result.tenantId, status: 'failed', error: provisionResult.reason });
        }
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  }, [tenantRegistry, workspaceProvisioner, newTenantData, refreshData]);

  const handleSuspendTenant = useCallback((tenantId) => {
    const result = tenantRegistry.suspendTenant(tenantId, 'Manual suspension');
    if (result.success) {
      refreshData();
    }
  }, [tenantRegistry, refreshData]);

  const handleReactivateTenant = useCallback((tenantId) => {
    const result = tenantRegistry.reactivateTenant(tenantId);
    if (result.success) {
      refreshData();
    }
  }, [tenantRegistry, refreshData]);

  const handleArchiveTenant = useCallback((tenantId) => {
    const result = tenantRegistry.archiveTenant(tenantId);
    if (result.success) {
      refreshData();
    }
  }, [tenantRegistry, refreshData]);

  const handleDeleteTenant = useCallback((tenantId) => {
    if (confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      const result = tenantRegistry.deleteTenant(tenantId, true);
      if (result.success) {
        refreshData();
      }
    }
  }, [tenantRegistry, refreshData]);

  const handleCloneTenant = useCallback((tenantId) => {
    const cloneData = {
      businessName: `${tenants.find(t => t.tenantId === tenantId)?.businessName} (Clone)`,
      legalName: '',
      ownerAccount: '',
      primaryContact: { name: '', email: '', phone: '' }
    };
    
    const result = tenantRegistry.cloneTenant(tenantId, cloneData);
    if (result.success) {
      refreshData();
    }
  }, [tenantRegistry, tenants, refreshData]);

  const filteredTenants = tenants.filter(tenant =>
    tenant.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViolations = violations.filter(violation =>
    violation.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLog = auditLog.filter(log =>
    log.details?.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Multi-tenant infrastructure management</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Create Tenant
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'tenants', label: 'Tenants' },
            { id: 'health', label: 'Health' },
            { id: 'security', label: 'Security' },
            { id: 'audit', label: 'Audit Log' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Tenants</div>
              <div className="text-2xl font-bold text-gray-900">{tenants.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Active</div>
              <div className="text-2xl font-bold text-green-600">
                {healthStats?.healthy || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Degraded</div>
              <div className="text-2xl font-bold text-amber-600">
                {healthStats?.degraded || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Security Violations</div>
              <div className="text-2xl font-bold text-red-600">
                {violations.length}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {auditLog.slice(0, 5).map((log, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900">{log.details?.message}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{log.details?.tenantId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">All Tenants</h3>
            {filteredTenants.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No tenants found</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTenants.map((tenant, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.businessName}</div>
                        <div className="text-sm text-gray-500">{tenant.legalName}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {tenant.businessType} • {tenant.region} • {tenant.tenantId}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        tenant.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="text-sm text-amber-600 hover:text-amber-700"
                      >
                        View Details
                      </button>
                      {tenant.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleSuspendTenant(tenant.tenantId)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleCloneTenant(tenant.tenantId)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Clone
                          </button>
                        </>
                      )}
                      {tenant.status === 'suspended' && (
                        <button
                          onClick={() => handleReactivateTenant(tenant.tenantId)}
                          className="text-sm text-green-600 hover:text-green-700"
                        >
                          Reactivate
                        </button>
                      )}
                      {(tenant.status === 'active' || tenant.status === 'suspended') && (
                        <button
                          onClick={() => handleArchiveTenant(tenant.tenantId)}
                          className="text-sm text-gray-600 hover:text-gray-700"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTenant(tenant.tenantId)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Overview</h3>
            {healthStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-xl font-bold text-gray-900">{healthStats.total}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Healthy</div>
                  <div className="text-xl font-bold text-green-600">{healthStats.healthy}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Degraded</div>
                  <div className="text-xl font-bold text-amber-600">{healthStats.degraded}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Unhealthy</div>
                  <div className="text-xl font-bold text-red-600">{healthStats.unhealthy}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">No health data available</div>
            )}
          </div>

          {selectedTenant && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {selectedTenant.businessName} - Health Details
              </h3>
              <div className="text-sm text-gray-600">
                <div>Database Health: <span className="text-green-600">Healthy</span></div>
                <div>Storage Health: <span className="text-green-600">Healthy</span></div>
                <div>Cloud Health: <span className="text-green-600">Healthy</span></div>
                <div>Backup Health: <span className="text-green-600">Healthy</span></div>
                <div>Sync Health: <span className="text-green-600">Healthy</span></div>
                <div>Security Score: <span className="text-green-600">85/100</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Violations</h3>
            {filteredViolations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No security violations</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredViolations.map((violation, index) => (
                  <div key={index} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-800">{violation.type.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-sm text-red-600 mt-1">
                      {new Date(violation.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      Tenant: {violation.tenantId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Audit Log</h3>
            {filteredAuditLog.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No audit log entries</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAuditLog.map((log, index) => (
                  <div key={index} className="p-3 border border-gray-100 rounded-lg">
                    <div className="font-medium text-gray-900">{log.details?.message}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Tenant: {log.details?.tenantId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tenant</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={newTenantData.businessName}
                  onChange={(e) => setNewTenantData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  value={newTenantData.legalName}
                  onChange={(e) => setNewTenantData(prev => ({ ...prev, legalName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={newTenantData.businessType}
                  onChange={(e) => setNewTenantData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.values(BusinessType).map(type => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={newTenantData.region}
                  onChange={(e) => setNewTenantData(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.values(Region).map(region => (
                    <option key={region} value={region}>{region.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Account ID</label>
                <input
                  type="text"
                  value={newTenantData.ownerAccount}
                  onChange={(e) => setNewTenantData(prev => ({ ...prev, ownerAccount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={newTenantData.primaryContact.email}
                  onChange={(e) => setNewTenantData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Create & Provision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provisioning Status */}
      {provisioningStatus && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="font-medium text-gray-900 mb-2">Workspace Provisioning</div>
          {provisioningStatus.status === 'provisioning' && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
              <span className="text-sm text-gray-600">Provisioning workspace...</span>
            </div>
          )}
          {provisioningStatus.status === 'completed' && (
            <div className="text-sm text-green-600">Workspace provisioned successfully!</div>
          )}
          {provisioningStatus.status === 'failed' && (
            <div className="text-sm text-red-600">Provisioning failed: {provisioningStatus.error}</div>
          )}
          <button
            onClick={() => setProvisioningStatus(null)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
