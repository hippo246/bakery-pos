/**
 * AccessiblePOS.jsx
 * Accessibility wrapper for Point of Sale (POS) components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for POS operations
 */

import {
  AccessibleCard,
  AccessibleList,
  AccessibleListItem,
  AccessibleButton,
  AccessibleLiveRegion,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessiblePOS - Main POS wrapper with full accessibility
 */
export const AccessiblePOS = ({ children, title = "Point of Sale" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="pos-content" />
      <div role="main" id="pos-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleProductCard - Product card with accessibility
 */
export const AccessibleProductCard = ({ 
  product, 
  onClick, 
  onAddToCart,
  isSelected = false,
  quantity = 0 
}) => {
  const ariaLabel = `${product.name}, category ${product.category}, price ₹${product.price}, ${quantity > 0 ? `${quantity} in cart` : 'not in cart'}, ${product.available ? 'available' : 'unavailable'}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#FFFFFF',
        border: `2px solid ${quantity > 0 ? '#E63946' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: product.available ? 1 : 0.6,
        position: 'relative',
      }}
    >
      {quantity > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#E63946',
            color: '#FFFFFF',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          aria-label={`${quantity} items in cart`}
        >
          {quantity}
        </div>
      )}
      <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '4px' }}>
        {product.name}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }} aria-label={`Category: ${product.category}`}>
        {product.category}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '900', color: '#E63946' }} aria-label={`Price: ₹${product.price}`}>
        ₹{product.price}
      </div>
      {onAddToCart && (
        <AccessibleButton
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product.id);
          }}
          ariaLabel={`Add ${product.name} to cart`}
          style={{
            width: '100%',
            padding: '8px',
            marginTop: '8px',
            backgroundColor: '#E63946',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add to Cart
        </AccessibleButton>
      )}
    </AccessibleCard>
  );
};

/**
 * AccessibleProductGrid - Grid of products with accessibility
 */
export const AccessibleProductGrid = ({ products, onProductAction, cart, ariaLabel = "Products" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={true}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
      }}
    >
      {products.map(product => {
        const cartItem = cart?.find(item => item.id === product.id);
        return (
          <AccessibleProductCard
            key={product.id}
            product={product}
            onClick={() => onProductAction?.('select', product.id)}
            onAddToCart={() => onProductAction?.('add', product.id)}
            quantity={cartItem?.quantity || 0}
          />
        );
      })}
    </AccessibleList>
  );
};

/**
 * AccessibleCartItem - Cart item with accessibility
 */
