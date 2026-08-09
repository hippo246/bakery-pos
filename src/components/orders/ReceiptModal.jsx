// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Receipt Modal
 * Modal for displaying order receipts with print/email/SMS options
 */

import { btn, input } from "../../styles/theme";
import { getOrderDisplayItems, getOrderCustomerName, getOrderAmount } from "../../domain/orderModel.js";
import { BUSINESS_DETAILS } from "../../data/documentConstants.js";

function ReceiptModal({ 
  isOpen, 
  onClose, 
  order, 
  staff, 
  receiptOptions = { type: "print", email: "", phone: "", customFooter: "" }, 
  updateReceiptOption, 
  printReceipt, 
  sendReceiptEmail, 
  sendReceiptSMS 
}) {
  if (!isOpen || !order) return null;

  const o = order;

  // Business info: prefer props passed in, fall back to sensible defaults
  const bizName    = (staff && staff[0] && staff[0].businessName) || BUSINESS_DETAILS.legalName || "CafeOS";
  const bizAddress = (staff && staff[0] && staff[0].businessAddress) || BUSINESS_DETAILS.address || "";
  const bizPhone   = (staff && staff[0] && staff[0].businessPhone) || BUSINESS_DETAILS.phone || "";
  const bizGST     = (staff && staff[0] && (staff[0].businessGST || staff[0].gstNumber)) || BUSINESS_DETAILS.gstNumber || "";
  const bizFssai   = (staff && staff[0] && (staff[0].businessFssai || staff[0].fssaiNumber)) || BUSINESS_DETAILS.fssaiNumber || "";

  // Amounts — always parse to numbers so math is safe
  const subtotal      = Number(o.subtotal ?? o.subTotal ?? 0);
  const taxAmount     = Number(o.taxAmount ?? o.tax ?? 0);
  const discountAmt   = Number(o.discountAmount ?? o.discount ?? 0);
  const packagingAmt  = Number(o.packagingCharge ?? 0);
  const totalAmt      = Number(getOrderAmount(o)) || 0;

  // Items — normalise so we always have an array
  const items = Array.isArray(o.items) && o.items.length > 0
    ? o.items
    : null;

  // Order-type label
  const orderTypeLabels = {
    DINE_IN: "Dine-in", TAKEAWAY: "Takeaway",
    DIRECT_DELIVERY: "Delivery", SWIGGY: "Swiggy", ZOMATO: "Zomato",
  };
  const orderTypeLabel = orderTypeLabels[o.orderType] || o.source || "";

  // Payment line: show method + status
  const paymentLine = [o.paymentMethod, o.paymentStatus].filter(Boolean).join(" · ") || "—";

  // Date formatting
  const dateStr = o.createdAt
    ? new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  // Safe integer rupee formatter — no floating garbage
  const rs = (n) => `₹${Math.round(Number(n) || 0)}`;

  // Whether to show subtotal row (only if it meaningfully differs from total)
  const showSubtotal = subtotal > 0 && (taxAmount > 0 || discountAmt > 0 || packagingAmt > 0);

  return (
    <div
      className="modal-overlay"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes receiptScaleIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
      <div
        className="modal-panel"
        style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", width: "min(420px,95vw)", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--cafe-shadow-xl)", display: "flex", flexDirection: "column", animation: "receiptScaleIn 0.18s ease" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal chrome header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid var(--cafe-border-light)`, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Receipt</div>
            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 1, fontFamily: "monospace" }}>{o.id}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              padding: "3px 8px", borderRadius: "var(--cafe-radius-sm)",
              background: o.paymentStatus === "PAID" ? "var(--cafe-success-bg)" : o.paymentStatus === "COD" ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)",
              color: o.paymentStatus === "PAID" ? "var(--cafe-success)" : o.paymentStatus === "COD" ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)",
              border: `1px solid ${o.paymentStatus === "PAID" ? "var(--cafe-success-border)" : o.paymentStatus === "COD" ? "var(--cafe-warning-border)" : "var(--cafe-border-light)"}`,
            }}>{o.paymentStatus || "UNPAID"}</span>
            <button
              onClick={onClose}
              aria-label="Close receipt"
              style={{ background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-sm)", color: "var(--cafe-text-tertiary)", fontSize: 16, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .15s, color .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; e.currentTarget.style.color = "var(--cafe-text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--cafe-bg-surface)"; e.currentTarget.style.color = "var(--cafe-text-tertiary)"; }}
            >×</button>
          </div>
        </div>

        {/* Thermal receipt area */}
        <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
          <div id="receipt-content" style={{ background: "#fff", color: "#111", padding: "20px 18px", borderRadius: 6, fontFamily: "'Courier New', Courier, monospace", fontSize: 12, lineHeight: 1.55 }}>

            {/* Business header */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed #999", paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>{bizName}</div>
              {bizAddress && <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{bizAddress}</div>}
              {bizPhone   && <div style={{ fontSize: 11, color: "#444" }}>{bizPhone}</div>}
              {bizGST     && <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>GSTIN: {bizGST}</div>}
              {bizFssai   && <div style={{ fontSize: 10, color: "#666" }}>FSSAI Lic. No: {bizFssai}</div>}
            </div>

            {/* Order meta */}
            <div style={{ marginBottom: 10, borderBottom: "1px dashed #ccc", paddingBottom: 10 }}>
              {[
                ["Order",    o.id],
                ["Date",     dateStr],
                ["Type",     orderTypeLabel],
                ["Customer", getOrderCustomerName(o)],
                o.customerPhone  && ["Phone",    o.customerPhone],
                o.tableId        && ["Table",    o.tableId],
                o.platformOrderId && ["Platform ID", o.platformOrderId],
                o.customerAddress && ["Address",  o.customerAddress],
              ].filter(Boolean).map(([k, v]) => v && (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                  <span style={{ color: "#666", minWidth: 80 }}>{k}</span>
                  <span style={{ textAlign: "right", wordBreak: "break-word", maxWidth: 200 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ borderBottom: "1px dashed #ccc", paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#444" }}>Items</div>
              {items ? items.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: item.notes ? 1 : 4 }}>
                    <span style={{ flex: 1, paddingRight: 8 }}>
                      <span style={{ fontWeight: 600 }}>{item.qty}×</span> {item.name}
                    </span>
                    <span style={{ flexShrink: 0, fontWeight: 600 }}>{rs(item.price * item.qty)}</span>
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: 10, color: "#666", paddingLeft: 16, marginBottom: 4, fontStyle: "italic" }}>↳ {item.notes}</div>
                  )}
                  {/* Unit price if qty > 1 */}
                  {item.qty > 1 && (
                    <div style={{ fontSize: 10, color: "#888", paddingLeft: 16, marginBottom: 4 }}>{rs(item.price)} each</div>
                  )}
                </div>
              )) : (
                <div style={{ color: "#444" }}>{getOrderDisplayItems(o)}</div>
              )}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: 10 }}>
              {showSubtotal && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#555" }}>
                  <span>Subtotal</span><span>{rs(subtotal)}</span>
                </div>
              )}
              {taxAmount > 0 && (() => {
                const cgstAmt = Math.round(taxAmount / 2);
                const sgstAmt = taxAmount - cgstAmt;
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#555" }}>
                      <span>CGST (9%)</span><span>{rs(cgstAmt)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#555" }}>
                      <span>SGST (9%)</span><span>{rs(sgstAmt)}</span>
                    </div>
                  </>
                );
              })()}
              {packagingAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#555" }}>
                  <span>Packaging</span><span>{rs(packagingAmt)}</span>
                </div>
              )}
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#555" }}>
                  <span>Discount</span><span>−{rs(discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #999", paddingTop: 6, marginTop: 6, fontWeight: 700, fontSize: 14 }}>
                <span>TOTAL</span><span>{rs(totalAmt)}</span>
              </div>
              {/* Split bill */}
              {o.splitBill > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#555" }}>
                  <span>Split ({o.splitBill} ways)</span>
                  <span>{rs(totalAmt / o.splitBill)} / person</span>
                </div>
              )}
            </div>

            {/* Payment */}
            <div style={{ borderTop: "1px dashed #ccc", paddingTop: 8, marginTop: 2, marginBottom: 10 }}>
              <div style={{ color: "#555", fontWeight: 700, marginBottom: 4 }}>Payment Details</div>
              
              {o.paymentBreakdown && o.paymentBreakdown.length > 0 ? (
                o.paymentBreakdown.map((p, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#444" }}>{p.method}</span>
                      <span style={{ fontWeight: 600 }}>{rs(p.amount)}</span>
                    </div>
                    {p.method === 'CASH' && (p.cashTendered > 0 || p.changeDue > 0) && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", paddingLeft: 8 }}>
                        <span>Tendered: {rs(p.cashTendered || p.amount)}</span>
                        <span>Change: {rs(p.changeDue || 0)}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555" }}>Method</span>
                  <span style={{ fontWeight: 600 }}>{paymentLine}</span>
                </div>
              )}
            </div>

            {/* Order notes */}
            {o.notes && (
              <div style={{ borderTop: "1px dashed #ccc", paddingTop: 8, marginTop: 2, marginBottom: 10, fontSize: 11, color: "#555", fontStyle: "italic" }}>
                Note: {o.notes}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: "center", borderTop: "1px dashed #999", paddingTop: 10, marginTop: 4, color: "#555", fontSize: 11 }}>
              <div>Thank you for visiting {bizName}!</div>
              {receiptOptions.customFooter && (
                <div style={{ marginTop: 2, fontStyle: "italic" }}>{receiptOptions.customFooter}</div>
              )}
              <div style={{ marginTop: 2 }}>Please come again ☕</div>
            </div>
          </div>
        </div>

        {/* Receipt Options */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid var(--cafe-border-light)`, borderBottom: `1px solid var(--cafe-border-light)` }}>
          <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: "var(--cafe-space-sm)" }}>
            Receipt Options
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--cafe-space-sm)", marginBottom: "var(--cafe-space-sm)" }}>
            {["print", "email", "sms", "none"].map(type => (
              <button
                key={type}
                onClick={() => updateReceiptOption("type", type)}
                style={{
                  ...btn(receiptOptions.type === type ? "primary" : "ghost"),
                  fontSize: "var(--cafe-font-xs)",
                  padding: "6px 8px",
                  textTransform: "capitalize",
                  transition: "background .15s, filter .15s",
                }}
                onMouseEnter={e => { if (receiptOptions.type === type) { e.currentTarget.style.filter = "brightness(1.08)"; } else { e.currentTarget.style.background = "var(--cafe-bg-hover)"; } }}
                onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.background = ""; }}
              >
                {type === "print" ? "🖨 Print" : type === "email" ? "📧 Email" : type === "sms" ? "📱 SMS" : "🚫 None"}
              </button>
            ))}
          </div>
          {receiptOptions.type === "email" && (
            <div style={{ marginTop: "var(--cafe-space-sm)" }}>
              <input
                style={{ ...input, width: "100%", fontSize: "var(--cafe-font-sm)" }}
                type="email"
                placeholder="Enter email address"
                value={receiptOptions.email}
                onChange={(e) => updateReceiptOption("email", e.target.value)}
              />
            </div>
          )}
          {receiptOptions.type === "sms" && (
            <div style={{ marginTop: "var(--cafe-space-sm)" }}>
              <input
                style={{ ...input, width: "100%", fontSize: "var(--cafe-font-sm)" }}
                type="tel"
                placeholder="Enter phone number"
                value={receiptOptions.phone}
                onChange={(e) => updateReceiptOption("phone", e.target.value)}
              />
            </div>
          )}
          <div style={{ marginTop: "var(--cafe-space-sm)" }}>
            <input
              style={{ ...input, width: "100%", fontSize: "var(--cafe-font-sm)" }}
              type="text"
              placeholder="Custom footer message (optional)"
              value={receiptOptions.customFooter}
              onChange={(e) => updateReceiptOption("customFooter", e.target.value)}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, padding: "14px 20px", borderTop: `1px solid var(--cafe-border-light)`, flexShrink: 0 }}>
          <button 
            style={{ ...btn("ghost"), flex: 1, transition: "background .15s" }} 
            onClick={onClose}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; }}
          >
            Close
          </button>
          {receiptOptions.type === "print" && (
            <button 
              style={{ ...btn("primary"), flex: 1, fontWeight: 700, transition: "filter .15s" }} 
              onClick={printReceipt}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              🖨 Print
            </button>
          )}
          {receiptOptions.type === "email" && (
            <button 
              style={{ ...btn("primary"), flex: 1, fontWeight: 700, transition: "filter .15s" }} 
              onClick={() => sendReceiptEmail(o, receiptOptions.email)}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              📧 Send Email
            </button>
          )}
          {receiptOptions.type === "sms" && (
            <button 
              style={{ ...btn("primary"), flex: 1, fontWeight: 700, transition: "filter .15s" }} 
              onClick={() => sendReceiptSMS(o, receiptOptions.phone)}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >
              📱 Send SMS
            </button>
          )}
          {receiptOptions.type === "none" && (
            <button 
              style={{ ...btn("ghost"), flex: 1, fontWeight: 700, transition: "background .15s" }} 
              onClick={onClose}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ""; }}
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
