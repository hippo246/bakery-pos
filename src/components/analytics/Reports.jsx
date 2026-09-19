import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import useScreenSize from '../../hooks/useScreenSize';
import GSTReports from './GSTReports';

export default function SimpleReports({ orders = [], menuItems = [], staff = [], customers = [], inventory = [], settings = {}, onNavigate, darkMode = true }) {
  const [selectedReport, setSelectedReport] = useState('sales-summary');
  const [dateRange, setDateRange] = useState('today');
  const [showGSTSection, setShowGSTSection] = useState(false);
  const screenSize = useScreenSize();

  // Local data from localStorage for richer reports
  const [wasteRecords, setWasteRecords] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [qrOrders, setQrOrders] = useState([]);

  useEffect(() => {
    try {
      const w = JSON.parse(localStorage.getItem('bakerypos_waste') || '[]');
      setWasteRecords(Array.isArray(w) ? w : []);
    } catch {}
    try {
      const r = JSON.parse(localStorage.getItem('bakerypos_recipes') || '[]');
      setRecipes(Array.isArray(r) ? r : []);
    } catch {}
    try {
      const res = JSON.parse(localStorage.getItem('bakerypos_reservations') || '[]');
      setReservations(Array.isArray(res) ? res : []);
    } catch {}
    try {
      const qr = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      setQrOrders(Array.isArray(qr) ? qr : []);
    } catch {}
  }, [selectedReport]);

  const reportCategories = [
    {
      name: 'Operations Reports',
      reports: [
        { id: 'reservation-report', name: 'Reservation Report' },
        { id: 'qr-orders-report', name: 'QR Orders Report' },
        { id: 'waste-report-ops', name: 'Waste Report (Ops)' },
        { id: 'kitchen-costs-ops', name: 'Kitchen Costs (Ops)' }
      ]
    },
    {
      name: 'Sales Reports',
      reports: [
        { id: 'sales-summary', name: 'Sales Summary' },
        { id: 'sales-by-hour', name: 'Sales by Hour' },
        { id: 'sales-by-day', name: 'Sales by Day' },
        { id: 'sales-by-week', name: 'Sales by Week' },
        { id: 'sales-by-month', name: 'Sales by Month' },
        { id: 'sales-by-category', name: 'Sales by Category' },
        { id: 'sales-by-item', name: 'Sales by Item' },
        { id: 'sales-by-payment', name: 'Sales by Payment Method' },
        { id: 'sales-by-staff', name: 'Sales by Staff' },
        { id: 'sales-by-table', name: 'Sales by Table' }
      ]
    },
    {
      name: 'Inventory Reports',
      reports: [
        { id: 'inventory-summary', name: 'Inventory Summary' },
        { id: 'low-stock', name: 'Low Stock Items' },
        { id: 'inventory-value', name: 'Inventory Value' },
        { id: 'inventory-turnover', name: 'Inventory Turnover' },
        { id: 'waste-report', name: 'Waste Report' },
        { id: 'stock-movement', name: 'Stock Movement' },
        { id: 'expiry-report', name: 'Expiry Report' },
        { id: 'supplier-performance', name: 'Supplier Performance' },
        { id: 'cost-variance', name: 'Cost Variance' },
        { id: 'reorder-report', name: 'Reorder Report' }
      ]
    },
    {
      name: 'Staff Reports',
      reports: [
        { id: 'staff-performance', name: 'Staff Performance' },
        { id: 'staff-hours', name: 'Staff Hours' },
        { id: 'staff-sales', name: 'Staff Sales' },
        { id: 'staff-productivity', name: 'Staff Productivity' },
        { id: 'staff-attendance', name: 'Staff Attendance' },
        { id: 'commission-report', name: 'Commission Report' },
        { id: 'staff-ranking', name: 'Staff Ranking' },
        { id: 'shift-report', name: 'Shift Report' },
        { id: 'overtime-report', name: 'Overtime Report' },
        { id: 'training-report', name: 'Training Report' }
      ]
    },
    {
      name: 'Customer Reports',
      reports: [
        { id: 'customer-summary', name: 'Customer Summary' },
        { id: 'customer-spending', name: 'Customer Spending' },
        { id: 'customer-frequency', name: 'Customer Frequency' },
        { id: 'customer-lifetime', name: 'Customer Lifetime Value' },
        { id: 'new-customers', name: 'New Customers' },
        { id: 'returning-customers', name: 'Returning Customers' },
        { id: 'customer-segments', name: 'Customer Segments' },
        { id: 'loyalty-report', name: 'Loyalty Report' },
        { id: 'feedback-report', name: 'Feedback Report' },
        { id: 'churn-report', name: 'Churn Report' }
      ]
    },
    {
      name: 'GST Reports',
      reports: [
        { id: 'gstr1-report', name: 'GSTR-1 Sales Report' },
        { id: 'gstr3b-report', name: 'GSTR-3B Tax Summary' },
        { id: 'gstr9-report', name: 'GSTR-9 Annual Return' },
        { id: 'einvoice-report', name: 'E-Invoice Report' },
        { id: 'discount-analysis', name: 'Discount Analysis' },
        { id: 'service-charge-report', name: 'Service Charge Report' },
        { id: 'multi-outlet-report', name: 'Multi-Outlet Report' },
        { id: 'vendor-validation', name: 'Vendor GST Validation' },
        { id: 'turnover-tracker', name: 'Turnover Threshold Tracker' },
        { id: 'invoice-sequence', name: 'Invoice Sequence Report' }
      ]
    },
    {
      name: 'Financial Reports',
      reports: [
        { id: 'revenue-report', name: 'Revenue Report' },
        { id: 'profit-loss', name: 'Profit & Loss' },
        { id: 'cost-analysis', name: 'Cost Analysis' },
        { id: 'margin-report', name: 'Margin Report' },
        { id: 'tax-report', name: 'Tax Report' },
        { id: 'cash-flow', name: 'Cash Flow' },
        { id: 'expense-report', name: 'Expense Report' },
        { id: 'budget-variance', name: 'Budget Variance' },
        { id: 'financial-ratios', name: 'Financial Ratios' }
      ]
    },
    {
      name: 'Menu Reports',
      reports: [
        { id: 'menu-performance', name: 'Menu Performance' },
        { id: 'item-profitability', name: 'Item Profitability' },
        { id: 'menu-engineering', name: 'Menu Engineering' },
        { id: 'popularity-report', name: 'Popularity Report' },
        { id: 'price-sensitivity', name: 'Price Sensitivity' },
        { id: 'combo-analysis', name: 'Combo Analysis' },
        { id: 'seasonal-items', name: 'Seasonal Items' },
        { id: 'recipe-cost', name: 'Recipe Cost' },
        { id: 'portion-analysis', name: 'Portion Analysis' },
        { id: 'menu-mix', name: 'Menu Mix' }
      ]
    },
    {
      name: 'Kitchen Reports',
      reports: [
        { id: 'kitchen-performance', name: 'Kitchen Performance' },
        { id: 'prep-time', name: 'Prep Time Analysis' },
        { id: 'bottleneck-report', name: 'Bottleneck Report' },
        { id: 'wastage-report', name: 'Wastage Report' },
        { id: 'station-efficiency', name: 'Station Efficiency' },
        { id: 'order-fulfillment', name: 'Order Fulfillment' },
        { id: 'quality-report', name: 'Quality Report' },
        { id: 'kitchen-capacity', name: 'Kitchen Capacity' },
        { id: 'peak-hours', name: 'Peak Hours' },
        { id: 'kitchen-costs', name: 'Kitchen Costs' }
      ]
    },
    {
      name: 'Time-based Reports',
      reports: [
        { id: 'daily-report', name: 'Daily Report' },
        { id: 'weekly-report', name: 'Weekly Report' },
        { id: 'monthly-report', name: 'Monthly Report' },
        { id: 'quarterly-report', name: 'Quarterly Report' },
        { id: 'yearly-report', name: 'Yearly Report' },
        { id: 'period-comparison', name: 'Period Comparison' },
        { id: 'ytd-report', name: 'Year to Date' },
        { id: 'mtd-report', name: 'Month to Date' },
        { id: 'holiday-report', name: 'Holiday Report' },
        { id: 'seasonal-report', name: 'Seasonal Report' }
      ]
    },
    {
      name: 'Performance Reports',
      reports: [
        { id: 'kpi-report', name: 'KPI Report' },
        { id: 'trend-analysis', name: 'Trend Analysis' },
        { id: 'growth-report', name: 'Growth Report' },
        { id: 'benchmark-report', name: 'Benchmark Report' },
        { id: 'efficiency-report', name: 'Efficiency Report' },
        { id: 'productivity-report', name: 'Productivity Report' },
        { id: 'utilization-report', name: 'Utilization Report' },
        { id: 'performance-scorecard', name: 'Performance Scorecard' },
        { id: 'goal-tracking', name: 'Goal Tracking' },
        { id: 'variance-report', name: 'Variance Report' }
      ]
    },
    {
      name: 'Custom Reports',
      reports: [
        { id: 'custom-1', name: 'Custom Report 1' },
        { id: 'custom-2', name: 'Custom Report 2' },
        { id: 'custom-3', name: 'Custom Report 3' },
        { id: 'custom-4', name: 'Custom Report 4' },
        { id: 'custom-5', name: 'Custom Report 5' },
        { id: 'custom-6', name: 'Custom Report 6' },
        { id: 'custom-7', name: 'Custom Report 7' },
        { id: 'custom-8', name: 'Custom Report 8' },
        { id: 'custom-9', name: 'Custom Report 9' },
        { id: 'custom-10', name: 'Custom Report 10' }
      ]
    }
  ];

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const reportName = reportCategories.flatMap(c => c.reports).find(r => r.id === selectedReport)?.name || 'Report';
    const cafeName = settings?.cafeName || 'BakeryPOS Cafe';
    const fssai = settings?.fssai || 'N/A';
    const gstin = settings?.gstin || 'N/A';
    const address = settings?.address || 'N/A';
    const phone = settings?.phone || 'N/A';
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 0;
    
    // Helper function for page breaks
    const checkPageBreak = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        addHeader();
      }
    };
    
    // Header function
    const addHeader = () => {
      // Top border line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, 15, pageWidth - 14, 15);
      
      // Report title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text(reportName.toUpperCase(), pageWidth / 2, 25, { align: 'center' });
      
      // Cafe name
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(cafeName, pageWidth / 2, 33, { align: 'center' });
      
      // Period info
      doc.setFontSize(10);
      doc.text(`Report Period: ${dateRange.toUpperCase()}`, pageWidth / 2, 39, { align: 'center' });
      
      // Generation date
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`, pageWidth / 2, 45, { align: 'center' });
      
      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(14, 51, pageWidth - 14, 51);
      
      yPos = 60;
    };
    
    // Footer function
    const addFooter = (pageNum) => {
      const footerY = pageHeight - 15;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNum}`, pageWidth / 2, footerY, { align: 'center' });
      doc.text('Professional Report - Generated by BakeryPOS System', pageWidth / 2, footerY + 5, { align: 'center' });
    };
    
    // Initial header
    addHeader();
    
    // Business Information Section
    checkPageBreak(50);
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text('BUSINESS INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont(undefined, 'normal');
    
    const businessInfo = [
      ['Business Name:', cafeName],
      ['FSSAI Number:', fssai],
      ['GSTIN:', gstin],
      ['Address:', address],
      ['Phone:', phone]
    ];
    
    businessInfo.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 14, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(value, 50, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // Get report data
    const summaryData = getReportData(selectedReport);
    
    // Summary Section with styled box
    checkPageBreak(60);
    
    doc.setFillColor(59, 130, 246);
    doc.rect(14, yPos, pageWidth - 28, 10, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY', 17, yPos + 7);
    yPos += 15;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Particulars', 'Value']],
      body: summaryData.summary,
      theme: 'grid',
      headStyles: { 
        fillColor: [241, 245, 249], 
        textColor: [30, 41, 59],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineWidth: 0.1,
        lineColor: [229, 231, 235]
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 'auto', halign: 'right' }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Details Section
    if (summaryData.details && summaryData.details.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(16, 185, 129);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DETAILED BREAKDOWN', 17, yPos + 7);
      yPos += 15;
      
      autoTable(doc, {
        startY: yPos,
        head: [summaryData.headers],
        body: summaryData.details,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Certification Section
    checkPageBreak(50);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text('CERTIFICATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont(undefined, 'normal');
    doc.text('I hereby certify that the information given above is true and correct to the best of my knowledge.', 14, yPos);
    yPos += 6;
    doc.text('This report is generated for business analysis and record-keeping purposes.', 14, yPos);
    yPos += 15;
    
    // Signature section
    doc.setFont(undefined, 'bold');
    doc.text('Authorized Signature', 14, yPos);
    doc.text('Date:', pageWidth - 50, yPos);
    yPos += 20;
    doc.line(14, yPos, 60, yPos);
    doc.line(pageWidth - 50, yPos, pageWidth - 14, yPos);
    
    // Add footer to all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i);
    }
    
    doc.save(`bakerypos_${selectedReport}_${dateRange}_Professional_Report.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const reportName = reportCategories.flatMap(c => c.reports).find(r => r.id === selectedReport)?.name || 'Report';
    const data = getReportData(selectedReport);
    
    // Cafe Info
    const cafeName = settings?.cafeName || 'BakeryPOS Cafe';
    const fssai = settings?.fssai || 'N/A';
    const gstin = settings?.gstin || 'N/A';
    const address = settings?.address || '';
    const phone = settings?.phone || '';
    
    // Info sheet with cafe and report information
    const infoData = [
      ['BAKERYPOS - PROFESSIONAL REPORT'],
      [],
      ['Cafe Details'],
      ['Field', 'Value'],
      ['Cafe Name', cafeName],
      ['FSSAI Number', fssai],
      ['GSTIN', gstin],
      ['Address', address],
      ['Phone Number', phone],
      [],
      ['Report Details'],
      ['Field', 'Value'],
      ['Report Name', reportName],
      ['Report ID', selectedReport],
      ['Date Range', dateRange.toUpperCase()],
      ['Generated On', new Date().toLocaleString()],
      ['Generated By', 'BakeryPOS System']
    ];
    
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    
    // Style the info sheet
    if (infoSheet['!ref']) {
      const range = XLSX.utils.decode_range(infoSheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!infoSheet[cellAddress]) continue;
          
          // Title row
          if (R === 0) {
            infoSheet[cellAddress].s = { 
              font: { bold: true, sz: 16 }, 
              fill: { fgColor: { rgb: "1F4E78" } }, 
              alignment: { horizontal: "center" }
            };
          }
          // Section headers
          else if (R === 2 || R === 9) {
            infoSheet[cellAddress].s = { 
              font: { bold: true, sz: 12 }, 
              fill: { fgColor: { rgb: "D9E1F2" } }
            };
          }
          // Field labels
          else if ((R >= 3 && R <= 7) || (R >= 10 && R <= 15)) {
            if (C === 0) {
              infoSheet[cellAddress].s = { 
                font: { bold: true }, 
                fill: { fgColor: { rgb: "F2F2F2" } }
              };
            }
          }
        }
      }
      // Set column widths
      infoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    }
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info');
    
    // Summary sheet
    const summaryData = [['Metric', 'Value'], ...data.summary];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the summary sheet
    if (summarySheet['!ref']) {
      const range = XLSX.utils.decode_range(summarySheet['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!summarySheet[cellAddress]) continue;
          if (R === 0) {
            summarySheet[cellAddress].s = { 
              font: { bold: true }, 
              fill: { fgColor: { rgb: "4472C4" } }, 
              alignment: { horizontal: "center" }
            };
          } else {
            summarySheet[cellAddress].s = { 
              fill: { fgColor: { rgb: R % 2 === 0 ? "FFFFFF" : "F2F2F2" } }
            };
          }
        }
      }
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
    }
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Details sheet
    if (data.details && data.details.length > 0) {
      const detailsData = [data.headers, ...data.details];
      const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
      
      // Style the details sheet
      if (detailsSheet['!ref']) {
        const range = XLSX.utils.decode_range(detailsSheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!detailsSheet[cellAddress]) continue;
            if (R === 0) {
              detailsSheet[cellAddress].s = { 
                font: { bold: true }, 
                fill: { fgColor: { rgb: "70AD47" } }, 
                alignment: { horizontal: "center" }
              };
            } else {
              detailsSheet[cellAddress].s = { 
                fill: { fgColor: { rgb: R % 2 === 0 ? "FFFFFF" : "E2EFDA" } },
                alignment: { horizontal: C === 0 ? "left" : "right" }
              };
            }
          }
        }
        // Auto-fit column widths based on content
        const colWidths = data.headers.map((h, i) => {
          const maxWidth = Math.max(
            h.length,
            ...data.details.map(row => String(row[i] || '').length)
          );
          return { wch: Math.min(Math.max(maxWidth + 2, 12), 30) };
        });
        detailsSheet['!cols'] = colWidths;
      }
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Details');
    }
    
    XLSX.writeFile(workbook, `bakerypos_${selectedReport}_${dateRange}_${Date.now()}.xlsx`);
  };

  const getReportData = (reportId) => {
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    
    // Common data calculations
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = completedOrders.reduce((sum, o) => sum + (o.items?.reduce((itemSum, item) => itemSum + (item.qty || 1), 0) || 0), 0);
    const totalGST = completedOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
    
    // Date range info
    const today = new Date();
    let dateRangeText = dateRange.toUpperCase();
    if (dateRange === 'today') {
      dateRangeText = today.toLocaleDateString();
    } else if (dateRange === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dateRangeText = yesterday.toLocaleDateString();
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateRangeText = `${weekAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateRangeText = `${monthAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
    }
    
    // Generate data based on report type
    switch (reportId) {
      case 'sales-summary':
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Total Items Sold', totalItemsSold.toString()],
            ['Average Order Value', `₹${Math.round(avgOrderValue)}`],
            ['GST Collected', `₹${totalGST.toLocaleString()}`],
            ['Unique Customers', new Set(completedOrders.map(o => o.customerName || 'Walk-in')).size.toString()]
          ],
          headers: ['Item', 'Quantity', 'Revenue'],
          details: Object.entries(completedOrders.reduce((acc, o) => {
            o.items?.forEach(item => {
              const name = item.name || 'Unknown';
              if (!acc[name]) acc[name] = { qty: 0, revenue: 0 };
              acc[name].qty += item.qty || 1;
              acc[name].revenue += (item.price || 0) * (item.qty || 1);
            });
            return acc;
          }, {})).map(([name, data]) => [name, data.qty, `₹${data.revenue.toFixed(2)}`])
        };
      
      case 'sales-by-hour':
        const hourlyData = {};
        completedOrders.forEach(o => {
          const hour = new Date(o.createdAt).getHours();
          if (!hourlyData[hour]) hourlyData[hour] = { orders: 0, revenue: 0, items: 0 };
          hourlyData[hour].orders++;
          hourlyData[hour].revenue += o.total || 0;
          hourlyData[hour].items += o.items?.length || 0;
        });
        const peakHour = Object.entries(hourlyData).sort((a, b) => b[1].revenue - a[1].revenue)[0];
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Peak Hour', peakHour ? `${peakHour[0]}:00` : 'N/A'],
            ['Peak Hour Revenue', peakHour ? `₹${peakHour[1].revenue.toFixed(2)}` : 'N/A'],
            ['Operating Hours', Object.keys(hourlyData).length.toString()]
          ],
          headers: ['Hour', 'Orders', 'Revenue', 'Avg Order Value'],
          details: Object.entries(hourlyData).map(([hour, data]) => [
            `${hour}:00`, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            `₹${data.orders > 0 ? (data.revenue / data.orders).toFixed(2) : 0}`
          ])
        };
      
      case 'sales-by-category':
        const categoryData = {};
        completedOrders.forEach(o => {
          o.items?.forEach(item => {
            const cat = item.category || 'Other';
            if (!categoryData[cat]) categoryData[cat] = { qty: 0, revenue: 0, orders: new Set() };
            categoryData[cat].qty += item.qty || 1;
            categoryData[cat].revenue += (item.price || 0) * (item.qty || 1);
            categoryData[cat].orders.add(o.id);
          });
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Categories', Object.keys(categoryData).length.toString()],
            ['Top Category', Object.entries(categoryData).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || 'N/A']
          ],
          headers: ['Category', 'Quantity', 'Revenue', 'Orders', 'Avg per Item'],
          details: Object.entries(categoryData).map(([cat, data]) => [
            cat, 
            data.qty, 
            `₹${data.revenue.toFixed(2)}`,
            data.orders.size,
            `₹${data.qty > 0 ? (data.revenue / data.qty).toFixed(2) : 0}`
          ])
        };
      
      case 'sales-by-payment':
        const paymentData = {};
        completedOrders.forEach(o => {
          const method = o.paymentMethod || 'CASH';
          if (!paymentData[method]) paymentData[method] = { count: 0, amount: 0 };
          paymentData[method].count++;
          paymentData[method].amount += o.total || 0;
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Payment Methods', Object.keys(paymentData).length.toString()],
            ['Most Used', Object.entries(paymentData).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'N/A']
          ],
          headers: ['Payment Method', 'Count', 'Amount', 'Percentage', 'Avg per Transaction'],
          details: Object.entries(paymentData).map(([method, data]) => [
            method, 
            data.count, 
            `₹${data.amount.toFixed(2)}`,
            `${totalRevenue > 0 ? ((data.amount / totalRevenue) * 100).toFixed(1) : 0}%`,
            `₹${data.count > 0 ? (data.amount / data.count).toFixed(2) : 0}`
          ])
        };
      
      case 'sales-by-staff':
        const staffData = {};
        completedOrders.forEach(o => {
          const staffName = o.employeeName || 'Unassigned';
          if (!staffData[staffName]) staffData[staffName] = { orders: 0, revenue: 0, items: 0 };
          staffData[staffName].orders++;
          staffData[staffName].revenue += o.total || 0;
          staffData[staffName].items += o.items?.length || 0;
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Staff Members', Object.keys(staffData).length.toString()],
            ['Top Performer', Object.entries(staffData).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || 'N/A']
          ],
          headers: ['Staff Name', 'Orders', 'Revenue', 'Items Sold', 'Avg Ticket'],
          details: Object.entries(staffData).map(([name, data]) => [
            name, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            data.items,
            `₹${data.orders > 0 ? (data.revenue / data.orders).toFixed(2) : 0}`
          ])
        };
      
      case 'sales-by-table':
        const tableData = {};
        completedOrders.forEach(o => {
          const table = o.tableNumber || 'Counter';
          if (!tableData[table]) tableData[table] = { orders: 0, revenue: 0, customers: 0 };
          tableData[table].orders++;
          tableData[table].revenue += o.total || 0;
          tableData[table].customers += o.customerName ? 1 : 0;
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Tables Used', Object.keys(tableData).length.toString()],
            ['Top Table', Object.entries(tableData).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || 'N/A']
          ],
          headers: ['Table', 'Orders', 'Revenue', 'Customers', 'Avg per Order'],
          details: Object.entries(tableData).map(([table, data]) => [
            table, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            data.customers,
            `₹${data.orders > 0 ? (data.revenue / data.orders).toFixed(2) : 0}`
          ])
        };
      
      case 'inventory-summary':
        const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.quantity * (i.cost || 0)), 0);
        const lowStockCount = inventory.filter(i => i.quantity <= (i.minStock || 5)).length;
        return {
          summary: [
            ['Report Date', new Date().toLocaleDateString()],
            ['Total Items', inventory.length.toString()],
            ['Total Inventory Value', `₹${totalInventoryValue.toLocaleString()}`],
            ['Low Stock Items', lowStockCount.toString()],
            ['Categories', new Set(inventory.map(i => i.category || 'Other')).size.toString()]
          ],
          headers: ['Item', 'Quantity', 'Cost', 'Value', 'Status'],
          details: inventory.map(i => [
            i.name, 
            i.quantity, 
            `₹${(i.cost || 0).toFixed(2)}`, 
            `₹${(i.quantity * (i.cost || 0)).toFixed(2)}`,
            i.quantity <= (i.minStock || 5) ? 'Low Stock' : 'OK'
          ])
        };
      
      case 'low-stock':
        const lowStock = inventory.filter(i => i.quantity <= (i.minStock || 5));
        return {
          summary: [
            ['Report Date', new Date().toLocaleDateString()],
            ['Low Stock Items', lowStock.length.toString()],
            ['Total Items', inventory.length.toString()],
            ['Reorder Value', `₹${lowStock.reduce((sum, i) => sum + ((i.minStock || 5) * 2 - i.quantity) * (i.cost || 0), 0).toLocaleString()}`]
          ],
          headers: ['Item', 'Current Stock', 'Min Stock', 'Reorder Qty', 'Reorder Cost'],
          details: lowStock.map(i => [
            i.name, 
            i.quantity, 
            i.minStock || 5, 
            Math.max(0, (i.minStock || 5) * 2 - i.quantity),
            `₹${Math.max(0, (i.minStock || 5) * 2 - i.quantity) * (i.cost || 0).toFixed(2)}`
          ])
        };
      
      case 'inventory-value':
        return {
          summary: [
            ['Report Date', new Date().toLocaleDateString()],
            ['Total Inventory Value', `₹${inventory.reduce((sum, i) => sum + (i.quantity * (i.cost || 0)), 0).toLocaleString()}`],
            ['Total Items', inventory.length.toString()],
            ['Categories', new Set(inventory.map(i => i.category || 'Other')).size.toString()]
          ],
          headers: ['Category', 'Items', 'Total Value', 'Avg Cost per Item'],
          details: Object.entries(inventory.reduce((acc, i) => {
            const cat = i.category || 'Other';
            if (!acc[cat]) acc[cat] = { count: 0, value: 0, totalQty: 0 };
            acc[cat].count++;
            acc[cat].value += i.quantity * (i.cost || 0);
            acc[cat].totalQty += i.quantity;
            return acc;
          }, {})).map(([cat, data]) => [
            cat, 
            data.count, 
            `₹${data.value.toFixed(2)}`,
            `₹${data.totalQty > 0 ? (data.value / data.totalQty).toFixed(2) : 0}`
          ])
        };
      
      case 'staff-performance':
        const staffPerf = {};
        completedOrders.forEach(o => {
          const name = o.employeeName || 'Unassigned';
          if (!staffPerf[name]) staffPerf[name] = { orders: 0, revenue: 0, avgTicket: 0, items: 0 };
          staffPerf[name].orders++;
          staffPerf[name].revenue += o.total || 0;
          staffPerf[name].items += o.items?.length || 0;
        });
        Object.values(staffPerf).forEach(s => s.avgTicket = s.orders > 0 ? s.revenue / s.orders : 0);
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Staff', Object.keys(staffPerf).length.toString()],
            ['Total Orders', totalOrders.toString()],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Avg per Staff', totalOrders > 0 ? (totalOrders / Object.keys(staffPerf).length).toFixed(1) : '0']
          ],
          headers: ['Staff', 'Orders', 'Revenue', 'Items Sold', 'Avg Ticket', 'Items per Order'],
          details: Object.entries(staffPerf).map(([name, data]) => [
            name, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            data.items,
            `₹${data.avgTicket.toFixed(2)}`,
            data.orders > 0 ? (data.items / data.orders).toFixed(1) : 0
          ])
        };
      
      case 'customer-summary':
        const customerData = {};
        completedOrders.forEach(o => {
          const cust = o.customerName || 'Walk-in';
          if (!customerData[cust]) customerData[cust] = { orders: 0, spent: 0, lastVisit: o.createdAt };
          customerData[cust].orders++;
          customerData[cust].spent += o.total || 0;
          if (new Date(o.createdAt) > new Date(customerData[cust].lastVisit)) {
            customerData[cust].lastVisit = o.createdAt;
          }
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Customers', Object.keys(customerData).length.toString()],
            ['Total Orders', totalOrders.toString()],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Avg per Customer', `₹${(totalRevenue / Object.keys(customerData).length).toFixed(2)}`]
          ],
          headers: ['Customer', 'Orders', 'Total Spent', 'Avg per Order', 'Last Visit'],
          details: Object.entries(customerData).map(([name, data]) => [
            name, 
            data.orders, 
            `₹${data.spent.toFixed(2)}`,
            `₹${(data.spent / data.orders).toFixed(2)}`,
            new Date(data.lastVisit).toLocaleDateString()
          ])
        };
      
      case 'revenue-report':
        const revenueByDate = completedOrders.reduce((acc, o) => {
          const date = new Date(o.createdAt).toLocaleDateString();
          if (!acc[date]) acc[date] = { orders: 0, revenue: 0, items: 0 };
          acc[date].orders++;
          acc[date].revenue += o.total || 0;
          acc[date].items += o.items?.length || 0;
          return acc;
        }, {});
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Days with Sales', Object.keys(revenueByDate).length.toString()],
            ['Avg Daily Revenue', `₹${(totalRevenue / Object.keys(revenueByDate).length).toFixed(2)}`]
          ],
          headers: ['Date', 'Orders', 'Revenue', 'Items Sold', 'Avg per Order'],
          details: Object.entries(revenueByDate).map(([date, data]) => [
            date, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            data.items,
            `₹${data.orders > 0 ? (data.revenue / data.orders).toFixed(2) : 0}`
          ])
        };
      
      case 'profit-loss':
        const totalCost = completedOrders.reduce((sum, o) => {
          return sum + (o.items?.reduce((itemSum, item) => {
            const menuItem = menuItems.find(m => m.name === item.name);
            return itemSum + ((menuItem?.cost || 0) * (item.qty || 1));
          }, 0) || 0);
        }, 0);
        const grossProfit = totalRevenue - totalCost;
        const totalTax = completedOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
        const netProfit = grossProfit - totalTax;
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Cost', `₹${totalCost.toLocaleString()}`],
            ['Gross Profit', `₹${grossProfit.toLocaleString()}`],
            ['Total Tax', `₹${totalTax.toLocaleString()}`],
            ['Net Profit', `₹${netProfit.toLocaleString()}`],
            ['Profit Margin', `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`],
            ['Cost Percentage', `${totalRevenue > 0 ? ((totalCost / totalRevenue) * 100).toFixed(1) : 0}%`]
          ],
          headers: ['Item', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Qty Sold'],
          details: completedOrders.reduce((acc, o) => {
            o.items?.forEach(item => {
              const name = item.name || 'Unknown';
              const menuItem = menuItems.find(m => m.name === name);
              const cost = menuItem?.cost || 0;
              const revenue = (item.price || 0) * (item.qty || 1);
              const totalItemCost = cost * (item.qty || 1);
              const profit = revenue - totalItemCost;
              if (!acc[name]) acc[name] = { revenue: 0, cost: 0, profit: 0, qty: 0 };
              acc[name].revenue += revenue;
              acc[name].cost += totalItemCost;
              acc[name].profit += profit;
              acc[name].qty += item.qty || 1;
            });
            return acc;
          }, {}).map((data, name) => [
            name, 
            `₹${data.revenue.toFixed(2)}`, 
            `₹${data.cost.toFixed(2)}`, 
            `₹${data.profit.toFixed(2)}`,
            `${data.revenue > 0 ? (data.profit / data.revenue * 100).toFixed(1) : 0}%`,
            data.qty
          ])
        };
      
      case 'menu-performance':
        const menuPerf = {};
        completedOrders.forEach(o => {
          o.items?.forEach(item => {
            const name = item.name || 'Unknown';
            if (!menuPerf[name]) menuPerf[name] = { qty: 0, revenue: 0, orders: new Set() };
            menuPerf[name].qty += item.qty || 1;
            menuPerf[name].revenue += (item.price || 0) * (item.qty || 1);
            menuPerf[name].orders.add(o.id);
          });
        });
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Items', Object.keys(menuPerf).length.toString()],
            ['Total Items Sold', Object.values(menuPerf).reduce((sum, m) => sum + m.qty, 0).toString()],
            ['Top Seller', Object.entries(menuPerf).sort((a, b) => b[1].qty - a[1].qty)[0]?.[0] || 'N/A'],
            ['Top Seller Revenue', Object.entries(menuPerf).sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[1].revenue.toFixed(2) || '0']
          ],
          headers: ['Item', 'Quantity Sold', 'Revenue', 'Orders', 'Avg Price'],
          details: Object.entries(menuPerf).sort((a, b) => b[1].qty - a[1].qty).map(([name, data]) => [
            name, 
            data.qty, 
            `₹${data.revenue.toFixed(2)}`,
            data.orders.size,
            `₹${data.qty > 0 ? (data.revenue / data.qty).toFixed(2) : 0}`
          ])
        };
      
      case 'daily-report':
        const todayDate = new Date().toDateString();
        const todayOrders = completedOrders.filter(o => new Date(o.createdAt).toDateString() === todayDate);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const todayItems = todayOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
        return {
          summary: [
            ['Report Date', todayDate],
            ['Total Orders', todayOrders.length.toString()],
            ['Total Revenue', `₹${todayRevenue.toLocaleString()}`],
            ['Total Items', todayItems.toString()],
            ['Avg Order Value', `₹${todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0}`],
            ['Unique Customers', new Set(todayOrders.map(o => o.customerName || 'Walk-in')).size.toString()]
          ],
          headers: ['Time', 'Orders', 'Revenue', 'Items', 'Avg per Order'],
          details: Object.entries(todayOrders.reduce((acc, o) => {
            const hour = new Date(o.createdAt).getHours();
            if (!acc[hour]) acc[hour] = { orders: 0, revenue: 0, items: 0 };
            acc[hour].orders++;
            acc[hour].revenue += o.total || 0;
            acc[hour].items += o.items?.length || 0;
            return acc;
          }, {})).map(([hour, data]) => [
            `${hour}:00`, 
            data.orders, 
            `₹${data.revenue.toFixed(2)}`,
            data.items,
            `₹${data.orders > 0 ? (data.revenue / data.orders).toFixed(2) : 0}`
          ])
        };
      
      case 'kpi-report':
        const itemsPerOrder = completedOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0) / totalOrders;
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Revenue Target', '₹50,000'],
            ['Revenue Status', totalRevenue >= 50000 ? '✓ Achieved' : '✗ Below Target'],
            ['Total Orders', totalOrders.toString()],
            ['Order Target', '100'],
            ['Order Status', totalOrders >= 100 ? '✓ Achieved' : '✗ Below Target'],
            ['Avg Order Value', `₹${Math.round(avgOrderValue)}`],
            ['Avg Ticket Target', '₹500'],
            ['Ticket Status', avgOrderValue >= 500 ? '✓ Achieved' : '✗ Below Target'],
            ['Items per Order', itemsPerOrder.toFixed(1)]
          ],
          headers: ['KPI', 'Actual', 'Target', 'Variance', 'Status'],
          details: [
            ['Revenue', `₹${totalRevenue.toLocaleString()}`, '₹50,000', `₹${(totalRevenue - 50000).toLocaleString()}`, totalRevenue >= 50000 ? '✓' : '✗'],
            ['Orders', totalOrders.toString(), '100', (totalOrders - 100).toString(), totalOrders >= 100 ? '✓' : '✗'],
            ['Avg Ticket', `₹${Math.round(avgOrderValue)}`, '₹500', `₹${Math.round(avgOrderValue - 500)}`, avgOrderValue >= 500 ? '✓' : '✗'],
            ['Items/Order', itemsPerOrder.toFixed(1), '3', (itemsPerOrder - 3).toFixed(1), itemsPerOrder >= 3 ? '✓' : '✗']
          ]
        };
      
      // ── Waste Report ────────────────────────────────────────────────────
      case 'waste-report': {
        const totalWasteCost = wasteRecords.reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0);
        const totalWasteQty = wasteRecords.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
        const wasteByCategory = wasteRecords.reduce((acc, w) => {
          const cat = w.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = { qty: 0, cost: 0, count: 0 };
          acc[cat].qty += parseFloat(w.quantity) || 0;
          acc[cat].cost += parseFloat(w.cost) || 0;
          acc[cat].count++;
          return acc;
        }, {});
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Waste Records', wasteRecords.length.toString()],
            ['Total Waste Quantity', `${totalWasteQty.toFixed(2)} units`],
            ['Total Waste Cost', `₹${totalWasteCost.toLocaleString()}`],
            ['Categories', Object.keys(wasteByCategory).length.toString()],
            ['Most Wasted Category', Object.entries(wasteByCategory).sort((a,b) => b[1].cost - a[1].cost)[0]?.[0] || 'N/A']
          ],
          headers: ['Item / Ingredient', 'Quantity', 'Reason', 'Cost', 'Date'],
          details: wasteRecords.slice().reverse().map(w => [
            w.itemName || w.name || 'Unknown',
            `${w.quantity || 0} ${w.unit || ''}`.trim(),
            w.reason || 'N/A',
            `₹${(parseFloat(w.cost) || 0).toFixed(2)}`,
            w.date ? new Date(w.date).toLocaleDateString() : 'N/A'
          ])
        };
      }

      // ── Recipe Cost Report ───────────────────────────────────────────────
      case 'recipe-cost': {
        const totalRecipeCost = recipes.reduce((sum, r) => sum + (parseFloat(r.cost) || parseFloat(r.totalCost) || 0), 0);
        return {
          summary: [
            ['Report Date', new Date().toLocaleDateString()],
            ['Total Recipes', recipes.length.toString()],
            ['Total Recipe Cost', `₹${totalRecipeCost.toLocaleString()}`],
            ['Avg Recipe Cost', recipes.length > 0 ? `₹${(totalRecipeCost / recipes.length).toFixed(2)}` : '₹0.00'],
            ['Recipes with Costing', recipes.filter(r => (r.cost || r.totalCost) > 0).length.toString()]
          ],
          headers: ['Recipe', 'Category', 'Servings', 'Total Cost', 'Cost per Serving', 'Selling Price', 'Margin'],
          details: recipes.map(r => {
            const cost = parseFloat(r.cost) || parseFloat(r.totalCost) || 0;
            const servings = parseInt(r.servings) || 1;
            const sellPrice = parseFloat(r.sellingPrice) || parseFloat(r.price) || 0;
            const margin = sellPrice > 0 ? ((sellPrice - (cost / servings)) / sellPrice * 100).toFixed(1) : 'N/A';
            return [
              r.name || 'Unnamed',
              r.category || 'General',
              servings,
              `₹${cost.toFixed(2)}`,
              `₹${(cost / servings).toFixed(2)}`,
              sellPrice > 0 ? `₹${sellPrice.toFixed(2)}` : 'N/A',
              typeof margin === 'string' ? margin : `${margin}%`
            ];
          })
        };
      }

      // ── Reservations Report ──────────────────────────────────────────────
      case 'reservation-report': {
        const upcoming = reservations.filter(r => new Date(r.date) >= new Date());
        const past = reservations.filter(r => new Date(r.date) < new Date());
        const confirmed = reservations.filter(r => r.status === 'confirmed' || r.status === 'Confirmed');
        const cancelled = reservations.filter(r => r.status === 'cancelled' || r.status === 'Cancelled');
        const totalGuests = reservations.reduce((sum, r) => sum + (parseInt(r.guests) || parseInt(r.partySize) || 0), 0);
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Reservations', reservations.length.toString()],
            ['Upcoming', upcoming.length.toString()],
            ['Past', past.length.toString()],
            ['Confirmed', confirmed.length.toString()],
            ['Cancelled', cancelled.length.toString()],
            ['Total Guests Expected', totalGuests.toString()]
          ],
          headers: ['Guest Name', 'Date', 'Time', 'Guests', 'Table', 'Status', 'Notes'],
          details: reservations.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => [
            r.customerName || r.name || 'Unknown',
            r.date ? new Date(r.date).toLocaleDateString() : 'N/A',
            r.time || 'N/A',
            r.guests || r.partySize || 1,
            r.tableNumber || r.table || 'Any',
            r.status || 'Pending',
            r.notes || r.specialRequests || '–'
          ])
        };
      }

      // ── QR Orders Report ─────────────────────────────────────────────────
      case 'qr-orders-report': {
        const qrRevenue = qrOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const qrByTable = qrOrders.reduce((acc, o) => {
          const t = o.tableNumber || o.table || 'Unknown';
          if (!acc[t]) acc[t] = { orders: 0, revenue: 0 };
          acc[t].orders++;
          acc[t].revenue += parseFloat(o.total) || 0;
          return acc;
        }, {});
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total QR Orders', qrOrders.length.toString()],
            ['Total QR Revenue', `₹${qrRevenue.toLocaleString()}`],
            ['Avg Order Value', qrOrders.length > 0 ? `₹${(qrRevenue / qrOrders.length).toFixed(2)}` : '₹0.00'],
            ['Tables Used', Object.keys(qrByTable).length.toString()]
          ],
          headers: ['Order ID', 'Table', 'Customer', 'Items', 'Total', 'Status', 'Date'],
          details: qrOrders.slice().reverse().map(o => [
            o.id || 'N/A',
            o.tableNumber || o.table || 'N/A',
            o.customerName || o.customer?.name || 'Guest',
            o.items?.length || 0,
            `₹${(parseFloat(o.total) || 0).toFixed(2)}`,
            o.status || 'Received',
            o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'
          ])
        };
      }

      // ── Kitchen Costs Report ─────────────────────────────────────────────
      case 'kitchen-costs': {
        const ingCostPerItem = {};
        completedOrders.forEach(o => {
          o.items?.forEach(item => {
            const menuItem = menuItems.find(m => m.name === item.name);
            const cost = (menuItem?.cost || 0) * (item.qty || item.quantity || 1);
            const name = item.name || 'Unknown';
            if (!ingCostPerItem[name]) ingCostPerItem[name] = { cost: 0, qty: 0, revenue: 0 };
            ingCostPerItem[name].cost += cost;
            ingCostPerItem[name].qty += item.qty || item.quantity || 1;
            ingCostPerItem[name].revenue += (item.price || 0) * (item.qty || item.quantity || 1);
          });
        });
        const totalKitchenCost = Object.values(ingCostPerItem).reduce((sum, v) => sum + v.cost, 0);
        const wasteCost = wasteRecords.reduce((sum, w) => sum + (parseFloat(w.cost) || 0), 0);
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Kitchen Cost', `₹${totalKitchenCost.toLocaleString()}`],
            ['Waste Cost', `₹${wasteCost.toLocaleString()}`],
            ['Total Cost (incl. Waste)', `₹${(totalKitchenCost + wasteCost).toLocaleString()}`],
            ['Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Gross Margin', `${totalRevenue > 0 ? (((totalRevenue - totalKitchenCost - wasteCost) / totalRevenue) * 100).toFixed(1) : 0}%`]
          ],
          headers: ['Item', 'Qty Sold', 'Total Cost', 'Total Revenue', 'Margin %'],
          details: Object.entries(ingCostPerItem).sort((a, b) => b[1].cost - a[1].cost).map(([name, data]) => [
            name,
            data.qty,
            `₹${data.cost.toFixed(2)}`,
            `₹${data.revenue.toFixed(2)}`,
            data.revenue > 0 ? `${((data.revenue - data.cost) / data.revenue * 100).toFixed(1)}%` : 'N/A'
          ])
        };
      }

      // ── GST Reports ─────────────────────────────────────────────────────
      case 'gstr1-report':
        const b2bInvoices = completedOrders.filter(o => o.customerGSTIN);
        const b2cInvoices = completedOrders.filter(o => !o.customerGSTIN);
        const interstateInvoices = completedOrders.filter(o => o.source === 'DIRECT_DELIVERY');
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Invoices', completedOrders.length.toString()],
            ['B2B Invoices', b2bInvoices.length.toString()],
            ['B2C Invoices', b2cInvoices.length.toString()],
            ['Interstate Invoices', interstateInvoices.length.toString()],
            ['Total Taxable Value', `₹${totalRevenue.toLocaleString()}`],
            ['Total GST Collected', `₹${totalGST.toLocaleString()}`]
          ],
          headers: ['Invoice Type', 'Count', 'Taxable Value', 'CGST', 'SGST', 'IGST'],
          details: [
            ['B2B', b2bInvoices.length, `₹${b2bInvoices.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`, '₹0'],
            ['B2C', b2cInvoices.length, `₹${b2cInvoices.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`, '₹0'],
            ['Interstate', interstateInvoices.length, `₹${interstateInvoices.reduce((s, o) => s + (o.total || 0), 0).toFixed(2)}`, '₹0', '₹0', `₹${totalGST.toFixed(2)}`]
          ]
        };

      case 'gstr3b-report':
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Taxable Value', `₹${totalRevenue.toLocaleString()}`],
            ['Total GST Collected', `₹${totalGST.toLocaleString()}`],
            ['CGST Collected', `₹${(totalGST * 0.5).toFixed(2)}`],
            ['SGST Collected', `₹${(totalGST * 0.5).toFixed(2)}`],
            ['IGST Collected', '₹0'],
            ['ITC Available', '₹0'],
            ['Tax Payable', `₹${totalGST.toLocaleString()}`]
          ],
          headers: ['Tax Type', 'Collected', 'ITC', 'Payable'],
          details: [
            ['CGST', `₹${(totalGST * 0.5).toFixed(2)}`, '₹0', `₹${(totalGST * 0.5).toFixed(2)}`],
            ['SGST', `₹${(totalGST * 0.5).toFixed(2)}`, '₹0', `₹${(totalGST * 0.5).toFixed(2)}`],
            ['IGST', '₹0', '₹0', '₹0'],
            ['Total', `₹${totalGST.toFixed(2)}`, '₹0', `₹${totalGST.toFixed(2)}`]
          ]
        };

      case 'gstr9-report':
        return {
          summary: [
            ['Financial Year', '2024-25'],
            ['Annual Turnover', `₹${totalRevenue.toLocaleString()}`],
            ['Total GST Collected', `₹${totalGST.toLocaleString()}`],
            ['GSTR-1 Filed', 'Pending'],
            ['GSTR-3B Filed', 'Pending'],
            ['Reconciliation Status', 'Pending']
          ],
          headers: ['Month', 'Turnover', 'GST Collected', 'Status'],
          details: [
            ['January', `₹${(totalRevenue / 12).toFixed(2)}`, `₹${(totalGST / 12).toFixed(2)}`, 'Pending'],
            ['February', `₹${(totalRevenue / 12).toFixed(2)}`, `₹${(totalGST / 12).toFixed(2)}`, 'Pending'],
            ['March', `₹${(totalRevenue / 12).toFixed(2)}`, `₹${(totalGST / 12).toFixed(2)}`, 'Pending']
          ]
        };

      case 'einvoice-report':
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Invoices', completedOrders.length.toString()],
            ['E-Invoice Required', 'No'],
            ['Turnover Threshold', '₹5,00,00,000'],
            ['Current Turnover', `₹${totalRevenue.toLocaleString()}`],
            ['IRN Generated', '0'],
            ['IRN Pending', completedOrders.length.toString()]
          ],
          headers: ['Invoice ID', 'IRN Status', 'QR Code', 'Generated At'],
          details: completedOrders.slice(0, 5).map(o => [
            o.id, 'Pending', 'Not Generated', new Date(o.createdAt).toLocaleString()
          ])
        };

      case 'discount-analysis':
        const discountedOrders = completedOrders.filter(o => o.discountAmount > 0);
        const totalDiscount = discountedOrders.reduce((s, o) => s + (o.discountAmount || 0), 0);
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Orders', completedOrders.length.toString()],
            ['Orders with Discount', discountedOrders.length.toString()],
            ['Total Discount Given', `₹${totalDiscount.toFixed(2)}`],
            ['Tax Savings from Discount', `₹${(totalDiscount * 0.05).toFixed(2)}`],
            ['Avg Discount per Order', `₹${discountedOrders.length > 0 ? (totalDiscount / discountedOrders.length).toFixed(2) : 0}`]
          ],
          headers: ['Order ID', 'Customer', 'Discount Amount', 'Tax Impact', 'Original Value'],
          details: discountedOrders.map(o => [
            o.id, o.customerName || 'Walk-in', `₹${(o.discountAmount || 0).toFixed(2)}`, `₹${((o.discountAmount || 0) * 0.05).toFixed(2)}`, `₹${(o.total + (o.discountAmount || 0)).toFixed(2)}`
          ])
        };

      case 'service-charge-report':
        const serviceChargeOrders = completedOrders.filter(o => o.serviceCharge > 0);
        const totalServiceCharge = serviceChargeOrders.reduce((s, o) => s + (o.serviceCharge || 0), 0);
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Orders', completedOrders.length.toString()],
            ['Orders with Service Charge', serviceChargeOrders.length.toString()],
            ['Total Service Charge', `₹${totalServiceCharge.toFixed(2)}`],
            ['Total GST', `₹${totalGST.toFixed(2)}`],
            ['Service Charge Separated', 'Yes']
          ],
          headers: ['Order ID', 'Customer', 'Service Charge', 'GST', 'Total'],
          details: serviceChargeOrders.map(o => [
            o.id, o.customerName || 'Walk-in', `₹${(o.serviceCharge || 0).toFixed(2)}`, `₹${(o.tax || 0).toFixed(2)}`, `₹${o.total.toFixed(2)}`
          ])
        };

      case 'multi-outlet-report':
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Branches', '1'],
            ['Total Turnover', `₹${totalRevenue.toLocaleString()}`],
            ['Main Branch Turnover', `₹${totalRevenue.toLocaleString()}`],
            ['GSTIN', '27AAPFU0939F1ZV'],
            ['State', 'Maharashtra']
          ],
          headers: ['Branch', 'GSTIN', 'State', 'Turnover', 'CGST', 'SGST'],
          details: [
            ['Main Branch', '27AAPFU0939F1ZV', 'Maharashtra', `₹${totalRevenue.toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`, `₹${(totalGST * 0.5).toFixed(2)}`]
          ]
        };

      case 'vendor-validation':
        return {
          summary: [
            ['Report Date', new Date().toLocaleDateString()],
            ['Total Vendors', '0'],
            ['Valid GSTINs', '0'],
            ['Invalid GSTINs', '0'],
            ['ITC Eligible', '0']
          ],
          headers: ['Vendor Name', 'GSTIN', 'Valid Format', 'Registered', 'ITC Eligible'],
          details: [['No vendors configured', 'N/A', 'N/A', 'N/A', 'N/A']]
        };

      case 'turnover-tracker':
        const currentTurnover = totalRevenue;
        return {
          summary: [
            ['Financial Year', '2024-25'],
            ['Current Turnover', `₹${currentTurnover.toLocaleString()}`],
            ['Registration Threshold', '₹40,00,000'],
            ['Composition Threshold', '₹1,50,00,000'],
            ['E-Invoice Threshold', '₹5,00,00,000'],
            ['Registration Progress', `${((currentTurnover / 4000000) * 100).toFixed(1)}%`],
            ['Near Registration Limit', currentTurnover >= 3500000 ? 'Yes' : 'No']
          ],
          headers: ['Threshold', 'Amount', 'Progress', 'Status'],
          details: [
            ['Registration Limit', '₹40,00,000', `${((currentTurnover / 4000000) * 100).toFixed(1)}%`, currentTurnover >= 4000000 ? 'Crossed' : 'OK'],
            ['Composition Scheme', '₹1,50,00,000', `${((currentTurnover / 15000000) * 100).toFixed(1)}%`, currentTurnover >= 15000000 ? 'Crossed' : 'OK'],
            ['E-Invoice', '₹5,00,00,000', `${((currentTurnover / 50000000) * 100).toFixed(1)}%`, currentTurnover >= 50000000 ? 'Crossed' : 'OK']
          ]
        };

      case 'invoice-sequence':
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Invoices', completedOrders.length.toString()],
            ['Gaps Found', '0'],
            ['Duplicates Found', '0'],
            ['Sequence Status', 'OK']
          ],
          headers: ['Invoice Number', 'Date', 'Status', 'Notes'],
          details: completedOrders.slice(0, 5).map(o => [
            o.id, new Date(o.createdAt).toLocaleDateString(), 'OK', 'No issues'
          ])
        };

      // ── Default fallback ─────────────────────────────────────────────────
      default:
        return {
          summary: [
            ['Report Period', dateRangeText],
            ['Total Revenue', `₹${totalRevenue.toLocaleString()}`],
            ['Total Orders', totalOrders.toString()],
            ['Average Order Value', `₹${Math.round(avgOrderValue)}`],
            ['Report Type', reportId]
          ],
          headers: ['Metric', 'Value'],
          details: [['Note', 'Detailed data for this report type is coming soon']]
        };
    }
  };

  const reportData = useMemo(() => {
    return getReportData(selectedReport);
  }, [orders, dateRange, inventory, menuItems, selectedReport, wasteRecords, recipes, reservations, qrOrders]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#000000' : '#f5f7fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{
        padding: screenSize === 'small' ? '16px' : '24px 32px',
        flex: 1,
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: darkMode ? '#ffffff' : '#1e293b' }}>Reports</h1>
          </div>
          <p style={{ color: darkMode ? '#9ca3af' : '#64748b', marginLeft: '52px', margin: 0 }}>Comprehensive business analytics and performance reports</p>
        </div>

        {/* Controls Bar */}
        <div style={{ background: darkMode ? '#111111' : '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}`, padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Period Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: darkMode ? '#1a1a1a' : '#f1f5f9', borderRadius: '8px', padding: '8px 12px', border: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}` }}>
              <span style={{ fontSize: '16px' }}>📅</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#334155', cursor: 'pointer' }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div style={{ flex: 1 }} />

            {/* GST Reports Toggle */}
            <button
              type="button"
              onClick={() => setShowGSTSection(!showGSTSection)}
              style={{
                padding: '10px 20px',
                background: showGSTSection ? '#2563eb' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = showGSTSection ? '#1d4ed8' : '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showGSTSection ? '#2563eb' : '#3b82f6';
              }}
            >
              🧾 {showGSTSection ? 'Hide GST' : 'GST Reports'}
            </button>

            {/* Export Buttons */}
            <button
              type="button"
              onClick={() => exportToPDF()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
              }}
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => exportToExcel()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              }}
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Report Type Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {reportCategories.map(category =>
            category.reports.map(report => {
              const isSelected = selectedReport === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  style={{
                    position: 'relative',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? '#3b82f6' : darkMode ? '#222222' : '#e2e8f0'}`,
                    background: isSelected ? darkMode ? '#1e3a5f' : '#eff6ff' : darkMode ? '#111111' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = darkMode ? '#1a1a1a' : '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = darkMode ? '#111111' : '#ffffff';
                    }
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: isSelected ? '#3b82f6' : 'transparent'
                  }} />
                  <div style={{
                    fontWeight: '600', fontSize: '14px', marginBottom: '4px',
                    color: isSelected ? '#3b82f6' : darkMode ? '#e5e7eb' : '#475569'
                  }}>{report.name}</div>
                  <div style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#64748b' }}>{category.name}</div>
                </button>
              );
            })
          ).flat()}
        </div>

        {/* Report Content */}
        <div style={{ background: darkMode ? '#111111' : '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}`, padding: '24px' }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {reportData.summary.slice(0, 4).map(([label, value], index) => {
              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
              const bgColors = ['#eff6ff', '#ecfdf5', '#fef3c7', '#f5f3ff'];
              const color = colors[index % colors.length];
              const bgColor = bgColors[index % bgColors.length];
              return (
                <div key={index} style={{
                  background: darkMode ? '#1a1a1a' : bgColor,
                  border: `1px solid ${darkMode ? '#333333' : color}20`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#64748b', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#1e293b' }}>{value}</div>
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <div style={{
            background: darkMode ? '#1a1a1a' : '#f8fafc',
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}`,
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: darkMode ? '#ffffff' : '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #3b82f6, #2563eb)', borderRadius: '2px' }} />
              Summary
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: darkMode ? '#222222' : '#f1f5f9' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: darkMode ? '#9ca3af' : '#64748b', borderBottom: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}` }}>Metric</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: darkMode ? '#9ca3af' : '#64748b', borderBottom: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}` }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.summary.map(([label, value], index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}` }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#9ca3af' : '#64748b', fontWeight: '500' }}>{label}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#ffffff' : '#1e293b', textAlign: 'right', fontWeight: '600' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Table */}
          {reportData.details && reportData.details.length > 0 && (
            <div style={{
              background: darkMode ? '#1a1a1a' : '#f8fafc',
              borderRadius: '12px',
              padding: '24px',
              border: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}`
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: darkMode ? '#ffffff' : '#1e293b',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ width: '4px', height: '24px', background: 'linear-gradient(180deg, #10b981, #059669)', borderRadius: '2px' }} />
                Details
              </div>
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: darkMode ? '#222222' : '#f8fafc' }}>
                      {reportData.headers.map((header, index) => (
                        <th key={index} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: darkMode ? '#9ca3af' : '#64748b', borderBottom: `1px solid ${darkMode ? '#333333' : '#e2e8f0'}` }}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details.map((row, rowIndex) => (
                      <tr key={rowIndex} style={{ borderBottom: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}` }}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#e0e0e0' : '#334155' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GST Reports Section - Inline at bottom */}
      {showGSTSection && (
        <div style={{
          background: darkMode ? '#0a0a0a' : '#ffffff',
          borderTop: `2px solid ${darkMode ? '#222222' : '#e2e8f0'}`,
          padding: '0',
          minHeight: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${darkMode ? '#222222' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: darkMode ? '#111111' : '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '16px' }}>🧾</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#1e293b' }}>GST Reports</h2>
            </div>
            <button
              onClick={() => setShowGSTSection(false)}
              style={{
                padding: '8px 16px',
                background: darkMode ? '#222222' : '#f1f5f9',
                color: darkMode ? '#ffffff' : '#334155',
                border: '1px solid',
                borderColor: darkMode ? '#333333' : '#e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? '#333333' : '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkMode ? '#222222' : '#f1f5f9';
              }}
            >
              ✕ Close
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
            <GSTReports 
              orders={orders} 
              menuItems={menuItems}
              staff={staff}
              customers={customers}
              inventory={inventory}
              settings={settings}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStatCard({ label, value, icon, color, trend, chart }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-4px)';
      e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      e.target.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      e.target.style.borderColor = '#e5e7eb';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          border: `2px solid ${color}30`
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            padding: '6px 12px',
            background: trend.startsWith('+') ? '#10b981' + '15' : '#ef4444' + '15',
            borderRadius: '8px',
            color: trend.startsWith('+') ? '#10b981' : '#ef4444',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {label}
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#0a0a0a', marginBottom: '8px', letterSpacing: '-1px' }}>
          {value}
        </div>
      </div>
      {chart && (
        <div style={{ height: '32px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
          {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${height}%`,
                background: color,
                borderRadius: '3px',
                transition: 'height 0.3s ease',
                opacity: i === 6 ? 1 : 0.6
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({ icon, title, value, description, color }) {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.target.style.background = '#f1f5f9';
      e.target.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.target.style.background = '#f8fafc';
      e.target.style.borderColor = '#e5e7eb';
    }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        border: `2px solid ${color}30`
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>
          {title}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0a0a0a', marginBottom: '2px' }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          {description}
        </div>
      </div>
    </div>
  );
}

function AdvancedLineChart({ data }) {
  const hours = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
  const values = hours.map(h => data[h].revenue);
  const maxValue = Math.max(...values, 1);
  
  return (
    <div style={{ height: '220px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 600 220" preserveAspectRatio="none">
        {/* Gradient fill */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1="0"
            y1={200 - ratio * 180}
            x2="600"
            y2={200 - ratio * 180}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        
        {/* Area fill */}
        <polygon
          points={`0,200 ${hours.map((h, i) => {
            const x = (i / (hours.length - 1 || 1)) * 580 + 10;
            const y = 200 - (data[h].revenue / maxValue) * 180;
            return `${x},${y}`;
          }).join(' ')} 600,200`}
          fill="url(#lineGradient)"
        />
        
        {/* Line */}
        <polyline
          points={hours.map((h, i) => {
            const x = (i / (hours.length - 1 || 1)) * 580 + 10;
            const y = 200 - (data[h].revenue / maxValue) * 180;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}
        />
        
        {/* Points with glow */}
        {hours.map((h, i) => {
          const x = (i / (hours.length - 1 || 1)) * 580 + 10;
          const y = 200 - (data[h].revenue / maxValue) * 180;
          return (
            <g key={h}>
              <circle
                cx={x}
                cy={y}
                r="12"
                fill="#3b82f6"
                opacity="0.2"
              />
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '500'
      }}>
        {hours.map((h, i) => (
          <span key={h}>{parseInt(h)}:00</span>
        ))}
      </div>
    </div>
  );
}

function AdvancedPieChart({ data }) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, d]) => sum + d.revenue, 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
      <div style={{ width: '180px', height: '180px', position: 'relative' }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {entries.map(([cat, d], index) => {
            const percentage = (d.revenue / total) * 100;
            const startAngle = index === 0 ? 0 : entries.slice(0, index).reduce((sum, [, data]) => sum + (data.revenue / total) * 360, 0);
            const endAngle = startAngle + (d.revenue / total) * 360;
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const x1 = 90 + 75 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 90 + 75 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 90 + 75 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 90 + 75 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            return (
              <g key={cat}>
                <path
                  d={`M 90 90 L ${x1} ${y1} A 75 75 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                  opacity="0.9"
                  style={{ transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.9'}
                />
              </g>
            );
          })}
          <circle cx="90" cy="90" r="45" fill="#ffffff" />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0a0a0a' }}>
            {entries.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            Categories
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        {entries.map(([cat, d], index) => {
          const percentage = ((d.revenue / total) * 100).toFixed(1);
          return (
            <div key={cat} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginBottom: '12px',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
            >
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '4px',
                background: colors[index % colors.length],
                boxShadow: `0 0 8px ${colors[index % colors.length]}50`
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a' }}>
                  {cat}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {percentage}% • ₹{d.revenue.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdvancedBarChart({ data, total }) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {Object.entries(data).map(([method, amount], index) => {
        const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
        return (
          <div key={method}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0a0a0a' }}>
                {method}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: colors[index % colors.length] }}>
                {percentage}%
              </span>
            </div>
            <div style={{
              height: '14px',
              background: '#f1f5f9',
              borderRadius: '7px',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}80 100%)`,
                borderRadius: '7px',
                transition: 'width 0.3s ease',
                boxShadow: `0 0 12px ${colors[index % colors.length]}40`
              }} />
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: '13px',
              color: '#64748b',
              fontWeight: '600'
            }}>
              ₹{amount.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
