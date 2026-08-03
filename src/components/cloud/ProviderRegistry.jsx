// Provider Registry Component
// Displays all available cloud storage providers with their status, capabilities, and configuration options

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LocalStorageProvider, 
  AWSS3Provider, 
  GCSProvider, 
  AzureBlobProvider,
  FirebaseStorageProvider,
  CloudflareR2Provider,
  BackblazeB2Provider,
  SupabaseStorageProvider,
  MinIOProvider,
  SMBProvider,
  WebDAVProvider
} from '../../cloud/providers';

// Provider metadata for display
const PROVIDER_METADATA = {
  'local': {
    name: 'Local Storage',
    description: 'Browser-based storage using localStorage',
    icon: '💾',
    category: 'local',
    tier: 'free',
    features: ['Fast access', 'No configuration needed', 'Limited to browser storage']
  },
  'aws-s3': {
    name: 'AWS S3',
    description: 'Amazon Simple Storage Service',
    icon: '☁️',
    category: 'cloud',
    tier: 'paid',
    features: ['Highly scalable', '99.999999999% durability', 'Multiple storage classes']
  },
  'gcs': {
    name: 'Google Cloud Storage',
    description: 'Google Cloud object storage',
    icon: '🔷',
    category: 'cloud',
    tier: 'paid',
    features: ['Unified storage', 'Strong consistency', 'Multi-region support']
  },
  'azure-blob': {
    name: 'Azure Blob Storage',
    description: 'Microsoft Azure object storage',
    icon: '🔵',
    category: 'cloud',
    tier: 'paid',
    features: ['Hot, cool, and archive tiers', 'Data redundancy options', 'Seamless Azure integration']
  },
  'firebase-storage': {
    name: 'Firebase Storage',
    description: 'Google Firebase cloud storage',
    icon: '🔥',
    category: 'cloud',
    tier: 'freemium',
    features: ['Real-time listeners', 'Security rules', 'CDN integration']
  },
  'cloudflare-r2': {
    name: 'Cloudflare R2',
    description: 'S3-compatible storage with zero egress fees',
    icon: '🌐',
    category: 'cloud',
    tier: 'paid',
    features: ['Zero egress fees', 'S3-compatible', 'Global edge network']
  },
  'backblaze-b2': {
    name: 'Backblaze B2',
    description: 'Affordable cloud storage',
    icon: '📦',
    category: 'cloud',
    tier: 'paid',
    features: ['Low cost', 'S3-compatible', 'Simple pricing']
  },
  'supabase-storage': {
    name: 'Supabase Storage',
    description: 'Open-source Firebase alternative',
    icon: '🗄️',
    category: 'cloud',
    tier: 'freemium',
    features: ['PostgreSQL integration', 'Row-level security', 'Open source']
  },
  'minio': {
    name: 'MinIO',
    description: 'Self-hosted S3-compatible storage',
    icon: '🏠',
    category: 'self-hosted',
    tier: 'free',
    features: ['Self-hosted', 'S3-compatible', 'Private cloud']
  },
  'smb-nas': {
    name: 'SMB/NAS',
    description: 'Network file share storage',
    icon: '🖥️',
    category: 'network',
    tier: 'free',
    features: ['Local network', 'Existing infrastructure', 'Requires backend']
  },
  'webdav': {
    name: 'WebDAV',
    description: 'Web-based Distributed Authoring',
    icon: '🌍',
    category: 'network',
    tier: 'free',
    features: ['Standard protocol', 'Wide support', 'Flexible']
  }
};

const CATEGORIES = ['all', 'local', 'cloud', 'self-hosted', 'network'];
const TIERS = ['all', 'free', 'freemium', 'paid'];

export default function ProviderRegistry({ onProviderSelect, activeProviderId }) {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize providers
  useEffect(() => {
    const initializeProviders = async () => {
      const providerInstances = [
        { id: 'local', instance: new LocalStorageProvider() },
        { id: 'aws-s3', instance: new AWSS3Provider() },
        { id: 'gcs', instance: new GCSProvider() },
        { id: 'azure-blob', instance: new AzureBlobProvider() },
        { id: 'firebase-storage', instance: new FirebaseStorageProvider() },
        { id: 'cloudflare-r2', instance: new CloudflareR2Provider() },
        { id: 'backblaze-b2', instance: new BackblazeB2Provider() },
        { id: 'supabase-storage', instance: new SupabaseStorageProvider() },
        { id: 'minio', instance: new MinIOProvider() },
        { id: 'smb-nas', instance: new SMBProvider() },
        { id: 'webdav', instance: new WebDAVProvider() }
      ];

      // Get provider info for each
      const providersWithInfo = await Promise.all(
        providerInstances.map(async ({ id, instance }) => {
          const info = instance.getProviderInfo();
          return {
            id,
            ...info,
            metadata: PROVIDER_METADATA[id]
          };
        })
      );

      setProviders(providersWithInfo);
      setFilteredProviders(providersWithInfo);
      setLoading(false);
    };

    initializeProviders();
  }, []);

  // Filter providers
  useEffect(() => {
    let filtered = providers;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.metadata.category === selectedCategory);
    }

    if (selectedTier !== 'all') {
      filtered = filtered.filter(p => p.metadata.tier === selectedTier);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.metadata.features.some(f => f.toLowerCase().includes(query))
      );
    }

    setFilteredProviders(filtered);
  }, [providers, selectedCategory, selectedTier, searchQuery]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-gray-500';
      case 'unavailable': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'free': return 'bg-emerald-100 text-emerald-800';
      case 'freemium': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleProviderClick = useCallback((provider) => {
    if (onProviderSelect) {
      onProviderSelect(provider);
    }
  }, [onProviderSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cloud Storage Providers</h2>
          <p className="text-gray-600 mt-1">Select and configure your storage provider</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {providers.filter(p => p.status === 'connected').length} Connected
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Category and Tier Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {TIERS.map(tier => (
                <option key={tier} value={tier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => (
          <div
            key={provider.id}
            onClick={() => handleProviderClick(provider)}
            className={`
              bg-white rounded-lg shadow-sm border-2 p-5 cursor-pointer transition-all duration-200
              ${activeProviderId === provider.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300 hover:shadow-md'}
            `}
          >
            {/* Provider Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{provider.metadata.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
              </div>
              {activeProviderId === provider.id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Active
                </span>
              )}
            </div>

            {/* Status and Tier */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(provider.status)}`}>
                {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTierBadge(provider.metadata.tier)}`}>
                {provider.metadata.tier.charAt(0).toUpperCase() + provider.metadata.tier.slice(1)}
              </span>
              <span className="text-xs text-gray-400 ml-auto">v{provider.version}</span>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-3">
              {provider.metadata.features.slice(0, 2).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-amber-500">✓</span>
                  {feature}
                </div>
              ))}
              {provider.metadata.features.length > 2 && (
                <div className="text-xs text-gray-400">
                  +{provider.metadata.features.length - 2} more features
                </div>
              )}
            </div>

            {/* Capabilities */}
            <div className="flex flex-wrap gap-1">
              {provider.capabilities.slice(0, 4).map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {cap.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
              {provider.capabilities.length > 4 && (
                <span className="text-xs text-gray-400">+{provider.capabilities.length - 4}</span>
              )}
            </div>

            {/* Last Health Check */}
            {provider.lastHealthCheck && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  Last check: {new Date(provider.lastHealthCheck).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-gray-500">No providers match your filters</p>
        </div>
      )}
    </div>
  );
}
