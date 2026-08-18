import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Report Categories and Types
const REPORT_CATEGORIES = {
  sales: {
    label: 'Sales',
    icon: '💰',
    reports: [
      { id: 'daily_sales', label: 'Daily Sales', description: 'Sales breakdown by day' },
      { id: 'weekly_sales', label: 'Weekly Sales', description: 'Sales breakdown by week' },
      { id: 'monthly_sales', label: 'Monthly Sales', description: 'Sales breakdown by month' },
      { id: 'yearly_sales', label: 'Yearly Sales', description: 'Sales breakdown by year' },
      { id: 'hourly_sales', label: 'Hourly Sales', description: 'Sales by hour of day' },
      { id: 'sales_by_category', label: 'Sales by Category', description: 'Revenue by menu category' },
      { id: 'sales_by_item', label: 'Sales by Item', description: 'Top selling items' },
      { id: 'sales_by_payment', label: 'Sales by Payment Method', description: 'Payment method breakdown' },
      { id: 'sales_by_table', label: 'Sales by Table', description: 'Revenue per table' },
      { id: 'sales_by_waiter', label: 'Sales by Waiter', description: 'Revenue per waiter' },
      { id: 'sales_by_day', label: 'Sales by Day of Week', description: 'Performance by day' },
      { id: 'peak_hours', label: 'Peak Hours Analysis', description: 'Busiest time periods' },
      { id: 'slow_periods', label: 'Slow Periods Analysis', description: 'Least busy times' },
      { id: 'sales_comparison', label: 'Sales Comparison', description: 'Period over period comparison' },
      { id: 'average_order_value', label: 'Average Order Value', description: 'AOV trends' }
    ]
  },
  inventory: {
    label: 'Inventory',
    icon: '📦',
    reports: [
      { id: 'stock_levels', label: 'Stock Levels', description: 'Current inventory status' },
      { id: 'low_stock', label: 'Low Stock Alert', description: 'Items needing reorder' },
      { id: 'overstock', label: 'Overstock Report', description: 'Excess inventory' },
      { id: 'wastage', label: 'Wastage Report', description: 'Inventory waste tracking' },
      { id: 'expiry', label: 'Expiry Report', description: 'Items expiring soon' },
      { id: 'inventory_valuation', label: 'Inventory Valuation', description: 'Total inventory value' },
      { id: 'stock_movement', label: 'Stock Movement', description: 'Inventory flow tracking' },
      { id: 'category_stock', label: 'Category-wise Stock', description: 'Stock by category' },
      { id: 'supplier_stock', label: 'Supplier-wise Stock', description: 'Stock by supplier' },
      { id: 'fast_moving', label: 'Fast Moving Items', description: 'High turnover items' },
      { id: 'slow_moving', label: 'Slow Moving Items', description: 'Low turnover items' },
      { id: 'stock_turnover', label: 'Stock Turnover', description: 'Inventory turnover rate' }
    ]
  },
  staff: {
    label: 'Staff',
    icon: '👥',
    reports: [
      { id: 'staff_performance', label: 'Staff Performance', description: 'Overall staff metrics' },
      { id: 'staff_attendance', label: 'Staff Attendance', description: 'Attendance tracking' },
      { id: 'tips_report', label: 'Tips Report', description: 'Tips earned by staff' },
      { id: 'orders_by_staff', label: 'Orders by Staff', description: 'Order count per staff' },
      { id: 'revenue_by_staff', label: 'Revenue by Staff', description: 'Revenue generated' },
      { id: 'staff_efficiency', label: 'Staff Efficiency', description: 'Performance metrics' },
      { id: 'staff_rankings', label: 'Staff Rankings', description: 'Leaderboard' },
      { id: 'shift_performance', label: 'Shift Performance', description: 'Performance by shift' },
      { id: 'staff_productivity', label: 'Staff Productivity', description: 'Output per hour' },
      { id: 'staff_commission', label: 'Staff Commission', description: 'Commission calculations' }
    ]
  },
  customer: {
    label: 'Customer',
    icon: '👤',
    reports: [
      { id: 'customer_spending', label: 'Spending Patterns', description: 'Customer spending habits' },
      { id: 'customer_frequency', label: 'Visit Frequency', description: 'How often customers visit' },
      { id: 'customer_loyalty', label: 'Loyalty Report', description: 'Loyal customer analysis' },
      { id: 'customer_demographics', label: 'Demographics', description: 'Customer profile data' },
      { id: 'customer_retention', label: 'Retention Report', description: 'Customer retention rates' },
      { id: 'top_customers', label: 'Top Customers', description: 'Highest spending customers' },
      { id: 'new_customers', label: 'New Customers', description: 'New customer acquisition' },
      { id: 'churned_customers', label: 'Churned Customers', description: 'Lost customers' },
      { id: 'customer_ltv', label: 'Lifetime Value', description: 'CLV analysis' },
      { id: 'customer_segmentation', label: 'Customer Segments', description: 'Customer grouping' }
    ]
  },
  financial: {
    label: 'Financial',
    icon: '📊',
    reports: [
      { id: 'profit_loss', label: 'Profit & Loss', description: 'P&L statement' },
      { id: 'cash_flow', label: 'Cash Flow', description: 'Cash movement tracking' },
      { id: 'tax_summary', label: 'Tax Summary', description: 'Tax overview' },
      { id: 'gst_report', label: 'GST Report', description: 'GST compliance' },
      { id: 'expense_report', label: 'Expense Report', description: 'Operating expenses' },
      { id: 'margin_analysis', label: 'Margin Analysis', description: 'Profit margins' },
      { id: 'roi_analysis', label: 'ROI Analysis', description: 'Return on investment' },
      { id: 'cost_breakdown', label: 'Cost Breakdown', description: 'Cost of goods analysis' },
      { id: 'revenue_breakdown', label: 'Revenue Breakdown', description: 'Revenue sources' },
      { id: 'daily_financial', label: 'Daily Financial', description: 'Daily financial summary' },
      { id: 'monthly_financial', label: 'Monthly Financial', description: 'Monthly financial summary' },
      { id: 'yearly_financial', label: 'Yearly Financial', description: 'Yearly financial summary' }
    ]
  },
  kitchen: {
    label: 'Kitchen',
    icon: '👨‍🍳',
    reports: [
      { id: 'kot_performance', label: 'KOT Performance', description: 'Kitchen order ticket metrics' },
      { id: 'preparation_time', label: 'Preparation Time', description: 'Time to prepare orders' },
      { id: 'station_efficiency', label: 'Station Efficiency', description: 'Kitchen station performance' },
      { id: 'kitchen_errors', label: 'Kitchen Errors', description: 'Mistake tracking' },
      { id: 'rush_hours', label: 'Rush Hours', description: 'Peak kitchen times' },
      { id: 'kitchen_throughput', label: 'Kitchen Throughput', description: 'Orders per hour' },
      { id: 'order_accuracy', label: 'Order Accuracy', description: 'Order completion rate' },
      { id: 'kitchen_staff', label: 'Kitchen Staff Performance', description: 'Kitchen staff metrics' }
    ]
  },
  tax: {
    label: 'Tax',
    icon: '🧾',
    reports: [
      { id: 'gst_summary', label: 'GST Summary', description: 'GST overview' },
      { id: 'tax_collected', label: 'Tax Collected', description: 'Tax received' },
      { id: 'tax_paid', label: 'Tax Paid', description: 'Tax paid out' },
      { id: 'tax_liability', label: 'Tax Liability', description: 'Tax owed' },
      { id: 'tax_compliance', label: 'Tax Compliance', description: 'Compliance status' }
    ]
  },
  performance: {
    label: 'Performance',
    icon: '📈',
    reports: [
      { id: 'overall_performance', label: 'Overall Performance', description: 'Business metrics' },
      { id: 'category_performance', label: 'Category Performance', description: 'Category metrics' },
      { id: 'item_performance', label: 'Item Performance', description: 'Item metrics' },
      { id: 'table_performance', label: 'Table Performance', description: 'Table revenue' },
      { id: 'waiter_performance', label: 'Waiter Performance', description: 'Waiter metrics' },
      { id: 'hourly_performance', label: 'Hourly Performance', description: 'Hourly metrics' },
      { id: 'daily_performance', label: 'Daily Performance', description: 'Daily metrics' },
      { id: 'weekly_performance', label: 'Weekly Performance', description: 'Weekly metrics' }
    ]
  },
  trends: {
    label: 'Trends',
    icon: '📉',
    reports: [
      { id: 'seasonal_trends', label: 'Seasonal Trends', description: 'Seasonal patterns' },
      { id: 'growth_trends', label: 'Growth Trends', description: 'Growth analysis' },
      { id: 'sales_forecast', label: 'Sales Forecast', description: 'Sales predictions' },
      { id: 'inventory_forecast', label: 'Inventory Forecast', description: 'Inventory predictions' },
      { id: 'customer_trends', label: 'Customer Trends', description: 'Customer patterns' },
      { id: 'staff_trends', label: 'Staff Trends', description: 'Staff patterns' },
      { id: 'financial_trends', label: 'Financial Trends', description: 'Financial patterns' },
      { id: 'yoy_comparison', label: 'Year-over-Year', description: 'Annual comparison' },
      { id: 'mom_comparison', label: 'Month-over-Month', description: 'Monthly comparison' },
      { id: 'trend_analysis', label: 'Trend Analysis', description: 'Comprehensive trends' }
    ]
  },
  custom: {
    label: 'Custom',
    icon: '⚙️',
    reports: [
      { id: 'custom_builder', label: 'Custom Builder', description: 'Build custom reports' },
      { id: 'saved_reports', label: 'Saved Reports', description: 'Your saved reports' },
      { id: 'scheduled_reports', label: 'Scheduled Reports', description: 'Automated reports' }
    ]
  }
};