export const AccessibleCartItem = ({ 
  item, 
  onQuantityChange, 
  onRemove
}) => {
  const ariaLabel = `${item.name}, quantity ${item.quantity}, price ₹${item.price}, total ₹${item.price * item.quantity}`;

  return (
    <AccessibleListItem
      ariaLabel={ariaLabel}
      isInteractive={false}
      style={{
        padding: '12px',
        backgroundColor: '#F8F9FA',
        borderRadius: '4px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.name}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>₹{item.price} each</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AccessibleButton
          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
          ariaLabel={`Decrease quantity of ${item.name}`}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            backgroundColor: '#E5E7EB',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          -
        </AccessibleButton>
        <div 
          style={{ 
            width: '32px', 
            textAlign: 'center', 
            fontWeight: 'bold' 
          }}
          aria-label={`Quantity: ${item.quantity}`}
        >
          {item.quantity}
        </div>
        <AccessibleButton
          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
          ariaLabel={`Increase quantity of ${item.name}`}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            backgroundColor: '#E5E7EB',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          +
        </AccessibleButton>
        <AccessibleButton
          onClick={() => onRemove(item.id)}
          ariaLabel={`Remove ${item.name} from cart`}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            backgroundColor: '#E63946',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ×
        </AccessibleButton>
      </div>
    </AccessibleListItem>
  );
};

/**
 * AccessibleCart - Cart component with accessibility
 */
export const AccessibleCart = ({ 
  items, 
  onQuantityChange, 
  onRemove,
  onCheckout,
  onClear,
  total 
}) => {
  const ariaLabel = `Shopping cart, ${items.length} items, total ₹${total}`;

  return (
    <section
      aria-label={ariaLabel}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900' }}>
        🛒 Cart ({items.length} items)
      </h3>
      <AccessibleList ariaLabel="Cart items" isGrid={false}>
        {items.map((item, index) => (
          <AccessibleCartItem
            key={item.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
            index={index}
          />
        ))}
      </AccessibleList>
      {items.length === 0 && (
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '24px', 
            color: '#666' 
          }}
          aria-label="Cart is empty"
        >
          Cart is empty
        </div>
      )}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', marginBottom: '12px' }}>
          <span>Total:</span>
          <span aria-label={`Total: ₹${total}`}>₹{total}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <AccessibleButton
            onClick={onClear}
            ariaLabel="Clear cart"
            disabled={items.length === 0}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6B7280',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: items.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            Clear
          </AccessibleButton>
          <AccessibleButton
            onClick={onCheckout}
            ariaLabel={`Checkout, total ₹${total}`}
            disabled={items.length === 0}
            style={{
              flex: 2,
              padding: '12px',
              backgroundColor: '#E63946',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: items.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            Checkout
          </AccessibleButton>
        </div>
      </div>
    </section>
  );
};

/**
 * AccessibleCategoryFilter - Category filter with accessibility
 */
export const AccessibleCategoryFilter = ({ 
  categories, 
  activeCategory, 
  onCategoryChange,
  ariaLabel = "Filter by category" 
}) => {
  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}
    >
      {categories.map(category => (
        <AccessibleButton
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          ariaLabel={`Show ${category.label} products`}
          aria-pressed={activeCategory === category.id}
          style={{
            padding: '8px 16px',
            backgroundColor: activeCategory === category.id ? '#E63946' : '#FFFFFF',
            color: activeCategory === category.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {category.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{category.icon}</span>}
          {category.label}
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessiblePaymentMethods - Payment method selection with accessibility
 */
export const AccessiblePaymentMethods = ({ 
  methods, 
  selectedMethod, 
  onSelect,
  onConfirm,
  total 
}) => {
  return (
    <section
      aria-label="Payment methods"
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '900' }}>
        💳 Payment Method
      </h3>
      <AccessibleList ariaLabel="Available payment methods" isGrid={false}>
        {methods.map(method => (
          <AccessibleListItem
            key={method.id}
            ariaLabel={`${method.name}, ${method.description}`}
            isInteractive={true}
            onClick={() => onSelect(method.id)}
            isSelected={selectedMethod === method.id}
            style={{
              padding: '12px',
              backgroundColor: selectedMethod === method.id ? '#E63946' : '#F8F9FA',
              color: selectedMethod === method.id ? '#FFFFFF' : '#1A1A1A',
              borderRadius: '4px',
              marginBottom: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {method.icon && <span aria-hidden="true" style={{ marginRight: '8px' }}>{method.icon}</span>}
                {method.name}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{method.description}</div>
            </div>
            {selectedMethod === method.id && (
              <span aria-hidden="true">✓</span>
            )}
          </AccessibleListItem>
        ))}
      </AccessibleList>
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', marginBottom: '12px' }}>
          <span>Total to Pay:</span>
          <span aria-label={`Total: ₹${total}`}>₹{total}</span>
        </div>
        <AccessibleButton
          onClick={onConfirm}
          ariaLabel={`Confirm payment of ₹${total} with ${selectedMethod}`}
          disabled={!selectedMethod}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#E63946',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedMethod ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          Confirm Payment
        </AccessibleButton>
      </div>
    </section>
  );
};

/**
 * AccessibleKeypad - Numeric keypad with accessibility
 */
export const AccessibleKeypad = ({ onInput, onClear, onEnter, _currentValue }) => {
  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', '⏎'
  ];

  return (
    <section
      aria-label="Numeric keypad"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}
    >
      {keys.map(key => (
        <AccessibleButton
          key={key}
          onClick={() => {
            if (key === 'C') onClear();
            else if (key === '⏎') onEnter();
            else onInput(key);
          }}
          ariaLabel={
            key === 'C' ? 'Clear' : 
            key === '⏎' ? 'Enter' : 
            `Number ${key}`
          }
          style={{
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: key === 'C' ? '#E63946' : key === '⏎' ? '#2ECC71' : '#FFFFFF',
            color: key === 'C' || key === '⏎' ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E5E7EB',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {key}
        </AccessibleButton>
      ))}
    </section>
  );
};

/**
 * AccessiblePOSAnnouncer - Live region for POS updates
 */
export const AccessiblePOSAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="assertive" ariaLabel="POS update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleOrderTypeSelector - Order type selection with accessibility
 */
export const AccessibleOrderTypeSelector = ({ 
  types, 
  selectedType, 
  onSelect,
  ariaLabel = "Select order type" 
}) => {
  return (
    <nav
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}
    >
      {types.map(type => (
        <AccessibleButton
          key={type.id}
          onClick={() => onSelect(type.id)}
          aria-label={type.label}
          aria-pressed={selectedType === type.id}
          role="radio"
          aria-checked={selectedType === type.id}
          style={{
            padding: '12px',
            backgroundColor: selectedType === type.id ? '#E6394640' : '#FFFFFF',
            border: `2px solid ${selectedType === type.id ? '#E63946' : '#E5E7EB'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          <div aria-hidden="true" style={{ fontSize: '20px', marginBottom: '4px' }}>
            {type.icon}
          </div>
          <div>{type.label}</div>
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessibleQuickActions - Quick action buttons with accessibility
 */
export const AccessibleQuickActions = ({ actions, ariaLabel = "Quick actions" }) => {
  return (
    <section
      aria-label={ariaLabel}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}
    >
      {actions.map(action => (
        <AccessibleButton
          key={action.id}
          onClick={action.onClick}
          ariaLabel={action.label}
          shortcut={action.shortcut}
          style={{
            padding: '12px',
            backgroundColor: action.color || '#3498DB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          <div aria-hidden="true" style={{ fontSize: '20px', marginBottom: '4px' }}>
            {action.icon}
          </div>
          <div style={{ fontSize: '10px' }}>{action.label}</div>
          {action.shortcut && (
            <div style={{ fontSize: '8px', opacity: 0.8, marginTop: '2px' }}>
              {action.shortcut}
            </div>
          )}
        </AccessibleButton>
      ))}
    </section>
  );
};

export default {
  AccessiblePOS,
  AccessibleProductCard,
  AccessibleProductGrid,
  AccessibleCartItem,
  AccessibleCart,
  AccessibleCategoryFilter,
  AccessiblePaymentMethods,
  AccessibleKeypad,
  AccessiblePOSAnnouncer,
  AccessibleOrderTypeSelector,
  AccessibleQuickActions,
};
