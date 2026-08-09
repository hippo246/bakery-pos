/**
 * FastFoodReportsComprehensive.jsx
 * Comprehensive Reports with sales analytics
 */

import { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import {
  AccessibleReports,
  AccessibleReportFilter,
  AccessibleDataTable,
  AccessibleExportButton,
} from '../accessibility';

export default function FastFoodReportsComprehensive() {
  const [selectedReport, setSelectedReport] = useState('SALES_BY_CATEGORY');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Sales by category data
  const salesByCategory = useMemo(() => [
    { category: 'BURGERS', icon: '🍔', percentage: 45, amount: 20555 },
    { category: 'CHICKEN', icon: '🍗', percentage: 30, amount: 13703 },
    { category: 'DRINKS', icon: '🥤', percentage: 18, amount: 8222 },
    { category: 'SIDES', icon: '🍟', percentage: 7, amount: 3197 },
  ], []);

  // Drive-thru vs dine-in data
  const channelComparison = useMemo(() => [
    { channel: 'Drive-Thru', icon: '🚗', percentage: 65, amount: 29690 },
    { channel: 'Dine-In', icon: '🍽️', percentage: 35, amount: 15988 },
  ], []);

  // Time-based sales data
  const hourlySales = useMemo(() => [
    { hour: '10AM', sales: 4500 },
    { hour: '11AM', sales: 8900 },
    { hour: '12PM', sales: 12500 },
    { hour: '1PM', sales: 15000 },
    { hour: '2PM', sales: 11000 },
    { hour: '3PM', sales: 7500 },
    { hour: '4PM', sales: 5000 },
    { hour: '5PM', sales: 6200 },
  ], []);

  // Top selling items
  const topItems = useMemo(() => [
    { name: 'Big Mac Meal', sales: 45, revenue: 40455 },
    { name: 'Zinger Burger', sales: 38, revenue: 22762 },
    { name: 'Pan Pizza', sales: 32, revenue: 41568 },
    { name: 'McFlurry', sales: 28, revenue: 13972 },
    { name: 'Buffalo Wings', sales: 25, revenue: 22475 },
  ], []);

  // Get bar width based on percentage
  const getBarWidth = (percentage) => `${percentage}%`;

  // Get bar color based on category
  const getBarColor = (category) => {
    const colors = {
      BURGERS: '#E63946',
      CHICKEN: '#FFD166',
      DRINKS: '#2ECC71',
      SIDES: '#3498DB',
    };
    return colors[category] || '#E63946';
  };

  // Handler functions
  const handleExportCSV = () => {
    setAlertDialog({ isOpen: true, title: 'Exporting Report', message: 'Exporting report to CSV...', type: 'info' });
  };

  const handlePrintReport = () => {
    setAlertDialog({ isOpen: true, title: 'Printing Report', message: 'Printing report...', type: 'info' });
  };

  const handleEmailReport = () => {
    setAlertDialog({ isOpen: true, title: 'Emailing Report', message: 'Emailing report...', type: 'info' });
  };

  // Styles
  const _containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
    fontFamily: 'Inter, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '900',
    fontSize: '12px',
  };

  const toolbarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const _selectStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '4px',
    color: '#1A1A1A',
  };

  const _reportSelectStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '4px',
    color: '#1A1A1A',
  };

  const _periodSelectStyle = {
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  };

  const reportCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
  };

  const reportTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    marginBottom: '12px',
    color: '#E63946',
  };

  const barChartStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const barRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const barLabelStyle = {
    width: '120px',
    fontSize: '12px',
    fontWeight: '700',
  };

  const barContainerStyle = {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: '4px',
    height: '24px',
    overflow: 'hidden',
  };

  const barFillStyle = (color, width) => ({
    backgroundColor: color,
    width: width,
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  });

  const barValueStyle = {
    width: '80px',
    fontSize: '12px',
    fontWeight: '800',
    textAlign: 'right',
  };

  const _tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
  };

  const _tableHeaderStyle = {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    padding: '8px',
    fontSize: '10px',
    fontWeight: '800',
    textTransform: 'uppercase',
  };

  const _tableCellStyle = {
    padding: '6px 8px',
    borderBottom: '1px solid #E63946',
    fontSize: '11px',
    fontWeight: '700',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '4px',
    marginTop: '12px',
  };

  const actionButtonStyle = {
    padding: '6px 12px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const _secondaryButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#FFFFFF',
    color: '#E63946',
  };

  return (
    <AccessibleReports title="Sales Reports">
      {/* Header */}
      <div style={headerStyle}>
        <span>📊 SALES REPORTS</span>
        <span>TODAY: ₹45,678 │ 📅 2024-08-07</span>
      </div>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        <AccessibleReportFilter
          filters={[
            { id: 'SALES_BY_CATEGORY', label: 'SALES BY CATEGORY', icon: '📈' },
            { id: 'CHANNEL_COMPARISON', label: 'DRIVE-THRU VS DINE-IN', icon: '🚗' },
            { id: 'HOURLY_SALES', label: 'HOURLY SALES', icon: '⏰' },
            { id: 'TOP_ITEMS', label: 'TOP SELLING ITEMS', icon: '🏆' },
          ]}
          activeFilter={selectedReport}
          onFilterChange={setSelectedReport}
        />
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Sales by Category */}
        <div style={reportCardStyle}>
          <div style={reportTitleStyle}>📈 SALES BY CATEGORY</div>
          <div style={barChartStyle}>
            {salesByCategory.map((item, index) => (
              <div key={index} style={barRowStyle}>
                <div style={barLabelStyle}>
                  {item.icon} {item.category}
                </div>
                <div style={barContainerStyle}>
                  <div style={barFillStyle(getBarColor(item.category), getBarWidth(item.percentage))} />
                </div>
                <div style={barValueStyle}>{item.percentage}%</div>
                <div style={barValueStyle}>₹{item.amount.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Comparison */}
        <div style={reportCardStyle}>
          <div style={reportTitleStyle}>🚗 DRIVE-THRU VS DINE-IN</div>
          <div style={barChartStyle}>
            {channelComparison.map((item, index) => (
              <div key={index} style={barRowStyle}>
                <div style={barLabelStyle}>
                  {item.icon} {item.channel}
                </div>
                <div style={barContainerStyle}>
                  <div style={barFillStyle('#E63946', getBarWidth(item.percentage))} />
                </div>
                <div style={barValueStyle}>{item.percentage}%</div>
                <div style={barValueStyle}>₹{item.amount.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Sales */}
        <div style={reportCardStyle}>
          <div style={reportTitleStyle}>⏰ HOURLY SALES</div>
          <div style={barChartStyle}>
            {hourlySales.map((item, index) => (
              <div key={index} style={barRowStyle}>
                <div style={barLabelStyle}>{item.hour}</div>
                <div style={barContainerStyle}>
                  <div style={barFillStyle('#FFD166', getBarWidth((item.sales / 15000) * 100))} />
                </div>
                <div style={barValueStyle}>₹{item.sales.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div style={reportCardStyle}>
          <div style={reportTitleStyle}>🏆 TOP SELLING ITEMS</div>
          <AccessibleDataTable
            columns={[
              { key: 'name', label: 'ITEM', flex: 2 },
              { key: 'sales', label: 'SALES', flex: 1 },
              { key: 'revenue', label: 'REVENUE', flex: 1 },
            ]}
            data={topItems.map(item => ({
              name: item.name,
              sales: item.sales,
              revenue: `₹${item.revenue.toLocaleString('en-IN')}`,
            }))}
            ariaLabel="Top selling items table"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        <AccessibleExportButton
          onExport={handleExportCSV}
          format="CSV"
        />
        <AccessibleExportButton
          onExport={handlePrintReport}
          format="PDF"
        />
        <AccessibleExportButton
          onExport={handleEmailReport}
          format="Email"
        />
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </AccessibleReports>
  );
}
