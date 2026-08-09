import React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_INVENTORY, INVENTORY_CATEGORIES, SUPPLIERS } from "../../data/inventoryConstants.js";
import { normalizeInventoryItem, deductInventoryForOrder, BASIC_RECIPES, isLowStock, isOutOfStock, getLowStockItems, getOutOfStockItems, getTotalInventoryValue, restockInventoryItem } from "../../domain/inventoryModel.js";
import WarningDialog from "../common/WarningDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import { triggerStockNotification } from "../../utils/notificationTriggers.js";
import { StockPermissions, ImportExportPermissions } from "../../utils/permissionService.js";
import { createSecurityAuditLog, createPermissionDeniedAuditLog, createExportAuditLog } from "../../domain/auditLogModel.js";
import { getCurrentUserId } from "../../utils/authService.js";
import PermissionDeniedDialog from "../common/PermissionDeniedDialog";
import { saveNotifications } from "../../utils/notificationService.js";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";

export default function Inventory({ inventory: propInventory, setInventory: propSetInventory, notifications, setNotifications }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const [inventory, setInventory] = useState(propInventory || INIT_INVENTORY);
  const handleSetInventory = propSetInventory || setInventory;
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "", expiryDate: "", batchNo: "" });
  const [formError, setFormError] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [adjustmentError, setAdjustmentError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null, usedIn: [], hasHistory: false, onConfirm: null });
  const [permissionDeniedDialog, setPermissionDeniedDialog] = useState({ open: false, action: '', requiredPermission: '', currentRole: '' });

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

  // --- Safe accessors: never let a null inventory or missing item field crash the screen ---
  const safeArr = Array.isArray(inventory) ? inventory : [];
  const safeStr = (v, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const safeNum = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : fallback; };
  const itemName = (it) => safeStr(it?.name, "Unnamed item");
  const itemCategory = (it) => safeStr(it?.category, "Uncategorized");
  const itemUnit = (it) => safeStr(it?.unit, "pcs");
  const itemSupplier = (it) => safeStr(it?.supplier, "Unknown supplier");
  const itemQuantity = (it) => safeNum(it?.quantity, 0);
  const itemMinStock = (it) => safeNum(it?.minStock, 0);
  const itemCost = (it) => safeNum(it?.cost, 0);
  const fmtCurrency = (n) => "₹" + (Number.isFinite(n) ? n : 0).toLocaleString();
  const safeIsLowStock = (it) => { try { return !!isLowStock(it); } catch { return itemQuantity(it) <= itemMinStock(it); } };
  const safeIsOutOfStock = (it) => { try { return !!isOutOfStock(it); } catch { return itemQuantity(it) === 0; } };

  // --- Movement history helpers (lightweight, stored on item.movements) ---
  const addMovement = (item, { type, qty, previousQty, newQty, reason }) => {
    const movement = {
      id: "mv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type, qty, previousQty, newQty,
      reason: (reason || "").trim(),
      createdAt: new Date().toISOString(),
    };
    const prevMovements = Array.isArray(item?.movements) ? item.movements : [];
    return [movement, ...prevMovements].slice(0, 50);
  };

  // --- Reorder / expiry helpers ---
  const reorderHint = (it) => {
    if (safeIsOutOfStock(it)) return { label: "Reorder now", color: C.red };
    if (safeIsLowStock(it)) return { label: "Reorder soon", color: C.amber };
    return { label: "Stock OK", color: C.green };
  };
  const suggestedReorderQty = (it) => {
    const qty = itemQuantity(it), min = itemMinStock(it);
    if (qty > min) return 0;
    return Math.max(0, Math.round(min * 3 - qty));
  };
  const expiryStatus = (it) => {
    const exp = it?.expiryDate;
    if (!exp) return null;
    const expDate = new Date(exp);
    if (isNaN(expDate.getTime())) return null;
    const days = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", color: C.red };
    if (days <= 7) return { label: `Expires in ${days}d`, color: C.amber };
    return { label: "OK", color: C.green };
  };
  const getRecipesUsingItem = useCallback((it) => {
    try {
      if (!it || !BASIC_RECIPES || typeof BASIC_RECIPES !== "object") return [];
      const nm = itemName(it).toLowerCase();
      const id = it?.id;
      const matches = [];
      Object.entries(BASIC_RECIPES).forEach(([menuName, recipe]) => {
        const ingredients = Array.isArray(recipe) ? recipe : Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
        const uses = ingredients.some(ing => {
          if (!ing) return false;
          if (typeof ing === "string") return ing.toLowerCase() === nm;
          const ingId = ing.id || ing.itemId || ing.inventoryId;
          const ingName = ing.name || ing.item;
          return (ingId && ingId === id) || (typeof ingName === "string" && ingName.toLowerCase() === nm);
        });
        if (uses) matches.push(menuName);
      });
      return matches;
    } catch {
      return [];
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeArr.filter(item => {
      const matchesCategory = categoryFilter === "All" || itemCategory(item) === categoryFilter;
      const matchesSearch = !q || itemName(item).toLowerCase().includes(q) || itemSupplier(item).toLowerCase().includes(q) || safeStr(item?.batchNo).toLowerCase().includes(q);
      const matchesLowStock = !showLowStock || safeIsLowStock(item);
      const matchesOutOfStock = !showOutOfStock || safeIsOutOfStock(item);
      const matchesExpiring = !showExpiring || expiryStatus(item)?.label !== "OK";
      return matchesCategory && matchesSearch && matchesLowStock && matchesOutOfStock && matchesExpiring;
    });
  }, [inventory, categoryFilter, search, showLowStock, showOutOfStock, showExpiring]);

  // Memoized sorted inventory
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = itemName(a).localeCompare(itemName(b));
      else if (sortBy === "qty") comparison = itemQuantity(a) - itemQuantity(b);
      else if (sortBy === "value") comparison = (itemQuantity(a) * itemCost(a)) - (itemQuantity(b) * itemCost(b));
      else if (sortBy === "lastRestock") comparison = new Date(a?.lastRestock || 0) - new Date(b?.lastRestock || 0);
      else if (sortBy === "status") comparison = (safeIsOutOfStock(a) ? 0 : safeIsLowStock(a) ? 1 : 2) - (safeIsOutOfStock(b) ? 0 : safeIsLowStock(b) ? 1 : 2);
      else if (sortBy === "expiry") comparison = new Date(a?.expiryDate || "9999-12-31") - new Date(b?.expiryDate || "9999-12-31");
      else if (sortBy === "supplier") comparison = itemSupplier(a).localeCompare(itemSupplier(b));

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortBy, sortOrder]);

  let lowStockCount = 0, outOfStockCount = 0, totalValue = 0;
  try { lowStockCount = getLowStockItems(safeArr).length; } catch { lowStockCount = safeArr.filter(safeIsLowStock).length; }
  try { outOfStockCount = getOutOfStockItems(safeArr).length; } catch { outOfStockCount = safeArr.filter(safeIsOutOfStock).length; }
  try {
    const v = getTotalInventoryValue(safeArr);
    totalValue = Number.isFinite(v) ? v : safeArr.reduce((sum, it) => sum + itemQuantity(it) * itemCost(it), 0);
  } catch {
    totalValue = safeArr.reduce((sum, it) => sum + itemQuantity(it) * itemCost(it), 0);
  }
  const totalSuppliers = new Set(safeArr.map(itemSupplier)).size;

  // Check for low stock and out of stock items periodically
  // notifiedStateRef tracks which alerts have already fired per item so we only
  // notify again when a status actually *changes* (e.g. goes low -> resolved -> low again),
  // instead of re-firing the same notification on every poll for as long as it persists.
  const notifiedStateRef = useRef({});
  useEffect(() => {
    const checkStock = () => {
      const nextState = {};
      safeArr.forEach(item => {
        if (!item?.id) return;
        const prev = notifiedStateRef.current[item.id] || {};
        const out = safeIsOutOfStock(item);
        const low = !out && safeIsLowStock(item);
        const expStatus = expiryStatus(item);
        const expired = expStatus?.label === "Expired";
        const expiring = expStatus?.label?.startsWith("Expires in");

        if (out && !prev.out) {
          addNotification(triggerStockNotification(item, 'OUT_OF_STOCK', {
            currentQuantity: itemQuantity(item),
            unit: itemUnit(item)
          }));
        } else if (low && !prev.low) {
          addNotification(triggerStockNotification(item, 'LOW_STOCK', {
            currentQuantity: itemQuantity(item),
            unit: itemUnit(item),
            reorderLevel: itemMinStock(item)
          }));
        }

        if (expired && !prev.expired) {
          addNotification(triggerStockNotification(item, 'EXPIRED', {
            expiryDate: item.expiryDate
          }));
        } else if (expiring && !prev.expiring) {
          addNotification(triggerStockNotification(item, 'EXPIRY_APPROACHING', {
            expiryDate: item.expiryDate
          }));
        }

        nextState[item.id] = { out, low, expired, expiring };
      });
      notifiedStateRef.current = nextState;
    };
    const interval = setInterval(checkStock, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [safeArr, addNotification]);

  const openAdd = () => {
    setEditItem(null);
    setFormError("");
    setForm({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "", expiryDate: "", batchNo: "" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item?.id);
    setFormError("");
    setForm({
      name: item?.name || "",
      category: item?.category || "Ingredients",
      quantity: String(itemQuantity(item)),
      unit: item?.unit || "pieces",
      minStock: String(itemMinStock(item)),
      cost: String(itemCost(item)),
      supplier: item?.supplier || "",
      expiryDate: item?.expiryDate || "",
      batchNo: item?.batchNo || "",
    });
    setShowModal(true);
  };

  const saveItem = () => {
    setFormError("");
    const name = (form.name || "").trim();
    const category = (form.category || "").trim();
    const unit = (form.unit || "").trim();
    const supplier = (form.supplier || "").trim();
    const batchNo = (form.batchNo || "").trim();
    const expiryDate = (form.expiryDate || "").trim();
    const quantity = Number(form.quantity);
    const minStock = Number(form.minStock === "" ? 0 : form.minStock);
    const cost = Number(form.cost);

    if (!name) return setFormError("Item name is required.");
    if (!category) return setFormError("Category is required.");
    if (!unit) return setFormError("Unit is required.");
    if (form.quantity === "" || !Number.isFinite(quantity) || quantity < 0) return setFormError("Quantity must be a number 0 or greater.");
    if (form.minStock === "" || !Number.isFinite(minStock) || minStock < 0) return setFormError("Min stock must be a number 0 or greater.");
    if (form.cost === "" || !Number.isFinite(cost) || cost < 0) return setFormError("Cost must be a number 0 or greater.");

    const isDuplicate = safeArr.some(i =>
      i?.id !== editItem &&
      itemName(i).toLowerCase() === name.toLowerCase() &&
      itemCategory(i).toLowerCase() === category.toLowerCase()
    );
    if (isDuplicate) return setFormError(`"${name}" already exists in category "${category}". Use a different name or edit the existing item.`);

    const now = new Date().toISOString();
    const existing = editItem ? safeArr.find(i => i?.id === editItem) : null;

    const itemData = {
      name, category, unit, supplier, batchNo, expiryDate,
      quantity, minStock, cost,
      lastRestock: existing?.lastRestock || now.split("T")[0],
      movements: existing?.movements || [],
      updatedAt: now,
    };

    let normalizedItem;
    try {
      normalizedItem = normalizeInventoryItem(itemData) || itemData;
    } catch {
      normalizedItem = itemData;
    }

    if (editItem) {
      handleSetInventory(safeArr.map(i => (i?.id === editItem ? { ...existing, ...normalizedItem, id: editItem, updatedAt: now } : i)));
      showToast(`${name} updated`, "success");
    } else {
      handleSetInventory([...safeArr, { ...normalizedItem, id: "inv-" + Date.now(), movements: [], updatedAt: now }]);
      showToast(`${name} added`, "success");
    }
    setShowModal(false);
  };

  const deleteItem = useCallback((id) => {
    // Check permission before allowing delete
    const permissionCheck = StockPermissions.canDelete();
    if (!permissionCheck.allowed) {
      // Log permission denial
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'STOCK_DELETE',
        details: { itemId: id, requiredPermission: permissionCheck.requiredPermission }
      });
      if (setNotifications) {
        setNotifications(prev => [denialLog, ...(prev || [])]);
      }
      
      setPermissionDeniedDialog({
        open: true,
        action: 'delete inventory item',
        requiredPermission: permissionCheck.requiredPermission,
        currentRole: permissionCheck.currentRole || '',
      });
      return;
    }
    
    const target = safeArr.find(i => i?.id === id);
    const usedIn = getRecipesUsingItem(target);
    const hasHistory = Array.isArray(target?.movements) && target.movements.length > 0;
    setDeleteDialog({
      open: true,
      item: target,
      usedIn,
      hasHistory,
      onConfirm: () => {
        setDeleteDialog({ open: false, item: null, usedIn: [], hasHistory: false, onConfirm: null });
        handleSetInventory(safeArr.filter(i => i?.id !== id));
        showToast(`${itemName(target)} deleted`, "success");
        
        // Log inventory item deletion
        const deleteLog = createSecurityAuditLog({
          userId: getCurrentUserId(),
          action: 'STOCK_DELETE',
          details: { itemId: id, itemName: itemName(target), usedInRecipes: usedIn.length, hadHistory: hasHistory }
        });
        if (setNotifications) {
          setNotifications(prev => [deleteLog, ...(prev || [])]);
        }
      }
    });
  }, [safeArr, handleSetInventory, getRecipesUsingItem, showToast, setNotifications]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const exportInventory = useCallback(() => {
    // Check permission before allowing export
    const permissionCheck = ImportExportPermissions.canExport();
    if (!permissionCheck.allowed) {
      // Log permission denial
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'EXPORT_ATTEMPT',
        details: { module: 'INVENTORY', requiredPermission: permissionCheck.requiredPermission }
      });
      if (setNotifications) {
        setNotifications(prev => [denialLog, ...(prev || [])]);
      }
      
      setPermissionDeniedDialog({
        open: true,
        action: 'export inventory data',
        requiredPermission: permissionCheck.requiredPermission,
        currentRole: permissionCheck.currentRole || '',
      });
      return;
    }
    
    try {
      const rows = [
        ["Name","Category","Unit","Quantity","Min Stock","Cost/Unit","Total Value","Supplier","Status","Suggested Reorder Qty","Expiry Date","Batch No","Latest Movement Type","Latest Movement Qty","Latest Movement Date","Latest Movement Reason","Last Restock"],
        ...safeArr.map(it => {
          const qty = itemQuantity(it);
          const min = itemMinStock(it);
          const cost = itemCost(it);
          const status = safeIsOutOfStock(it) ? "Out of Stock" : safeIsLowStock(it) ? "Low Stock" : "OK";
          const suggestQty = qty > min ? 0 : Math.max(0, Math.round(min * 3 - qty));
          const mv = Array.isArray(it?.movements) && it.movements.length > 0 ? it.movements[0] : null;
          return [
            itemName(it),
            itemCategory(it),
            itemUnit(it),
            qty,
            min,
            cost,
            qty * cost,
            itemSupplier(it),
            status,
            suggestQty > 0 ? `${suggestQty} ${itemUnit(it)}` : "",
            it?.expiryDate || "",
            it?.batchNo || "",
            mv?.type || "",
            mv?.qty ?? "",
            mv?.createdAt ? new Date(mv.createdAt).toLocaleString() : "",
            mv?.reason || "",
            it?.lastRestock || "",
          ];
        }),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Inventory exported to CSV", "success");
      
      // Log successful export
      const exportLog = createExportAuditLog({
        userId: getCurrentUserId(),
        module: 'INVENTORY',
        details: { itemCount: safeArr.length, format: 'CSV' }
      });
      if (setNotifications) {
        setNotifications(prev => [exportLog, ...(prev || [])]);
      }
    } catch (err) {
      showToast("Export failed — please try again", "error");
    }
  }, [safeArr, showToast, setNotifications]);

  const openAdjustmentModal = (item) => {
    setAdjustmentError("");
    setAdjustmentModal({
      item,
      type: "RESTOCK",
      quantity: "",
      reason: "",
      staff: "",
      note: ""
    });
  };

  const handleAdjustment = () => {
    if (!adjustmentModal) return;
    setAdjustmentError("");
    try {
      const { item, type, quantity, reason, note } = adjustmentModal;
      const qtyChange = Number(quantity);
      const isCorrection = type === "CORRECTION";
      if (quantity === "" || !Number.isFinite(qtyChange) || (!isCorrection && qtyChange <= 0) || (isCorrection && qtyChange < 0)) {
        return setAdjustmentError(isCorrection ? "Please enter a valid final quantity (0 or greater)" : "Please enter a valid quantity greater than 0");
      }

      const reasonTextParts = [];
      if (reason?.trim()) reasonTextParts.push(reason.trim());
      if (staff?.trim()) reasonTextParts.push(`(Staff: ${staff.trim()})`);
      if (note?.trim()) reasonTextParts.push(`[Note: ${note.trim()}]`);
      const reasonText = reasonTextParts.join(" ");

      if ((type === "WASTAGE" || type === "CORRECTION") && !reason?.trim()) {
        return setAdjustmentError("A reason is required for wastage and correction adjustments");
      }

      const current = safeArr.find(i => i?.id === item?.id);
      if (!current) return setAdjustmentError("Item not found");
      const previousQty = itemQuantity(current);
      const now = new Date().toISOString();
      let newQty;
      let movementType;

      if (type === "RESTOCK") {
        newQty = previousQty + qtyChange;
        movementType = "restock";
      } else if (type === "WASTAGE") {
        if (qtyChange > previousQty) return setAdjustmentError(`Wastage cannot exceed available stock (${previousQty} ${itemUnit(current)})`);
        newQty = previousQty - qtyChange;
        movementType = "wastage";
      } else if (type === "CORRECTION") {
        newQty = qtyChange; // final quantity set directly
        movementType = "correction";
      } else {
        // RETURN/Reduce — treated as a reduction movement
        if (qtyChange > previousQty) return setAdjustmentError(`Cannot reduce more than available stock (${previousQty} ${itemUnit(current)})`);
        newQty = previousQty - qtyChange;
        movementType = "reduce";
      }

      if (newQty < 0) return setAdjustmentError("This adjustment would take stock below zero");

      const movementQty = movementType === "correction" ? Math.abs(newQty - previousQty) : qtyChange;
      const movements = addMovement(current, { type: movementType, qty: movementQty, previousQty, newQty, reason: reasonText });
      const updatedInventory = safeArr.map(i => i?.id === item?.id ? {
        ...i,
        quantity: newQty,
        lastRestock: movementType === "restock" ? now.split("T")[0] : (i?.lastRestock || now.split("T")[0]),
        updatedAt: now,
        movements,
      } : i);

      handleSetInventory(updatedInventory);

      // Publish event for real-time Dashboard synchronization
      const eventType = movementType === "restock" ? "inventory.restocked" 
                    : movementType === "wastage" ? "inventory.wastage"
                    : movementType === "correction" ? "inventory.correction"
                    : "inventory.adjusted";
      
      moduleEventPublisher.publishInventoryEvent(eventType, {
        itemId: item?.id,
        itemName: itemName(current),
        previousQty: previousQty,
        newQty: newQty,
        reason: reasonText,
        staffId: getCurrentUserId()
      });

      // Check for low stock after adjustment
      const isLow = safeIsLowStock({ ...current, quantity: newQty });
      const isOut = safeIsOutOfStock({ ...current, quantity: newQty });
      
      if (isLow && !safeIsLowStock(current)) {
        moduleEventPublisher.publishInventoryEvent('inventory.low_stock', {
          itemId: item?.id,
          itemName: itemName(current),
          currentQty: newQty,
          minStock: itemMinStock(current)
        });
      }
      
      if (isOut && !safeIsOutOfStock(current)) {
        moduleEventPublisher.publishInventoryEvent('inventory.out_of_stock', {
          itemId: item?.id,
          itemName: itemName(current)
        });
      }

      showToast(`${type === "WASTAGE" ? "Wastage recorded" : type === "CORRECTION" ? "Correction applied" : type === "RESTOCK" ? "Stock restocked" : "Stock reduced"} for ${itemName(current)}`, "success");
      setAdjustmentModal(null);
    } catch (err) {
      setAdjustmentError("Something went wrong applying this adjustment. Please try again.");
    }
  };

  // Escape closes whichever modal is open; lock background scroll while one is open
  const anyModalOpen = showModal || !!adjustmentModal;
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (adjustmentModal) { setAdjustmentModal(null); return; }
      if (showModal) { setShowModal(false); setFormError(""); return; }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [anyModalOpen, adjustmentModal, showModal]);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: "var(--cafe-bg-card)", border: `1px solid ${toast.type === "error" ? "var(--cafe-danger-border)" : "var(--cafe-border-light)"}`, borderLeft: `3px solid ${toast.type === "error" ? "var(--cafe-danger)" : "var(--cafe-success)"}`, borderRadius: "var(--cafe-radius-md)", padding: "12px 16px", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)", boxShadow: "var(--cafe-shadow-lg)", maxWidth: 280, animation: "fadeInUp .18s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Stock Room Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--cafe-text-primary)", marginBottom: 6 }}>Stock Room</div>
          <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", fontWeight: 500 }}>Track ingredients, packaging, wastage, and restocking</div>
        </div>

        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "Total Items", count: safeArr.length, color: "var(--cafe-text-secondary)" },
            { label: "Low Stock", count: lowStockCount, color: lowStockCount > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
            { label: "Out of Stock", count: outOfStockCount, color: outOfStockCount > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" },
            { label: "Stock Value", count: fmtCurrency(totalValue), color: "var(--cafe-success)" },
            { label: "Suppliers", count: totalSuppliers, color: "var(--cafe-info)" },
          ].map(chip => (
            <div key={chip.label} style={{
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: chip.color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Health Strip */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Healthy", count: safeArr.filter(i => !safeIsLowStock(i) && !safeIsOutOfStock(i)).length, color: "var(--cafe-success)", filter: null },
          { label: "Low", count: lowStockCount, color: "var(--cafe-warning)", filter: "low" },
          { label: "Out", count: outOfStockCount, color: "var(--cafe-danger)", filter: "out" },
          { label: "Expiring", count: safeArr.filter(i => expiryStatus(i)?.label !== "OK").length, color: "var(--cafe-accent)", filter: "expiring" },
        ].map(health => (
          <button key={health.label} onClick={() => {
            if (health.filter === "low") { setShowLowStock(true); setShowOutOfStock(false); setShowExpiring(false); }
            else if (health.filter === "out") { setShowLowStock(false); setShowOutOfStock(true); setShowExpiring(false); }
            else if (health.filter === "expiring") { setShowLowStock(false); setShowOutOfStock(false); setShowExpiring(true); }
            else { setShowLowStock(false); setShowOutOfStock(false); setShowExpiring(false); }
          }} style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: `1px solid ${health.count > 0 ? health.color : "var(--cafe-border-light)"}`,
            background: health.count > 0 ? `${health.color}22` : "var(--cafe-bg-surface)",
            color: health.count > 0 ? health.color : "var(--cafe-text-tertiary)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
          onMouseOver={e => { if (health.count > 0) { e.currentTarget.style.background = health.color + '33'; } }}
          onMouseOut={e => { if (health.count > 0) { e.currentTarget.style.background = health.color + '22'; } }}
          >
            <span>{health.label}</span>
            <span style={{ fontFamily: "monospace", fontSize: 14 }}>{health.count}</span>
          </button>
        ))}
      </div>

      {/* Stock Room Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--cafe-text-tertiary)" }}>⌕</span>
          <input style={{ paddingLeft: 40, paddingRight: search ? 40 : undefined, borderRadius: 12, fontSize: 13, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} placeholder="Search items, suppliers, batches…" value={search} onChange={e => setSearch(e.target.value)} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }} title="Clear search" aria-label="Clear search">×</button>
          )}
        </div>

        {/* Category Rail */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {INVENTORY_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid ${categoryFilter === cat ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
              background: categoryFilter === cat ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
              color: categoryFilter === cat ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              fontSize: 13,
              fontWeight: categoryFilter === cat ? 700 : 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
            onMouseOver={e => { if (categoryFilter !== cat) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
            onMouseOut={e => { if (categoryFilter !== cat) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {(search || showLowStock || showOutOfStock || showExpiring || categoryFilter !== "All") && (
            <button onClick={() => { setSearch(""); setShowLowStock(false); setShowOutOfStock(false); setShowExpiring(false); setCategoryFilter("All"); }} style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>
              Clear Filters
            </button>
          )}
          <button onClick={() => setShowLowStock(v => !v)} style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44, background: showLowStock ? "var(--cafe-warning-bg)" : "var(--cafe-bg-surface)", border: `1px solid ${showLowStock ? "var(--cafe-warning)" : "var(--cafe-border-light)"}`, color: showLowStock ? "var(--cafe-warning)" : "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { if (!showLowStock) { e.currentTarget.style.borderColor = 'var(--cafe-warning)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }} onMouseOut={e => { if (!showLowStock) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}>
            ⚠ Low Stock
          </button>
          <button onClick={() => setShowOutOfStock(v => !v)} style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44, background: showOutOfStock ? "var(--cafe-danger-bg)" : "var(--cafe-bg-surface)", border: `1px solid ${showOutOfStock ? "var(--cafe-danger)" : "var(--cafe-border-light)"}`, color: showOutOfStock ? "var(--cafe-danger)" : "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => { if (!showOutOfStock) { e.currentTarget.style.borderColor = 'var(--cafe-danger)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }} onMouseOut={e => { if (!showOutOfStock) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}>
            ✕ Out of Stock
          </button>
          <button style={{ padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onClick={exportInventory} title="Export inventory to CSV" onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>↓ Export</button>
          <button style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, minHeight: 44, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onClick={openAdd} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}>+ Add Item</button>
        </div>
      </div>

      {/* Sort Options */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sort by:</span>
        {[
          { key: "name", label: "Name" },
          { key: "qty", label: "Quantity" },
          { key: "value", label: "Value" },
          { key: "status", label: "Stock Status" },
          { key: "expiry", label: "Expiry" },
          { key: "supplier", label: "Supplier" },
          { key: "lastRestock", label: "Restock Date" },
        ].map(sortOpt => (
          <button key={sortOpt.key} onClick={() => handleSort(sortOpt.key)} style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: `1px solid ${sortBy === sortOpt.key ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
            background: sortBy === sortOpt.key ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
            color: sortBy === sortOpt.key ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
            fontSize: 12,
            fontWeight: sortBy === sortOpt.key ? 700 : 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
          onMouseOver={e => { if (sortBy !== sortOpt.key) { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; } }}
          onMouseOut={e => { if (sortBy !== sortOpt.key) { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; } }}
          >
            {sortOpt.label}
            {sortBy === sortOpt.key && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "var(--cafe-space-md)" }} className="inventory-grid">
        {sorted.map(item => {
          const itemIsLowStock = safeIsLowStock(item);
          const itemIsOutOfStock = safeIsOutOfStock(item);
          const qty = itemQuantity(item);
          const min = itemMinStock(item);
          const stockPercent = min > 0 ? Math.min(100, (qty / min) * 100) : 100;
          const hint = reorderHint(item);
          const suggestQty = suggestedReorderQty(item);
          const exp = expiryStatus(item);
          const accentColor = itemIsOutOfStock ? "var(--cafe-danger)" : itemIsLowStock ? "var(--cafe-warning)" : "var(--cafe-success)";
          const mvTypeIcon = { restock: "↑", wastage: "✕", correction: "≈", reduce: "↓" };
          const recipesUsing = getRecipesUsingItem(item);

          return (
            <div key={item.id} style={{
              background: "var(--cafe-bg-card)",
              border: `1px solid ${itemIsOutOfStock ? "var(--cafe-danger)" : itemIsLowStock ? "var(--cafe-warning)" : "var(--cafe-border-light)"}`,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {/* Status indicator bar */}
              <div style={{ height: 4, background: accentColor, opacity: itemIsOutOfStock || itemIsLowStock ? 1 : 0.4 }} />

              <div style={{ padding: "18px", flex: 1 }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6, letterSpacing: "-0.01em" }}>{itemName(item)}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{itemCategory(item)}</span>
                      {item?.batchNo && <><span style={{ opacity: 0.4 }}>·</span><span style={{ fontFamily: "monospace", letterSpacing: "0.03em" }}>{item.batchNo}</span></>}
                    </div>
                  </div>
                  {itemIsOutOfStock
                    ? <span style={{ padding: "4px 10px", borderRadius: 8, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>OUT</span>
                    : itemIsLowStock
                    ? <span style={{ padding: "4px 10px", borderRadius: 8, background: "var(--cafe-warning-bg)", color: "var(--cafe-warning)", fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>LOW</span>
                    : null}
                </div>

                {/* Stock bar + qty */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: accentColor, lineHeight: 1, letterSpacing: "-0.02em" }}>{qty}<span style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-tertiary)", marginLeft: 4 }}>{itemUnit(item)}</span></span>
                    <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>min <strong style={{ color: "var(--cafe-text-secondary)", fontFamily: "monospace" }}>{min}</strong></span>
                  </div>
                  <div style={{ height: 8, background: "var(--cafe-bg-surface)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, background: accentColor, width: `${stockPercent}%`, transition: "width 0.3s", opacity: itemIsOutOfStock ? 0.5 : 1 }} />
                  </div>
                </div>

                {/* Value row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "10px 0", borderTop: "1px solid var(--cafe-border-light)", borderBottom: "1px solid var(--cafe-border-light)" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>Cost/unit</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-secondary)", letterSpacing: "-0.01em" }}>₹{itemCost(item).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>Total Value</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: "var(--cafe-success)", letterSpacing: "-0.02em" }}>₹{(qty * itemCost(item)).toLocaleString()}</div>
                  </div>
                </div>

                {/* Meta row: supplier + restock date */}
                <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{itemSupplier(item) || "—"}</span>
                  {item?.lastRestock && <span style={{ flexShrink: 0 }}>last {item.lastRestock}</span>}
                </div>

                {/* Reorder / expiry signals */}
                {(suggestQty > 0 || exp) && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {suggestQty > 0 && (
                      <span style={{ fontSize: "var(--cafe-font-xs)", color: hint.color, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent-border)", borderRadius: "var(--cafe-radius-sm)", padding: "4px 10px", fontWeight: 600 }}>
                        Order <strong style={{ fontFamily: "monospace" }}>{suggestQty} {itemUnit(item)}</strong>
                      </span>
                    )}
                    {exp && exp.label !== "OK" && (
                      <span style={{ padding: "4px 10px", borderRadius: "var(--cafe-radius-sm)", background: exp.label === "Expired" ? "var(--cafe-danger-bg)" : "var(--cafe-warning-bg)", color: exp.label === "Expired" ? "var(--cafe-danger)" : "var(--cafe-warning)", fontSize: "var(--cafe-font-xs)", fontWeight: 600, border: exp.label === "Expired" ? "1px solid var(--cafe-danger-border)" : "1px solid var(--cafe-warning-border)" }}>
                        {exp.label}
                      </span>
                    )}
                  </div>
                )}

                {/* Recipe usage */}
                {recipesUsing.length > 0 && (
                  <div style={{ marginBottom: 12, fontSize: "var(--cafe-font-xs)", color: "var(--cafe-info)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12 }}>🍽</span>
                    <span>Used in: <strong>{recipesUsing.join(", ")}</strong></span>
                  </div>
                )}

                {/* Recent movements — compact inline */}
                {Array.isArray(item?.movements) && item.movements.length > 0 && (
                  <div style={{ marginBottom: 12, paddingTop: 8, borderTop: "1px solid var(--cafe-border-light)" }}>
                    {item.movements.slice(0, 2).map(mv => (
                      <div key={mv.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", color: mv.type === "restock" ? "var(--cafe-success)" : mv.type === "wastage" ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" }}>{mvTypeIcon[mv.type] || "·"}</span>
                        <span style={{ fontFamily: "monospace", color: "var(--cafe-text-secondary)" }}>{mv.qty} {itemUnit(item)}</span>
                        <span style={{ color: "var(--cafe-text-tertiary)" }}>{mv.type}</span>
                        <span style={{ marginLeft: "auto", flexShrink: 0 }}>{new Date(mv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div style={{ display: "flex", borderTop: "1px solid var(--cafe-border-light)", marginTop: "auto" }}>
                <button onClick={() => openAdjustmentModal(item)} style={{ flex: 1, padding: "12px 0", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-secondary)", fontSize: 13, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>Adjust</button>
                <button onClick={() => openEdit(item)} style={{ padding: "12px 18px", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-tertiary)", fontSize: 14, cursor: "pointer", transition: "all 0.2s" }} aria-label={`Edit ${itemName(item)}`} title="Edit item" onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cafe-text-tertiary)'; }}>✎</button>
                <button onClick={() => deleteItem(item.id)} style={{ padding: "12px 18px", border: "none", background: "transparent", color: "var(--cafe-danger)", fontSize: 14, cursor: "pointer", transition: "all 0.2s" }} aria-label={`Delete ${itemName(item)}`} title="Delete item" onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-danger-bg)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--cafe-text-tertiary)" }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, border: "2px dashed var(--cafe-border-light)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, opacity: 0.4 }}>
            ▣
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-text-secondary)", marginBottom: 8, letterSpacing: "-0.01em" }}>
            Your stock room is empty
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 20 }}>
            Add your first item to start tracking stock
          </div>
          <button style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onClick={openAdd} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}>+ Add First Item</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 28, width: "min(480px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{editItem ? "Edit Item" : "New Inventory Item"}</div>
                {editItem && <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>Changes save immediately</div>}
              </div>
              <button style={{ padding: "8px 12px", border: "1px solid var(--cafe-border-light)", borderRadius: 10, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 14, lineHeight: 1, transition: "all 0.2s" }} aria-label="Close" onClick={() => { setShowModal(false); setFormError(""); }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>✕</button>
            </div>
            
            {/* Basic Details Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Basic Details</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Name *</label>
                <input autoFocus style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); if (formError) setFormError(""); }} placeholder="Item name" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Category</label>
                  <select style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                    {INVENTORY_CATEGORIES.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Unit</label>
                  <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="kg, liters, pieces" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Supplier</label>
                <select style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                  <option value="">Select supplier</option>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Stock Setup Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stock Setup</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Quantity *</label>
                  <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Min Stock</label>
                  <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="0" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Cost per Unit *</label>
                <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
              </div>
            </div>

            {/* Tracking Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-secondary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tracking</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Expiry Date <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>(optional)</span></label>
                  <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Batch No. <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>(optional)</span></label>
                  <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} placeholder="e.g. B-2024-07" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger)", color: "var(--cafe-danger)", fontSize: 13, fontWeight: 600 }}>
                {formError}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => { setShowModal(false); setFormError(""); }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>Cancel</button>
              <button style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onClick={saveItem} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}>{editItem ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 12 }} onClick={() => setAdjustmentModal(null)}>
          <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 16, padding: 28, width: "min(480px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>Stock Adjustment</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>Logged to movement history</div>
              </div>
              <button style={{ padding: "8px 12px", border: "1px solid var(--cafe-border-light)", borderRadius: 10, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 14, lineHeight: 1, transition: "all 0.2s" }} onClick={() => setAdjustmentModal(null)} aria-label="Close" onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>✕</button>
            </div>
            <div style={{ marginBottom: 18, padding: "14px 18px", background: "var(--cafe-bg-surface)", borderRadius: 12, border: "1px solid var(--cafe-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em" }}>{adjustmentModal.item.name}</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 4, fontWeight: 500 }}>{adjustmentModal.item.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "var(--cafe-accent)", lineHeight: 1, letterSpacing: "-0.02em" }}>{adjustmentModal.item.quantity}</div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 500 }}>{adjustmentModal.item.unit} on hand</div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Adjustment Type</label>
              <select style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", cursor: "pointer", transition: "all 0.2s" }} value={adjustmentModal.type} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, type: e.target.value }); }} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'}>
                <option value="RESTOCK">Restock (Add stock)</option>
                <option value="WASTAGE">Wastage (Remove stock)</option>
                <option value="CORRECTION">Correction (Set exact quantity)</option>
                <option value="RETURN">Reduce (Use / Return to supplier)</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>{adjustmentModal.type === "CORRECTION" ? "New Quantity (exact) *" : "Quantity Change *"}</label>
              <input autoFocus style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} type="number" min="0" value={adjustmentModal.quantity} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, quantity: e.target.value }); }} placeholder={adjustmentModal.type === "CORRECTION" ? "Enter final quantity" : "Enter quantity to add/remove"} onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            </div>
            {(() => {
              const qtyChange = Number(adjustmentModal.quantity);
              if (adjustmentModal.quantity === "" || !Number.isFinite(qtyChange)) return null;
              const previousQty = itemQuantity(adjustmentModal.item);
              let projected;
              if (adjustmentModal.type === "RESTOCK") projected = previousQty + qtyChange;
              else if (adjustmentModal.type === "CORRECTION") projected = qtyChange;
              else projected = previousQty - qtyChange;
              const projectedInvalid = projected < 0;
              return (
                <div style={{ marginBottom: 14, fontSize: 13, color: projectedInvalid ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", padding: "10px 14px", background: projectedInvalid ? "var(--cafe-danger-bg)" : "var(--cafe-bg-surface)", borderRadius: 10, border: projectedInvalid ? "1px solid var(--cafe-danger)" : "1px solid var(--cafe-border-light)", fontWeight: 500 }}>
                  Projected quantity: <strong style={{ color: projectedInvalid ? "var(--cafe-danger)" : "var(--cafe-text-secondary)", fontFamily: "monospace", letterSpacing: "-0.01em" }}>{Math.max(0, Math.round(projected * 100) / 100)}</strong> {adjustmentModal.item.unit}
                  {projectedInvalid && " — cannot go below 0"}
                </div>
              );
            })()}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Reason {(adjustmentModal.type === "WASTAGE" || adjustmentModal.type === "CORRECTION") && <span style={{ color: "var(--cafe-danger)" }}>*</span>}</label>
              <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} value={adjustmentModal.reason} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, reason: e.target.value }); }} placeholder="Reason for adjustment" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Staff</label>
              <input style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s" }} value={adjustmentModal.staff} onChange={e => setAdjustmentModal({ ...adjustmentModal, staff: e.target.value })} placeholder="Staff name" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 6, display: "block" }}>Note</label>
              <textarea style={{ borderRadius: 12, padding: "12px 16px", fontSize: 14, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-primary)", outline: "none", transition: "all 0.2s", resize: "none" }} rows={2} value={adjustmentModal.note} onChange={e => setAdjustmentModal({ ...adjustmentModal, note: e.target.value })} placeholder="Additional notes" onFocus={e => e.currentTarget.style.borderColor = 'var(--cafe-accent)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--cafe-border-light)'} />
            </div>
            {adjustmentError && (
              <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger)", color: "var(--cafe-danger)", fontSize: 13, fontWeight: 600 }}>
                {adjustmentError}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)", color: "var(--cafe-text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onClick={() => setAdjustmentModal(null)} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--cafe-accent)'; e.currentTarget.style.background = 'var(--cafe-bg-hover)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--cafe-border-light)'; e.currentTarget.style.background = 'var(--cafe-bg-surface)'; }}>Cancel</button>
              <button style={{ padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--cafe-accent-bg)", border: "1px solid var(--cafe-accent)", color: "var(--cafe-accent)", cursor: "pointer", transition: "all 0.2s" }} onClick={handleAdjustment} onMouseOver={e => { e.currentTarget.style.background = 'var(--cafe-accent)'; e.currentTarget.style.color = '#1A1208'; }} onMouseOut={e => { e.currentTarget.style.background = 'var(--cafe-accent-bg)'; e.currentTarget.style.color = 'var(--cafe-accent)'; }}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <WarningDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null, usedIn: [], hasHistory: false, onConfirm: null })}
        onConfirm={deleteDialog.onConfirm}
        title="Delete Inventory Item"
        description="This action cannot be undone."
        warning={`Delete "${itemName(deleteDialog.item)}"?`}
        consequence={deleteDialog.usedIn.length > 0 
          ? `"${itemName(deleteDialog.item)}" is used in ${deleteDialog.usedIn.length} menu recipe${deleteDialog.usedIn.length > 1 ? "s" : ""} (${deleteDialog.usedIn.join(", ")}). Deleting it may break those recipes${deleteDialog.hasHistory ? " and will remove its movement history" : ""}.`
          : deleteDialog.hasHistory 
            ? `This will also remove its ${deleteDialog.item?.movements?.length || 0} stock movement record(s).`
            : "This item will be permanently removed from inventory."
        }
        confirmLabel="Delete Item"
      />

      <PermissionDeniedDialog
        open={permissionDeniedDialog.open}
        onClose={() => setPermissionDeniedDialog({ ...permissionDeniedDialog, open: false })}
        action={permissionDeniedDialog.action}
        requiredPermission={permissionDeniedDialog.requiredPermission}
        currentRole={permissionDeniedDialog.currentRole}
        contactMessage="Contact a manager or owner for access to manage inventory."
      />
    </div>
  );
}
