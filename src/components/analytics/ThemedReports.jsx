/**
 * Themed Reports Component
 *
 * Wrapper that integrates the LayoutEngine with the Reports component.
 * This enables runtime layout transformation based on the active theme.
 */

import { useTheme } from '../../theme/useTheme';
import AnalyticsReports from './AnalyticsReports';
import ClassicPosReports from './ClassicPosReports';
import FastFoodReports from './FastFoodReports';
import FastFoodReportsComprehensive from './FastFoodReportsComprehensive';

export default function ThemedReports(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <AnalyticsReports {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicPosReports {...props} />;
  }

  if (structure === 'fastfood-pos') {
    return <FastFoodReports {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodReportsComprehensive {...props} />;
  }

  return <AnalyticsReports {...props} />;
}
