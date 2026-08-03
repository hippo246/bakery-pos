import React from 'react';
// CafeOS Printer Routing Configuration
// Configure printer assignments for different document types

import { useState, useCallback, useEffect } from "react";
import printEngine, { DOCUMENT_TYPES, PAPER_SIZES } from "../../print/printEngine.js";

const DEFAULT_ROUTING = {
  [DOCUMENT_TYPES.RECEIPT]: "receipt",
  [DOCUMENT_TYPES.KITCHEN_TICKET]: "kitchen",
  [DOCUMENT_TYPES.CUSTOMER_BILL]: "receipt",
  [DOCUMENT_TYPES.INVOICE]: "office",
  [DOCUMENT_TYPES.CREDIT_NOTE]: "office",
  [DOCUMENT_TYPES.REFUND_RECEIPT]: "receipt",
  [DOCUMENT_TYPES.SHIFT_REPORT]: "office",
  [DOCUMENT_TYPES.STOCK_ADJUSTMENT]: "office",
  [DOCUMENT_TYPES.PURCHASE_ORDER]: "office",
  [DOCUMENT_TYPES.PRODUCTION_BATCH]: "office",
  [DOCUMENT_TYPES.RESERVATION_SLIP]: "receipt",
  [DOCUMENT_TYPES.STAFF_SHIFT_SUMMARY]: "office"
};

