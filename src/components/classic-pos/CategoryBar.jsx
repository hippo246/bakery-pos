/**
 * Classic POS Category Bar
 * 
 * Horizontal tab buttons with rounded pill style for category navigation.
 * Selected category lights up in dark teal/cyan (#0D9488).
 * Includes Previous/Next navigation for paging.
 */

export default function CategoryBar({ categories, selectedCategory, onSelectCategory, currentPage, totalPages, onPageChange }) {
  const containerStyle = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'var(--pos-catbar-bg, #1E1E1E)',
    overflowX: 'auto',
  };

  const getCategoryStyle = (isSelected) => ({
    padding: '10px 18px',
    borderRadius: 'var(--pos-cat-border-radius, 20px)',
    border: 'none',
    background: isSelected ? 'var(--pos-cat-active-bg, #0D9488)' : 'var(--pos-cat-inactive-bg, #2A2A2A)',
    color: isSelected ? 'var(--pos-cat-active-color, #ffffff)' : 'var(--pos-cat-inactive-color, #ffffff)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: isSelected ? '0 2px 8px var(--pos-cat-active-glow, rgba(13, 148, 136, 0.4))' : '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.15s ease',
  });

  const navButtonStyle = {
    padding: '10px 16px',
    borderRadius: 'var(--pos-cat-border-radius, 20px)',
    border: 'none',
    background: 'var(--pos-cat-nav-next-bg, #3B82F6)',
    color: 'var(--pos-cat-nav-color, #ffffff)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.15s ease',
  };

  const prevButtonStyle = {
    ...navButtonStyle,
    background: 'var(--pos-cat-nav-prev-bg, #6B7280)',
  };

  return (
    <div style={containerStyle}>
      {currentPage > 1 && (
        <button
          style={prevButtonStyle}
          onClick={() => onPageChange(currentPage - 1)}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--pos-cat-nav-prev-bg-hover, #4B5563)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--pos-cat-nav-prev-bg, #6B7280)';
          }}
        >
          &lt;&lt; Previous
        </button>
      )}
      
      {categories.map((category, index) => (
        <button
          key={index}
          style={getCategoryStyle(selectedCategory === category)}
          onClick={() => onSelectCategory(category)}
          onMouseEnter={(e) => {
            if (selectedCategory !== category) {
              e.target.style.background = 'var(--pos-cat-inactive-bg-hover, #3A3A3A)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategory !== category) {
              e.target.style.background = 'var(--pos-cat-inactive-bg, #2A2A2A)';
            }
          }}
        >
          {category}
        </button>
      ))}
      
      {currentPage < totalPages && (
        <button
          style={navButtonStyle}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--pos-cat-nav-next-bg-hover, #2563EB)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'var(--pos-cat-nav-next-bg, #3B82F6)';
          }}
        >
          Next &gt;&gt;
        </button>
      )}
    </div>
  );
}