export default function ComprehensiveReports({ orders = [], menuItems = [], staff = [], customers = [], inventory = [], onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('sales');
  const [selectedReport, setSelectedReport] = useState('daily_sales');
  const [dateRange, setDateRange] = useState('today');
  const [wasteRecords, setWasteRecords] = useState([]);

  const currentReports = REPORT_CATEGORIES[selectedCategory]?.reports || [];

  // Load waste records
  useEffect(() => {
    try {
      const savedWaste = localStorage.getItem('bakerypos_waste');
      if (savedWaste) {
        setWasteRecords(JSON.parse(savedWaste));
      }
    } catch (e) {
      console.error('Failed to load waste records:', e);
    }
  }, []);
  
  // Calculate report data based on selected report
  const reportData = useMemo(() => {
    // Filter orders by date range
    const filteredOrders = filterOrdersByDateRange(orders, dateRange);
    const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED');

    // Return data based on report type
    return calculateReportData(selectedReport, completedOrders, menuItems, staff, customers, inventory, wasteRecords);
  }, [selectedReport, dateRange, orders, menuItems, staff, customers, inventory, wasteRecords]);

  function filterOrdersByDateRange(orders, range) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    switch (range) {
      case 'today':
        return orders.filter(o => new Date(o.createdAt).toDateString() === today);
      case 'yesterday':
        return orders.filter(o => new Date(o.createdAt).toDateString() === yesterday);
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        return orders.filter(o => new Date(o.createdAt) >= weekAgo);
      case 'month':
        const monthAgo = new Date(Date.now() - 30 * 86400000);
        return orders.filter(o => new Date(o.createdAt) >= monthAgo);
      case 'quarter':
        const quarterAgo = new Date(Date.now() - 90 * 86400000);
        return orders.filter(o => new Date(o.createdAt) >= quarterAgo);
      case 'year':
        const yearAgo = new Date(Date.now() - 365 * 86400000);
        return orders.filter(o => new Date(o.createdAt) >= yearAgo);
      default:
        return orders;
    }
  }

  function calculateReportData(reportId, orders, menuItems, staff, customers, inventory, wasteRecords) {
    // Basic calculations
    const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalGST = orders.reduce((sum, o) => sum + (o.tax || 0), 0);

    // Sales by item
    const itemSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { quantity: 0, revenue: 0 };
        }
        itemSales[item.name].quantity += item.qty || 1;
        itemSales[item.name].revenue += (item.price || 0) * (item.qty || 1);
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Sales by category
    const categorySales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.category || 'Other';
        if (!categorySales[category]) {
          categorySales[category] = { quantity: 0, revenue: 0 };
        }
        categorySales[category].quantity += item.qty || 1;
        categorySales[category].revenue += (item.price || 0) * (item.qty || 1);
      });
    });

    // Payment methods
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'CASH';
      paymentMethods[method] = (paymentMethods[method] || 0) + order.total;
    });

    // Hourly sales
    const hourlySales = {};
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      if (!hourlySales[hour]) {
        hourlySales[hour] = { count: 0, revenue: 0 };
      }
      hourlySales[hour].count += 1;
      hourlySales[hour].revenue += order.total || 0;
    });

    // Staff performance
    const staffPerformance = {};
    orders.forEach(order => {
      const staffId = order.employeeId || 'unassigned';
      const staffName = order.employeeName || 'Unassigned';
      if (!staffPerformance[staffId]) {
        staffPerformance[staffId] = { name: staffName, orders: 0, revenue: 0 };
      }
      staffPerformance[staffId].orders += 1;
      staffPerformance[staffId].revenue += order.total || 0;
    });

    // Customer spending
    const customerSpending = {};
    orders.forEach(order => {
      const customerId = order.customerId || 'walk-in';
      const customerName = order.customerName || 'Walk-in';
      if (!customerSpending[customerId]) {
        customerSpending[customerId] = { name: customerName, orders: 0, totalSpent: 0 };
      }
      customerSpending[customerId].orders += 1;
      customerSpending[customerId].totalSpent += order.total || 0;
    });

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);

    // Inventory analysis
    const inventoryAnalysis = {
      totalItems: inventory.length,
      lowStockItems: inventory.filter(item => item.quantity <= (item.minStock || 5)).length,
      totalValue: inventory.reduce((sum, item) => sum + (item.quantity * (item.cost || 0)), 0),
      categories: {}
    };
    
    // Waste analysis
    const wasteAnalysis = {
      totalWasteCost: wasteRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0),
      totalWasteQuantity: wasteRecords.reduce((sum, r) => sum + (r.quantity || 0), 0),
      wasteByReason: {},
      wasteByCategory: {},
      wasteByItem: {}
    };
    
    wasteRecords.forEach(r => {
      wasteAnalysis.wasteByReason[r.reason] = (wasteAnalysis.wasteByReason[r.reason] || 0) + (r.totalCost || 0);
      wasteAnalysis.wasteByCategory[r.category] = (wasteAnalysis.wasteByCategory[r.category] || 0) + (r.totalCost || 0);
      wasteAnalysis.wasteByItem[r.itemName] = (wasteAnalysis.wasteByItem[r.itemName] || 0) + (r.totalCost || 0);
    });
    
    inventory.forEach(item => {
      const category = item.category || 'Other';
      if (!inventoryAnalysis.categories[category]) {
        inventoryAnalysis.categories[category] = { count: 0, value: 0 };
      }
      inventoryAnalysis.categories[category].count += 1;
      inventoryAnalysis.categories[category].value += item.quantity * (item.cost || 0);
    });

    // Financial analysis
    const financialAnalysis = {
      totalRevenue: totalSales,
      totalCost: orders.reduce((sum, o) => {
        const orderCost = o.items?.reduce((itemSum, item) => {
          const menuItem = menuItems.find(m => m.name === item.name);
          const cost = menuItem?.cost || 0;
          return itemSum + (cost * (item.qty || 1));
        }, 0) || 0;
        return sum + orderCost;
      }, 0),
      totalGST: totalGST,
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0
    };
    
    financialAnalysis.grossProfit = financialAnalysis.totalRevenue - financialAnalysis.totalCost;
    financialAnalysis.netProfit = financialAnalysis.grossProfit - financialAnalysis.totalGST;
    financialAnalysis.profitMargin = financialAnalysis.totalRevenue > 0 
      ? (financialAnalysis.netProfit / financialAnalysis.totalRevenue * 100).toFixed(1) 
      : 0;

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      topItems,
      paymentMethods,
      totalGST,
      categorySales,
      hourlySales,
      staffPerformance,
      topCustomers,
      inventoryAnalysis,
      financialAnalysis,
      wasteAnalysis,
      wasteRecords,
      orders: filterOrdersByDateRange(orders, dateRange)
    };
  }

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    const reportTitle = `${currentReports.find(r => r.id === selectedReport)?.label.replace(/_/g, ' ')} - ${dateRange.toUpperCase()}`;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('BakeryPOS Report', 14, 20);
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(reportTitle, 14, 30);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 14, 50);
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Sales', `₹${reportData.totalSales.toLocaleString()}`],
      ['Total Orders', reportData.totalOrders.toString()],
      ['Average Order Value', `₹${Math.round(reportData.avgOrderValue)}`],
      ['Total GST', `₹${reportData.totalGST.toLocaleString()}`]
    ];
    
    doc.autoTable({
      startY: 55,
      head: [['Metric', 'Value']],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [17, 24, 39] },
      styles: { fontSize: 10 }
    });
    
    // Report-specific data
    let reportDataArray = [];
    switch (selectedReport) {
      case 'sales_by_item':
        reportDataArray = [['Item', 'Quantity', 'Revenue'], ...reportData.topItems.map(item => [item.name, item.quantity, `₹${item.revenue}`])];
        break;
      case 'sales_by_category':
        reportDataArray = [['Category', 'Quantity', 'Revenue'], ...Object.entries(reportData.categorySales).map(([cat, stats]) => [cat, stats.quantity, `₹${stats.revenue}`])];
        break;
      case 'sales_by_payment':
        reportDataArray = [['Payment Method', 'Amount'], ...Object.entries(reportData.paymentMethods).map(([method, amount]) => [method, `₹${amount}`])];
        break;
      case 'hourly_sales':
        reportDataArray = [['Hour', 'Orders', 'Revenue'], ...Object.entries(reportData.hourlySales).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, stats]) => [`${parseInt(hour)}:00`, stats.count, `₹${stats.revenue}`])];
        break;
      case 'staff_performance':
        reportDataArray = [['Staff Name', 'Orders', 'Revenue'], ...Object.values(reportData.staffPerformance).map(staff => [staff.name, staff.orders, `₹${staff.revenue}`])];
        break;
      case 'top_customers':
        reportDataArray = [['Customer', 'Orders', 'Total Spent'], ...reportData.topCustomers.map(cust => [cust.name, cust.orders, `₹${cust.totalSpent}`])];
        break;
      default:
        reportDataArray = [['Metric', 'Value'], ['Total Sales', `₹${reportData.totalSales}`], ['Total Orders', reportData.totalOrders]];
    }
    
    if (reportDataArray.length > 0) {
      doc.text('Report Details', 14, doc.lastAutoTable.finalY + 15);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [reportDataArray[0]],
        body: reportDataArray.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [17, 24, 39] },
        styles: { fontSize: 9 }
      });
    }
    
    doc.save(`bakerypos_${selectedReport}_${dateRange}_${Date.now()}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Sales', reportData.totalSales],
      ['Total Orders', reportData.totalOrders],
      ['Average Order Value', reportData.avgOrderValue],
      ['Total GST', reportData.totalGST]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Report-specific data sheet
    let reportDataArray = [];
    switch (selectedReport) {
      case 'sales_by_item':
        reportDataArray = [['Item', 'Quantity', 'Revenue'], ...reportData.topItems.map(item => [item.name, item.quantity, item.revenue])];
        break;
      case 'sales_by_category':
        reportDataArray = [['Category', 'Quantity', 'Revenue'], ...Object.entries(reportData.categorySales).map(([cat, stats]) => [cat, stats.quantity, stats.revenue])];
        break;
      case 'sales_by_payment':
        reportDataArray = [['Payment Method', 'Amount'], ...Object.entries(reportData.paymentMethods).map(([method, amount]) => [method, amount])];
        break;
      case 'hourly_sales':
        reportDataArray = [['Hour', 'Orders', 'Revenue'], ...Object.entries(reportData.hourlySales).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, stats]) => [parseInt(hour), stats.count, stats.revenue])];
        break;
      case 'staff_performance':
        reportDataArray = [['Staff Name', 'Orders', 'Revenue'], ...Object.values(reportData.staffPerformance).map(staff => [staff.name, staff.orders, staff.revenue])];
        break;
      case 'top_customers':
        reportDataArray = [['Customer', 'Orders', 'Total Spent'], ...reportData.topCustomers.map(cust => [cust.name, cust.orders, cust.totalSpent])];
        break;
      case 'profit_loss':
        reportDataArray = [
          ['Financial Metric', 'Value'],
          ['Total Revenue', reportData.financialAnalysis?.totalRevenue],
          ['Total Cost (COGS)', reportData.financialAnalysis?.totalCost],
          ['Gross Profit', reportData.financialAnalysis?.grossProfit],
          ['GST/Tax', reportData.financialAnalysis?.totalGST],
          ['Net Profit', reportData.financialAnalysis?.netProfit],
          ['Profit Margin (%)', reportData.financialAnalysis?.profitMargin]
        ];
        break;
      default:
        reportDataArray = [['Metric', 'Value'], ['Total Sales', reportData.totalSales], ['Total Orders', reportData.totalOrders]];
    }
    
    if (reportDataArray.length > 0) {
      const reportSheet = XLSX.utils.aoa_to_sheet(reportDataArray);
      XLSX.utils.book_append_sheet(workbook, reportSheet, 'Report Data');
    }
    
    XLSX.writeFile(workbook, `bakerypos_${selectedReport}_${dateRange}_${Date.now()}.xlsx`);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Comprehensive Reports
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              80+ specialized business analytics reports
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Categories */}
        <div style={{
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em' }}>
            CATEGORIES
          </div>
          {Object.entries(REPORT_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setSelectedReport(category.reports[0]?.id);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: selectedCategory === key ? '#f3f4f6' : '#ffffff',
                color: selectedCategory === key ? '#111827' : '#6b7280',
                border: selectedCategory === key ? '1px solid #d1d5db' : '1px solid transparent',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '4px',
                textAlign: 'left'
              }}
            >
              <span>{category.icon}</span>
              {category.label}
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                {category.reports.length}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f9fafb' }}>
          {/* Report Type Selector */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '12px' }}>
              Select Report
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {currentReports.map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  style={{
                    padding: '10px 16px',
                    background: selectedReport === report.id ? '#111827' : '#ffffff',
                    color: selectedReport === report.id ? '#ffffff' : '#111827',
                    border: selectedReport === report.id ? 'none' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {report.label.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selector */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Period:</span>
            {['today', 'yesterday', 'week', 'month', 'quarter', 'year'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '10px 20px',
                  background: dateRange === range ? '#111827' : '#ffffff',
                  color: dateRange === range ? '#ffffff' : '#111827',
                  border: dateRange === range ? 'none' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={exportToPDF}
              style={{
                padding: '12px 24px',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📄 Export PDF
            </button>
            <button
              onClick={exportToExcel}
              style={{
                padding: '12px 24px',
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📊 Export Excel
            </button>
          </div>

          {/* Report Display */}
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
              {currentReports.find(r => r.id === selectedReport)?.label.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              {currentReports.find(r => r.id === selectedReport)?.description}
            </div>

            {/* Summary Cards */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <SummaryCard label="Total Sales" value={`₹${reportData.totalSales.toLocaleString()}`} icon="💰" />
              <SummaryCard label="Total Orders" value={reportData.totalOrders} icon="🛒" />
              <SummaryCard label="Avg Order Value" value={`₹${Math.round(reportData.avgOrderValue)}`} icon="📊" />
              <SummaryCard label="Total GST" value={`₹${reportData.totalGST.toLocaleString()}`} icon="🧾" />
            </div>

            {/* Report-specific content will be rendered here */}
            <ReportContent reportId={selectedReport} data={reportData} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '150px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ReportContent({ reportId, data }) {
  // Render different content based on report type
  switch (reportId) {
    case 'daily_sales':
      return <DailySalesReport data={data} />;
    case 'weekly_sales':
      return <WeeklySalesReport data={data} />;
    case 'monthly_sales':
      return <MonthlySalesReport data={data} />;
    case 'yearly_sales':
      return <YearlySalesReport data={data} />;
    case 'sales_by_item':
      return <SalesByItemReport data={data} />;
    case 'sales_by_category':
      return <SalesByCategoryReport data={data} />;
    case 'sales_by_payment':
      return <SalesByPaymentReport data={data} />;
    case 'sales_by_table':
      return <SalesByTableReport data={data} />;
    case 'sales_by_waiter':
      return <SalesByWaiterReport data={data} />;
    case 'sales_by_day':
      return <SalesByDayReport data={data} />;
    case 'peak_hours':
      return <PeakHoursReport data={data} />;
    case 'slow_periods':
      return <SlowPeriodsReport data={data} />;
    case 'sales_comparison':
      return <SalesComparisonReport data={data} />;
    case 'average_order_value':
      return <AverageOrderValueReport data={data} />;
    case 'hourly_sales':
      return <HourlySalesReport data={data} />;
    case 'stock_levels':
      return <StockLevelsReport data={data} />;
    case 'low_stock':
      return <LowStockReport data={data} />;
    case 'overstock':
      return <OverstockReport data={data} />;
    case 'wastage':
      return <WastageReport data={data} />;
    case 'expiry':
      return <ExpiryReport data={data} />;
    case 'inventory_valuation':
      return <InventoryValuationReport data={data} />;
    case 'stock_movement':
      return <StockMovementReport data={data} />;
    case 'category_stock':
      return <CategoryStockReport data={data} />;
    case 'supplier_stock':
      return <SupplierStockReport data={data} />;
    case 'fast_moving':
      return <FastMovingReport data={data} />;
    case 'slow_moving':
      return <SlowMovingReport data={data} />;
    case 'stock_turnover':
      return <StockTurnoverReport data={data} />;
    case 'staff_performance':
      return <StaffPerformanceReport data={data} />;
    case 'staff_attendance':
      return <StaffAttendanceReport data={data} />;
    case 'tips_report':
      return <TipsReport data={data} />;
    case 'orders_by_staff':
      return <OrdersByStaffReport data={data} />;
    case 'revenue_by_staff':
      return <RevenueByStaffReport data={data} />;
    case 'staff_efficiency':
      return <StaffEfficiencyReport data={data} />;
    case 'staff_rankings':
      return <StaffRankingsReport data={data} />;
    case 'shift_performance':
      return <ShiftPerformanceReport data={data} />;
    case 'staff_productivity':
      return <StaffProductivityReport data={data} />;
    case 'staff_commission':
      return <StaffCommissionReport data={data} />;
    case 'customer_spending':
      return <CustomerSpendingReport data={data} />;
    case 'customer_frequency':
      return <CustomerFrequencyReport data={data} />;
    case 'customer_loyalty':
      return <CustomerLoyaltyReport data={data} />;
    case 'customer_demographics':
      return <CustomerDemographicsReport data={data} />;
    case 'customer_retention':
      return <CustomerRetentionReport data={data} />;
    case 'top_customers':
      return <TopCustomersReport data={data} />;
    case 'new_customers':
      return <NewCustomersReport data={data} />;
    case 'churned_customers':
      return <ChurnedCustomersReport data={data} />;
    case 'customer_ltv':
      return <CustomerLTVReport data={data} />;
    case 'customer_segmentation':
      return <CustomerSegmentationReport data={data} />;
    case 'profit_loss':
      return <ProfitLossReport data={data} />;
    case 'cash_flow':
      return <CashFlowReport data={data} />;
    case 'tax_summary':
      return <TaxSummaryReport data={data} />;
    case 'gst_report':
      return <GSTReport data={data} />;
    case 'expense_report':
      return <ExpenseReport data={data} />;
    case 'margin_analysis':
      return <MarginAnalysisReport data={data} />;
    case 'roi_analysis':
      return <ROIAnalysisReport data={data} />;
    case 'cost_breakdown':
      return <CostBreakdownReport data={data} />;
    case 'revenue_breakdown':
      return <RevenueBreakdownReport data={data} />;
    case 'daily_financial':
      return <DailyFinancialReport data={data} />;
    case 'monthly_financial':
      return <MonthlyFinancialReport data={data} />;
    case 'yearly_financial':
      return <YearlyFinancialReport data={data} />;
    case 'kot_performance':
      return <KOTPerformanceReport data={data} />;
    case 'preparation_time':
      return <PreparationTimeReport data={data} />;
    case 'station_efficiency':
      return <StationEfficiencyReport data={data} />;
    case 'kitchen_errors':
      return <KitchenErrorsReport data={data} />;
    case 'rush_hours':
      return <KitchenRushHoursReport data={data} />;
    case 'kitchen_throughput':
      return <KitchenThroughputReport data={data} />;
    case 'order_accuracy':
      return <OrderAccuracyReport data={data} />;
    case 'kitchen_staff':
      return <KitchenStaffReport data={data} />;
    case 'overall_performance':
      return <OverallPerformanceReport data={data} />;
    case 'category_performance':
      return <CategoryPerformanceReport data={data} />;
    case 'item_performance':
      return <ItemPerformanceReport data={data} />;
    case 'table_performance':
      return <TablePerformanceReport data={data} />;
    case 'waiter_performance':
      return <WaiterPerformanceReport data={data} />;
    case 'hourly_performance':
      return <HourlyPerformanceReport data={data} />;
    case 'daily_performance':
      return <DailyPerformanceReport data={data} />;
    case 'weekly_performance':
      return <WeeklyPerformanceReport data={data} />;
    case 'seasonal_trends':
      return <SeasonalTrendsReport data={data} />;
    case 'growth_trends':
      return <GrowthTrendsReport data={data} />;
    case 'sales_forecast':
      return <SalesForecastReport data={data} />;
    case 'inventory_forecast':
      return <InventoryForecastReport data={data} />;
    case 'customer_trends':
      return <CustomerTrendsReport data={data} />;
    case 'staff_trends':
      return <StaffTrendsReport data={data} />;
    case 'financial_trends':
      return <FinancialTrendsReport data={data} />;
    case 'yoy_comparison':
      return <YOYComparisonReport data={data} />;
    case 'mom_comparison':
      return <MOMComparisonReport data={data} />;
    case 'trend_analysis':
      return <TrendAnalysisReport data={data} />;
    case 'custom_builder':
      return <CustomBuilderReport data={data} />;
    case 'saved_reports':
      return <SavedReportsReport data={data} />;
    case 'scheduled_reports':
      return <ScheduledReportsReport data={data} />;
    default:
      return (
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <p>Detailed report content for <strong>{reportId}</strong> will be rendered here.</p>
          <p style={{ marginTop: '12px' }}>This report contains {data.totalOrders} orders with total sales of ₹{data.totalSales.toLocaleString()}.</p>
        </div>
      );
  }
}

// Sales Reports
function DailySalesReport({ data }) {
  const salesByDay = {};
  data.orders?.forEach(order => {
    const day = new Date(order.createdAt).toLocaleDateString();
    if (!salesByDay[day]) {
      salesByDay[day] = { orders: 0, revenue: 0 };
    }
    salesByDay[day].orders += 1;
    salesByDay[day].revenue += order.total || 0;
  });

  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Sales by Day
      </div>
      {Object.entries(salesByDay).map(([day, stats]) => (
        <div key={day} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{day}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.orders} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesByItemReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Top Selling Items
      </div>
      {data.topItems?.map((item, index) => (
        <div key={item.name} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              #{index + 1}. {item.name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Qty: {item.quantity}</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{item.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesByCategoryReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Sales by Category
      </div>
      {Object.entries(data.categorySales || {}).map(([category, stats]) => (
        <div key={category} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{category}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Qty: {stats.quantity}</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesByPaymentReport({ data }) {
  const totalSales = data.totalSales;
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Payment Method Breakdown
      </div>
      {Object.entries(data.paymentMethods || {}).map(([method, amount]) => {
        const percentage = totalSales > 0 ? (amount / totalSales * 100).toFixed(1) : 0;
        return (
          <div key={method} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{method}</span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>{percentage}%</span>
            </div>
            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percentage}%`, background: '#111827' }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
              ₹{amount.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourlySalesReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Sales by Hour
      </div>
      {Object.entries(data.hourlySales || {}).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, stats]) => (
        <div key={hour} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              {parseInt(hour)}:00 - {parseInt(hour)}:59
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.count} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffPerformanceReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Staff Performance
      </div>
      {Object.values(data.staffPerformance || {}).map(staff => (
        <div key={staff.name} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{staff.name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{staff.orders} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{staff.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopCustomersReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Top Customers
      </div>
      {data.topCustomers?.map((customer, index) => (
        <div key={customer.name} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              #{index + 1}. {customer.name}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{customer.orders} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{customer.totalSpent.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfitLossReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Profit & Loss Statement
      </div>
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Revenue</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>₹{data.financialAnalysis?.totalRevenue?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Cost (COGS)</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>-₹{data.financialAnalysis?.totalCost?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Gross Profit</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>₹{data.financialAnalysis?.grossProfit?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>GST/Tax</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>-₹{data.financialAnalysis?.totalGST?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Net Profit</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>₹{data.financialAnalysis?.netProfit?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Profit Margin</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{data.financialAnalysis?.profitMargin}%</span>
        </div>
      </div>
    </div>
  );
}

function StockLevelsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Inventory Overview
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SummaryCard label="Total Items" value={data.inventoryAnalysis?.totalItems} icon="📦" />
        <SummaryCard label="Low Stock" value={data.inventoryAnalysis?.lowStockItems} icon="⚠️" />
        <SummaryCard label="Total Value" value={`₹${data.inventoryAnalysis?.totalValue?.toLocaleString()}`} icon="💰" />
      </div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Stock by Category
      </div>
      {Object.entries(data.inventoryAnalysis?.categories || {}).map(([category, stats]) => (
        <div key={category} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{category}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.count} items</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Additional Sales Reports
function WeeklySalesReport({ data }) {
  const salesByWeek = {};
  data.orders?.forEach(order => {
    const week = getWeekNumber(new Date(order.createdAt));
    if (!salesByWeek[week]) {
      salesByWeek[week] = { orders: 0, revenue: 0 };
    }
    salesByWeek[week].orders += 1;
    salesByWeek[week].revenue += order.total || 0;
  });

  return <GenericReport title="Sales by Week" data={salesByWeek} labelKey="Week" />;
}

function MonthlySalesReport({ data }) {
  const salesByMonth = {};
  data.orders?.forEach(order => {
    const month = new Date(order.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!salesByMonth[month]) {
      salesByMonth[month] = { orders: 0, revenue: 0 };
    }
    salesByMonth[month].orders += 1;
    salesByMonth[month].revenue += order.total || 0;
  });

  return <GenericReport title="Sales by Month" data={salesByMonth} labelKey="Month" />;
}

function YearlySalesReport({ data }) {
  const salesByYear = {};
  data.orders?.forEach(order => {
    const year = new Date(order.createdAt).getFullYear();
    if (!salesByYear[year]) {
      salesByYear[year] = { orders: 0, revenue: 0 };
    }
    salesByYear[year].orders += 1;
    salesByYear[year].revenue += order.total || 0;
  });

  return <GenericReport title="Sales by Year" data={salesByYear} labelKey="Year" />;
}

function SalesByTableReport({ data }) {
  const salesByTable = {};
  data.orders?.forEach(order => {
    const table = order.tableId || 'Takeaway';
    if (!salesByTable[table]) {
      salesByTable[table] = { orders: 0, revenue: 0 };
    }
    salesByTable[table].orders += 1;
    salesByTable[table].revenue += order.total || 0;
  });

  return <GenericReport title="Sales by Table" data={salesByTable} labelKey="Table" />;
}

function SalesByWaiterReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function SalesByDayReport({ data }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const salesByDay = {};
  days.forEach(day => salesByDay[day] = { orders: 0, revenue: 0 });
  
  data.orders?.forEach(order => {
    const day = days[new Date(order.createdAt).getDay()];
    salesByDay[day].orders += 1;
    salesByDay[day].revenue += order.total || 0;
  });

  return <GenericReport title="Sales by Day of Week" data={salesByDay} labelKey="Day" />;
}

function PeakHoursReport({ data }) {
  const sortedHours = Object.entries(data.hourlySales || {})
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Peak Hours (Top 5)
      </div>
      {sortedHours.map(([hour, stats]) => (
        <div key={hour} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{parseInt(hour)}:00</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.count} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlowPeriodsReport({ data }) {
  const sortedHours = Object.entries(data.hourlySales || {})
    .sort((a, b) => a[1].revenue - b[1].revenue)
    .slice(0, 5);
  
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Slow Periods (Lowest 5)
      </div>
      {sortedHours.map(([hour, stats]) => (
        <div key={hour} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{parseInt(hour)}:00</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.count} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesComparisonReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Sales Comparison
      </div>
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '20px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Compare sales across different periods. Select date ranges to compare.
        </div>
      </div>
    </div>
  );
}

function AverageOrderValueReport({ data }) {
  const aovByDay = {};
  data.orders?.forEach(order => {
    const day = new Date(order.createdAt).toLocaleDateString();
    if (!aovByDay[day]) {
      aovByDay[day] = { total: 0, count: 0 };
    }
    aovByDay[day].total += order.total || 0;
    aovByDay[day].count += 1;
  });

  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Average Order Value Trends
      </div>
      {Object.entries(aovByDay).map(([day, stats]) => (
        <div key={day} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{day}</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{Math.round(stats.total / stats.count).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Inventory Reports
function LowStockReport({ data }) {
  return <StockLevelsReport data={data} />;
}

function OverstockReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Overstock Items
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Items with excess inventory above optimal levels.
      </div>
    </div>
  );
}

function WastageReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Wastage Report
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <SummaryCard label="Total Waste Cost" value={`₹${data.wasteAnalysis?.totalWasteCost?.toFixed(2) || '0.00'}`} icon="💰" />
        <SummaryCard label="Total Records" value={data.wasteRecords?.length || 0} icon="📋" />
        <SummaryCard label="Total Quantity" value={`${data.wasteAnalysis?.totalWasteQuantity?.toFixed(2) || '0'}`} icon="⚖️" />
      </div>
      
      {/* Waste by Reason */}
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Waste by Reason
      </div>
      {Object.entries(data.wasteAnalysis?.wasteByReason || {}).map(([reason, cost]) => {
        const percentage = data.wasteAnalysis?.totalWasteCost > 0 ? (cost / data.wasteAnalysis.totalWasteCost * 100).toFixed(1) : 0;
        return (
          <div key={reason} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>{reason}</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{percentage}% (₹{cost.toFixed(2)})</span>
            </div>
            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percentage}%`, background: '#dc2626' }} />
            </div>
          </div>
        );
      })}
      
      {/* Waste by Category */}
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: '24px' }}>
        Waste by Category
      </div>
      {Object.entries(data.wasteAnalysis?.wasteByCategory || {}).map(([category, cost]) => (
        <div key={category} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{category}</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>₹{cost.toFixed(2)}</div>
        </div>
      ))}
      
      {/* Top Wasted Items */}
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px', marginTop: '24px' }}>
        Top Wasted Items
      </div>
      {Object.entries(data.wasteAnalysis?.wasteByItem || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([item, cost], index) => (
          <div key={item} style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>#{index + 1}. {item}</div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>₹{cost.toFixed(2)}</div>
          </div>
        ))}
    </div>
  );
}

function ExpiryReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Expiry Report
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Items expiring within the next 7 days.
      </div>
    </div>
  );
}

function InventoryValuationReport({ data }) {
  return <StockLevelsReport data={data} />;
}

function StockMovementReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Stock Movement
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Track inventory in-flow and out-flow.
      </div>
    </div>
  );
}

function CategoryStockReport({ data }) {
  return <StockLevelsReport data={data} />;
}

function SupplierStockReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Stock by Supplier
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Inventory breakdown by supplier.
      </div>
    </div>
  );
}

function FastMovingReport({ data }) {
  return <SalesByItemReport data={data} />;
}

function SlowMovingReport({ data }) {
  const slowItems = data.topItems?.slice(-10).reverse() || [];
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Slow Moving Items
      </div>
      {slowItems.map((item, index) => (
        <div key={item.name} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{item.name}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Qty: {item.quantity}</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{item.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function StockTurnoverReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Stock Turnover Rate
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        How quickly inventory is being sold.
      </div>
    </div>
  );
}

// Staff Reports
function StaffAttendanceReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Staff Attendance
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Track staff attendance and shift coverage.
      </div>
    </div>
  );
}

function TipsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Tips Report
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Tips earned by staff members.
      </div>
    </div>
  );
}

function OrdersByStaffReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function RevenueByStaffReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function StaffEfficiencyReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function StaffRankingsReport({ data }) {
  const rankedStaff = Object.values(data.staffPerformance || {})
    .sort((a, b) => b.revenue - a.revenue);
  
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Staff Rankings
      </div>
      {rankedStaff.map((staff, index) => (
        <div key={staff.name} style={{
          background: index === 0 ? '#f0fdf4' : '#f9fafb',
          border: index === 0 ? '2px solid #059669' : '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{staff.name}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{staff.orders} orders</div>
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{staff.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShiftPerformanceReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Shift Performance
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Performance by shift (Morning/Afternoon/Evening).
      </div>
    </div>
  );
}

function StaffProductivityReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function StaffCommissionReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Staff Commission
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Commission calculations based on sales.
      </div>
    </div>
  );
}

// Customer Reports
function CustomerSpendingReport({ data }) {
  return <TopCustomersReport data={data} />;
}

function CustomerFrequencyReport({ data }) {
  return <TopCustomersReport data={data} />;
}

function CustomerLoyaltyReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Customer Loyalty
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Most loyal customers based on visit frequency.
      </div>
    </div>
  );
}

function CustomerDemographicsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Customer Demographics
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Customer profile and demographic data.
      </div>
    </div>
  );
}

function CustomerRetentionReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Customer Retention
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Customer retention and churn rates.
      </div>
    </div>
  );
}

function NewCustomersReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        New Customers
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        New customer acquisition in this period.
      </div>
    </div>
  );
}

function ChurnedCustomersReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Churned Customers
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Customers who haven't returned recently.
      </div>
    </div>
  );
}

function CustomerLTVReport({ data }) {
  return <TopCustomersReport data={data} />;
}

function CustomerSegmentationReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Customer Segments
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Customer grouping by spending patterns.
      </div>
    </div>
  );
}

// Financial Reports
function CashFlowReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Cash Flow
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Cash movement tracking.
      </div>
    </div>
  );
}

function TaxSummaryReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Tax Summary
      </div>
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Tax Collected</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>₹{data.totalGST?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function GSTReport({ data }) {
  return <TaxSummaryReport data={data} />;
}

function ExpenseReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Expense Report
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Operating expenses breakdown.
      </div>
    </div>
  );
}

function MarginAnalysisReport({ data }) {
  return <ProfitLossReport data={data} />;
}

function ROIAnalysisReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        ROI Analysis
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Return on investment metrics.
      </div>
    </div>
  );
}

function CostBreakdownReport({ data }) {
  return <ProfitLossReport data={data} />;
}

function RevenueBreakdownReport({ data }) {
  return <SalesByCategoryReport data={data} />;
}

function DailyFinancialReport({ data }) {
  return <ProfitLossReport data={data} />;
}

function MonthlyFinancialReport({ data }) {
  return <ProfitLossReport data={data} />;
}

function YearlyFinancialReport({ data }) {
  return <ProfitLossReport data={data} />;
}

// Kitchen Reports
function KOTPerformanceReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        KOT Performance
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Kitchen Order Ticket metrics.
      </div>
    </div>
  );
}

function PreparationTimeReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Preparation Time
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Average time to prepare orders.
      </div>
    </div>
  );
}

function StationEfficiencyReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Station Efficiency
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Kitchen station performance metrics.
      </div>
    </div>
  );
}

function KitchenErrorsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Kitchen Errors
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Order mistakes and corrections.
      </div>
    </div>
  );
}

function KitchenRushHoursReport({ data }) {
  return <PeakHoursReport data={data} />;
}

function KitchenThroughputReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Kitchen Throughput
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Orders processed per hour.
      </div>
    </div>
  );
}

function OrderAccuracyReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Order Accuracy
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Order completion accuracy rate.
      </div>
    </div>
  );
}

function KitchenStaffReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

// Performance Reports
function OverallPerformanceReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Overall Performance
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SummaryCard label="Total Sales" value={`₹${data.totalSales?.toLocaleString()}`} icon="💰" />
        <SummaryCard label="Total Orders" value={data.totalOrders} icon="🛒" />
        <SummaryCard label="Avg Order" value={`₹${Math.round(data.avgOrderValue)}`} icon="📊" />
      </div>
    </div>
  );
}

function CategoryPerformanceReport({ data }) {
  return <SalesByCategoryReport data={data} />;
}

function ItemPerformanceReport({ data }) {
  return <SalesByItemReport data={data} />;
}

function TablePerformanceReport({ data }) {
  return <SalesByTableReport data={data} />;
}

function WaiterPerformanceReport({ data }) {
  return <StaffPerformanceReport data={data} />;
}

function HourlyPerformanceReport({ data }) {
  return <HourlySalesReport data={data} />;
}

function DailyPerformanceReport({ data }) {
  return <DailySalesReport data={data} />;
}

function WeeklyPerformanceReport({ data }) {
  return <WeeklySalesReport data={data} />;
}

// Trend Reports
function SeasonalTrendsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Seasonal Trends
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Sales patterns by season.
      </div>
    </div>
  );
}

function GrowthTrendsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Growth Trends
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Business growth over time.
      </div>
    </div>
  );
}

function SalesForecastReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Sales Forecast
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Predicted sales based on historical data.
      </div>
    </div>
  );
}

function InventoryForecastReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Inventory Forecast
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Predicted inventory needs.
      </div>
    </div>
  );
}

function CustomerTrendsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Customer Trends
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Customer behavior patterns.
      </div>
    </div>
  );
}

function StaffTrendsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Staff Trends
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Staff performance trends.
      </div>
    </div>
  );
}

function FinancialTrendsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Financial Trends
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Financial performance patterns.
      </div>
    </div>
  );
}

function YOYComparisonReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Year-over-Year Comparison
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Compare this year with previous year.
      </div>
    </div>
  );
}

function MOMComparisonReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Month-over-Month Comparison
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Compare this month with previous month.
      </div>
    </div>
  );
}

function TrendAnalysisReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Trend Analysis
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Comprehensive trend analysis.
      </div>
    </div>
  );
}

// Custom Reports
function CustomBuilderReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Custom Report Builder
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Build your own custom reports with filters.
      </div>
    </div>
  );
}

function SavedReportsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Saved Reports
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Your saved custom reports.
      </div>
    </div>
  );
}

function ScheduledReportsReport({ data }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Scheduled Reports
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Automated report schedules.
      </div>
    </div>
  );
}

// Helper function
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function GenericReport({ title, data, labelKey }) {
  return (
    <div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        {title}
      </div>
      {Object.entries(data).map(([key, stats]) => (
        <div key={key} style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{key}</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{stats.orders} orders</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{stats.revenue.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