export default function PrinterRouting({ isMobile }) {
  const [routing, setRouting] = useState(DEFAULT_ROUTING);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  useEffect(() => {
    loadPrinters();
    loadRouting();
  }, []);

  const loadPrinters = useCallback(() => {
    const allPrinters = printEngine.getAllPrinters();
    setPrinters(allPrinters);
  }, []);

  const loadRouting = useCallback(() => {
    try {
      const savedRouting = localStorage.getItem("cafeos_printer_routing");
      if (savedRouting) {
        setRouting(JSON.parse(savedRouting));
      }
    } catch (e) {
      console.error("Failed to load routing:", e);
    }
  }, []);

  const saveRouting = useCallback((newRouting) => {
    setRouting(newRouting);
    try {
      localStorage.setItem("cafeos_printer_routing", JSON.stringify(newRouting));
    } catch (e) {
      console.error("Failed to save routing:", e);
    }
  }, []);

  const handleRoutingChange = useCallback((documentType, printerId) => {
    const updated = { ...routing, [documentType]: printerId };
    saveRouting(updated);
  }, [routing, saveRouting]);

  const handleAddPrinter = useCallback(() => {
    const id = `printer_${Date.now()}`;
    printEngine.registerPrinter(id, {
      name: `New Printer ${printers.length + 1}`,
      type: "thermal",
      paperSize: PAPER_SIZES.MM80
    });
    loadPrinters();
  }, [printers.length, loadPrinters]);

  const handleRemovePrinter = useCallback((printerId) => {
    printEngine.unregisterPrinter(printerId);
    loadPrinters();
    
    // Reset routing for documents using this printer
    const updated = { ...routing };
    Object.keys(updated).forEach(docType => {
      if (updated[docType] === printerId) {
        updated[docType] = printEngine.defaultPrinter || "receipt";
      }
    });
    saveRouting(updated);
  }, [routing, saveRouting, loadPrinters]);

  const handleSetDefault = useCallback((printerId) => {
    printEngine.setDefaultPrinter(printerId);
    loadPrinters();
  }, [loadPrinters]);

  const documentGroups = [
    {
      title: "Customer Documents",
      documents: [
        DOCUMENT_TYPES.RECEIPT,
        DOCUMENT_TYPES.CUSTOMER_BILL,
        DOCUMENT_TYPES.REFUND_RECEIPT,
        DOCUMENT_TYPES.RESERVATION_SLIP
      ]
    },
    {
      title: "Kitchen Documents",
      documents: [
        DOCUMENT_TYPES.KITCHEN_TICKET
      ]
    },
    {
      title: "Office Documents",
      documents: [
        DOCUMENT_TYPES.INVOICE,
        DOCUMENT_TYPES.CREDIT_NOTE,
        DOCUMENT_TYPES.SHIFT_REPORT,
        DOCUMENT_TYPES.STOCK_ADJUSTMENT,
        DOCUMENT_TYPES.PURCHASE_ORDER,
        DOCUMENT_TYPES.PRODUCTION_BATCH,
        DOCUMENT_TYPES.STAFF_SHIFT_SUMMARY
      ]
    }
  ];

  const getDocumentLabel = (type) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 18 : 20,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: 0
        }}>
          Printer Routing
        </h2>
        <p style={{
          fontSize: isMobile ? 11 : 12,
          color: "var(--cafe-text-tertiary)",
          margin: "4px 0 0"
        }}>
          Configure which printer handles each document type
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Printers Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              margin: 0
            }}>
              Available Printers
            </h3>
            <button
              onClick={handleAddPrinter}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                border: "1px solid var(--cafe-accent)",
                borderRadius: 8,
                background: "var(--cafe-accent)",
                color: "white",
                cursor: "pointer"
              }}
            >
              Add Printer
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {printers.map(printer => (
              <PrinterCard
                key={printer.id}
                printer={printer}
                isDefault={printEngine.defaultPrinter === printer.id}
                onSetDefault={handleSetDefault}
                onRemove={handleRemovePrinter}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>

        {/* Routing Rules */}
        {documentGroups.map(group => (
          <div key={group.title} style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-primary)",
              margin: "0 0 16px"
            }}>
              {group.title}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.documents.map(docType => (
                <RoutingRow
                  key={docType}
                  documentType={docType}
                  label={getDocumentLabel(docType)}
                  printers={printers}
                  selectedPrinter={routing[docType]}
                  onChange={handleRoutingChange}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Printer Card Component
function PrinterCard({ printer, isDefault, onSetDefault, onRemove, isMobile }) {
  const [status, setStatus] = useState(printer.status);

  const handleTestConnection = useCallback(async () => {
    try {
      await printEngine.validatePrinter(printer.id);
      setStatus("online");
    } catch (error) {
      setStatus("offline");
    }
  }, [printer.id]);

  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: isDefault ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--cafe-accent-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20
          }}>
            🖨️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 2 }}>
              {printer.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
              {printer.type} • {printer.paperSize?.name || "80mm"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: status === "online" ? "var(--cafe-success)" : "var(--cafe-danger)"
          }} />
          <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
            {status}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={handleTestConnection}
          style={{
            padding: "6px 12px",
            fontSize: 11,
            border: "1px solid var(--cafe-border)",
            borderRadius: 6,
            background: "var(--cafe-bg-surface)",
            color: "var(--cafe-text-primary)",
            cursor: "pointer"
          }}
        >
          Test Connection
        </button>
        {!isDefault && (
          <button
            onClick={() => onSetDefault(printer.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              background: "var(--cafe-accent-bg)",
              color: "var(--cafe-accent)",
              cursor: "pointer"
            }}
          >
            Set Default
          </button>
        )}
        {printers.length > 1 && (
          <button
            onClick={() => onRemove(printer.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              border: "1px solid var(--cafe-danger)",
              borderRadius: 6,
              background: "var(--cafe-danger-bg)",
              color: "var(--cafe-danger)",
              cursor: "pointer"
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// Routing Row Component
function RoutingRow({ documentType, label, printers, selectedPrinter, onChange, isMobile }) {
  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 8,
      padding: "12px 16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{documentType}</div>
      </div>
      <select
        value={selectedPrinter || ""}
        onChange={(e) => onChange(documentType, e.target.value)}
        style={{
          padding: "8px 12px",
          fontSize: 12,
          border: "1px solid var(--cafe-border)",
          borderRadius: 6,
          background: "var(--cafe-bg-surface)",
          color: "var(--cafe-text-primary)",
          minWidth: 150
        }}
      >
        {printers.map(printer => (
          <option key={printer.id} value={printer.id}>{printer.name}</option>
        ))}
      </select>
    </div>
  );
}
