/**
 * Themed Settings Component
 *
 * Wrapper that integrates the LayoutEngine with the Settings component.
 * This enables runtime layout transformation based on the active theme.
 */

import { useTheme } from '../../theme/useTheme';
import Settings from './Settings';
import ClassicPosSettings from './ClassicPosSettings';
import FastFoodSettings from './FastFoodSettings';
import FastFoodSettingsComprehensive from './FastFoodSettingsComprehensive';

export default function ThemedSettings(props) {
  const { theme } = useTheme();
  const layout = theme?.layout || {};
  const structure = layout?.structure || 'modern';

  if (structure === 'modern') {
    return <Settings {...props} />;
  }

  if (structure === 'classic-pos') {
    return <ClassicPosSettings {...props} />;
  }

  if (structure === 'fastfood-pos') {
    return <FastFoodSettings {...props} />;
  }

  if (structure === 'fastfood-comprehensive') {
    return <FastFoodSettingsComprehensive {...props} />;
  }

  return <Settings {...props} />;
}
