import React from 'react';
import { useMemo } from "react";
import { formatCurrency } from "../../domain/money.js";

function ShiftReport({ shift, orders, menuItems, onPrint, onExport }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Calculate top items
  const topItems = useMemo(() => {
    if (!shift || !orders || !menuItems) return [];
    
    const shiftOrders = orders.filter(o => {
      const orderTime = new Date(o.createdAt);
      const shiftStart = new Date(shift.openedAt);
      return orderTime >= shiftStart;
    });

    const itemCounts = {};
    shiftOrders.forEach(order => {
      order.items?.forEach(item => {
        itemCounts[item.id] = (itemCounts[item.id] || 0) + (item.quantity || 1);
      });
    });

    return Object.entries(itemCounts)
      .map(([itemId, count]) => ({
        item: menuItems.find(m => m.id === itemId),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [shift, orders, menuItems]);

  const shiftDuration = useMemo(() => {
    if (!shift || !shift.openedAt) return 0;
    const opened = new Date(shift.openedAt);
    const closed = shift.closedAt ? new Date(shift.closedAt) : new Date();
    return Math.floor((closed - opened) / 60000);
  }, [shift]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--cafe-text-primary)'
        }}>
          Shift Report
        </div>
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onExport}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              background: 'var(--cafe-bg-elevated)',
              color: 'var(--cafe-text-primary)',
              border: '1px solid var(--cafe-border-light)',
              borderRadius: 'var(--cafe-radius-md)',
              cursor: 'pointer'
            }}
          >
            Export
          </button>
          <button
            onClick={onPrint}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              background: 'var(--cafe-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--cafe-radius-md)',
              cursor: 'pointer'
            }}
          >
            Print
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--cafe-radius-lg)',
        padding: '32px',
        border: '1px solid var(--cafe-border-light)'
      }}>
        {/* Report Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            marginBottom: '8px'
          }}>
            Shift Report
          </div>
          <div style={{
            fontSize: '16px',
            color: 'var(--cafe-text-secondary)',
            marginBottom: '4px'
          }}>
            {shift.id}
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--cafe-text-secondary)'
          }}>
            {shift.registerId} • {shift.terminalId}
          </div>
        </div>

        {/* Shift Details */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Shift Details
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <DetailRow label="Manager" value={shift.managerName} />
            <DetailRow label="Cashier" value={shift.cashierName} />
            <DetailRow label="Opened" value={new Date(shift.openedAt).toLocaleString()} />
            <DetailRow label="Closed" value={shift.closedAt ? new Date(shift.closedAt).toLocaleString() : 'Active'} />
            <DetailRow label="Duration" value={`${shiftDuration} minutes`} />
            <DetailRow label="Status" value={shift.status} />
          </div>
        </div>

        {/* Revenue Summary */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Revenue Summary
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            <RevenueCard label="Gross Sales" value={shift.grossSales} highlight />
            <RevenueCard label="Net Sales" value={shift.netSales} highlight />
            <RevenueCard label="Average Order" value={shift.averageOrderValue} />
          </div>
        </div>

        {/* Payment Breakdown */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Payment Breakdown
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            {Object.entries(shift.payments || {}).map(([type, data]) => (
              <PaymentRow
                key={type}
                label={type.replace('_', ' ')}
                expected={data.expected}
                actual={data.actual}
              />
            ))}
          </div>
        </div>

        {/* Adjustments */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Adjustments
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            <AdjustmentRow label="Discounts" value={shift.discounts} />
            <AdjustmentRow label="Voids" value={shift.voids} />
            <AdjustmentRow label="Refunds" value={shift.refunds} />
            <AdjustmentRow label="Cancelled" value={shift.cancelledOrders} type="count" />
          </div>
        </div>

        {/* Cash Drawer */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Cash Drawer
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <DetailRow label="Opening Float" value={formatCurrency(shift.openingFloat)} />
            <DetailRow label="Cash Sales" value={formatCurrency(shift.cashSales)} />
            <DetailRow label="Cash Refunds" value={formatCurrency(shift.cashRefunds)} />
            <DetailRow label="Cash Paid Out" value={formatCurrency(shift.cashPaidOut)} />
            <DetailRow label="Expected Cash" value={formatCurrency(shift.expectedCash)} highlight />
            <DetailRow 
              label="Actual Cash" 
              value={shift.actualCash !== null ? formatCurrency(shift.actualCash) : 'Not counted'} 
              highlight
            />
            {shift.actualCash !== null && (
              <DetailRow
                label="Difference"
                value={formatCurrency(shift.cashDifference)}
                highlight
                color={Math.abs(shift.cashDifference) < 10 ? '#27ae60' : '#e74c3c'}
              />
            )}
          </div>
        </div>

        {/* Top Items */}
        {topItems.length > 0 && (
          <div style={{
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--cafe-border-light)'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '16px'
            }}>
              Top Selling Items
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--cafe-bg-elevated)',
                    borderRadius: 'var(--cafe-radius-md)'
                  }}
                >
                  <span style={{ fontSize: '14px', color: 'var(--cafe-text-primary)' }}>
                    {item.item?.name || 'Unknown Item'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>
                    {item.count} sold
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operational Metrics */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--cafe-border-light)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--cafe-text-primary)',
            marginBottom: '16px'
          }}>
            Operational Metrics
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '12px'
          }}>
            <DetailRow label="Orders" value={shift.orderCount} />
            <DetailRow label="Customers" value={shift.customersServed} />
            <DetailRow label="Kitchen Tickets" value={shift.kitchenTickets} />
            <DetailRow label="Reservations" value={shift.reservations} />
          </div>
        </div>

        {/* Manager Notes */}
        {shift.managerNotes && (
          <div style={{
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--cafe-border-light)'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--cafe-text-primary)',
              marginBottom: '16px'
            }}>
              Manager Notes
            </div>
            <div style={{
              padding: '16px',
              background: 'var(--cafe-bg-elevated)',
              borderRadius: 'var(--cafe-radius-md)',
              fontSize: '14px',
              color: 'var(--cafe-text-primary)',
              fontStyle: 'italic'
            }}>
              {shift.managerNotes}
            </div>
          </div>
        )}

        {/* Signature */}
        <div style={{
          marginTop: '48px',
          paddingTop: '24px',
          borderTop: '2px solid var(--cafe-border-light)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '32px'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--cafe-text-secondary)',
                marginBottom: '8px'
              }}>
                Manager Signature
              </div>
              <div style={{
                height: '48px',
                borderBottom: '1px solid var(--cafe-border-light)'
              }} />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--cafe-text-secondary)',
                marginBottom: '8px'
              }}>
                Date & Time
              </div>
              <div style={{
                fontSize: '16px',
                color: 'var(--cafe-text-primary)',
                fontWeight: '600'
              }}>
                {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false, color }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: highlight ? 'var(--cafe-bg-elevated)' : 'transparent',
      borderRadius: 'var(--cafe-radius-sm)'
    }}>
      <span style={{
        fontSize: '14px',
        color: 'var(--cafe-text-secondary)'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '14px',
        fontWeight: highlight ? '600' : '500',
        color: color || 'var(--cafe-text-primary)'
      }}>
        {value}
      </span>
    </div>
  );
}

function RevenueCard({ label, value, highlight }) {
  return (
    <div style={{
      padding: '16px',
      background: highlight ? 'var(--cafe-primary)' : 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--cafe-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: highlight ? 'white' : 'var(--cafe-text-primary)'
      }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

function PaymentRow({ label, expected, actual }) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--cafe-bg-elevated)',
      borderRadius: 'var(--cafe-radius-md)'
    }}>
      <div style={{
        fontSize: '12px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        fontWeight: '500',
        color: 'var(--cafe-text-primary)'
      }}>
        <span>Expected: {formatCurrency(expected)}</span>
        <span>Actual: {formatCurrency(actual)}</span>
      </div>
    </div>
  );
}

function AdjustmentRow({ label, value, type = 'currency' }) {
  return (
    <div style={{
      padding: '12px',
      background: '#fee',
      borderRadius: 'var(--cafe-radius-md)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '12px',
        color: 'var(--cafe-text-secondary)',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: '#e74c3c'
      }}>
        {type === 'currency' ? formatCurrency(value) : value}
      </div>
    </div>
  );
}

export default ShiftReport;
