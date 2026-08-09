/**
 * Theme Exports
 * 
 * Exports all available theme configurations.
 */

export { modernTheme } from './modern';
export { classicTheme } from './classic';
export { fastFoodTheme } from './fastfood';
export { cafeTheme } from './cafe';
export { fineDiningTheme } from './finedining';
export { barTheme } from './bar';
export { bakeryTheme } from './bakery';
export { accessibilityTheme } from './accessibility';

// Default export as an object for convenience
import { modernTheme } from './modern';
import { classicTheme } from './classic';
import { fastFoodTheme } from './fastfood';
import { cafeTheme } from './cafe';
import { fineDiningTheme } from './finedining';
import { barTheme } from './bar';
import { bakeryTheme } from './bakery';
import { accessibilityTheme } from './accessibility';

const themes = {
  modern: modernTheme,
  classic: classicTheme,
  fastfood: fastFoodTheme,
  cafe: cafeTheme,
  finedining: fineDiningTheme,
  bar: barTheme,
  bakery: bakeryTheme,
  accessibility: accessibilityTheme,
};

export default themes;
