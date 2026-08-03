import React from 'react';
import { useMemo } from "react";
import { ISSUE_SEVERITY } from "../../domain/shiftModel.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

function IssuesPanel({ shift, context }) {
  const isMobile = useIsMobile();

  // Calculate issues based on shift and context
  const issues = useMemo(() => {
    const allIssues = [];

    // Cash mismatch
    if (shift.cashDifference !== null && Math.abs(shift.cashDifference) > 10) {
      allIssues.push({
        id: 'cash-mismatch',
        type: 'CASH_MISMATCH',
        severity: ISSUE_SEVERITY.HIGH,
        title: 'Cash Mismatch',
        description: `Cash difference of ₹${Math.abs(shift.cashDifference)} detected`,
        action: 'Count cash again'
      });
    }

    // Open orders
    if (context?.openOrders?.length > 0) {
      allIssues.push({
        id: 'open-orders',
        type: 'OPEN_ORDERS',
        severity: ISSUE_SEVERITY.CRITICAL,
        title: 'Open Orders',
        description: `${context.openOrders.length} orders still open`,
        count: context.openOrders.length,
        action: 'Complete or cancel orders'
      });
    }

    // Open tables
    if (context?.openTables?.length > 0) {
      allIssues.push({
        id: 'open-tables',
        type: 'OPEN_TABLES',
        severity: ISSUE_SEVERITY.HIGH,
        title: 'Open Tables',
        description: `${context.openTables.length} tables still occupied`,
        count: context.openTables.length,
        action: 'Clear tables'
      });
    }

    // Unfinished kitchen tickets
    if (context?.unfinishedTickets?.length > 0) {
      allIssues.push({
        id: 'unfinished-tickets',
        type: 'UNFINISHED_TICKETS',
        severity: ISSUE_SEVERITY.HIGH,
        title: 'Unfinished Kitchen Tickets',
        description: `${context.unfinishedTickets.length} tickets not completed`,
        count: context.unfinishedTickets.length,
        action: 'Complete kitchen tickets'
      });
    }

    // Pending refunds
    if (context?.pendingRefunds?.length > 0) {
      allIssues.push({
        id: 'pending-refunds',
        type: 'PENDING_REFUNDS',
        severity: ISSUE_SEVERITY.HIGH,
        title: 'Pending Refunds',
        description: `${context.pendingRefunds.length} refunds pending`,
        count: context.pendingRefunds.length,
        action: 'Process refunds'
      });
    }

    // Payment reconciliation issues
    Object.entries(shift.payments || {}).forEach(([type, data]) => {
      if (Math.abs(data.difference) > 1) {
        allIssues.push({
          id: `payment-${type}`,
          type: 'PAYMENT_MISMATCH',
          severity: ISSUE_SEVERITY.MEDIUM,
          title: `${type.replace('_', ' ')} Mismatch`,
          description: `Difference of ₹${Math.abs(data.difference)}`,
          action: 'Reconcile payments'
        });
      }
    });

    // Cash not counted
    if (shift.actualCash === null) {
      allIssues.push({
        id: 'cash-not-counted',
        type: 'CASH_NOT_COUNTED',
        severity: ISSUE_SEVERITY.CRITICAL,
        title: 'Cash Not Counted',
        description: 'Cash drawer has not been counted',
        action: 'Count cash drawer'
      });
    }

    // Add shift issues
    if (shift.issues && shift.issues.length > 0) {
      allIssues.push(...shift.issues);
    }

    return allIssues.sort((a, b) => {
      const severityOrder = {
        [ISSUE_SEVERITY.CRITICAL]: 0,
        [ISSUE_SEVERITY.HIGH]: 1,
        [ISSUE_SEVERITY.MEDIUM]: 2,
        [ISSUE_SEVERITY.LOW]: 3
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [shift, context]);

  const criticalCount = issues.filter(i => i.severity === ISSUE_SEVERITY.CRITICAL).length;
  const highCount = issues.filter(i => i.severity === ISSUE_SEVERITY.HIGH).length;
  const mediumCount = issues.filter(i => i.severity === ISSUE_SEVERITY.MEDIUM).length;
  const lowCount = issues.filter(i => i.severity === ISSUE_SEVERITY.LOW).length;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ISSUE_SEVERITY.CRITICAL: return '#e74c3c';
      case ISSUE_SEVERITY.HIGH: return '#f39c12';
      case ISSUE_SEVERITY.MEDIUM: return '#e67e22';
      case ISSUE_SEVERITY.LOW: return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ISSUE_SEVERITY.CRITICAL: return '🚨';
      case ISSUE_SEVERITY.HIGH: return '⚠️';
      case ISSUE_SEVERITY.MEDIUM: return '📋';
      case ISSUE_SEVERITY.LOW: return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--cafe-text-primary)'
      }}>
        Issues Panel
      </div>

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <SeverityBadge
          label="Critical"
          count={criticalCount}
          color={getSeverityColor(ISSUE_SEVERITY.CRITICAL)}
        />
        <SeverityBadge
          label="High"
          count={highCount}
          color={getSeverityColor(ISSUE_SEVERITY.HIGH)}
        />
        <SeverityBadge
          label="Medium"
          count={mediumCount}
          color={getSeverityColor(ISSUE_SEVERITY.MEDIUM)}
        />
        <SeverityBadge
          label="Low"
          count={lowCount}
          color={getSeverityColor(ISSUE_SEVERITY.LOW)}
        />
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <div style={{
          background: 'var(--cafe-bg-surface)',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '40px',
          border: '1px solid var(--cafe-border-light)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✅</div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            All Clear
          </div>
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
            No issues detected for this shift
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              color={getSeverityColor(issue.severity)}
              icon={getSeverityIcon(issue.severity)}
            />
          ))}
        </div>
      )}

      {/* Blocker Warning */}
      {criticalCount > 0 && (
        <div style={{
          background: '#fee',
          border: '1px solid #e74c3c',
          borderRadius: 'var(--cafe-radius-lg)',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#e74c3c',
            marginBottom: '8px'
          }}>
            🚨 Shift Cannot Close
          </div>
          <div style={{
            fontSize: '14px',
            color: '#e74c3c'
          }}>
            {criticalCount} critical issue(s) must be resolved before closing this shift.
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ label, count, color }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '20px',
      border: '1px solid var(--cafe-border-light)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color,
        marginBottom: '8px'
      }}>
        {count}
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--cafe-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
    </div>
  );
}

function IssueCard({ issue, color, icon }) {
  return (
    <div style={{
      background: 'var(--cafe-bg-surface)',
      borderRadius: 'var(--cafe-radius-lg)',
      padding: '16px',
      border: `2px solid ${color}`,
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start'
    }}>
      <div style={{
        fontSize: '24px',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '4px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)'
          }}>
            {issue.title}
          </div>
          <div style={{
            padding: '4px 8px',
            background: `${color}20`,
            color,
            borderRadius: 'var(--cafe-radius-sm)',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {issue.severity}
          </div>
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--cafe-text-secondary)',
          marginBottom: '8px'
        }}>
          {issue.description}
        </div>
        {issue.action && (
          <button style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '600',
            background: color,
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-sm)',
            cursor: 'pointer'
          }}>
            {issue.action}
          </button>
        )}
      </div>
    </div>
  );
}

export default IssuesPanel;
