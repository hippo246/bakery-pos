/**
 * Themed Inventory Component
 *
 * Wrapper that integrates the LayoutEngine with the Inventory component.
 * This enables runtime layout transformation based on the active theme.
 */

import { useTheme } from '../../theme/useTheme';
import Inventory from './Inventory';
import ClassicPosInventory from './ClassicPosInventory';
import FastFoodInventoryComprehensive from './FastFoodInventoryComprehensive';

export default function ThemedInventory(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <Inventory {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicPosInventory {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodInventoryComprehensive {...props} />;
  }

  return <Inventory {...props} />;
}
