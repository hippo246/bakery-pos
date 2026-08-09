/**
 * Themed Dashboard Component
 *
 * Wrapper that integrates the LayoutEngine with the Dashboard component.
 * This enables runtime layout transformation based on the active theme.
 */

import Dashboard from './Dashboard';
import ClassicDashboard from './ClassicDashboard';
import FastFoodDashboard from './FastFoodDashboard';
import FastFoodDashboardComprehensive from './FastFoodDashboardComprehensive';
import FastFoodDashboardSimple from './FastFoodDashboardSimple';
import { useTheme } from '../../theme/useTheme';

export default function ThemedDashboard(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <Dashboard {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicDashboard {...props} />;
  }

  if (structure === 'fastfood-pos') {
    return <FastFoodDashboard {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodDashboardComprehensive {...props} />;
  }

  if (structure === 'fastfood-simple') {
    return <FastFoodDashboardSimple {...props} />;
  }

  return <Dashboard {...props} />;
}
