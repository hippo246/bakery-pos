/**
 * Themed Menu Component
 *
 * Wrapper that integrates the LayoutEngine with the Menu component.
 * This enables runtime layout transformation based on the active theme.
 */

import { useTheme } from '../../theme/useTheme';
import Menu from './Menu';
import ClassicPosMenu from './ClassicPosMenu';
import FastFoodMenuComprehensive from './FastFoodMenuComprehensive';

export default function ThemedMenu(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <Menu {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicPosMenu {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodMenuComprehensive {...props} />;
  }

  return <Menu {...props} />;
}
