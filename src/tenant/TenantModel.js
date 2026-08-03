// Tenant Model
// Core tenant data structure

import { TenantStatus, SubscriptionStatus, BusinessType, Region, _TenantHealthStatus } from './TenantTypes.js';

export class TenantModel {
  constructor(data = {}) {
    this.tenantId = data.tenantId || this.generateTenantId();
    this.businessName = data.businessName || '';
    this.legalName = data.legalName || '';
    this.businessType = data.businessType || BusinessType.CAFE;
    this.subscriptionStatus = data.subscriptionStatus || SubscriptionStatus.TRIAL;
    this.region = data.region || Region.US_EAST;
    this.timezone = data.timezone || 'UTC';
    this.currency = data.currency || 'USD';
    this.primaryContact = data.primaryContact || {};
    this.ownerAccount = data.ownerAccount || null;
    this.workspaceId = data.workspaceId || this.generateWorkspaceId();
    this.databaseReference = data.databaseReference || null;
    this.storageReference = data.storageReference || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.status = data.status || TenantStatus.PROVISIONING;
    this.version = data.version || '1.0.0';
    this.platformVersion = data.platformVersion || '1.0.0';
    this.config = data.config || {};
    this.metadata = data.metadata || {};
  }

  /**
   * Generate unique tenant ID
   * @returns {string} Tenant ID
   */
  generateTenantId() {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique workspace ID
   * @returns {string} Workspace ID
   */
  generateWorkspaceId() {
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if tenant is active
   * @returns {boolean} Active status
   */
  isActive() {
    return this.status === TenantStatus.ACTIVE;
  }

  /**
   * Check if tenant is suspended
   * @returns {boolean} Suspended status
   */
  isSuspended() {
    return this.status === TenantStatus.SUSPENDED;
  }

  /**
   * Check if tenant is archived
   * @returns {boolean} Archived status
   */
  isArchived() {
    return this.status === TenantStatus.ARCHIVED;
  }

  /**
   * Check if tenant is deleted
   * @returns {boolean} Deleted status
   */
  isDeleted() {
    return this.status === TenantStatus.DELETED;
  }

  /**
   * Activate tenant
   */
  activate() {
    this.status = TenantStatus.ACTIVE;
    this.metadata.lastStatusChange = new Date().toISOString();
  }

  /**
   * Suspend tenant
   */
  suspend() {
    this.status = TenantStatus.SUSPENDED;
    this.metadata.lastStatusChange = new Date().toISOString();
  }

  /**
   * Archive tenant
   */
  archive() {
    this.status = TenantStatus.ARCHIVED;
    this.metadata.lastStatusChange = new Date().toISOString();
  }

  /**
   * Delete tenant
   */
  delete() {
    this.status = TenantStatus.DELETED;
    this.metadata.deletedAt = new Date().toISOString();
  }

  /**
   * Update tenant information
   * @param {object} updates - Updates to apply
   */
  update(updates) {
    Object.assign(this, updates);
    this.metadata.lastModified = new Date().toISOString();
  }

  /**
   * Get tenant summary
   * @returns {object} Tenant summary
   */
  getSummary() {
    return {
      tenantId: this.tenantId,
      businessName: this.businessName,
      businessType: this.businessType,
      subscriptionStatus: this.subscriptionStatus,
      status: this.status,
      region: this.region,
      createdAt: this.createdAt,
      workspaceId: this.workspaceId
    };
  }

  /**
   * Validate tenant data
   * @returns {object} Validation result
   */
  validate() {
    const errors = [];

    if (!this.businessName) {
      errors.push({ field: 'businessName', message: 'Business name is required' });
    }

    if (!this.legalName) {
      errors.push({ field: 'legalName', message: 'Legal name is required' });
    }

    if (!this.primaryContact.email) {
      errors.push({ field: 'primaryContact.email', message: 'Primary contact email is required' });
    }

    if (!this.ownerAccount) {
      errors.push({ field: 'ownerAccount', message: 'Owner account is required' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   * @returns {object} JSON representation
   */
  toJSON() {
    return {
      tenantId: this.tenantId,
      businessName: this.businessName,
      legalName: this.legalName,
      businessType: this.businessType,
      subscriptionStatus: this.subscriptionStatus,
      region: this.region,
      timezone: this.timezone,
      currency: this.currency,
      primaryContact: this.primaryContact,
      ownerAccount: this.ownerAccount,
      workspaceId: this.workspaceId,
      databaseReference: this.databaseReference,
      storageReference: this.storageReference,
      createdAt: this.createdAt,
      status: this.status,
      version: this.version,
      platformVersion: this.platformVersion,
      config: this.config,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   * @param {object} json - JSON data
   * @returns {TenantModel} Tenant instance
   */
  static fromJSON(json) {
    return new TenantModel(json);
  }
}

export default TenantModel;
