/**
 * ThemedTables.jsx
 * Router that selects the correct Table management display based on active theme structure.
 * Add new structures here as new themes are created.
 */

import { useTheme } from '../../theme/useTheme';
import Tables from './Tables';
import ClassicPosTable from '../table-management/ClassicPosTable';
import FastFoodTables from './FastFoodTables';
import FastFoodTablesSimple from './FastFoodTablesSimple';
import FastFoodTablesComprehensive from './FastFoodTablesComprehensive';
import CafeTables from './CafeTables';
import FineDiningTables from './FineDiningTables';
import BarTables from './BarTables';
import BakeryTables from './BakeryTables';
import AccessibilityTables from './AccessibilityTables';

export default function ThemedTables(props) {
  const { theme } = useTheme();
  const structure = theme?.layout?.structure || 'modern';

  const TABLES_MAP = {
    'modern':                 Tables,
    'classic-pos':            ClassicPosTable,
    'fastfood-pos':           FastFoodTables,
    'fastfood-simple':        FastFoodTablesSimple,
    'fastfood-comprehensive': FastFoodTablesComprehensive,
    'cafe':                   CafeTables,
    'finedining':             FineDiningTables,
    'bar':                    BarTables,
    'bakery':                 BakeryTables,
    'accessibility':          AccessibilityTables,
  };

  const Component = TABLES_MAP[structure] || Tables;
  return <Component {...props} />;
}
