 
import React from 'react';
import { btn, input, label, card } from "../../styles/theme";

const CustomerPanel = ({ 
  customerPhone, 
  onCustomerPhoneChange, 
  availableCustomers,
  showOrderHistory,
  onToggleOrderHistory,
  customerOrders,
  onReorderItems
}) => {
  const match = customerPhone.trim() ? availableCustomers.find(c => c.phone === customerPhone.trim()) : null;
  
  // Calculate customer stats
  const customerStats = React.useMemo(() => {
    if (!match || !customerOrders.length) return null;
    
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total || order.amount || 0), 0);
    const avgSpend = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrder = customerOrders[0]; // Assuming orders are sorted by date desc
    
    return {
      visitCount: totalOrders,
      totalSpent,
      avgSpend,
      lastOrder
    };
  }, [match, customerOrders]);

  return (
    <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
      <label style={label}>Customer Phone (optional)</label>
      <div style={{ display: "flex", gap: "var(--cafe-space-sm)" }}>
        <input
          style={{ ...input, flex: 1, transition: "border-color .15s, box-shadow .15s" }}
          value={customerPhone}
          onChange={(e) => onCustomerPhoneChange(e.target.value)}
          placeholder="For receipt & loyalty tracking"
          aria-label="Customer phone number"
          onFocus={e => { e.currentTarget.style.borderColor = "var(--cafe-accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--cafe-accent-dim)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "none"; }}
        />
        {customerPhone.trim() && (
          <button
            onClick={onToggleOrderHistory}
            style={{
              ...btn("ghost"),
              padding: "8px 12px",
              fontSize: "var(--cafe-font-xs)",
              transition: "background .15s, transform .1s",
            }}
            title="View order history"
            aria-label="View order history"
            onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; }}
          >
            📜
          </button>
        )}
      </div>
      
      {/* Customer Recognition Card */}
      {customerPhone.trim() && match && (
        <div style={{
          ...card(),
          marginTop: "var(--cafe-space-sm)",
          padding: "var(--cafe-space-md)",
          border: `1px solid var(--cafe-success-border)`,
          background: "var(--cafe-success-bg)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "var(--cafe-space-sm)" }}>
            <span style={{ fontSize: 20 }}>👤</span>
            <div>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-success)" }}>
                {match.name || "Returning Customer"}
              </div>
              <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                {match.phone}
              </div>
            </div>
          </div>
          
          {/* Customer Stats */}
          {customerStats && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "var(--cafe-space-sm)",
              marginTop: "var(--cafe-space-sm)",
              paddingTop: "var(--cafe-space-sm)",
              borderTop: `1px solid var(--cafe-success-border)`
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-success)" }}>
                  {customerStats.visitCount}
                </div>
                <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                  Visits
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-success)" }}>
                  ₹{Math.round(customerStats.avgSpend)}
                </div>
                <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                  Avg Spend
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-success)" }}>
                  ₹{Math.round(customerStats.totalSpent)}
                </div>
                <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                  Total
                </div>
              </div>
            </div>
          )}
          
          {/* Allergies/Dietary Info */}
          {match.allergies && match.allergies.length > 0 && (
            <div style={{ 
              marginTop: "var(--cafe-space-sm)",
              paddingTop: "var(--cafe-space-sm)",
              borderTop: `1px solid var(--cafe-success-border)`
            }}>
              <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-warning)", marginBottom: 4 }}>
                ⚠️ Allergies
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {match.allergies.map((allergen, idx) => (
                  <span key={idx} style={{
                    fontSize: "var(--cafe-font-xs)",
                    padding: "2px 8px",
                    background: "var(--cafe-warning-bg)",
                    border: `1px solid var(--cafe-warning-border)`,
                    borderRadius: "var(--cafe-radius-sm)",
                    color: "var(--cafe-warning)"
                  }}>
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Dietary Preferences */}
          {match.dietaryPreferences && match.dietaryPreferences.length > 0 && (
            <div style={{ marginTop: "var(--cafe-space-sm)" }}>
              <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                🥗 Dietary Preferences
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {match.dietaryPreferences.map((pref, idx) => (
                  <span key={idx} style={{
                    fontSize: "var(--cafe-font-xs)",
                    padding: "2px 8px",
                    background: "var(--cafe-bg-surface)",
                    border: `1px solid var(--cafe-border-light)`,
                    borderRadius: "var(--cafe-radius-sm)",
                    color: "var(--cafe-text-secondary)"
                  }}>
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Loyalty Points (if available) */}
          {match.loyaltyPoints !== undefined && (
            <div style={{ 
              marginTop: "var(--cafe-space-sm)",
              paddingTop: "var(--cafe-space-sm)",
              borderTop: `1px solid var(--cafe-success-border)`,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-accent)" }}>
                {match.loyaltyPoints} Loyalty Points
              </span>
            </div>
          )}
        </div>
      )}
      
      {customerPhone.trim() && !match && (
        <div style={{ marginTop: 6, fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
          New customer — saved after this order
        </div>
      )}

      {/* Order History Panel */}
      {showOrderHistory && customerPhone.trim() && customerOrders.length > 0 && (
        <div style={{ marginTop: "var(--cafe-space-sm)", display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)" }}>
          <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-text-secondary)" }}>
            Recent Orders (Last 3)
          </div>
          {customerOrders.map(order => (
            <div key={order.id} style={{
              padding: "var(--cafe-space-sm)",
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: "var(--cafe-radius-sm)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--cafe-space-xs)" }}>
                <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)" }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
                </span>
                <span style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: "var(--cafe-accent)" }}>
                  ₹{Math.round(order.total || order.amount || 0)}
                </span>
              </div>
              <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-xs)" }}>
                {Array.isArray(order.items) ? order.items.map(i => `${i.name} × ${i.qty || 1}`).join(", ") : "Items"}
              </div>
              <button
                onClick={() => onReorderItems(Array.isArray(order.items) ? order.items : [])}
                style={{
                  ...btn("primary"),
                  padding: "4px 8px",
                  fontSize: "var(--cafe-font-xs)",
                  width: "100%",
                  transition: "filter .15s, transform .1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = ""; }}
              >
                🔄 Repeat Order
              </button>
            </div>
          ))}
        </div>
      )}
      {showOrderHistory && customerPhone.trim() && customerOrders.length === 0 && (
        <div style={{ marginTop: "var(--cafe-space-sm)", padding: "var(--cafe-space-sm)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
          No order history found
        </div>
      )}
    </div>
  );
};

export default CustomerPanel;
