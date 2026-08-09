/**
 * Layout Engine
 * 
 * Renders different component structures based on the active theme.
 * Themes can define layout regions, panel configurations, and component composition.
 * 
 * This enables complete layout transformations (e.g., Modern vs Classic POS)
 * while sharing the same business logic and state.
 */

import React from 'react';
import { useTheme } from './useTheme';

/**
 * Layout Engine Component
 * 
 * @param {Object} props
 * @param {Object} props.regions - Component map of available regions
 * @param {Object} props.components - Component map of available components
 * @param {React.ReactNode} props.children - Fallback content
 */
export function LayoutEngine({ regions = {}, components = {}, children }) {
  const { theme } = useTheme();
  
  // Get layout structure from theme
  const layout = theme.layout || {};
  const structure = layout.structure || 'modern';
  const themeRegions = layout.regions || {};
  
  // Render components based on theme-defined regions
  const renderRegion = (regionName) => {
    const componentKeys = themeRegions[regionName] || [];
    
    return componentKeys.map(key => {
      const Component = components[key];
      if (!Component) {
        console.warn(`LayoutEngine: Component "${key}" not found in region "${regionName}"`);
        return null;
      }
      return <Component key={key} />;
    });
  };
  
  // Different layout structures
  switch (structure) {
    case 'classic-pos':
      return <ClassicPosLayout regions={regions} renderRegion={renderRegion} />;
    case 'dense':
      return <DenseLayout regions={regions} renderRegion={renderRegion} />;
    case 'minimal':
      return <MinimalLayout regions={regions} renderRegion={renderRegion} />;
    case 'modern':
    default:
      return <ModernLayout regions={regions} renderRegion={renderRegion} />;
  }
}

/**
 * Modern Layout (default CafeOS)
 * Sidebar navigation, main content area, right panel
 */
function ModernLayout({ regions, renderRegion }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 320px', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1px solid var(--cafe-border)', overflow: 'auto' }}>
        {renderRegion('sidebar')}
      </div>
      
      {/* Main Content */}
      <div style={{ overflow: 'auto' }}>
        {renderRegion('header')}
        {renderRegion('main')}
      </div>
      
      {/* Right Panel */}
      <div style={{ borderLeft: '1px solid var(--cafe-border)', overflow: 'auto' }}>
        {renderRegion('right')}
      </div>
    </div>
  );
}

/**
 * Classic POS Layout
 * Full-screen workspace with numeric keypad, function keys, dense grid
 */
function ClassicPosLayout({ regions, renderRegion }) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateColumns: '1fr 280px',
      height: '100vh',
      background: '#c0c0c0',
      fontFamily: 'Tahoma, sans-serif'
    }}>
      {/* Function Key Panel (Top) */}
      <div style={{ 
        gridColumn: '1 / -1',
        background: '#000080',
        padding: '4px',
        display: 'flex',
        gap: '2px'
      }}>
        {renderRegion('functionKeys')}
      </div>
      
      {/* Main Content Area */}
      <div style={{ 
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: '4px',
        padding: '4px',
        background: '#808080'
      }}>
        {/* Category Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '2px',
          padding: '2px'
        }}>
          {renderRegion('category')}
        </div>
        
        {/* Menu Grid */}
        <div style={{ 
          overflow: 'auto',
          padding: '2px'
        }}>
          {renderRegion('menu')}
        </div>
      </div>
      
      {/* Right Panel (Cart + Keypad) */}
      <div style={{ 
        display: 'grid',
        gridTemplateRows: '1fr auto',
        gap: '4px',
        padding: '4px',
        background: '#808080'
      }}>
        {/* Cart */}
        <div style={{ 
          overflow: 'auto',
          background: '#ffffff',
          border: '2px solid #000000'
        }}>
          {renderRegion('cart')}
        </div>
        
        {/* Numeric Keypad */}
        <div style={{ 
          background: '#c0c0c0',
          border: '2px solid #000000'
        }}>
          {renderRegion('keypad')}
        </div>
      </div>
      
      {/* Payment Bar (Bottom) */}
      <div style={{ 
        gridColumn: '1 / -1',
        background: '#000080',
        padding: '4px',
        display: 'flex',
        gap: '4px'
      }}>
        {renderRegion('payment')}
      </div>
    </div>
  );
}

/**
 * Dense Layout
 * High information density, compact spacing
 */
function DenseLayout({ regions, renderRegion }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 280px', height: '100vh' }}>
      <div style={{ borderRight: '1px solid var(--cafe-border)', overflow: 'auto' }}>
        {renderRegion('sidebar')}
      </div>
      <div style={{ overflow: 'auto' }}>
        {renderRegion('header')}
        {renderRegion('main')}
      </div>
      <div style={{ borderLeft: '1px solid var(--cafe-border)', overflow: 'auto' }}>
        {renderRegion('right')}
      </div>
    </div>
  );
}

/**
 * Minimal Layout
 * Clean, minimal interface with maximum content focus
 */
function MinimalLayout({ regions, renderRegion }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ borderBottom: '1px solid var(--cafe-border)', padding: '16px' }}>
        {renderRegion('header')}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px' }}>
        <div style={{ overflow: 'auto' }}>
          {renderRegion('main')}
        </div>
        <div style={{ borderLeft: '1px solid var(--cafe-border)', overflow: 'auto' }}>
          {renderRegion('right')}
        </div>
      </div>
    </div>
  );
}

/**
 * Layout Region Component
 * Renders a specific layout region with its components
 */
export function LayoutRegion({ name, children }) {
  return <div data-layout-region={name}>{children}</div>;
}

export default LayoutEngine;
