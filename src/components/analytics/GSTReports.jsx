// GST Reports Component - Main GST reporting dashboard

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import {
  generateGSTR1Report,
  generateGSTR3BReport,
  generateEInvoiceReport,
  generateDiscountAnalysisReport,
  generateServiceChargeReport,
  generateMultiOutletReport,
  generateVendorValidationLog,
  generateTurnoverTracker,
  generateInvoiceSequenceReport,
  generateAmendmentLog
} from '../../domain/gstReports.js';
import { REPORT_TYPES, REPORT_FREQUENCIES } from '../../data/gstConstants.js';

export default function GSTReports({ orders, purchases, business, branches, vendors, menuItems, staff, customers, inventory, settings }) {
  const [selectedReport, setSelectedReport] = useState('GSTR1');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedFrequency, setSelectedFrequency] = useState('MONTHLY');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSchedule, setEmailSchedule] = useState(false);

  useEffect(() => {
    generateReport();
  }, [selectedReport, selectedPeriod]);

  const generateReport = () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        let data;
        switch (selectedReport) {
          case 'GSTR1':
            data = generateGSTR1Report(orders || [], business || { gstin: 'N/A' }, selectedPeriod);
            break;
          case 'GSTR3B':
            data = generateGSTR3BReport(orders || [], purchases || [], business || { gstin: 'N/A' }, selectedPeriod);
            break;
          case 'GSTR9':
            // For GSTR-9, we'd need monthly reports - using placeholder
            data = { message: 'GSTR-9 requires monthly GSTR-1 and GSTR-3B data' };
            break;
          case 'EINVOICE':
            const invoices = (orders || []).map(o => ({ ...o, irn: null, irnStatus: 'PENDING' }));
            data = generateEInvoiceReport(invoices);
            break;
          case 'DISCOUNT_ANALYSIS':
            data = generateDiscountAnalysisReport(orders || []);
            break;
          case 'SERVICE_CHARGE':
            data = generateServiceChargeReport(orders || []);
            break;
          case 'MULTI_OUTLET':
            data = generateMultiOutletReport(orders || [], branches || []);
            break;
          case 'VENDOR_VALIDATION':
            data = generateVendorValidationLog(vendors || []);
            break;
          case 'TURNOVER_TRACKER':
            data = generateTurnoverTracker(orders || [], '2024-25');
            break;
          case 'INVOICE_SEQUENCE':
            const invoicesForSequence = (orders || []).map(o => ({ 
              ...o, 
              invoiceNumber: `INV-2024-${o.id.slice(-4)}` 
            }));
            data = generateInvoiceSequenceReport(invoicesForSequence, selectedPeriod);
            break;
          case 'AMENDMENT_LOG':
            data = generateAmendmentLog([], selectedPeriod);
            break;
          default:
            data = null;
        }
        setReportData(data);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const reportName = reportTypes.find(r => r.id === selectedReport)?.label || selectedReport;
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
      
      // Period info
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(`Tax Period: ${selectedPeriod}`, pageWidth / 2, 33, { align: 'center' });
      
      // Generation date
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`, pageWidth / 2, 39, { align: 'center' });
      
      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(14, 45, pageWidth - 14, 45);
      
      yPos = 55;
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
      doc.text('GST Compliance Report - Generated by Bakery POS System', pageWidth / 2, footerY + 5, { align: 'center' });
    };
    
    // Initial header
    addHeader();
    
    // Business Information Section
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, 'bold');
    doc.text('BUSINESS INFORMATION', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont(undefined, 'normal');
    
    const businessInfo = [
      ['Business Name:', 'Bakery POS System'],
      ['GSTIN:', '29AAAAA0000A1Z5'],
      ['State:', 'Karnataka'],
      ['Address:', '123 Bakery Street, Bangalore - 560001']
    ];
    
    businessInfo.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 14, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(value, 50, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // Summary Section with styled box
    if (reportData.summary) {
      checkPageBreak(60);
      
      // Section header with background
      doc.setFillColor(59, 130, 246);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY', 17, yPos + 7);
      yPos += 15;
      
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        typeof value === 'number' && value > 1000 ? `₹${value.toLocaleString('en-IN')}` : value
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Particulars', 'Amount / Value']],
        body: summaryData,
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
    }
    
    // B2B Invoices Section
    if (reportData.B2B && reportData.B2B.length > 0) {
      checkPageBreak(80);
      
      doc.setFillColor(139, 92, 246);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('B2B INVOICES (INTERSTATE)', 17, yPos + 7);
      yPos += 15;
      
      const b2bData = reportData.B2B.map(item => [
        item.invoiceNo || 'N/A',
        item.invoiceDate || 'N/A',
        item.customerName || 'N/A',
        item.customerGSTIN || 'N/A',
        item.taxableValue ? `₹${item.taxableValue.toLocaleString('en-IN')}` : '₹0',
        item.igst ? `₹${item.igst.toLocaleString('en-IN')}` : '₹0',
        item.cgst ? `₹${item.cgst.toLocaleString('en-IN')}` : '₹0',
        item.sgst ? `₹${item.sgst.toLocaleString('en-IN')}` : '₹0',
        item.totalTax ? `₹${item.totalTax.toLocaleString('en-IN')}` : '₹0'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Invoice No', 'Date', 'Customer Name', 'Customer GSTIN', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total Tax']],
        body: b2bData,
        theme: 'striped',
        headStyles: { 
          fillColor: [139, 92, 246], 
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        styles: { 
          fontSize: 7,
          cellPadding: 3,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 18, halign: 'right' },
          7: { cellWidth: 18, halign: 'right' },
          8: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // B2CL Section
    if (reportData.B2CL && reportData.B2CL.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(16, 185, 129);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('B2C LARGE (INTERSTATE > ₹2.5 LAKH)', 17, yPos + 7);
      yPos += 15;
      
      const b2clData = reportData.B2CL.map(item => [
        item.invoiceNo || 'N/A',
        item.invoiceDate || 'N/A',
        item.customerName || 'N/A',
        item.state || 'N/A',
        item.taxableValue ? `₹${item.taxableValue.toLocaleString('en-IN')}` : '₹0',
        item.igst ? `₹${item.igst.toLocaleString('en-IN')}` : '₹0'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Invoice No', 'Date', 'Customer', 'State', 'Taxable Value', 'IGST']],
        body: b2clData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // B2CS Section
    if (reportData.B2CS && reportData.B2CS.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(245, 158, 11);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('B2C SMALL (INTRASTATE)', 17, yPos + 7);
      yPos += 15;
      
      const b2csData = reportData.B2CS.map(item => [
        item.hsnSac || 'N/A',
        item.description || 'N/A',
        item.totalQuantity || 0,
        item.totalTaxableValue ? `₹${item.totalTaxableValue.toLocaleString('en-IN')}` : '₹0',
        item.cgst ? `₹${item.cgst.toLocaleString('en-IN')}` : '₹0',
        item.sgst ? `₹${item.sgst.toLocaleString('en-IN')}` : '₹0'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['HSN/SAC', 'Description', 'Quantity', 'Taxable Value', 'CGST', 'SGST']],
        body: b2csData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // HSN Summary Section
    if (reportData.HSN && reportData.HSN.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(239, 68, 68);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('HSN/SAC SUMMARY', 17, yPos + 7);
      yPos += 15;
      
      const hsnData = reportData.HSN.map(item => [
        item.hsnSac || 'N/A',
        item.description || 'N/A',
        item.uqc || 'N/A',
        item.totalQuantity || 0,
        item.totalTaxableValue ? `₹${item.totalTaxableValue.toLocaleString('en-IN')}` : '₹0',
        item.totalIGST ? `₹${item.totalIGST.toLocaleString('en-IN')}` : '₹0',
        item.totalCGST ? `₹${item.totalCGST.toLocaleString('en-IN')}` : '₹0',
        item.totalSGST ? `₹${item.totalSGST.toLocaleString('en-IN')}` : '₹0'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['HSN/SAC', 'Description', 'UQC', 'Total Qty', 'Taxable Value', 'IGST', 'CGST', 'SGST']],
        body: hsnData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Details Section
    if (reportData.details && reportData.details.length > 0) {
      checkPageBreak(60);
      
      doc.setFillColor(99, 102, 241);
      doc.rect(14, yPos, pageWidth - 28, 10, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('DETAILED BREAKDOWN', 17, yPos + 7);
      yPos += 15;
      
      autoTable(doc, {
        startY: yPos,
        head: reportData.headers || Object.keys(reportData.details[0] || {}).map(k => k.toUpperCase()),
        body: reportData.details,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 3 }
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
    doc.text('This report is generated for GST compliance purposes and should be verified with official GST portal data.', 14, yPos);
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
    
    doc.save(`${selectedReport}_${selectedPeriod}_GST_Report.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    const wb = XLSX.utils.book_new();
    const reportName = reportTypes.find(r => r.id === selectedReport)?.label || selectedReport;
    
    // Summary sheet
    if (reportData.summary) {
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
        'Metric': key,
        'Value': value
      }));
      const ws = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    }
    
    // Details sheet
    if (reportData.details && reportData.details.length > 0) {
      const ws = XLSX.utils.json_to_sheet(reportData.details);
      XLSX.utils.book_append_sheet(wb, ws, 'Details');
    }
    
    // B2B sheet
    if (reportData.B2B) {
      const ws = XLSX.utils.json_to_sheet(reportData.B2B);
      XLSX.utils.book_append_sheet(wb, ws, 'B2B Invoices');
    }
    
    // B2CL sheet
    if (reportData.B2CL) {
      const ws = XLSX.utils.json_to_sheet(reportData.B2CL);
      XLSX.utils.book_append_sheet(wb, ws, 'B2C Large');
    }
    
    // B2CS sheet
    if (reportData.B2CS) {
      const ws = XLSX.utils.json_to_sheet(reportData.B2CS);
      XLSX.utils.book_append_sheet(wb, ws, 'B2C Small');
    }
    
    // HSN sheet
    if (reportData.HSN) {
      const ws = XLSX.utils.json_to_sheet(reportData.HSN);
      XLSX.utils.book_append_sheet(wb, ws, 'HSN/SAC');
    }
    
    XLSX.writeFile(wb, `${selectedReport}_${selectedPeriod}.xlsx`);
  };

  const exportReport = () => {
    exportToPDF();
  };

  const scheduleEmailReport = () => {
    setEmailSchedule(true);
    // In a real implementation, this would call an API to schedule the email
    setTimeout(() => {
      setEmailSchedule(false);
      alert(`Report scheduled to be sent ${selectedFrequency.toLowerCase()}`);
    }, 1000);
  };

  const reportTypes = [
    { id: 'GSTR1', label: 'GSTR-1 Sales Report', icon: FileText, description: 'Outward supply details for GST filing' },
    { id: 'GSTR3B', label: 'GSTR-3B Tax Summary', icon: FileText, description: 'Summary of tax liability and ITC' },
    { id: 'GSTR9', label: 'GSTR-9 Annual Return', icon: FileText, description: 'Annual reconciliation report' },
    { id: 'EINVOICE', label: 'E-Invoice Report', icon: FileText, description: 'IRN generation status and tracking' },
    { id: 'DISCOUNT_ANALYSIS', label: 'Discount Analysis', icon: TrendingUp, description: 'Tax impact of discounts' },
    { id: 'SERVICE_CHARGE', label: 'Service Charge Report', icon: FileText, description: 'Service charge vs GST separation' },
    { id: 'MULTI_OUTLET', label: 'Multi-Outlet Report', icon: FileText, description: 'State-wise GSTIN split' },
    { id: 'VENDOR_VALIDATION', label: 'Vendor Validation', icon: CheckCircle, description: 'GSTIN validation status' },
    { id: 'TURNOVER_TRACKER', label: 'Turnover Tracker', icon: TrendingUp, description: 'Threshold monitoring' },
    { id: 'INVOICE_SEQUENCE', label: 'Invoice Sequence', icon: AlertTriangle, description: 'Gap and duplicate detection' },
    { id: 'AMENDMENT_LOG', label: 'Amendment Log', icon: Clock, description: 'Rate change and amendment tracking' },
  ];

  return (
    <div style={{ padding: '16px 24px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>GST Reports</h1>
          </div>
          <p style={{ color: '#64748b', marginLeft: '52px', margin: 0 }}>Comprehensive GST compliance and filing reports</p>
        </div>

        {/* Controls Bar */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Period Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
              <Calendar style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '500', color: '#334155', cursor: 'pointer' }}
              >
                <option value="2024-01">January 2024</option>
                <option value="2024-02">February 2024</option>
                <option value="2024-03">March 2024</option>
                <option value="2024-04">April 2024</option>
                <option value="2024-05">May 2024</option>
                <option value="2024-06">June 2024</option>
              </select>
            </div>

            {/* Frequency Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#64748b' }} />
              <select
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '500', color: '#334155', cursor: 'pointer' }}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div style={{ flex: 1 }} />

            {/* Action Buttons */}
            <button
              onClick={exportToPDF}
              disabled={!reportData || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: !reportData || loading ? 'not-allowed' : 'pointer',
                opacity: !reportData || loading ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (reportData && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                }
              }}
              onMouseLeave={(e) => {
                if (reportData && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                }
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Export PDF
            </button>

            <button
              onClick={exportToExcel}
              disabled={!reportData || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: !reportData || loading ? 'not-allowed' : 'pointer',
                opacity: !reportData || loading ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (reportData && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
                }
              }}
              onMouseLeave={(e) => {
                if (reportData && !loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                }
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              Export Excel
            </button>

            <button
              onClick={scheduleEmailReport}
              disabled={emailSchedule}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: emailSchedule ? 'not-allowed' : 'pointer',
                opacity: emailSchedule ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Mail style={{ width: '16px', height: '16px' }} />
              {emailSchedule ? 'Scheduling...' : 'Schedule Email'}
            </button>
          </div>
        </div>

        {/* Report Type Selector - Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedReport === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                style={{
                  position: 'relative',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${isSelected ? '#8b5cf6' : '#e2e8f0'}`,
                  background: isSelected ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: isSelected ? '#8b5cf6' : 'transparent'
                }} />
                <Icon style={{
                  width: '24px', height: '24px', marginBottom: '8px',
                  color: isSelected ? '#8b5cf6' : '#94a3b8'
                }} />
                <div style={{
                  fontWeight: '600', fontSize: '14px', marginBottom: '4px',
                  color: isSelected ? '#1e293b' : '#475569'
                }}>{type.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{type.description}</div>
              </button>
            );
          })}
        </div>

        {/* Report Content */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6',
                  animation: 'spin 1s linear infinite',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#1e293b', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>Generating Report</p>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Please wait while we process your data...</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '32px' }}>⚠️</span>
                </div>
                <div>
                  <p style={{ color: '#dc2626', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Error Loading Report</p>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>{error}</p>
                  <button
                    onClick={generateReport}
                    style={{
                      padding: '10px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : reportData ? (
            <ReportContent reportType={selectedReport} data={reportData} />
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
              <p style={{ color: '#64748b' }}>Select a report type to generate</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 768px) {
          .report-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .report-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}

function ReportContent({ reportType, data }) {
  switch (reportType) {
    case 'GSTR1':
      return <GSTR1Report data={data} />;
    case 'GSTR3B':
      return <GSTR3BReport data={data} />;
    case 'EINVOICE':
      return <EInvoiceReport data={data} />;
    case 'DISCOUNT_ANALYSIS':
      return <DiscountAnalysisReport data={data} />;
    case 'SERVICE_CHARGE':
      return <ServiceChargeReport data={data} />;
    case 'MULTI_OUTLET':
      return <MultiOutletReport data={data} />;
    case 'VENDOR_VALIDATION':
      return <VendorValidationReport data={data} />;
    case 'TURNOVER_TRACKER':
      return <TurnoverTrackerReport data={data} />;
    case 'INVOICE_SEQUENCE':
      return <InvoiceSequenceReport data={data} />;
    default:
      return <GenericReport data={data} />;
  }
}

function GSTR1Report({ data }) {
  if (!data || !data.summary) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No GSTR-1 data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>GSTR-1 Sales Report</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Invoices" value={data.summary.totalInvoices || 0} icon={FileText} color="blue" />
        <StatCard label="Taxable Value" value={`₹${(data.summary.totalTaxableValue || 0).toLocaleString()}`} icon={IndianRupee} color="green" />
        <StatCard label="Total Tax" value={`₹${(data.summary.totalTax || 0).toLocaleString()}`} icon={IndianRupee} color="purple" />
        <StatCard label="Total Turnover" value={`₹${(data.summary.totalTurnover || 0).toLocaleString()}`} icon={TrendingUp} color="blue" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.B2B && <Section title="B2B Invoices" data={data.B2B} />}
        {data.B2CL && <Section title="B2C Large (Interstate > ₹2.5L)" data={data.B2CL} />}
        {data.B2CS && <Section title="B2C Small" data={data.B2CS} />}
        {data.HSN && <Section title="HSN/SAC Summary" data={data.HSN} isTable />}
      </div>
    </div>
  );
}

function GSTR3BReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No GSTR-3B data available</p>
      </div>
    );
  }

  const taxPayableTotal = data.taxPayable?.total || 0;
  const itcAvailableTotal = data.itcAvailable?.total || 0;
  const reverseChargeLiability = data.reverseChargeLiability || 0;
  const balancePayable = data.summary?.balancePayable || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>GSTR-3B Tax Summary</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Tax Payable" value={`₹${taxPayableTotal.toLocaleString()}`} icon={IndianRupee} color="red" />
        <StatCard label="ITC Available" value={`₹${itcAvailableTotal.toLocaleString()}`} icon={CheckCircle} color="green" />
        <StatCard label="Reverse Charge" value={`₹${reverseChargeLiability.toLocaleString()}`} icon={AlertTriangle} color="yellow" />
        <StatCard label="Balance Payable" value={`₹${balancePayable.toLocaleString()}`} icon={IndianRupee} color="blue" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.outwardSupplies && <Section title="Outward Supplies (Sales)" data={data.outwardSupplies} />}
        {data.itcAvailable && <Section title="ITC Details" data={data.itcAvailable} />}
        {data.taxPayable && <Section title="Tax Payable Breakdown" data={data.taxPayable} />}
      </div>
    </div>
  );
}

function EInvoiceReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No E-Invoice data available</p>
      </div>
    );
  }

  const currentTurnover = data.currentTurnover || 0;
  const turnoverThreshold = data.turnoverThreshold || 0;
  const requiresEInvoice = data.requiresEInvoice || false;
  const summary = data.summary || { generated: 0, pending: 0, failed: 0, successRate: 0 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>E-Invoice Report</h2>
      </div>
      
      <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, #f5f3ff, #eef2ff)', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '500', marginBottom: '4px' }}>Current Turnover</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>₹{currentTurnover.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '500', marginBottom: '4px' }}>E-Invoice Threshold</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>₹{turnoverThreshold.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '500', marginBottom: '4px' }}>Requires E-Invoicing</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: requiresEInvoice ? '#dc2626' : '#059669' }}>
              {requiresEInvoice ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Generated" value={summary.generated} icon={CheckCircle} color="green" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} color="yellow" />
        <StatCard label="Failed" value={summary.failed} icon={AlertTriangle} color="red" />
        <StatCard label="Success Rate" value={`${(summary.successRate * 100).toFixed(1)}%`} icon={TrendingUp} color="blue" />
      </div>
    </div>
  );
}

function DiscountAnalysisReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No discount data available</p>
      </div>
    );
  }

  const ordersWithDiscount = data.ordersWithDiscount || [];
  const totalDiscountAmount = data.totalDiscountAmount || 0;
  const taxSavingsFromDiscount = data.taxSavingsFromDiscount || 0;
  const totalTaxableValue = data.totalTaxableValue || 0;
  const discountBreakdown = data.discountBreakdown || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Discount Analysis</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Orders with Discount" value={ordersWithDiscount.length} icon={FileText} color="blue" />
        <StatCard label="Total Discount" value={`₹${totalDiscountAmount.toLocaleString()}`} icon={IndianRupee} color="green" />
        <StatCard label="Tax Savings" value={`₹${taxSavingsFromDiscount.toLocaleString()}`} icon={TrendingUp} color="purple" />
        <StatCard label="Taxable Value" value={`₹${totalTaxableValue.toLocaleString()}`} icon={IndianRupee} color="blue" />
      </div>

      <div style={{ background: 'linear-gradient(135deg, #fef3c7, #ffedd5)', borderRadius: '12px', padding: '20px', border: '1px solid #fcd34d' }}>
        <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '20px', background: 'linear-gradient(180deg, #f59e0b, #f97316)', borderRadius: '2px' }} />
          Discount Breakdown by Code
        </h3>
        {Object.keys(discountBreakdown).length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(discountBreakdown).map(([code, amount]) => (
              <li key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #fcd34d' }}>
                <span style={{ fontWeight: '500', color: '#334155' }}>{code}</span>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>₹{amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontSize: '14px', color: '#64748b' }}>No discounts applied</p>
        )}
      </div>
    </div>
  );
}

function ServiceChargeReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No service charge data available</p>
      </div>
    );
  }

  const totalServiceCharge = data.totalServiceCharge || 0;
  const totalGST = data.totalGST || 0;
  const totalRevenue = data.totalRevenue || 0;
  const correctlySeparated = data.correctlySeparated || false;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Service Charge vs GST Report</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Service Charge" value={`₹${totalServiceCharge.toLocaleString()}`} icon={IndianRupee} color="blue" />
        <StatCard label="Total GST" value={`₹${totalGST.toLocaleString()}`} icon={IndianRupee} color="purple" />
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="green" />
        <StatCard 
          label="Service Charge Separated" 
          value={correctlySeparated ? 'Yes' : 'No'} 
          icon={correctlySeparated ? CheckCircle : AlertTriangle}
          color={correctlySeparated ? 'green' : 'red'}
        />
      </div>

      {!correctlySeparated && (
        <div style={{ background: 'linear-gradient(135deg, #fef2f2, #ffedd5)', borderRadius: '12px', padding: '20px', border: '1px solid #fecaca' }}>
          <p style={{ color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px' }} />
            Service charge is not properly separated from GST. This is a compliance issue.
          </p>
        </div>
      )}
    </div>
  );
}

function MultiOutletReport({ data }) {
  if (!data || !Array.isArray(data)) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No multi-outlet data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Multi-Outlet GSTIN Split</h2>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '14px' }}>
          <thead style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Branch</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>GSTIN</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>State</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>Orders</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>Turnover</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>CGST</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>SGST</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>IGST</th>
            </tr>
          </thead>
          <tbody>
            {data.map((branch) => (
              <tr key={branch.gstin} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155' }}>{branch.branchName}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{branch.gstin}</td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{branch.state}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>{branch.totalOrders}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{(branch.totalTurnover || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{(branch.totalCGST || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{(branch.totalSGST || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{(branch.totalIGST || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorValidationReport({ data }) {
  if (!data || !Array.isArray(data)) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No vendor data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Vendor GSTIN Validation</h2>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '14px' }}>
          <thead style={{ background: 'linear-gradient(135deg, #ccfbf1, #cffafe)' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Vendor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>GSTIN</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#334155' }}>Valid Format</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#334155' }}>Registered</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#334155' }}>ITC Eligible</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((vendor) => (
              <tr key={vendor.vendorId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontWeight: '500', color: '#334155' }}>{vendor.vendorName}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>{vendor.gstin || 'N/A'}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {vendor.isValidFormat ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  ) : (
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {vendor.isRegistered ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  ) : (
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {vendor.itcEligible ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  ) : (
                    <AlertTriangle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  )}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>{vendor.registrationStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TurnoverTrackerReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No turnover data available</p>
      </div>
    );
  }

  const currentTurnover = data.currentTurnover || 0;
  const registrationThreshold = data.registrationThreshold || 0;
  const compositionThreshold = data.compositionThreshold || 0;
  const einvoiceThreshold = data.einvoiceThreshold || 0;
  const registrationPercentage = data.registrationPercentage || 0;
  const compositionPercentage = data.compositionPercentage || 0;
  const einvoicePercentage = data.einvoicePercentage || 0;
  const nearRegistrationLimit = data.nearRegistrationLimit || false;
  const nearCompositionLimit = data.nearCompositionLimit || false;
  const nearEinvoiceLimit = data.nearEinvoiceLimit || false;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Turnover Threshold Tracker</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Current Turnover" value={`₹${currentTurnover.toLocaleString()}`} icon={IndianRupee} color="blue" />
        <StatCard label="Registration Limit" value={`₹${registrationThreshold.toLocaleString()}`} icon={AlertTriangle} color="yellow" />
        <StatCard label="Composition Limit" value={`₹${compositionThreshold.toLocaleString()}`} icon={AlertTriangle} color="purple" />
        <StatCard label="E-Invoice Limit" value={`₹${einvoiceThreshold.toLocaleString()}`} icon={AlertTriangle} color="green" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProgressBar label="Registration Threshold" percentage={registrationPercentage} alert={nearRegistrationLimit} />
        <ProgressBar label="Composition Scheme" percentage={compositionPercentage} alert={nearCompositionLimit} />
        <ProgressBar label="E-Invoice" percentage={einvoicePercentage} alert={nearEinvoiceLimit} />
      </div>
    </div>
  );
}

