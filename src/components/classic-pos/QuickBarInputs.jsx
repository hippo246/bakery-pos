/**
 * Classic POS Quick Bar Inputs
 * 
 * Inline text boxes for fast barcode/manual entry:
 * Item Code, Description, Qty, Price, Amount, Salesman ID
 */

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

  const containerStyle = {
    display: 'flex',
    gap: '8px',
    padding: '8px 12px',
    background: '#1E1E1E',
    borderBottom: '1px solid #333333',
    alignItems: 'center',
    position: 'relative',
  };

  const inputStyle = {
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid #444444',
    background: '#252525',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    outline: 'none',
    transition: 'all 0.15s ease',
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: '#888888',
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
    background: '#2A2A2A',
    border: '1px solid #444444',
    borderRadius: '4px',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: '1000',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  };

  const suggestionItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #333333',
    fontSize: '12px',
    color: '#ffffff',
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
      setShowSuggestions(false);
    }
  };

  const handleItemCodeChange = (value) => {
    onInputChange?.('itemCode', value);
    
    if (value.length > 0) {
      const filtered = menuItems.filter(item => 
        item.code?.toLowerCase().includes(value.toLowerCase()) ||
        item.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleItemChange = (value) => {
    onInputChange?.('description', value);
    
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
    onInputChange?.('itemCode', item.code || '');
    onInputChange?.('description', item.name || '');
    onInputChange?.('price', (item.price || 0).toString());
    setShowSuggestions(false);
    setShowItemSuggestions(false);
  };

  const handleItemSuggestionClick = (item) => {
    onInputChange?.('itemCode', item.code || '');
    onInputChange?.('description', item.name || '');
    onInputChange?.('price', (item.price || 0).toString());
    setShowItemSuggestions(false);
    setShowSuggestions(false);
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
                style={suggestionItemStyle}
                onClick={() => handleSuggestionClick(item)}
                onMouseEnter={(e) => e.target.style.background = '#3A3A3A'}
                onMouseLeave={(e) => e.target.style.background = '#2A2A2A'}
              >
                <div style={{ fontWeight: '600' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>Code: {item.code} | ₹{item.price?.toFixed(2)}</div>
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
                style={suggestionItemStyle}
                onClick={() => handleItemSuggestionClick(item)}
                onMouseEnter={(e) => e.target.style.background = '#3A3A3A'}
                onMouseLeave={(e) => e.target.style.background = '#2A2A2A'}
              >
                <div style={{ fontWeight: '600' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>Code: {item.code} | ₹{item.price?.toFixed(2)}</div>
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
          style={{ ...inputStyle, width: '90px', color: '#38EF7D' }}
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
