// PERFORMANCE & UX: Reusable loading skeleton components for stress scenarios
// Provides visual feedback during data loading without blocking UI

const SkeletonBase = ({ width = '100%', height = 20, style = {} }) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, var(--cafe-bg-surface) 25%, var(--cafe-bg-hover) 50%, var(--cafe-bg-surface) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s ease-in-out infinite',
      borderRadius: 4,
      ...style
    }}
  />
);

const SkeletonText = ({ lines = 3, width = '100%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase
        key={i}
        width={i === lines - 1 ? '60%' : width}
        height={16}
      />
    ))}
  </div>
);

const SkeletonCard = ({ count = 1 }) => (
  <div style={{ display: 'grid', gap: 16 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          padding: 16,
          background: 'var(--cafe-bg-surface)',
          borderRadius: 8,
          border: '1px solid var(--cafe-border)'
        }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <SkeletonBase width={48} height={48} style={{ borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <SkeletonBase width="70%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonBase width="40%" height={12} />
          </div>
        </div>
        <SkeletonText lines={2} />
      </div>
    ))}
  </div>
);

const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div style={{ overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--cafe-border)' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBase key={i} width={`${100 / columns}%`} height={16} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--cafe-border-light)' }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonBase key={colIndex} width={`${100 / columns}%`} height={14} />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonWidget = () => (
  <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
      <SkeletonBase width="30%" height={20} />
      <SkeletonBase width="20%" height={16} />
    </div>
    <div style={{ flex: 1 }}>
      <SkeletonCard count={3} />
    </div>
  </div>
);

const FullPageLoader = ({ message = 'Loading...' }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--cafe-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        border: '3px solid var(--cafe-border)',
        borderTopColor: 'var(--cafe-accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: 16
      }}
    />
    <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', fontWeight: 600 }}>
      {message}
    </div>
  </div>
);

const InlineLoader = ({ size = 24, color = 'var(--cafe-accent)' }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid var(--cafe-border)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}
  />
);

// Add keyframe animations to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export {
  SkeletonBase,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonWidget,
  FullPageLoader,
  InlineLoader
};

export default FullPageLoader;