function InvoiceSequenceReport({ data }) {
  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <FileText style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>No invoice sequence data available</p>
      </div>
    );
  }

  const totalInvoices = data.totalInvoices || 0;
  const gapsFound = data.gapsFound || 0;
  const duplicatesFound = data.duplicatesFound || 0;
  const hasIssues = data.hasIssues || false;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Invoice Sequence Report</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Invoices" value={totalInvoices} icon={FileText} color="blue" />
        <StatCard label="Gaps Found" value={gapsFound} icon={AlertTriangle} color={gapsFound > 0 ? 'red' : 'green'} />
        <StatCard label="Duplicates Found" value={duplicatesFound} icon={AlertTriangle} color={duplicatesFound > 0 ? 'red' : 'green'} />
        <StatCard label="Has Issues" value={hasIssues ? 'Yes' : 'No'} icon={hasIssues ? AlertTriangle : CheckCircle} color={hasIssues ? 'red' : 'green'} />
      </div>

      {hasIssues && (
        <div style={{ background: 'linear-gradient(135deg, #fef2f2, #ffedd5)', borderRadius: '12px', padding: '20px', border: '1px solid #fecaca' }}>
          <p style={{ color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ width: '20px', height: '20px' }} />
            Invoice sequence issues detected. Review required before GST filing.
          </p>
        </div>
      )}
    </div>
  );
}

