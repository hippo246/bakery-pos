/**
 * useOrderValidation Hook
 * Provides comprehensive validation for POS orders
 */

import { useMemo } from "react";

export function useOrderValidation({ cart, orderType, customerPhone, selectedTable, paymentMethod, cashTendered, cartTotal }) {
  const validationErrors = useMemo(() => {
    const errors = [];
    const warnings = [];

    // Empty order validation
    if (cart.items.length === 0) {
      errors.push({
        id: "empty_cart",
        message: "Cart is empty",
        severity: "error",
        field: "cart"
      });
    }

    // Out of stock validation
    cart.items.forEach(item => {
      if (item.stockStatus === "out_of_stock") {
        errors.push({
          id: "out_of_stock",
          message: `${item.name} is out of stock`,
          severity: "error",
          field: "cart",
          itemId: item.id
        });
      } else if (item.stockStatus === "low_stock") {
        warnings.push({
          id: "low_stock",
          message: `${item.name} has low stock`,
          severity: "warning",
          field: "cart",
          itemId: item.id
        });
      }
    });

    // Missing customer for delivery
    if (orderType === "DIRECT_DELIVERY" && !customerPhone) {
      errors.push({
        id: "missing_customer",
        message: "Customer phone required for delivery orders",
        severity: "error",
        field: "customer"
      });
    }

    // Missing table for dine-in
    if (orderType === "DINE_IN" && !selectedTable) {
      errors.push({
        id: "missing_table",
        message: "Table selection required for dine-in orders",
        severity: "error",
        field: "table"
      });
    }

    // Negative totals validation
    if (cartTotal < 0) {
      errors.push({
        id: "negative_total",
        message: "Order total cannot be negative",
        severity: "error",
        field: "totals"
      });
    }

    // Invalid discount validation
    if (cart.discount && cart.discount.amount > cartTotal) {
      errors.push({
        id: "invalid_discount",
        message: "Discount cannot exceed order total",
        severity: "error",
        field: "discount"
      });
    }

    // Invalid payment amount validation
    if (paymentMethod === "CASH" && cashTendered) {
      const tendered = parseFloat(cashTendered);
      if (isNaN(tendered) || tendered < 0) {
        errors.push({
          id: "invalid_payment",
          message: "Invalid cash amount",
          severity: "error",
          field: "payment"
        });
      } else if (tendered < cartTotal) {
        warnings.push({
          id: "insufficient_payment",
          message: "Cash tendered is less than order total",
          severity: "warning",
          field: "payment"
        });
      }
    }

    // Missing payment method
    if (!paymentMethod) {
      errors.push({
        id: "missing_payment",
        message: "Payment method required",
        severity: "error",
        field: "payment"
      });
    }

    return { errors, warnings };
  }, [cart, orderType, customerPhone, selectedTable, paymentMethod, cashTendered, cartTotal]);

  const isValid = validationErrors.errors.length === 0;
  const hasWarnings = validationErrors.warnings.length > 0;

  return {
    validationErrors,
    isValid,
    hasWarnings,
    canProceed: isValid
  };
}
