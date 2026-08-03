/**
 * Widget Dashboard
 * Main dashboard component that uses the Widget Engine
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ErrorBoundary } from '../../components/common/ErrorBoundary.jsx';
import WidgetRenderer from './WidgetRenderer.jsx';
import WidgetLibrary from './WidgetLibrary.jsx';
import WidgetSettings from './WidgetSettings.jsx';
import widgetRegistry from './WidgetRegistry.js';
import widgetManager from './WidgetManager.js';
import widgetLayoutManager from './WidgetLayoutManager.js';
import widgetPersistence from './WidgetPersistence.js';
import roleDashboards from './RoleDashboards.js';
import { WidgetSizes } from './WidgetTypes.js';

function WidgetDashboard({ userRole = 'owner', userId = 'default' }) {
  const [instances, setInstances] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [settingsWidget, setSettingsWidget] = useState(null);
  const [screenSize, setScreenSize] = useState('desktop');

  // Initialize widget engine
  useEffect(() => {
    widgetRegistry.initialize();
    widgetManager.initialize();
    widgetPersistence.initialize();
    roleDashboards.initialize();

    // Load user's dashboard layout
    loadDashboardLayout();
  }, [userRole, userId]);

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newSize = 'desktop';
      
      if (width < 768) {
        newSize = 'mobile';
      } else if (width < 1024) {
        newSize = 'tablet';
      } else if (width > 1920) {
        newSize = 'tv';
      }

      setScreenSize(newSize);
      widgetLayoutManager.setScreenSize(newSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load dashboard layout
  const loadDashboardLayout = useCallback(() => {
    // Try to load user's layout
    const userLayout = widgetPersistence.getUserCurrentLayout(userId, userRole);
    
    if (userLayout) {
      widgetManager.loadInstances(userLayout.widgets);
      setInstances(widgetManager.getAllInstances());
    } else {
      // Fall back to role default
      const defaultLayout = roleDashboards.getDefaultLayout(userRole);
      if (defaultLayout) {
        widgetManager.loadInstances(defaultLayout.widgets);
        setInstances(widgetManager.getAllInstances());
      }
    }

    widgetLayoutManager.updateOccupiedCells(widgetManager.getAllInstances());
  }, [userId, userRole]);

  // Save dashboard layout
  const saveDashboardLayout = useCallback(() => {
    const layout = {
      id: `${userRole}_${userId}`,
      name: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
      description: `Custom dashboard for ${userRole}`,
      role: userRole,
      widgets: widgetManager.exportInstances(),
      isDefault: false,
      isLocked: false
    };

    widgetPersistence.saveLayout(layout, userId);
  }, [userRole, userId]);

  // Widget operations
  const handleMoveWidget = useCallback((instanceId, newPosition) => {
    widgetManager.moveWidget(instanceId, newPosition.x, newPosition.y);
    setInstances(widgetManager.getAllInstances());
    widgetLayoutManager.updateOccupiedCells(instances);
    saveDashboardLayout();
  }, [instances, saveDashboardLayout]);

  const handleResizeWidget = useCallback((instanceId, newSize) => {
    widgetManager.resizeWidget(instanceId, newSize);
    setInstances(widgetManager.getAllInstances());
    widgetLayoutManager.updateOccupiedCells(instances);
    saveDashboardLayout();
  }, [instances, saveDashboardLayout]);

  const handleToggleCollapse = useCallback((instanceId) => {
    widgetManager.toggleCollapse(instanceId);
    setInstances(widgetManager.getAllInstances());
    saveDashboardLayout();
  }, [saveDashboardLayout]);

  const handleToggleVisibility = useCallback((instanceId) => {
    widgetManager.toggleVisibility(instanceId);
    setInstances(widgetManager.getAllInstances());
    widgetLayoutManager.updateOccupiedCells(instances);
    saveDashboardLayout();
  }, [instances, saveDashboardLayout]);

  const handleTogglePin = useCallback((instanceId) => {
    widgetManager.togglePin(instanceId);
    setInstances(widgetManager.getAllInstances());
    saveDashboardLayout();
  }, [saveDashboardLayout]);

  const handleToggleLock = useCallback((instanceId) => {
    widgetManager.toggleLock(instanceId);
    setInstances(widgetManager.getAllInstances());
    saveDashboardLayout();
  }, [saveDashboardLayout]);

  const handleDeleteWidget = useCallback((instanceId) => {
    widgetManager.deleteInstance(instanceId);
    setInstances(widgetManager.getAllInstances());
    widgetLayoutManager.updateOccupiedCells(instances);
    saveDashboardLayout();
  }, [instances, saveDashboardLayout]);

  const handleDuplicateWidget = useCallback((instanceId) => {
    const newInstance = widgetManager.duplicateInstance(instanceId);
    if (newInstance) {
      setInstances(widgetManager.getAllInstances());
      widgetLayoutManager.updateOccupiedCells(instances);
      saveDashboardLayout();
    }
  }, [instances, saveDashboardLayout]);

  const handleUpdateSettings = useCallback((instanceId, newSettings) => {
    widgetManager.updateSettings(instanceId, newSettings);
    setInstances(widgetManager.getAllInstances());
    saveDashboardLayout();
  }, [saveDashboardLayout]);

  const handleAddWidget = useCallback((widgetId) => {
    const widgetDef = widgetRegistry.getWidget(widgetId);
    if (!widgetDef) return;

    // Find available position
    const position = widgetLayoutManager.findAvailablePosition(widgetDef.defaultSize);
    if (!position) return;

    widgetManager.createInstance(widgetId, {
      position,
      size: widgetDef.defaultSize
    });

    setInstances(widgetManager.getAllInstances());
    widgetLayoutManager.updateOccupiedCells(instances);
    saveDashboardLayout();
    setShowLibrary(false);
  }, [instances, saveDashboardLayout]);

  const handleAutoArrange = useCallback(() => {
    const arranged = widgetLayoutManager.autoArrange(instances);
    arranged.forEach(instance => {
      widgetManager.updateInstance(instance.id, { position: instance.position });
    });
    setInstances(widgetManager.getAllInstances());
    saveDashboardLayout();
  }, [instances, saveDashboardLayout]);

  const handleResetLayout = useCallback(() => {
    widgetPersistence.resetToDefault(userRole, userId);
    loadDashboardLayout();
  }, [userRole, userId, loadDashboardLayout]);

  // Get grid config
  const gridConfig = widgetLayoutManager.getGridConfig();

  // Filter visible instances
  const visibleInstances = useMemo(() => {
    return instances.filter(instance => instance.visible);
  }, [instances]);

  return (
    <ErrorBoundary>
      <div style={{ 
        padding: 24, 
        height: '100vh',
        background: 'var(--cafe-bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Dashboard Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1px solid var(--cafe-border)'
        }}>
          <div>
            <h1 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: 'var(--cafe-text-primary)',
              margin: 0 
            }}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
            </h1>
            <p style={{ 
              fontSize: 14, 
              color: 'var(--cafe-text-secondary)',
              margin: '4px 0 0' 
            }}>
              Your personalized workspace
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '10px 20px',
                background: isEditing ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                border: isEditing ? '1px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: isEditing ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                cursor: 'pointer'
              }}
            >
              {isEditing ? '✓ Done Editing' : '✎ Edit Dashboard'}
            </button>

            {isEditing && (
              <>
                <button
                  onClick={() => setShowLibrary(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--cafe-bg-surface)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--cafe-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  + Add Widget
                </button>

                <button
                  onClick={handleAutoArrange}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--cafe-bg-surface)',
                    border: '1px solid var(--cafe-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--cafe-text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Auto Arrange
                </button>

                <button
                  onClick={handleResetLayout}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--cafe-warning-bg)',
                    border: '1px solid var(--cafe-warning-border)',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--cafe-warning)',
                    cursor: 'pointer'
                  }}
                >
                  Reset Layout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Widget Grid */}
        <div 
          style={{ 
            flex: 1,
            position: 'relative',
            background: 'var(--cafe-bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--cafe-border)',
            overflow: 'hidden'
          }}
        >
          {visibleInstances.length === 0 ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--cafe-text-tertiary)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No widgets on dashboard</div>
              <div style={{ fontSize: 14 }}>Click "Add Widget" to get started</div>
            </div>
          ) : (
            visibleInstances.map(instance => {
              const widgetDef = widgetRegistry.getWidget(instance.widgetId);
              if (!widgetDef) return null;

              return (
                <WidgetRenderer
                  key={instance.id}
                  instance={instance}
                  widgetDef={widgetDef}
                  onMove={handleMoveWidget}
                  onResize={handleResizeWidget}
                  onToggleCollapse={handleToggleCollapse}
                  onToggleVisibility={handleToggleVisibility}
                  onTogglePin={handleTogglePin}
                  onToggleLock={handleToggleLock}
                  onDelete={handleDeleteWidget}
                  onDuplicate={handleDuplicateWidget}
                  onSettings={(id) => setSettingsWidget(id)}
                  isEditing={isEditing}
                />
              );
            })
          )}
        </div>

        {/* Widget Library Modal */}
        {showLibrary && (
          <WidgetLibrary
            availableWidgets={instances}
            onAddWidget={handleAddWidget}
            onClose={() => setShowLibrary(false)}
          />
        )}

        {/* Widget Settings Modal */}
        {settingsWidget && (
          <WidgetSettings
            instance={widgetManager.getInstance(settingsWidget)}
            widgetDef={widgetRegistry.getWidget(widgetManager.getInstance(settingsWidget)?.widgetId)}
            onClose={() => setSettingsWidget(null)}
            onSave={handleUpdateSettings}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(WidgetDashboard);
