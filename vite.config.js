import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Serve index.html for all paths so /guest/<code> works in dev
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          
          // Feature chunks
          if (id.includes('/components/dashboard/')) {
            return 'dashboard';
          }
          if (id.includes('/components/orders/')) {
            return 'orders';
          }
          if (id.includes('/components/kitchen/')) {
            return 'kitchen';
          }
          if (id.includes('/components/crm/')) {
            return 'crm';
          }
          if (id.includes('/components/analytics/')) {
            return 'analytics';
          }
          if (id.includes('/components/inventory/')) {
            return 'inventory';
          }
          
          // Settings sections split into smaller chunks
          if (id.includes('/components/settings/sections/CloudOverviewSection')) {
            return 'settings-cloud-overview';
          }
          if (id.includes('/components/settings/sections/MonitoringSection')) {
            return 'settings-monitoring';
          }
          if (id.includes('/components/settings/sections/DiagnosticsSection')) {
            return 'settings-diagnostics';
          }
          if (id.includes('/components/settings/sections/AdvancedSection')) {
            return 'settings-advanced';
          }
          if (id.includes('/components/settings/sections/')) {
            return 'settings-sections';
          }
          if (id.includes('/components/settings/')) {
            return 'settings-core';
          }
          
          if (id.includes('/components/cloud/')) {
            return 'cloud';
          }
          if (id.includes('/health/')) {
            return 'health';
          }
          if (id.includes('/diagnostics/')) {
            return 'diagnostics';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500,
    target: 'esnext'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
