/**
 * Themed Staff Component
 *
 * Wrapper that integrates the LayoutEngine with the Staff component.
 * This enables runtime layout transformation based on the active theme.
 */

import { useTheme } from '../../theme/useTheme';
import Staff from './Staff';
import ClassicPosStaff from './ClassicPosStaff';
import FastFoodStaff from './FastFoodStaff';
import FastFoodStaffComprehensive from './FastFoodStaffComprehensive';

export default function ThemedStaff(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <Staff {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicPosStaff {...props} />;
  }

  if (structure === 'fastfood-pos') {
    return <FastFoodStaff {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodStaffComprehensive {...props} />;
  }

  return <Staff {...props} />;
}
