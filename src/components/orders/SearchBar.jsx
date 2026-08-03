// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, startTransition } from 'react';
import { input, card } from "../../styles/theme";

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search items (name, SKU, barcode, category)...",
  menuItems = [],
  onSelectItem,
  showResults = true,
  autoFocus = false
}) => {
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter menu items based on search query
  useEffect(() => {
    if (!value.trim() || !showResults) {
      startTransition(() => {
        setResults([]);
        setIsOpen(false);
        setSelectedIndex(-1);
      });
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = menuItems.filter(item => {
      if (item.name?.toLowerCase().includes(query)) return true;
      if (item.sku?.toLowerCase().includes(query)) return true;
      if (item.barcode?.toLowerCase().includes(query)) return true;
      if (item.category?.toLowerCase().includes(query)) return true;
      if (item.cat?.toLowerCase().includes(query)) return true;
      if (item.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      return false;
    }).slice(0, 8);

    startTransition(() => {
      setResults(filtered);
      setIsOpen(filtered.length > 0);
      setSelectedIndex(-1);
    });
  }, [value, menuItems, showResults]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (results.length > 0) {
          handleSelect(results[0]); // Select first result
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (item) => {
    onChange(''); // Clear search
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectItem?.(item);
  };

  const handleBlur = (_e) => {
    // Delay closing to allow click on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--cafe-text-tertiary)", zIndex: 1 }}>🔍</span>
      <input 
        ref={inputRef}
        style={{ ...input, paddingLeft: 36, width: "100%" }} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Search menu items"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="search-results"
      />
      
      {isOpen && results.length > 0 && (
        <div 
          id="search-results"
          role="listbox"
          style={{
            ...card(),
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 320,
            overflowY: "auto",
            zIndex: 100,
            padding: 0
          }}
        >
          {results.map((item, index) => (
            <div
              key={item.id}
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background: selectedIndex === index ? "var(--cafe-accent-dim)" : "var(--cafe-bg-card)",
                borderBottom: index < results.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{item.emoji || "🍽️"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                  {item.name}
                </div>
                <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
                  {item.sku && <span style={{ fontFamily: "monospace", marginRight: 8 }}>SKU: {item.sku}</span>}
                  {item.category && <span>{item.category}</span>}
                </div>
              </div>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-accent)" }}>
                ₹{item.price?.toFixed(2) || "0.00"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
