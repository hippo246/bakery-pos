/**
 * ThemedKitchen.jsx
 * Router that selects the correct Kitchen Display System based on active theme structure.
 * Add new structures here as new themes are created.
 */

import { useTheme } from '../../theme/useTheme';
import Kitchen from './Kitchen';
import ClassicPosKDS from './ClassicPosKDS';
import FastFoodKitchen from './FastFoodKitchen';
import FastFoodKitchenComprehensive from './FastFoodKitchenComprehensive';
import FastFoodKitchenSimple from './FastFoodKitchenSimple';
import CafeKitchen from './CafeKitchen';
import FineDiningKitchen from './FineDiningKitchen';
import BarKitchen from './BarKitchen';
import BakeryKitchen from './BakeryKitchen';
import AccessibilityKitchen from './AccessibilityKitchen';

export default function ThemedKitchen(props) {
  const { theme } = useTheme();
  const structure = theme?.layout?.structure || 'modern';

  const KITCHEN_MAP = {
    'modern':                 Kitchen,
    'classic-pos':            ClassicPosKDS,
    'fastfood-pos':           FastFoodKitchen,
    'fastfood-comprehensive': FastFoodKitchenComprehensive,
    'fastfood-simple':        FastFoodKitchenSimple,
    'cafe':                   CafeKitchen,
    'finedining':             FineDiningKitchen,
    'bar':                    BarKitchen,
    'bakery':                 BakeryKitchen,
    'accessibility':          AccessibilityKitchen,
  };

  const Component = KITCHEN_MAP[structure] || Kitchen;
  return <Component {...props} />;
}