function GenericReport({ data }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #64748b, #475569)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Report</h2>
      </div>
      
      <pre style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', overflowX: 'auto', fontSize: '14px', border: '1px solid #e2e8f0' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', bg: '#eff6ff', text: '#2563eb' },
    green: { gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: '#ecfdf5', text: '#059669' },
    red: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', bg: '#fef2f2', text: '#dc2626' },
    yellow: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: '#fef3c7', text: '#d97706' },
    orange: { gradient: 'linear-gradient(135deg, #f97316, #ea580c)', bg: '#ffedd5', text: '#ea580c' }
  };

  const { gradient, bg, text } = colors[color];

  return (
    <div style={{
      background: bg,
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{value}</div>
    </div>
  );
}

function Section({ title, data, isTable = false }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc' }}>
      <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '4px', height: '20px', background: 'linear-gradient(180deg, #8b5cf6, #6366f1)', borderRadius: '2px' }} />
        {title}
      </h3>
      {isTable ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead style={{ background: 'white' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>HSN/SAC</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>Quantity</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>Taxable Value</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>IGST</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>CGST</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155', background: '#f1f5f9' }}>SGST</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>{item.hsnSac}</td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{item.description}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>{item.totalQuantity}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{item.totalTaxableValue.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{item.totalIGST.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{item.totalCGST.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#334155' }}>₹{item.totalSGST.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ background: 'white', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '500', marginBottom: '4px' }}>{key}</div>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>
                {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, percentage, alert }) {
  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
        <span style={{ fontWeight: '500', color: '#334155' }}>{label}</span>
        <span style={{ fontWeight: '600', color: alert ? '#dc2626' : '#059669' }}>{percentage.toFixed(1)}%</span>
      </div>
      <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
        <div
          style={{
            height: '12px',
            borderRadius: '9999px',
            transition: 'all 0.5s',
            background: alert ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #10b981, #059669)',
            width: `${Math.min(percentage, 100)}%`
          }}
        ></div>
      </div>
      {alert && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle style={{ width: '12px', height: '12px' }} />
          Approaching threshold
        </p>
      )}
    </div>
  );
}
