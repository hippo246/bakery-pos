import { useState } from 'react';

export default function QuickBarInputs({ 
  itemCode, 
  description, 
  qty, 
  price, 
  amount, 
  salesmanId,
  menuItems = [],
  onInputChange,
  onEnter,
  onFocus,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerStyle = {
    display: 'flex',
    gap: '8px',
    padding: '8px 12px',
    background: 'var(--classic-pos-quickbar-bg)',
    borderBottom: '1px solid var(--classic-pos-quickbar-border)',
    alignItems: 'center',
    position: 'relative',
  };

  const inputStyle = {
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid var(--classic-pos-input-border)',
    background: 'var(--classic-pos-input-bg)',
    color: 'var(--classic-pos-name-color)',
    fontSize: '12px',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.15s ease',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--classic-pos-code-color)',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  const inputWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  };

  const suggestionsStyle = {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    background: 'var(--classic-pos-suggest-bg)',
    border: '1px solid var(--classic-pos-suggest-border)',
    borderRadius: '4px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: '1000',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  };

  const suggestionItemStyle = (index) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid var(--classic-pos-suggest-divider)',
    fontSize: '12px',
    color: index === selectedIndex ? '#ffffff' : 'var(--classic-pos-name-color)',
    background: index === selectedIndex ? 'var(--classic-pos-suggest-selected)' : 'var(--classic-pos-suggest-bg)',
  });

  const handleKeyDown = (e) => {
    const suggestions = showSuggestions ? filteredItems : (showItemSuggestions ? filteredItems : []);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : -1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        if (showSuggestions) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (showItemSuggestions) {
          handleItemSuggestionClick(suggestions[selectedIndex]);
        }
      } else if (onEnter) {
        onEnter();
        setShowSuggestions(false);
        setShowItemSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowItemSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleItemCodeChange = (value) => {
    onInputChange?.('itemCode', value);
    setSelectedIndex(-1);
    
    console.log('[QuickBarInputs] ItemCode change:', value, 'menuItems count:', menuItems.length);
    
    if (value.length > 0) {
      const filtered = menuItems.filter(item => 
        item.code?.toLowerCase().includes(value.toLowerCase()) ||
        item.name?.toLowerCase().includes(value.toLowerCase())
      );
      console.log('[QuickBarInputs] Filtered items:', filtered.length);
      setFilteredItems(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleItemChange = (value) => {
    onInputChange?.('description', value);
    setSelectedIndex(-1);
    
    if (value.length > 0) {
      const filtered = menuItems.filter(item => 
        item.name?.toLowerCase().includes(value.toLowerCase()) ||
        item.code?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
      setShowItemSuggestions(filtered.length > 0);
    } else {
      setShowItemSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    console.log('[QuickBarInputs] Suggestion clicked:', item);
    onInputChange?.('itemCode', item.code || '');
    onInputChange?.('description', item.name || '');
    onInputChange?.('price', (item.price || 0).toString());
    setShowSuggestions(false);
    setShowItemSuggestions(false);
    setSelectedIndex(-1);
    setTimeout(() => onEnter?.(), 100);
  };

  const handleItemSuggestionClick = (item) => {
    console.log('[QuickBarInputs] Item suggestion clicked:', item);
    onInputChange?.('itemCode', item.code || '');
    onInputChange?.('description', item.name || '');
    onInputChange?.('price', (item.price || 0).toString());
    setShowItemSuggestions(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setTimeout(() => onEnter?.(), 100);
  };

  return (
    <div style={containerStyle}>
      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Item Code</span>
        <input
          type="text"
          value={itemCode}
          onChange={(e) => handleItemCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus?.('itemCode')}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          style={{ ...inputStyle, width: '100px' }}
          placeholder="Code"
          autoFocus
        />
        {showSuggestions && filteredItems.length > 0 && (
          <div style={suggestionsStyle}>
            {filteredItems.map((item, index) => (
              <div
                key={index}
                style={suggestionItemStyle(index)}
                onClick={() => handleSuggestionClick(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ fontWeight: '600' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--classic-pos-code-color)' }}>Code: {item.code} | ₹{item.price?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Item</span>
        <input
          type="text"
          value={description}
          onChange={(e) => handleItemChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus?.('description')}
          onBlur={() => setTimeout(() => setShowItemSuggestions(false), 200)}
          style={{ ...inputStyle, width: '200px' }}
          placeholder="Item"
        />
        {showItemSuggestions && filteredItems.length > 0 && (
          <div style={suggestionsStyle}>
            {filteredItems.map((item, index) => (
              <div
                key={index}
                style={suggestionItemStyle(index)}
                onClick={() => handleItemSuggestionClick(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ fontWeight: '600' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: index === selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--classic-pos-code-color)' }}>Code: {item.code} | ₹{item.price?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Qty</span>
        <input
          type="number"
          value={qty}
          onChange={(e) => onInputChange?.('qty', e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus?.('qty')}
          style={{ ...inputStyle, width: '60px' }}
          placeholder="1"
          min="1"
        />
      </div>

      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Price</span>
        <input
          type="number"
          value={price}
          onChange={(e) => onInputChange?.('price', e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus?.('price')}
          style={{ ...inputStyle, width: '80px' }}
          placeholder="0.00"
          step="0.01"
        />
      </div>

      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Amount</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => onInputChange?.('amount', e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ ...inputStyle, width: '90px', color: 'var(--classic-pos-price-color)' }}
          placeholder="0.00"
          step="0.01"
          readOnly
        />
      </div>

      <div style={inputWrapperStyle}>
        <span style={labelStyle}>Salesman ID</span>
        <input
          type="text"
          value={salesmanId}
          onChange={(e) => onInputChange?.('salesmanId', e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocus?.('salesmanId')}
          style={{ ...inputStyle, width: '100px' }}
          placeholder="ID"
        />
      </div>
    </div>
  );
}
