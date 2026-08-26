// Payroll Integration System

export const PayrollStatus = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  PROCESSED: 'processed',
  PAID: 'paid',
  CANCELLED: 'cancelled'
};

export const PayFrequency = {
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

export const PaymentMethod = {
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  CHECK: 'check',
  DIRECT_DEPOSIT: 'direct_deposit'
};

class PayrollManager {
  constructor() {
    this.payrollPeriods = [];
    this.payrollItems = [];
    this.deductions = [];
    this.taxRates = {};
    this.loadFromStorage();
  }

  // Load payroll data from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedPeriods = localStorage.getItem('payroll_periods');
        const storedItems = localStorage.getItem('payroll_items');
        const storedDeductions = localStorage.getItem('payroll_deductions');
        const storedTaxRates = localStorage.getItem('tax_rates');
        
        if (storedPeriods) {
          this.payrollPeriods = JSON.parse(storedPeriods);
        }
        if (storedItems) {
          this.payrollItems = JSON.parse(storedItems);
        }
        if (storedDeductions) {
          this.deductions = JSON.parse(storedDeductions);
        }
        if (storedTaxRates) {
          this.taxRates = JSON.parse(storedTaxRates);
        }
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
    }
  }

  // Save payroll data to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('payroll_periods', JSON.stringify(this.payrollPeriods));
        localStorage.setItem('payroll_items', JSON.stringify(this.payrollItems));
        localStorage.setItem('payroll_deductions', JSON.stringify(this.deductions));
        localStorage.setItem('tax_rates', JSON.stringify(this.taxRates));
      }
    } catch (error) {
      console.error('Error saving payroll data:', error);
    }
  }

  // Create payroll period
  createPayrollPeriod(periodData) {
    const period = {
      id: this.generateId(),
      ...periodData,
      status: PayrollStatus.DRAFT,
      frequency: periodData.frequency || PayFrequency.MONTHLY,
      createdAt: new Date().toISOString(),
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      employeeCount: 0
    };

    this.payrollPeriods.push(period);
    this.saveToStorage();
    
    return period;
  }

  // Update payroll period
  updatePayrollPeriod(periodId, updates) {
    const index = this.payrollPeriods.findIndex(p => p.id === periodId);
    if (index === -1) {
      throw new Error('Payroll period not found');
    }

    this.payrollPeriods[index] = {
      ...this.payrollPeriods[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.payrollPeriods[index];
  }

  // Add payroll item for employee
  addPayrollItem(payrollPeriodId, itemData) {
    const item = {
      id: this.generateId(),
      payrollPeriodId,
      ...itemData,
      createdAt: new Date().toISOString()
    };

    // Calculate gross pay
    const grossPay = this.calculateGrossPay(item);
    item.grossPay = grossPay;

    // Calculate deductions
    const deductions = this.calculateDeductions(item);
    item.deductions = deductions;

    // Calculate net pay
    item.netPay = grossPay - deductions.total;

    this.payrollItems.push(item);

    // Update payroll period totals
    this.updatePayrollPeriodTotals(payrollPeriodId);

    this.saveToStorage();
    return item;
  }

  // Calculate gross pay for employee
  calculateGrossPay(payrollItem) {
    const baseSalary = payrollItem.baseSalary || 0;
    const hourlyRate = payrollItem.hourlyRate || 0;
    const hoursWorked = payrollItem.hoursWorked || 0;
    const overtimeHours = payrollItem.overtimeHours || 0;
    const overtimeRate = payrollItem.overtimeRate || hourlyRate * 1.5;
    const bonuses = payrollItem.bonuses || 0;
    const commissions = payrollItem.commissions || 0;

    const regularPay = hourlyRate > 0 ? hoursWorked * hourlyRate : baseSalary;
    const overtimePay = overtimeHours * overtimeRate;

    return regularPay + overtimePay + bonuses + commissions;
  }

  // Calculate deductions for employee
  calculateDeductions(payrollItem) {
    const grossPay = payrollItem.grossPay;
    const deductions = {
      tax: 0,
      socialSecurity: 0,
      medicare: 0,
      retirement: 0,
      healthInsurance: 0,
      other: 0,
      total: 0
    };

    // Tax deduction
    const taxRate = this.taxRates.incomeTax || 0.1;
    deductions.tax = grossPay * taxRate;

    // Social security
    const ssRate = this.taxRates.socialSecurity || 0.062;
    deductions.socialSecurity = grossPay * ssRate;

    // Medicare
    const medicareRate = this.taxRates.medicare || 0.0145;
    deductions.medicare = grossPay * medicareRate;

    // Retirement contribution
    if (payrollItem.retirementContribution) {
      deductions.retirement = payrollItem.retirementContribution;
    }

    // Health insurance
    if (payrollItem.healthInsurance) {
      deductions.healthInsurance = payrollItem.healthInsurance;
    }

    // Other deductions
    if (payrollItem.otherDeductions) {
      deductions.other = payrollItem.otherDeductions;
    }

    deductions.total = Object.values(deductions).reduce((sum, val) => sum + val, 0);

    return deductions;
  }

  // Update payroll period totals
  updatePayrollPeriodTotals(periodId) {
    const period = this.payrollPeriods.find(p => p.id === periodId);
    if (!period) return;

    const items = this.payrollItems.filter(i => i.payrollPeriodId === periodId);

    period.totalGrossPay = items.reduce((sum, i) => sum + i.grossPay, 0);
    period.totalNetPay = items.reduce((sum, i) => sum + i.netPay, 0);
    period.totalDeductions = items.reduce((sum, i) => sum + i.deductions.total, 0);
    period.employeeCount = items.length;

    this.saveToStorage();
  }

  // Process payroll period
  processPayrollPeriod(periodId, processedBy) {
    const period = this.payrollPeriods.find(p => p.id === periodId);
    if (!period) {
      throw new Error('Payroll period not found');
    }

    return this.updatePayrollPeriod(periodId, {
      status: PayrollStatus.PROCESSED,
      processedBy,
      processedAt: new Date().toISOString()
    });
  }

  // Approve payroll period
  approvePayrollPeriod(periodId, approvedBy) {
    const period = this.payrollPeriods.find(p => p.id === periodId);
    if (!period) {
      throw new Error('Payroll period not found');
    }

    return this.updatePayrollPeriod(periodId, {
      status: PayrollStatus.APPROVED,
      approvedBy,
      approvedAt: new Date().toISOString()
    });
  }

  // Mark payroll as paid
  markAsPaid(periodId, paymentMethod, paidBy) {
    const period = this.payrollPeriods.find(p => p.id === periodId);
    if (!period) {
      throw new Error('Payroll period not found');
    }

    return this.updatePayrollPeriod(periodId, {
      status: PayrollStatus.PAID,
      paymentMethod,
      paidBy,
      paidAt: new Date().toISOString()
    });
  }

  // Get payroll period by ID
  getPayrollPeriod(periodId) {
    return this.payrollPeriods.find(p => p.id === periodId);
  }

  // Get all payroll periods
  getAllPayrollPeriods(filters = {}) {
    let filtered = [...this.payrollPeriods];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.frequency) {
      filtered = filtered.filter(p => p.frequency === filters.frequency);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(p => {
        const periodDate = new Date(p.startDate);
        return periodDate >= new Date(filters.startDate) && periodDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  // Get payroll items for period
  getPayrollItems(periodId) {
    return this.payrollItems.filter(i => i.payrollPeriodId === periodId);
  }

  // Get payroll item for employee
  getEmployeePayrollItem(periodId, employeeId) {
    return this.payrollItems.find(i => 
      i.payrollPeriodId === periodId && i.employeeId === employeeId
    );
  }

  // Update tax rates
  updateTaxRates(rates) {
    this.taxRates = {
      ...this.taxRates,
      ...rates,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return this.taxRates;
  }

  // Get tax rates
  getTaxRates() {
    return this.taxRates;
  }

  // Generate payslip for employee
  generatePayslip(periodId, employeeId) {
    const period = this.getPayrollPeriod(periodId);
    const item = this.getEmployeePayrollItem(periodId, employeeId);

    if (!period || !item) {
      throw new Error('Payroll period or item not found');
    }

    return {
      period: {
        id: period.id,
        startDate: period.startDate,
        endDate: period.endDate,
        payDate: period.payDate
      },
      employee: {
        id: item.employeeId,
        name: item.employeeName,
        employeeId: item.employeeNumber
      },
      earnings: {
        baseSalary: item.baseSalary || 0,
        regularPay: item.hourlyRate * item.hoursWorked,
        overtimePay: (item.overtimeHours || 0) * (item.overtimeRate || item.hourlyRate * 1.5),
        bonuses: item.bonuses || 0,
        commissions: item.commissions || 0,
        total: item.grossPay
      },
      deductions: item.deductions,
      netPay: item.netPay,
      paymentMethod: period.paymentMethod
    };
  }

  // Get payroll statistics
  getStatistics(startDate, endDate) {
    const periods = this.getAllPayrollPeriods({ startDate, endDate });
    
    const totalPeriods = periods.length;
    const totalGrossPay = periods.reduce((sum, p) => sum + p.totalGrossPay, 0);
    const totalNetPay = periods.reduce((sum, p) => sum + p.totalNetPay, 0);
    const totalDeductions = periods.reduce((sum, p) => sum + p.totalDeductions, 0);

    const byStatus = {};
    periods.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      totalPeriods,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      averageGrossPay: totalPeriods > 0 ? totalGrossPay / totalPeriods : 0,
      averageNetPay: totalPeriods > 0 ? totalNetPay / totalPeriods : 0,
      byStatus
    };
  }

  // Export payroll as CSV
  exportToCSV(periodId) {
    const items = this.getPayrollItems(periodId);
    const headers = ['Employee ID', 'Employee Name', 'Gross Pay', 'Total Deductions', 'Net Pay', 'Payment Method'];
    const rows = items.map(item => [
      item.employeeId,
      item.employeeName,
      item.grossPay.toFixed(2),
      item.deductions.total.toFixed(2),
      item.netPay.toFixed(2),
      item.paymentMethod || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Generate unique ID
  generateId() {
    return `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let payrollManager = null;

export const getPayrollManager = () => {
  if (!payrollManager) {
    payrollManager = new PayrollManager();
  }
  return payrollManager;
};
