import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
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
          if (id.includes('node_modules/leaflet')) {
            return 'leaflet';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'jspdf';
          }
          
          // Feature chunks - split large ones further
          if (id.includes('/components/dashboard/')) {
            if (id.includes('OperationalCommandCenter')) {
              return 'dashboard-operations';
            }
            if (id.includes('IntelligenceDashboard')) {
              return 'dashboard-intelligence';
            }
            return 'dashboard';
          }
          if (id.includes('/components/orders/')) {
            if (id.includes('ClassicOrdersLayout')) {
              return 'orders-classic';
            }
            if (id.includes('Orders.jsx')) {
              return 'orders-main';
            }
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
          
          // Setup wizard separate chunk
          if (id.includes('/components/setup/SetupWizard')) {
            return 'setup-wizard';
          }
          if (id.includes('/components/setup/WelcomeScreen')) {
            return 'setup-welcome';
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
          
          // Tables component separate chunk (large)
          if (id.includes('/components/tables/ThemedTables')) {
            return 'tables';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
    target: 'esnext'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
