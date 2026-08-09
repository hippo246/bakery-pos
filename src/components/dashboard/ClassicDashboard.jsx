/**
 * Classic Dashboard - Classic POS Theme
 * 
 * High-density, desktop-first Classic Cafe Management Dashboard with:
 * - Enterprise header with brand, store selector, date range picker, quick actions
 * - 5 KPI metric cards with Indian cafe-specific metrics
 * - Left section (65%): Order stream table + hourly peak volume chart
 * - Right section (35%): Top selling items, tax audit box, admin utilities
 * - Legacy enterprise UI feel: dense data grids, high contrast, compact spacing
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';
import { jsPDF } from 'jspdf';

export default function ClassicDashboard({
  orders = [],
  customers = [],
  inventory = [],
  kdsCards = [],
  tables = [],
  staff = [],
  waitlist = [],
  onNavigate,
}) {
  const [activeModal, setActiveModal] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [realOrders, setRealOrders] = useState([]);

  // Load real orders from localStorage
  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('cafeos_orders');
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        setRealOrders(orders);
      }
    } catch (error) {
      console.error('[ClassicDashboard] Failed to load orders:', error);
    }
  }, []);

  // Transform real orders to dashboard format
  const dashboardOrders = useMemo(() => {
    if (realOrders.length > 0) {
      return realOrders.map((order) => ({
        billNo: order.billNo || order.id || 'N/A',
        time: order.time || new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        items: order.items?.map(item => `${item.quantity}x ${item.name}`).join(', ') || order.itemsString || 'N/A',
        orderType: order.orderType || order.type || 'Dine-In',
        paymentMode: order.paymentMode || order.payment?.method || 'Cash',
        transactionId: order.transactionId || order.payment?.transactionId || 'N/A',
        status: order.status || 'Paid',
        amount: order.amount || order.total || order.netAmount || 0,
      }));
    }
    // Fallback to mock data if no real orders
    return [
    { billNo: '1001', time: '09:15', items: '1x Alfredo Pasta, 2x Cold Coffee', orderType: 'Dine-In', paymentMode: 'UPI', transactionId: 'UPI@987654321', status: 'Paid', amount: 485 },
    { billNo: '1002', time: '09:32', items: '1x Chewy Boba, 1x Vanilla Shake', orderType: 'Takeaway', paymentMode: 'Cash', transactionId: 'N/A', status: 'KOT Sent', amount: 320 },
    { billNo: '1003', time: '09:45', items: '2x KitKat Shake, 1x Garlic Bread', orderType: 'Zomato', paymentMode: 'UPI', transactionId: 'UPI@123456789', status: 'Paid', amount: 410 },
    { billNo: '1004', time: '10:02', items: '1x Masala Chai, 2x Samosa', orderType: 'Dine-In', paymentMode: 'Card', transactionId: 'CARD****4532', status: 'Cancelled', amount: 180 },
    { billNo: '1005', time: '10:18', items: '1x Chicken Burger, 1x Cold Coffee', orderType: 'Swiggy', paymentMode: 'UPI', transactionId: 'UPI@456789123', status: 'Paid', amount: 295 },
    { billNo: '1006', time: '10:35', items: '3x Vanilla Shake, 1x Chewy Boba', orderType: 'Takeaway', paymentMode: 'Cash', transactionId: 'N/A', status: 'KOT Sent', amount: 540 },
    { billNo: '1007', time: '10:52', items: '1x Alfredo Pasta Chicken, 1x Garlic Bread', orderType: 'Dine-In', paymentMode: 'UPI', transactionId: 'UPI@789123456', status: 'Paid', amount: 565 },
    { billNo: '1008', time: '11:08', items: '2x Masala Chai, 1x Samosa', orderType: 'Dine-In', paymentMode: 'Cash', transactionId: 'N/A', status: 'Paid', amount: 165 },
    { billNo: '1009', time: '11:25', items: '1x Butter Chicken, 2x Naan', orderType: 'Dine-In', paymentMode: 'UPI', transactionId: 'UPI@321654987', status: 'Paid', amount: 520 },
    { billNo: '1010', time: '11:42', items: '1x Chocolate Brownie, 1x Cold Coffee', orderType: 'Takeaway', paymentMode: 'UPI', transactionId: 'UPI@654987321', status: 'KOT Sent', amount: 285 },
    { billNo: '1011', time: '12:05', items: '2x Masala Dosa, 1x Filter Coffee', orderType: 'Dine-In', paymentMode: 'Cash', transactionId: 'N/A', status: 'Paid', amount: 195 },
    { billNo: '1012', time: '12:18', items: '1x Paneer Tikka, 1x Garlic Naan', orderType: 'Zomato', paymentMode: 'UPI', transactionId: 'UPI@987321654', status: 'Paid', amount: 385 },
  ];
  }, [realOrders]);

  // Calculate hourly data from real orders
  const hourlyData = useMemo(() => {
    if (realOrders.length > 0) {
      const hourMap = {};
      realOrders.forEach(order => {
        const hour = new Date(order.createdAt || Date.now()).getHours();
        const hourKey = `${hour}-${hour + 1}`;
        hourMap[hourKey] = (hourMap[hourKey] || 0) + (order.amount || order.total || order.netAmount || 0);
      });
      return Object.entries(hourMap).map(([hour, volume]) => ({ hour, volume }));
    }
    // Fallback to mock hourly data
    return [
    { hour: '8-9', volume: 1200 },
    { hour: '9-10', volume: 3500 },
    { hour: '10-11', volume: 4200 },
    { hour: '11-12', volume: 3800 },
    { hour: '12-1', volume: 4500 },
    { hour: '1-2', volume: 2800 },
    { hour: '2-3', volume: 3200 },
    { hour: '3-4', volume: 5100 },
    { hour: '4-5', volume: 5800 },
    { hour: '5-6', volume: 4900 },
    { hour: '6-7', volume: 3500 },
    { hour: '7-8', volume: 2800 },
    { hour: '8-9', volume: 2200 },
    { hour: '9-10', volume: 1800 },
  ];
  }, [realOrders]);

  // Calculate top items from real orders
  const topItems = useMemo(() => {
    if (realOrders.length > 0) {
      const itemMap = {};
      realOrders.forEach(order => {
        order.items?.forEach(item => {
          const name = item.name || 'Unknown';
          const quantity = item.quantity || 1;
          const price = item.price || 0;
          itemMap[name] = {
            name,
            sold: (itemMap[name]?.sold || 0) + quantity,
            revenue: (itemMap[name]?.revenue || 0) + (price * quantity),
            price,
          };
        });
      });
      return Object.values(itemMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 7);
    }
    // Fallback to mock top items
    return [
    { name: 'Vanilla Shake', sold: 38, revenue: 3002, price: 79 },
    { name: 'Alfredo Pasta Chicken', sold: 29, revenue: 4321, price: 149 },
    { name: 'Chewy Boba', sold: 24, revenue: 720, price: 30 },
    { name: 'KitKat Shake', sold: 21, revenue: 1869, price: 89 },
    { name: 'Cold Coffee', sold: 18, revenue: 1440, price: 80 },
    { name: 'Masala Chai', sold: 15, revenue: 450, price: 30 },
    { name: 'Garlic Bread', sold: 12, revenue: 600, price: 50 },
  ];
  }, [realOrders]);

  const maxItemSold = useMemo(() => Math.max(...topItems.map(i => i.sold)), [topItems]);

  const handleQuickAction = useCallback((action) => {
    switch (action) {
      case 'z_report': 
        setActiveModal('z_report');
        break;
      case 'e_way': 
        setActiveModal('gst_summary');
        break;
      case 'kot_monitor': 
        onNavigate?.('kitchen');
        break;
      case 'export_tally': 
        setActiveModal('export_tally');
        break;
      case 'printer_settings': 
        setActiveModal('printer_settings');
        break;
      case 'menu_override': 
        setActiveModal('menu_override');
        break;
      case 'cash_counter': 
        setActiveModal('cash_counter');
        break;
    }
  }, [onNavigate]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const generateZReportPDF = useCallback(() => {
    // Generate Z-Report PDF using jsPDF with professional formatting
    const doc = new jsPDF();
    
    // Header section with background
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Chai & Cafe CRM', 105, 18, { align: 'center' });
    
    // Report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Z-REPORT / DAY END', 105, 28, { align: 'center' });
    
    // Date and outlet info
    doc.setFontSize(10);
    doc.text(`Date: Aug 7, 2026 | Outlet: Goa Flagship #01`, 105, 35, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Sales Summary Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, 50, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES SUMMARY', 20, 57);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    // Sales data in table format
    const salesData = [
      ['Total Sales', '₹34,850.00'],
      ['Total Orders', '142'],
      ['Average Bill Value', '₹245.35'],
      ['Gross Sales', '₹33,190.50'],
      ['Total Discounts', '₹0.00'],
    ];
    
    let yPos = 70;
    salesData.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 170, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // GST Breakdown Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GST BREAKDOWN', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const gstData = [
      ['Taxable Value', '₹33,190.50'],
      ['CGST (2.5%)', '₹829.75'],
      ['SGST (2.5%)', '₹829.75'],
      ['Total GST', '₹1,659.50'],
      ['Net Invoice Total', '₹34,850.00'],
    ];
    
    yPos += 25;
    gstData.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 170, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // Payment Split Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SPLIT', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const paymentData = [
      ['UPI / QR', '₹23,698', '68%'],
      ['Cash', '₹7,687', '22%'],
      ['Card', '₹3,465', '10%'],
    ];
    
    yPos += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Mode', 20, yPos);
    doc.text('Amount', 120, yPos);
    doc.text('Percentage', 170, yPos);
    
    yPos += 8;
    paymentData.forEach(([mode, amount, percent], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.text(mode, 20, yPos);
      doc.text(amount, 120, yPos);
      doc.text(percent, 170, yPos);
      yPos += 8;
    });
    
    // Top Selling Items Section with Bar Chart
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP SELLING ITEMS', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const topItemsData = [
      ['Vanilla Shake', '38', '₹3,002'],
      ['Alfredo Pasta Chicken', '29', '₹4,321'],
      ['Chewy Boba', '24', '₹720'],
      ['KitKat Shake', '21', '₹1,869'],
      ['Cold Coffee', '18', '₹1,440'],
    ];
    
    yPos += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Item Name', 20, yPos);
    doc.text('Qty Sold', 130, yPos);
    doc.text('Revenue', 170, yPos);
    
    yPos += 8;
    topItemsData.forEach(([name, qty, revenue], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.text(name, 20, yPos);
      doc.text(qty, 130, yPos);
      doc.text(revenue, 170, yPos);
      yPos += 8;
    });

    // Visual Bar Chart for Sales Distribution
    yPos += 10;
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES DISTRIBUTION CHART', 20, yPos + 12);
    
    yPos += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const chartData = [
      { label: 'UPI', value: 68, color: [34, 197, 94] },
      { label: 'Cash', value: 22, color: [245, 158, 11] },
      { label: 'Card', value: 10, color: [59, 130, 246] },
    ];
    
    const barWidth = 40;
    const barSpacing = 20;
    const startX = 30;
    const barMaxHeight = 40;
    
    chartData.forEach((item, index) => {
      const barHeight = (item.value / 100) * barMaxHeight;
      const x = startX + (index * (barWidth + barSpacing));
      const y = yPos + barMaxHeight - barHeight + 15;
      
      // Draw bar
      doc.setFillColor(...item.color);
      doc.rect(x, y, barWidth, barHeight, 'F');
      
      // Draw value on top
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`${item.value}%`, x + barWidth / 2, y - 3, { align: 'center' });
      
      // Draw label below
      doc.setFontSize(9);
      doc.text(item.label, x + barWidth / 2, yPos + barMaxHeight + 20, { align: 'center' });
    });
    
    // Footer
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 270, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by Chai & Cafe CRM - Admin Terminal', 105, 280, { align: 'center' });
    doc.text('This is an automated report. For questions, contact support.', 105, 286, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 292, { align: 'center' });
    
    // Watermark
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL', 105, 150, { align: 'center', angle: 45, renderingMode: 'fill' });
    
    // Signature line
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', 150, 260);
    doc.text('Authorized Signature', 150, 265);
    
    // Save the PDF
    doc.save(`Z-Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    closeModal();
  }, [closeModal]);

  const generateZReportExcel = useCallback(() => {
    // Generate Z-Report Excel (CSV) logic
    const csvContent = [
      ['Z-Report / Day End', ''],
      ['Date', 'Aug 7, 2026'],
      ['Total Sales', '34850.00'],
      ['Total Orders', '142'],
      ['CGST (2.5%)', '829.75'],
      ['SGST (2.5%)', '829.75'],
      ['UPI', '23698'],
      ['UPI %', '68%'],
      ['Cash', '7687'],
      ['Cash %', '22%'],
      ['Card', '3465'],
      ['Card %', '10%'],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Z-Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeModal();
  }, [closeModal]);

  const generateGSTSummaryPDF = useCallback(() => {
    // Generate GST Summary PDF using jsPDF with professional formatting
    const doc = new jsPDF();
    
    // Header section with background
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Chai & Cafe CRM', 105, 18, { align: 'center' });
    
    // Report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('GST SUMMARY REPORT', 105, 28, { align: 'center' });
    
    // Date and outlet info
    doc.setFontSize(10);
    doc.text(`Date: Aug 7, 2026 | Outlet: Goa Flagship #01`, 105, 35, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // GSTIN and Business Details Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, 50, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS DETAILS', 20, 57);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const businessData = [
      ['GSTIN', '29AAAAA0000A1Z5'],
      ['Business Name', 'Chai & Cafe Enterprises'],
      ['PAN', 'AAAAA0000A'],
      ['State', 'Goa - GA'],
    ];
    
    let yPos = 70;
    businessData.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPos);
      yPos += 8;
    });
    
    // Tax Summary Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX SUMMARY', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const taxData = [
      ['Total Gross Sales', '₹33,190.50'],
      ['Total Discounts', '₹0.00'],
      ['Taxable Value', '₹33,190.50'],
      ['Exempted Sales', '₹0.00'],
      ['Nil Rated Sales', '₹0.00'],
    ];
    
    yPos += 25;
    taxData.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 170, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // GST Breakdown Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GST BREAKDOWN (2.5% + 2.5%)', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const gstBreakdown = [
      ['Output CGST (2.5%)', '₹829.75'],
      ['Output SGST (2.5%)', '₹829.75'],
      ['Total GST', '₹1,659.50'],
      ['Net Invoice Total', '₹34,850.00'],
    ];
    
    yPos += 25;
    gstBreakdown.forEach(([label, value], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 170, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // Payment Mode GST Analysis Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT MODE GST ANALYSIS', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    
    const paymentGST = [
      ['UPI / QR', '₹23,698', '₹592.45', '₹592.45'],
      ['Cash', '₹7,687', '₹192.18', '₹192.18'],
      ['Card', '₹3,465', '₹86.62', '₹86.62'],
    ];
    
    yPos += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Mode', 20, yPos);
    doc.text('Amount', 80, yPos);
    doc.text('CGST', 130, yPos);
    doc.text('SGST', 170, yPos);
    
    yPos += 8;
    paymentGST.forEach(([mode, amount, cgst, sgst], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.text(mode, 20, yPos);
      doc.text(amount, 80, yPos);
      doc.text(cgst, 130, yPos);
      doc.text(sgst, 170, yPos);
      yPos += 8;
    });
    
    // Compliance Section
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPLIANCE NOTES', 20, yPos + 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    yPos += 25;
    const notes = [
      '• This report is generated as per GST compliance requirements',
      '• All transactions are recorded with valid GSTIN',
      '• E-Way bills generated for interstate transactions above ₹50,000',
      '• GSTR-1 filing due date: 11th of next month',
      '• GSTR-3B filing due date: 20th of next month',
    ];
    
    notes.forEach(note => {
      doc.text(note, 20, yPos);
      yPos += 7;
    });

    // Visual GST Distribution Chart
    yPos += 10;
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GST DISTRIBUTION CHART', 20, yPos + 12);
    
    yPos += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const gstChartData = [
      { label: 'CGST', value: 829.75, color: [34, 197, 94] },
      { label: 'SGST', value: 829.75, color: [245, 158, 11] },
    ];
    
    const gstBarWidth = 50;
    const gstBarSpacing = 30;
    const gstStartX = 45;
    const gstBarMaxHeight = 40;
    
    gstChartData.forEach((item, index) => {
      const barHeight = (item.value / 1000) * gstBarMaxHeight;
      const x = gstStartX + (index * (gstBarWidth + gstBarSpacing));
      const y = yPos + gstBarMaxHeight - barHeight + 15;
      
      // Draw bar
      doc.setFillColor(...item.color);
      doc.rect(x, y, gstBarWidth, barHeight, 'F');
      
      // Draw value on top
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`₹${item.value}`, x + gstBarWidth / 2, y - 3, { align: 'center' });
      
      // Draw label below
      doc.setFontSize(9);
      doc.text(item.label, x + gstBarWidth / 2, yPos + gstBarMaxHeight + 20, { align: 'center' });
    });

    // Payment Mode GST Chart
    yPos += 60;
    doc.setFillColor(39, 39, 42);
    doc.rect(15, yPos + 5, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT MODE GST ANALYSIS CHART', 20, yPos + 12);
    
    yPos += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const paymentGSTChart = [
      { label: 'UPI', gst: 592.45, color: [34, 197, 94] },
      { label: 'Cash', gst: 192.18, color: [245, 158, 11] },
      { label: 'Card', gst: 86.62, color: [59, 130, 246] },
    ];
    
    const payBarWidth = 35;
    const payBarSpacing = 20;
    const payStartX = 25;
    const payBarMaxHeight = 35;
    
    paymentGSTChart.forEach((item, index) => {
      const barHeight = (item.gst / 600) * payBarMaxHeight;
      const x = payStartX + (index * (payBarWidth + payBarSpacing));
      const y = yPos + payBarMaxHeight - barHeight + 15;
      
      // Draw bar
      doc.setFillColor(...item.color);
      doc.rect(x, y, payBarWidth, barHeight, 'F');
      
      // Draw value on top
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(`₹${item.gst}`, x + payBarWidth / 2, y - 3, { align: 'center' });
      
      // Draw label below
      doc.setFontSize(8);
      doc.text(item.label, x + payBarWidth / 2, yPos + payBarMaxHeight + 20, { align: 'center' });
    });
    
    // Footer
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 270, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated by Chai & Cafe CRM - GST Compliance Module', 105, 280, { align: 'center' });
    doc.text('This report is for tax compliance purposes. Keep for audit records.', 105, 286, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 292, { align: 'center' });
    
    // Watermark
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('GST COMPLIANT', 105, 150, { align: 'center', angle: 45, renderingMode: 'fill' });
    
    // Signature line
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', 150, 260);
    doc.text('Authorized Signature', 150, 265);
    
    // Save the PDF
    doc.save(`GST-Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    
    closeModal();
  }, [closeModal]);

  const generateGSTSummaryExcel = useCallback(() => {
    // Generate GST Summary Excel (CSV) logic
    const csvContent = [
      ['GST SUMMARY REPORT'],
      [''],
      ['Report Date', 'Aug 7, 2026'],
      ['Outlet', 'Goa Flagship #01'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      [''],
      ['BUSINESS DETAILS'],
      ['GSTIN', '29AAAAA0000A1Z5'],
      ['Business Name', 'Chai & Cafe Enterprises'],
      ['PAN', 'AAAAA0000A'],
      ['State', 'Goa - GA'],
      [''],
      ['TAX SUMMARY'],
      ['Total Gross Sales', '33190.50'],
      ['Total Discounts', '0.00'],
      ['Taxable Value', '33190.50'],
      ['Exempted Sales', '0.00'],
      ['Nil Rated Sales', '0.00'],
      [''],
      ['GST BREAKDOWN (2.5% + 2.5%)'],
      ['Output CGST (2.5%)', '829.75'],
      ['Output SGST (2.5%)', '829.75'],
      ['Total GST', '1659.50'],
      ['Net Invoice Total', '34850.00'],
      [''],
      ['PAYMENT MODE GST ANALYSIS'],
      ['Payment Mode', 'Amount', 'CGST', 'SGST'],
      ['UPI / QR', '23698', '592.45', '592.45'],
      ['Cash', '7687', '192.18', '192.18'],
      ['Card', '3465', '86.62', '86.62'],
      [''],
      ['COMPLIANCE NOTES'],
      ['GSTR-1 Filing Due Date', '11th of next month'],
      ['GSTR-3B Filing Due Date', '20th of next month'],
      [''],
      ['END OF REPORT'],
      ['Generated by Chai & Cafe CRM - GST Compliance Module'],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST-Summary_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeModal();
  }, [closeModal]);

  const exportToExcel = useCallback(() => {
    // Export to Excel (CSV) logic with professional formatting
    const csvContent = [
      ['CHAI & CAFE CRM - TALLY COMPATIBLE EXPORT'],
      [''],
      ['Report Date', 'Aug 7, 2026'],
      ['Outlet', 'Goa Flagship #01'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      [''],
      ['SALES SUMMARY'],
      ['Total Sales', '34850.00'],
      ['Total Orders', '142'],
      ['Average Bill Value', '245.35'],
      [''],
      ['GST BREAKDOWN'],
      ['Taxable Value', '33190.50'],
      ['CGST (2.5%)', '829.75'],
      ['SGST (2.5%)', '829.75'],
      ['Total GST', '1659.50'],
      ['Net Invoice Total', '34850.00'],
      [''],
      [''],
      ['ORDER TRANSACTIONS'],
      ['Bill No', 'Time', 'Items', 'Order Type', 'Payment Mode', 'Transaction ID', 'Status', 'Amount'],
      ...dashboardOrders.map(order => [
        order.billNo,
        order.time,
        order.items,
        order.orderType,
        order.paymentMode,
        order.transactionId,
        order.status,
        order.amount
      ]),
      [''],
      [''],
      ['TOP SELLING ITEMS'],
      ['Item Name', 'Qty Sold', 'Price', 'Revenue'],
      ['Vanilla Shake', '38', '79', '3002'],
      ['Alfredo Pasta Chicken', '29', '149', '4321'],
      ['Chewy Boba', '24', '30', '720'],
      ['KitKat Shake', '21', '89', '1869'],
      ['Cold Coffee', '18', '80', '1440'],
      ['Masala Chai', '15', '30', '450'],
      ['Garlic Bread', '12', '50', '600'],
      [''],
      [''],
      ['PAYMENT MODE ANALYSIS'],
      ['Payment Mode', 'Amount', 'Percentage'],
      ['UPI / QR', '23698', '68%'],
      ['Cash', '7687', '22%'],
      ['Card', '3465', '10%'],
      [''],
      [''],
      ['END OF REPORT'],
      ['Generated by Chai & Cafe CRM - Tally Compatible Export'],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tally-Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeModal();
  }, [closeModal, dashboardOrders]);

  const getStatusBadge = (status) => {
    const colors = {
      'Paid': { bg: '#22C55E', text: '#ffffff' },
      'KOT Sent': { bg: '#F59E0B', text: '#ffffff' },
      'Cancelled': { bg: '#EF4444', text: '#ffffff' },
    };
    const style = colors[status] || { bg: '#6B7280', text: '#ffffff' };
    return {
      background: style.bg,
      color: style.text,
      padding: '2px 4px',
      borderRadius: '2px',
      fontSize: '9px',
      fontWeight: '700',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    };
  };

  // Base styles
  const baseStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
    color: '#e5e5e5',
  };

  const headerStyle = {
    ...baseStyle,
    background: '#18181B',
    borderBottom: '1px solid #3F3F46',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const cardStyle = {
    background: '#27272A',
    border: '1px solid #3F3F46',
    borderRadius: '4px',
    padding: '12px',
  };

  const kpiCardStyle = {
    ...cardStyle,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const buttonStyle = {
    padding: '6px 12px',
    borderRadius: '3px',
    border: 'none',
    fontWeight: '700',
    fontSize: '11px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const tableHeaderStyle = {
    background: '#3F3F46',
    padding: '8px 10px',
    fontWeight: '700',
    fontSize: '11px',
    textTransform: 'uppercase',
    color: '#ffffff',
  };

  const tableRowStyle = {
    padding: '8px 10px',
    borderBottom: '1px solid #3F3F46',
    fontSize: '11px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#18181B',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      ...baseStyle,
    }}>
      {/* TOP ENTERPRISE HEADER */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
            Chai & Cafe CRM - Admin Terminal
          </div>
          <div style={{ 
            padding: '4px 10px', 
            background: '#27272A', 
            border: '1px solid #3F3F46', 
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#9CA3AF'
          }}>
            Goa Flagship Outlet #01
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            Today: Aug 7, 2026
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleQuickAction('z_report')} style={{ ...buttonStyle, background: '#DC2626', color: '#ffffff' }}>
            Z-REPORT / DAY END
          </button>
          <button onClick={() => handleQuickAction('e_way')} style={{ ...buttonStyle, background: '#F59E0B', color: '#ffffff' }}>
            E-WAY / GST SUMMARY
          </button>
          <button onClick={() => handleQuickAction('kot_monitor')} style={{ ...buttonStyle, background: '#3B82F6', color: '#ffffff' }}>
            KOT MONITOR
          </button>
          <div style={{ 
            padding: '4px 10px', 
            background: '#22C55E', 
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            POS Sync: Online
          </div>
        </div>
      </div>

      {/* TOP KPI METRIC CARDS */}
      <div style={{ 
        padding: '12px 16px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '12px',
        borderBottom: '1px solid #3F3F46',
      }}>
        {/* KPI 1: Total Sales */}
        <div style={kpiCardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Total Sales (Today)
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#22C55E' }}>
            ₹34,850.00
          </div>
          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
            142 Orders | Avg Bill: ₹245
          </div>
        </div>

        {/* KPI 2: Payment Split */}
        <div style={kpiCardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Payment Split
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#8B5CF6' }}>
            UPI / QR: 68%
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            Cash: 22% | Cards: 10%
          </div>
        </div>

        {/* KPI 3: Tax Breakdown */}
        <div style={kpiCardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Tax Breakdown (GST)
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#F59E0B' }}>
            CGST (2.5%): ₹829.75
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#F59E0B' }}>
            SGST (2.5%): ₹829.75
          </div>
        </div>

        {/* KPI 4: Active KOT Status */}
        <div style={kpiCardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Active KOT Status
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#F59E0B' }}>
            8 Preparing
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#3B82F6' }}>
            3 Ready | 102 Completed
          </div>
        </div>

        {/* KPI 5: Top Selling Category */}
        <div style={kpiCardStyle}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Top Selling Category
          </div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#22C55E' }}>
            Shakes & Boba
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            42% Volume
          </div>
        </div>
      </div>

      {/* MAIN BODY - SPLIT GRID LAYOUT */}
      <div style={{ flex: 1, display: 'flex', padding: '12px 16px', gap: '12px', overflow: 'hidden' }}>
        
        {/* LEFT SECTION (65%) - SALES & KOT ANALYTICS */}
        <div style={{ flex: '0.65', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          
          {/* Real-Time Order Stream & KOT Tracker Table */}
          <div style={{ ...cardStyle, flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>
              Real-Time Order Stream & KOT Tracker
            </div>
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #3F3F46' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 50px 1fr 100px 80px 70px 75px', background: '#3F3F46' }}>
                <div style={tableHeaderStyle}>Bill No</div>
                <div style={tableHeaderStyle}>Time</div>
                <div style={tableHeaderStyle}>Items</div>
                <div style={tableHeaderStyle}>Order Type</div>
                <div style={tableHeaderStyle}>Payment</div>
                <div style={tableHeaderStyle}>Status</div>
                <div style={tableHeaderStyle}>Amount</div>
              </div>
              {dashboardOrders.map((order, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '60px 50px 1fr 100px 80px 70px 75px', ...tableRowStyle }}>
                  <div style={{ fontWeight: '700', color: '#3B82F6' }}>{order.billNo}</div>
                  <div style={{ color: '#9CA3AF' }}>{order.time}</div>
                  <div style={{ color: '#e5e5e5' }}>{order.items}</div>
                  <div style={{ color: '#9CA3AF' }}>{order.orderType}</div>
                  <div style={{ color: '#9CA3AF' }}>{order.paymentMode}</div>
                  <div style={getStatusBadge(order.status)}>{order.status}</div>
                  <div style={{ fontWeight: '700', color: '#22C55E' }}>₹{order.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales & Hourly Peak Volume Bar Chart */}
          <div style={{ ...cardStyle, height: '200px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>
              Sales & Hourly Peak Volume
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 10px' }}>
              {hourlyData.map((data, idx) => {
                const maxVolume = Math.max(...hourlyData.map(d => d.volume));
                const height = (data.volume / maxVolume) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${height}%`, 
                      background: idx >= 7 && idx <= 9 ? '#22C55E' : '#3B82F6',
                      borderRadius: '2px 2px 0 0',
                      minHeight: '4px',
                    }} />
                    <div style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: '600' }}>
                      {data.hour}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION (35%) - ITEM PERFORMANCE & GST SUMMARY */}
        <div style={{ flex: '0.35', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          
          {/* Top Selling Cafe Items List */}
          <div style={{ ...cardStyle, flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase' }}>
              Top Selling Cafe Items
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topItems.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#e5e5e5' }}>{item.name}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#22C55E' }}>
                      {item.sold} Sold (₹{item.revenue})
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#3F3F46', borderRadius: '2px' }}>
                    <div style={{ 
                      width: `${(item.sold / maxItemSold) * 100}%`, 
                      height: '100%', 
                      background: '#22C55E',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Indian Tax & Payment Audit Box */}
          <div style={{ ...cardStyle, padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', borderBottom: '1px solid #3F3F46', paddingBottom: '8px' }}>
              Daily Tax & Payment Audit
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#9CA3AF' }}>Total Gross Sales:</span>
                <span style={{ fontWeight: '700', color: '#e5e5e5' }}>₹33,190.50</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#9CA3AF' }}>Total Discount Given:</span>
                <span style={{ fontWeight: '700', color: '#e5e5e5' }}>₹0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#9CA3AF' }}>Taxable Value:</span>
                <span style={{ fontWeight: '700', color: '#e5e5e5' }}>₹33,190.50</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#9CA3AF' }}>Output CGST (2.5%):</span>
                <span style={{ fontWeight: '700', color: '#F59E0B' }}>₹829.75</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#9CA3AF' }}>Output SGST (2.5%):</span>
                <span style={{ fontWeight: '700', color: '#F59E0B' }}>₹829.75</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px', 
                fontWeight: '800', 
                color: '#22C55E',
                paddingTop: '6px',
                borderTop: '1px solid #3F3F46',
                marginTop: '4px',
              }}>
                <span>Net Invoice Total:</span>
                <span>₹34,850.00</span>
              </div>
            </div>
          </div>

          {/* Quick Admin Utilities (2x2 Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => handleQuickAction('export_tally')} style={{ 
              ...buttonStyle, 
              background: '#27272A', 
              border: '1px solid #3F3F46', 
              color: '#e5e5e5',
              padding: '10px',
              fontSize: '10px',
            }}>
              EXPORT TALLY /<br />GST EXCEL
            </button>
            <button onClick={() => handleQuickAction('printer_settings')} style={{ 
              ...buttonStyle, 
              background: '#27272A', 
              border: '1px solid #3F3F46', 
              color: '#e5e5e5',
              padding: '10px',
              fontSize: '10px',
            }}>
              PRINTER<br />SETTINGS
            </button>
            <button onClick={() => handleQuickAction('menu_override')} style={{ 
              ...buttonStyle, 
              background: '#27272A', 
              border: '1px solid #3F3F46', 
              color: '#e5e5e5',
              padding: '10px',
              fontSize: '10px',
            }}>
              MENU PRICE<br />OVERRIDE
            </button>
            <button onClick={() => handleQuickAction('cash_counter')} style={{ 
              ...buttonStyle, 
              background: '#27272A', 
              border: '1px solid #3F3F46', 
              color: '#e5e5e5',
              padding: '10px',
              fontSize: '10px',
            }}>
              DENOMINATION<br />CASH COUNTER
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'z_report' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              Z-Report / Day End
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p><strong>Date:</strong> Aug 7, 2026</p>
              <p><strong>Total Sales:</strong> ₹34,850.00</p>
              <p><strong>Total Orders:</strong> 142</p>
              <p><strong>CGST (2.5%):</strong> ₹829.75</p>
              <p><strong>SGST (2.5%):</strong> ₹829.75</p>
              <p><strong>UPI:</strong> ₹23,698 (68%)</p>
              <p><strong>Cash:</strong> ₹7,687 (22%)</p>
              <p><strong>Card:</strong> ₹3,465 (10%)</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={generateZReportPDF} style={{ ...buttonStyle, background: '#DC2626', color: '#ffffff' }}>
                Export PDF
              </button>
              <button onClick={generateZReportExcel} style={{ ...buttonStyle, background: '#22C55E', color: '#ffffff' }}>
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'gst_summary' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              E-Way / GST Summary
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p><strong>Taxable Value:</strong> ₹33,190.50</p>
              <p><strong>Output CGST (2.5%):</strong> ₹829.75</p>
              <p><strong>Output SGST (2.5%):</strong> ₹829.75</p>
              <p><strong>Total GST:</strong> ₹1,659.50</p>
              <p><strong>Net Invoice Total:</strong> ₹34,850.00</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={generateGSTSummaryPDF} style={{ ...buttonStyle, background: '#DC2626', color: '#ffffff' }}>
                Export PDF
              </button>
              <button onClick={generateGSTSummaryExcel} style={{ ...buttonStyle, background: '#22C55E', color: '#ffffff' }}>
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'export_tally' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              Export Tally / GST Excel
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <p>Export daily sales data to Tally-compatible Excel format with GST breakdown.</p>
              <p><strong>Includes:</strong></p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>All order transactions</li>
                <li>GST tax breakdown (CGST/SGST)</li>
                <li>Payment mode analysis</li>
                <li>Item-wise sales report</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={exportToExcel} style={{ ...buttonStyle, background: '#3B82F6', color: '#ffffff' }}>
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'printer_settings' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              Printer Settings
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>Receipt Printer:</label>
                <select style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }}>
                  <option>EPSON TM-T88VI</option>
                  <option>Star Micronics TSP143III</option>
                  <option>Custom Thermal Printer</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>Kitchen Printer:</label>
                <select style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }}>
                  <option>EPSON TM-U220B</option>
                  <option>Star SP700</option>
                  <option>None (KDS Only)</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" defaultChecked />
                  <span>Auto-print receipts on payment</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={() => { setAlertDialog({ isOpen: true, title: 'Settings Saved', message: 'Printer settings saved!', type: 'success' }); closeModal(); }} style={{ ...buttonStyle, background: '#3B82F6', color: '#ffffff' }}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'menu_override' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              Menu Price Override
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>Select Item:</label>
                <select style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }}>
                  <option>Vanilla Shake - ₹79</option>
                  <option>Alfredo Pasta Chicken - ₹149</option>
                  <option>Chewy Boba - ₹30</option>
                  <option>KitKat Shake - ₹89</option>
                  <option>Cold Coffee - ₹80</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>New Price (₹):</label>
                <input type="number" defaultValue="79" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" />
                  <span>Apply to all outlets</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={() => { setAlertDialog({ isOpen: true, title: 'Price Updated', message: 'Price updated successfully!', type: 'success' }); closeModal(); }} style={{ ...buttonStyle, background: '#F59E0B', color: '#ffffff' }}>
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'cash_counter' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#27272A',
            border: '2px solid #3F3F46',
            borderRadius: '4px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase' }}>
              Denomination Cash Counter
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#e5e5e5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹2000 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹500 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹200 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹100 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹50 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹20 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹10 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>₹5 x</label>
                  <input type="number" defaultValue="0" style={{ width: '100%', padding: '6px', background: '#18181B', border: '1px solid #3F3F46', color: '#e5e5e5', borderRadius: '3px' }} />
                </div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3F3F3F' }}>
                <p><strong>Total Cash Counted:</strong> ₹0.00</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ ...buttonStyle, background: '#3F3F46', color: '#e5e5e5' }}>
                Cancel
              </button>
              <button onClick={() => { setAlertDialog({ isOpen: true, title: 'Count Saved', message: 'Cash counter saved!', type: 'success' }); closeModal(); }} style={{ ...buttonStyle, background: '#22C55E', color: '#ffffff' }}>
                Save Count
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
