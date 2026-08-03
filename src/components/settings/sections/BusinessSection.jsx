import React from 'react';
import { PremiumCard, PremiumToggle } from '../SystemControlCenter.jsx';
import { input, label } from '../../../styles/theme';

export default function BusinessSection({ settings, setSettings, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Business Type */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Business Configuration
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Business Type</label>
            <select
              value={settings.businessType || "cafe"}
              onChange={e => setSettings("businessType", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="cafe">Cafe</option>
              <option value="restaurant">Restaurant</option>
              <option value="bakery">Bakery</option>
              <option value="fast_food">Fast Food</option>
              <option value="fine_dining">Fine Dining</option>
              <option value="bar">Bar & Lounge</option>
            </select>
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Default Service Type</label>
            <select
              value={settings.defaultOrderType || "dine_in"}
              onChange={e => setSettings("defaultOrderType", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
            >
              <option value="dine_in">Dine In</option>
              <option value="takeaway">Takeaway</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
        </div>
      </PremiumCard>

      {/* Numbering System */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Numbering System
        </h4>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoicePrefix || "INV"}
              onChange={e => setSettings("invoicePrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="INV"
              maxLength={10}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Order Prefix</label>
            <input
              type="text"
              value={settings.orderPrefix || "ORD"}
              onChange={e => setSettings("orderPrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="ORD"
              maxLength={10}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Kitchen Ticket Prefix</label>
            <input
              type="text"
              value={settings.kitchenPrefix || "KDS"}
              onChange={e => setSettings("kitchenPrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="KDS"
              maxLength={10}
            />
          </div>
          
          <div>
            <label style={{ ...label, fontSize: 12, marginBottom: 6 }}>Table Prefix</label>
            <input
              type="text"
              value={settings.tablePrefix || "TBL"}
              onChange={e => setSettings("tablePrefix", e.target.value)}
              style={{ ...input, width: "100%", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)" }}
              placeholder="TBL"
              maxLength={10}
            />
          </div>
        </div>
      </PremiumCard>

      {/* Order Settings */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Order Settings
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Require Customer Name
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Ask for customer name on every order
              </div>
            </div>
            <PremiumToggle
              value={settings.requireCustomerName}
              onChange={(enabled) => setSettings("requireCustomerName", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Allow Item Notes
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Enable custom notes on individual items
              </div>
            </div>
            <PremiumToggle
              value={settings.allowItemNotes}
              onChange={(enabled) => setSettings("allowItemNotes", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Allow Order Notes
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Enable notes on entire orders
              </div>
            </div>
            <PremiumToggle
              value={settings.allowOrderNotes}
              onChange={(enabled) => setSettings("allowOrderNotes", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Allow Split Bills
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Enable bill splitting functionality
              </div>
            </div>
            <PremiumToggle
              value={settings.allowSplitBills}
              onChange={(enabled) => setSettings("allowSplitBills", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Allow Table Transfer
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Allow moving orders between tables
              </div>
            </div>
            <PremiumToggle
              value={settings.allowTableTransfer}
              onChange={(enabled) => setSettings("allowTableTransfer", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Allow Voids
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Allow voiding items and orders
              </div>
            </div>
            <PremiumToggle
              value={settings.allowVoids}
              onChange={(enabled) => setSettings("allowVoids", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>

      {/* Void & Cancellation */}
      <PremiumCard>
        <h4 style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cafe-text-primary)",
          marginBottom: 20,
          marginTop: 0
        }}>
          Void & Cancellation
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Require Void Reason
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Ask for reason when voiding items
              </div>
            </div>
            <PremiumToggle
              value={settings.requireVoidReason}
              onChange={(enabled) => setSettings("requireVoidReason", enabled)}
              size="small"
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--cafe-text-primary)",
                marginBottom: 2
              }}>
                Require Cancellation Reason
              </div>
              <div style={{
                fontSize: 10,
                color: "var(--cafe-text-tertiary)"
              }}>
                Ask for reason when cancelling orders
              </div>
            </div>
            <PremiumToggle
              value={settings.requireCancellationReason}
              onChange={(enabled) => setSettings("requireCancellationReason", enabled)}
              size="small"
            />
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
