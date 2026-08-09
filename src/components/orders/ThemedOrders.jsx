/**
 * Themed Orders Component
 *
 * Wrapper that integrates the LayoutEngine with the Orders component.
 * This enables runtime layout transformation based on the active theme.
 *
 * When the theme changes, the entire layout structure can transform
 * (e.g., from Modern sidebar layout to Classic POS layout) while
 * preserving the same business logic and state.
 */

import { useTheme } from '../../theme/useTheme';
import Orders from './Orders';
import ClassicOrdersLayout from './ClassicOrdersLayout';
import FastFoodOrdersLayout from './FastFoodOrdersLayout';
import FastFoodOrdersComprehensive from './FastFoodOrdersComprehensive';
import FastFoodOrdersSimple from './FastFoodOrdersSimple';
import CafeOrdersLayout from './CafeOrdersLayout';
import FineDiningOrdersLayout from './FineDiningOrdersLayout';
import BarOrdersLayout from './BarOrdersLayout';
import BakeryOrdersLayout from './BakeryOrdersLayout';
import AccessibilityOrdersLayout from './AccessibilityOrdersLayout';

/**
 * ThemedOrders Component
 *
 * Renders the Orders interface using the appropriate layout based on the active theme.
 * For modern themes, it renders the standard Orders component.
 * For classic-pos themes, it uses the ClassicOrdersLayout component.
 * For fastfood-pos themes, it uses the FastFoodOrdersLayout component.
 */
export default function ThemedOrders(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  console.log('[ThemedOrders] Theme:', theme?.id, 'Structure:', structure);

  // For modern themes, render standard Orders component
  if (structure === 'modern') {
    return <Orders {...props} />;
  }

  // For classic-pos themes, render the classic layout
  if (structure === 'classic-pos') {
    return <ClassicOrdersLayout {...props} />;
  }

  // For fastfood-pos themes, render the fast food layout
  if (structure === 'fastfood-pos') {
    return <FastFoodOrdersLayout {...props} />;
  }

  // For fastfood-comprehensive themes, render the comprehensive fast food layout
  if (structure === 'fastfood-comprehensive') {
    return <FastFoodOrdersComprehensive {...props} />;
  }

  // For fastfood-simple themes, render the simplified fast food layout
  if (structure === 'fastfood-simple') {
    return <FastFoodOrdersSimple {...props} />;
  }

  // For cafe themes, render the cafe layout
  if (structure === 'cafe') {
    return <CafeOrdersLayout {...props} />;
  }

  // For finedining themes, render the fine dining layout
  if (structure === 'finedining') {
    return <FineDiningOrdersLayout {...props} />;
  }

  // For bar themes, render the bar layout
  if (structure === 'bar') {
    return <BarOrdersLayout {...props} />;
  }

  // For bakery themes, render the bakery layout
  if (structure === 'bakery') {
    return <BakeryOrdersLayout {...props} />;
  }

  // For accessibility themes, render the accessibility layout
  if (structure === 'accessibility') {
    return <AccessibilityOrdersLayout {...props} />;
  }

  // Default to standard Orders for unknown structures
  return <Orders {...props} />;
}
