/**
 * useCart Hook
 * Single source of truth for cart operations
 */

import { useState, useCallback, useMemo } from "react";
import { calculateCartTotals } from "../utils/cartCalculations";
import { calculateChangeDue } from "../utils/cartCalculations";
import { validateCartItem, validateCartItems } from "../utils/itemHelpers";
import { toggleModifier, applyModifiersToItem, calculateModifierPriceForItem } from "../utils/modifierHelpers";
import { checkAllergenConflict } from "../utils/allergenHelpers";
import { DISCOUNT_MODES, DEFAULT_SPLIT_COUNT, TAX_RATE } from "../constants/orderConstants";

/**
 * useCart hook - Single source of truth for cart operations
 * @param {Object} options - Hook options
 * @param {Function} options.onAddItem - Callback when item is added
 * @param {Function} options.onRemoveItem - Callback when item is removed
 * @param {Function} options.onUpdateItem - Callback when item is updated
 * @param {Object} options.modifierCategories - Available modifier categories
 * @param {Object} options.menuModifierMap - Menu to modifier mapping
 * @param {Object} options.itemAllergens - Item allergen mapping
 * @param {Array} options.customerAllergens - Customer allergen profile
 * @returns {Object} Cart state and actions
 */
export const useCart = (options = {}) => {
  const {
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    modifierCategories = {},
    menuModifierMap = {},
    itemAllergens = {},
    customerAllergens = []
  } = options;

  // Cart items state
  const [items, setItems] = useState([]);

  // Discount state
  const [discountInput, setDiscountInput] = useState("");
  const [discountMode, setDiscountMode] = useState(DISCOUNT_MODES.AMOUNT);

  // Packaging charge state
  const [packagingCharge, setPackagingCharge] = useState("");

  // Split bill state
  const [splitCount, setSplitCount] = useState(DEFAULT_SPLIT_COUNT);
  const [splitMode, setSplitMode] = useState(false);
  const [itemSplits, setItemSplits] = useState({});

  // Modifier state
  const [selectedModifiers, setSelectedModifiers] = useState({});

  // Item notes state
  const [itemNotes, setItemNotes] = useState("");

  // Calculate cart totals (memoized)
  const totals = useMemo(() => {
    return calculateCartTotals({
      items,
      discountInput,
      discountMode,
      packagingCharge,
      taxRate: TAX_RATE
    });
  }, [items, discountInput, discountMode, packagingCharge]);

  // Calculate change due for cash payments
  const changeDue = useMemo(() => {
    if (!discountInput) return null;
    return calculateChangeDue(discountInput, totals.total);
  }, [discountInput, totals.total]);

  // Add item to cart
  const addItem = useCallback((menuItem, quantity = 1) => {
    // Check for allergen conflicts
    const conflict = checkAllergenConflict(menuItem, customerAllergens, itemAllergens);
    if (conflict) {
      return { success: false, conflict };
    }

    // Validate item
    const validationError = validateCartItem(menuItem);
    if (validationError) {
      return { success: false, error: validationError };
    }

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === menuItem.id);
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: (updated[existingIndex].qty || 0) + quantity
        };
        return updated;
      } else {
        // Add new item
        const newItem = {
          id: menuItem.id,
          menuItemId: menuItem.id,
          name: menuItem.name,
          category: menuItem.cat,
          qty: quantity,
          price: menuItem.price,
          modifiers: [],
          notes: "",
          station: menuItem.category === "Coffee" ? "Bar" : "Kitchen"
        };
        return [...prevItems, newItem];
      }
    });

    onAddItem?.(menuItem);
    return { success: true };
  }, [customerAllergens, itemAllergens, onAddItem]);

  // Remove item from cart
  const removeItem = useCallback((itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    onRemoveItem?.(itemId);
  }, [onRemoveItem]);

  // Update item quantity
  const updateQuantity = useCallback((itemId, delta) => {
    if (!Number.isFinite(delta) || delta === 0) {
      return { success: false, error: "Invalid quantity change" };
    }

    setItems(prevItems => {
      const exists = prevItems.some(item => item.id === itemId);
      if (!exists) {
        return prevItems;
      }

      return prevItems.map(item => {
        if (item.id !== itemId) return item;
        
        const currentQty = Number.isFinite(item.qty) ? item.qty : 1;
        const newQty = currentQty + delta;
        
        // Quantity never goes below 1 from +/- controls
        // Removal is explicit via removeItem
        if (newQty < 1) {
          return item;
        }
        
        return { ...item, qty: newQty };
      });
    });

    onUpdateItem?.(itemId);
    return { success: true };
  }, [onUpdateItem]);

  // Update item notes
  const updateItemNotes = useCallback((itemId, notes) => {
    setItems(prevItems => {
      const exists = prevItems.some(item => item.id === itemId);
      if (!exists) {
        return prevItems;
      }

      return prevItems.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, notes: (notes || "").trim() };
      });
    });

    onUpdateItem?.(itemId);
  }, [onUpdateItem]);

  // Update item price (for price overrides)
  const setItemPrice = useCallback((itemId, newPrice, overrideData = {}) => {
    setItems(prevItems => {
      const exists = prevItems.some(item => item.id === itemId);
      if (!exists) {
        return prevItems;
      }

      return prevItems.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          price: newPrice,
          priceOverride: {
            reason: overrideData.reason,
            notes: overrideData.notes,
            originalPrice: overrideData.originalPrice,
            timestamp: Date.now()
          }
        };
      });
    });

    onUpdateItem?.(itemId);
  }, [onUpdateItem]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountInput("");
    setDiscountMode(DISCOUNT_MODES.AMOUNT);
    setPackagingCharge("");
    setSplitCount(DEFAULT_SPLIT_COUNT);
    setSplitMode(false);
    setItemSplits({});
    setSelectedModifiers({});
  }, []);

  // Set discount
  const setDiscount = useCallback((input, mode) => {
    setDiscountInput(input);
    if (mode) {
      setDiscountMode(mode);
    }
  }, []);

  // Set packaging charge
  const setPackaging = useCallback((charge) => {
    setPackagingCharge(charge);
  }, []);

  // Toggle modifier selection
  const toggleItemModifier = useCallback((itemId, categoryId, optionId, isMultiSelect = false) => {
    setSelectedModifiers(prev => {
      return toggleModifier(prev, itemId, categoryId, optionId, isMultiSelect);
    });
  }, []);

  // Apply modifiers to cart item
  const applyModifiers = useCallback((itemId) => {
    setItems(prevItems => {
      const itemModifiers = selectedModifiers[itemId];
      if (!itemModifiers) {
        return prevItems;
      }

      return prevItems.map(item => {
        if (item.id !== itemId) return item;
        return applyModifiersToItem(item, itemModifiers, modifierCategories);
      });
    });
  }, [selectedModifiers, modifierCategories]);

  // Validate cart
  const validateCart = useCallback(() => {
    return validateCartItems(items);
  }, [items]);

  // Get cart item count
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  }, [items]);

  // Get unique item count
  const uniqueItemCount = useMemo(() => {
    return items.length;
  }, [items]);

  // Check if cart is empty
  const isEmpty = useMemo(() => {
    return items.length === 0;
  }, [items]);

  // Reorder items from previous order
  const reorderItems = useCallback((orderItems) => {
    if (!Array.isArray(orderItems)) {
      return { success: false, error: "Invalid items" };
    }

    clearCart();
    
    orderItems.forEach(item => {
      addItem({
        id: item.menuItemId || item.id,
        name: item.name,
        cat: item.category,
        price: item.price
      }, item.qty || 1);
    });

    return { success: true };
  }, [addItem, clearCart]);

  // Set cart items directly (for restoring held orders)
  const setCartItems = useCallback((newItems) => {
    setItems(Array.isArray(newItems) ? newItems : []);
  }, []);

  return {
    // State
    items,
    discountInput,
    discountMode,
    packagingCharge,
    splitCount,
    splitMode,
    itemSplits,
    selectedModifiers,
    
    // Computed values
    totals,
    changeDue,
    itemCount,
    uniqueItemCount,
    isEmpty,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    updateItemNotes,
    setItemPrice,
    clearCart,
    setCartItems,
    setDiscount,
    setPackaging,
    toggleItemModifier,
    applyModifiers,
    validateCart,
    reorderItems,
    
    // Setters
    setItems,
    setDiscountInput,
    setDiscountMode,
    setPackagingCharge,
    setSplitCount,
    setSplitMode,
    setItemSplits,
    setSelectedModifiers,
    setItemNotes
  };
};
