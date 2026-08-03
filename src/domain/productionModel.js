// Production domain model for CafeOS
// Handles production batches, quality control, traceability, wastage, and replacements

// ── Type definitions ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ProductionBatch
 * @property {string} id - Unique batch ID (e.g., "BATCH-20240723-001")
 * @property {string} productId - Product/menu item ID
 * @property {string} productName - Product name (denormalized for display)
 * @property {"DRAFT"|"PLANNED"|"IN_PROGRESS"|"AWAITING_QC"|"COMPLETED"|"ON_HOLD"|"REJECTED"|"CANCELLED"|"EXPIRED"} status
 * @property {number} productionDate - Production date timestamp
 * @property {string|null} operator - Operator name or ID
 * @property {string|null} branch - Branch identifier if multi-location
 * @property {number} plannedQuantity - Planned production quantity
 * @property {string} unit - Unit (kg, L, pcs, etc.)
 * @property {number|null} plannedServings - Planned servings/packs if applicable
 * @property {number|null} targetCompletionTime - Expected completion timestamp
 * @property {number} actualProduced - Actual units produced
 * @property {number} acceptedOutput - Accepted quantity
 * @property {number} rejectedOutput - Rejected quantity
 * @property {number} wastageQuantity - Wastage quantity
 * @property {number} finalUsableQuantity - Final usable quantity
 * @property {ProductionIngredient[]} ingredients - Ingredients used
 * @property {QualityControl|null} qualityControl - QC data
 * @property {number|null} manufactureDate - Manufacture date timestamp
 * @property {number|null} bestBeforeDate - Best-before date timestamp
 * @property {number|null} expiryDate - Expiry date timestamp
 * @property {string|null} shelfLife - Shelf life (e.g., "7 days", "2 weeks")
 * @property {string|null} storageInstruction - Storage instructions
 * @property {TraceabilityRecord[]} traceability - Customer/delivery traceability
 * @property {ReplacementRecord[]} replacements - Replacement records
 * @property {string|null} productionNotes - Production notes
 * @property {string|null} internalNote - Internal notes
 * @property {string|null} referenceNumber - External reference
 * @property {string[]} attachments - Attachment URLs or IDs
 * @property {ActivityEvent[]} activity - Activity timeline
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} ProductionIngredient
 * @property {string} ingredientId - Ingredient ID
 * @property {string} ingredientName - Ingredient name
 * @property {number} plannedQuantity - Planned quantity
 * @property {number} actualQuantity - Actual quantity used
 * @property {string} unit - Unit
 * @property {number} variance - Quantity variance
 * @property {string|null} sourceBatch - Source stock batch if applicable
 */

/**
 * @typedef {Object} QualityControl
 * @property {"A"|"B"|"C"|"REJECTED"} grade - QC grade
 * @property {"PENDING"|"PASSED"|"CONDITIONAL"|"FAILED"} status - QC status
 * @property {QualityCheck[]} checks - Individual quality checks
 * @property {number|null} temperature - Recorded temperature if applicable
 * @property {string|null} appearance - Appearance notes
 * @property {string|null} texture - Texture notes
 * @property {string|null} taste - Taste notes
 * @property {string|null} packaging - Packaging notes
 * @property {string|null} notes - General QC notes
 * @property {string|null} checkedBy - Who performed QC
 * @property {number|null} checkedAt - QC timestamp
 * @property {string|null} correctiveAction - Corrective action if failed
 */

/**
 * @typedef {Object} QualityCheck
 * @property {string} name - Check name (e.g., "Appearance", "Texture")
 * @property {"PASS"|"NEEDS_REVIEW"|"FAIL"|"NOT_APPLICABLE"} result - Check result
 * @property {string|null} notes - Check-specific notes
 */

/**
 * @typedef {Object} TraceabilityRecord
 * @property {string} id - Record ID
 * @property {string|null} customerId - Customer ID
 * @property {string|null} customerName - Customer name (denormalized)
 * @property {string|null} deliveryId - Delivery ID
 * @property {string|null} deliveryReference - Delivery reference
 * @property {string|null} invoiceReference - Invoice/order reference
 * @property {number} quantitySupplied - Quantity supplied
 * @property {string} unit - Unit
 * @property {number} dateSupplied - Supply date timestamp
 * @property {number} returnedQuantity - Returned quantity
 * @property {number} replacementQuantity - Replacement quantity
 * @property {string|null} note - Notes
 * @property {"MANUAL"|"AUTOMATIC"} mode - Traceability mode
 * @property {number} createdAt - Record creation timestamp
 */

/**
 * @typedef {Object} ReplacementRecord
 * @property {string} id - Record ID
 * @property {string|null} customerId - Customer ID
 * @property {string|null} customerName - Customer name
 * @property {string|null} deliveryId - Delivery ID
 * @property {string|null} orderReference - Related order reference
 * @property {number} originalQuantity - Original quantity
 * @property {number} replacementQuantity - Replacement quantity
 * @property {string} unit - Unit
 * @property {"damaged"|"quality_issue"|"wrong_quantity"|"incorrect_product"|"expired"|"customer_complaint"|"delivery_damage"|"other"} reason
 * @property {number} replacementDate - Replacement date timestamp
 * @property {string|null} replacementBatchId - Replacement batch ID if applicable
 * @property {string|null} approvedBy - Approval if required
 * @property {string|null} note - Notes
 * @property {number} createdAt - Record creation timestamp
 */

/**
 * @typedef {Object} ActivityEvent
 * @property {string} type - Event type
 * @property {string} description - Event description
 * @property {string|null} actor - Who performed the action
 * @property {number} timestamp - Event timestamp
 */

// ── Constants ───────────────────────────────────────────────────────────────────

export const BATCH_STATUS = {
  DRAFT: { label: "Draft", icon: "📝", color: "#95a5a6" },
  PLANNED: { label: "Planned", icon: "📅", color: "#3498db" },
  IN_PROGRESS: { label: "In Progress", icon: "🔄", color: "#f39c12" },
  AWAITING_QC: { label: "Awaiting QC", icon: "🔍", color: "#9b59b6" },
  COMPLETED: { label: "Completed", icon: "✅", color: "#27ae60" },
  ON_HOLD: { label: "On Hold", icon: "⏸️", color: "#e67e22" },
  REJECTED: { label: "Rejected", icon: "❌", color: "#e74c3c" },
  CANCELLED: { label: "Cancelled", icon: "🚫", color: "#7f8c8d" },
  EXPIRED: { label: "Expired", icon: "⏰", color: "#c0392b" }
};

export const QC_GRADES = {
  A: { label: "A", description: "Excellent quality", color: "#27ae60" },
  B: { label: "B", description: "Good quality", color: "#f39c12" },
  C: { label: "C", description: "Acceptable", color: "#e67e22" },
  REJECTED: { label: "Rejected", description: "Failed quality", color: "#e74c3c" }
};

export const QC_STATUS = {
  PENDING: { label: "Pending", color: "#95a5a6" },
  PASSED: { label: "Passed", color: "#27ae60" },
  CONDITIONAL: { label: "Conditional", color: "#f39c12" },
  FAILED: { label: "Failed", color: "#e74c3c" }
};

export const WASTAGE_REASONS = {
  PRODUCTION_LOSS: { label: "Production Loss", color: "#e67e22" },
  QUALITY_REJECTION: { label: "Quality Rejection", color: "#e74c3c" },
  SPILLAGE: { label: "Spillage", color: "#f39c12" },
  PACKAGING_DAMAGE: { label: "Packaging Damage", color: "#9b59b6" },
  EXPIRED: { label: "Expired", color: "#c0392b" },
  CONTAMINATION: { label: "Contamination", color: "#e74c3c" },
  INCORRECT_PREPARATION: { label: "Incorrect Preparation", color: "#e67e22" },
  OTHER: { label: "Other", color: "#95a5a6" }
};

export const REPLACEMENT_REASONS = {
  damaged: { label: "Damaged", color: "#e67e22" },
  quality_issue: { label: "Quality Issue", color: "#e74c3c" },
  wrong_quantity: { label: "Wrong Quantity", color: "#f39c12" },
  incorrect_product: { label: "Incorrect Product", color: "#9b59b6" },
  expired: { label: "Expired", color: "#c0392b" },
  customer_complaint: { label: "Customer Complaint", color: "#e67e22" },
  delivery_damage: { label: "Delivery Damage", color: "#e74c3c" },
  other: { label: "Other", color: "#95a5a6" }
};

export const TRACEABILITY_STATES = {
  COMPLETE: { label: "Complete", description: "All usable output has been linked", color: "#27ae60" },
  PARTIAL: { label: "Partial", description: "Some output remains unallocated", color: "#f39c12" },
  MISSING: { label: "Missing", description: "No traceability records", color: "#95a5a6" },
  OVERALLOCATED: { label: "Overallocated", description: "Linked quantity exceeds usable output", color: "#e74c3c" },
  NEEDS_REVIEW: { label: "Needs Review", description: "Traceability requires attention", color: "#e67e22" }
};

export const EXPIRY_GROUPS = {
  EXPIRES_TODAY: { label: "Expires Today", color: "#e74c3c", days: 0 },
  EXPIRES_SOON: { label: "Expires Soon", color: "#f39c12", days: 7 },
  HEALTHY: { label: "Healthy Shelf Life", color: "#27ae60", days: Infinity },
  EXPIRED: { label: "Expired", color: "#c0392b", days: -Infinity }
};

export const QUALITY_CHECK_TYPES = [
  { name: "Appearance", required: true },
  { name: "Texture", required: true },
  { name: "Taste", required: true },
  { name: "Temperature", required: false },
  { name: "Weight", required: false },
  { name: "Packaging", required: true },
  { name: "Seal Integrity", required: false },
  { name: "Label Accuracy", required: true },
  { name: "Hygiene", required: true },
  { name: "Storage Condition", required: false }
];

export const CHECK_RESULTS = {
  PASS: { label: "Pass", color: "#27ae60" },
  NEEDS_REVIEW: { label: "Needs Review", color: "#f39c12" },
  FAIL: { label: "Fail", color: "#e74c3c" },
  NOT_APPLICABLE: { label: "N/A", color: "#95a5a6" }
};

// ── Safe helpers ───────────────────────────────────────────────────────────────

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeStr = (v, fallback = "") => (v === null || v === undefined ? fallback : String(v));

const safeArr = (v) => (Array.isArray(v) ? v : []);

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Validate batch ID format
 * @param {string} batchId - Batch ID to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBatchId(batchId) {
  if (!batchId || typeof batchId !== "string") {
    return { valid: false, error: "Batch ID is required" };
  }
  if (batchId.trim().length === 0) {
    return { valid: false, error: "Batch ID cannot be empty" };
  }
  if (batchId.length > 50) {
    return { valid: false, error: "Batch ID is too long (max 50 characters)" };
  }
  return { valid: true };
}

/**
 * Check if batch ID is unique within a collection
 * @param {string} batchId - Batch ID to check
 * @param {ProductionBatch[]} existingBatches - Existing batch collection
 * @param {string|null} excludeId - Optional batch ID to exclude (for edits)
 * @returns {{ unique: boolean, error?: string }}
 */
export function checkBatchIdUnique(batchId, existingBatches, excludeId = null) {
  const duplicate = existingBatches.find(b => 
    b.id === batchId && b.id !== excludeId
  );
  if (duplicate) {
    return { 
      unique: false, 
      error: `Batch ID "${batchId}" already exists` 
    };
  }
  return { unique: true };
}

/**
 * Generate a batch ID with format: BATCH-YYYYMMDD-NNN
 * @param {number} sequence - Sequence number for the day
 * @param {Date|null} date - Date to use (defaults to today)
 * @returns {string}
 */
export function generateBatchId(sequence = 1, date = null) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `BATCH-${year}${month}${day}-${seq}`;
}

/**
 * Get next sequence number for batch ID generation
 * @param {ProductionBatch[]} existingBatches - Existing batches
 * @param {Date|null} date - Date to check (defaults to today)
 * @returns {number}
 */
export function getNextBatchSequence(existingBatches, date = null) {
  const d = date || new Date();
  const todayPrefix = `BATCH-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  
  const todayBatches = existingBatches.filter(b => b.id.startsWith(todayPrefix));
  const maxSeq = todayBatches.reduce((max, b) => {
    const match = b.id.match(/-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      return Math.max(max, seq);
    }
    return max;
  }, 0);
  
  return maxSeq + 1;
}

// ── Normalization ───────────────────────────────────────────────────────────────

/**
 * Normalize a production batch
 * @param {unknown} raw - Raw batch data
 * @param {ProductionBatch[]} existingBatches - Existing batches for ID validation
 * @returns {ProductionBatch|null}
 */
export function normalizeProductionBatch(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = safeStr(raw.id);
  if (!id) {
    return null;
  }

  const statusConfig = BATCH_STATUS[raw.status];
  const status = statusConfig ? raw.status : "DRAFT";

  const qcGradeConfig = QC_GRADES[raw.qualityControl?.grade];
  const qcGrade = qcGradeConfig ? raw.qualityControl.grade : null;

  const ingredients = safeArr(raw.ingredients).map(ing => ({
    ingredientId: safeStr(ing.ingredientId),
    ingredientName: safeStr(ing.ingredientName, ing.ingredientId || "Unknown"),
    plannedQuantity: safeNum(ing.plannedQuantity),
    actualQuantity: safeNum(ing.actualQuantity),
    unit: safeStr(ing.unit),
    variance: safeNum(ing.actualQuantity) - safeNum(ing.plannedQuantity),
    sourceBatch: safeStr(ing.sourceBatch)
  }));

  const traceability = safeArr(raw.traceability).map(tr => ({
    id: safeStr(tr.id, `TRACE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    customerId: safeStr(tr.customerId),
    customerName: safeStr(tr.customerName),
    deliveryId: safeStr(tr.deliveryId),
    deliveryReference: safeStr(tr.deliveryReference),
    invoiceReference: safeStr(tr.invoiceReference),
    quantitySupplied: safeNum(tr.quantitySupplied),
    unit: safeStr(tr.unit),
    dateSupplied: safeNum(tr.dateSupplied),
    returnedQuantity: safeNum(tr.returnedQuantity),
    replacementQuantity: safeNum(tr.replacementQuantity),
    note: safeStr(tr.note),
    mode: tr.mode === "AUTOMATIC" ? "AUTOMATIC" : "MANUAL",
    createdAt: safeNum(tr.createdAt, Date.now())
  }));

  const replacements = safeArr(raw.replacements).map(rep => ({
    id: safeStr(rep.id, `REPL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    customerId: safeStr(rep.customerId),
    customerName: safeStr(rep.customerName),
    deliveryId: safeStr(rep.deliveryId),
    orderReference: safeStr(rep.orderReference),
    originalQuantity: safeNum(rep.originalQuantity),
    replacementQuantity: safeNum(rep.replacementQuantity),
    unit: safeStr(rep.unit),
    reason: REPLACEMENT_REASONS[rep.reason] ? rep.reason : "other",
    replacementDate: safeNum(rep.replacementDate),
    replacementBatchId: safeStr(rep.replacementBatchId),
    approvedBy: safeStr(rep.approvedBy),
    note: safeStr(rep.note),
    createdAt: safeNum(rep.createdAt, Date.now())
  }));

  const activity = safeArr(raw.activity).map(act => ({
    type: safeStr(act.type),
    description: safeStr(act.description),
    actor: safeStr(act.actor),
    timestamp: safeNum(act.timestamp, Date.now())
  }));

  const actualProduced = safeNum(raw.actualProduced);
  const acceptedOutput = safeNum(raw.acceptedOutput);
  const rejectedOutput = safeNum(raw.rejectedOutput);
  const wastageQuantity = safeNum(raw.wastageQuantity);
  
  // Calculate final usable quantity
  const finalUsableQuantity = Math.max(0, acceptedOutput - wastageQuantity);

  return {
    id,
    productId: safeStr(raw.productId),
    productName: safeStr(raw.productName, raw.productId || "Unknown Product"),
    status,
    productionDate: safeNum(raw.productionDate, Date.now()),
    operator: safeStr(raw.operator),
    branch: safeStr(raw.branch),
    plannedQuantity: safeNum(raw.plannedQuantity),
    unit: safeStr(raw.unit, "pcs"),
    plannedServings: raw.plannedServings !== null ? safeNum(raw.plannedServings) : null,
    targetCompletionTime: raw.targetCompletionTime !== null ? safeNum(raw.targetCompletionTime) : null,
    actualProduced,
    acceptedOutput,
    rejectedOutput,
    wastageQuantity,
    finalUsableQuantity,
    ingredients,
    qualityControl: raw.qualityControl ? {
      grade: qcGrade,
      status: QC_STATUS[raw.qualityControl.status] ? raw.qualityControl.status : "PENDING",
      checks: safeArr(raw.qualityControl.checks).map(chk => ({
        name: safeStr(chk.name),
        result: CHECK_RESULTS[chk.result] ? chk.result : "NOT_APPLICABLE",
        notes: safeStr(chk.notes)
      })),
      temperature: raw.qualityControl.temperature !== null ? safeNum(raw.qualityControl.temperature) : null,
      appearance: safeStr(raw.qualityControl.appearance),
      texture: safeStr(raw.qualityControl.texture),
      taste: safeStr(raw.qualityControl.taste),
      packaging: safeStr(raw.qualityControl.packaging),
      notes: safeStr(raw.qualityControl.notes),
      checkedBy: safeStr(raw.qualityControl.checkedBy),
      checkedAt: raw.qualityControl.checkedAt !== null ? safeNum(raw.qualityControl.checkedAt) : null,
      correctiveAction: safeStr(raw.qualityControl.correctiveAction)
    } : null,
    manufactureDate: raw.manufactureDate !== null ? safeNum(raw.manufactureDate) : null,
    bestBeforeDate: raw.bestBeforeDate !== null ? safeNum(raw.bestBeforeDate) : null,
    expiryDate: raw.expiryDate !== null ? safeNum(raw.expiryDate) : null,
    shelfLife: safeStr(raw.shelfLife),
    storageInstruction: safeStr(raw.storageInstruction),
    traceability,
    replacements,
    productionNotes: safeStr(raw.productionNotes),
    internalNote: safeStr(raw.internalNote),
    referenceNumber: safeStr(raw.referenceNumber),
    attachments: safeArr(raw.attachments),
    activity,
    createdAt: safeNum(raw.createdAt, Date.now()),
    updatedAt: safeNum(raw.updatedAt, Date.now())
  };
}

/**
 * Normalize an array of production batches
 * @param {unknown[]} rawArray - Raw batch data array
 * @param {ProductionBatch[]} existingBatches - Existing batches for validation
 * @returns {ProductionBatch[]}
 */
export function normalizeProductionBatches(rawArray, existingBatches = []) {
  if (!Array.isArray(rawArray)) {
    return [];
  }
  return rawArray
    .map(raw => normalizeProductionBatch(raw, existingBatches))
    .filter(Boolean);
}

// ── Calculations ───────────────────────────────────────────────────────────────

/**
 * Calculate output variance percentage
 * @param {number} planned - Planned quantity
 * @param {number} actual - Actual quantity
 * @returns {number} Variance percentage
 */
export function calculateOutputVariance(planned, actual) {
  if (planned <= 0) return 0;
  return ((actual - planned) / planned) * 100;
}

/**
 * Calculate wastage percentage
 * @param {number} wastage - Wastage quantity
 * @param {number} produced - Actual produced quantity
 * @returns {number} Wastage percentage
 */
export function calculateWastagePercentage(wastage, produced) {
  if (produced <= 0) return 0;
  return (wastage / produced) * 100;
}

/**
 * Calculate traceability allocation state
 * @param {number} usableQuantity - Final usable quantity
 * @param {number} allocatedQuantity - Total allocated quantity
 * @returns {string} Traceability state key
 */
export function calculateTraceabilityState(usableQuantity, allocatedQuantity) {
  if (allocatedQuantity === 0) return "MISSING";
  if (allocatedQuantity > usableQuantity) return "OVERALLOCATED";
  if (allocatedQuantity < usableQuantity) return "PARTIAL";
  return "COMPLETE";
}

/**
 * Get expiry group for a batch
 * @param {number|null} expiryDate - Expiry date timestamp
 * @returns {string} Expiry group key
 */
export function getExpiryGroup(expiryDate) {
  if (!expiryDate) return "HEALTHY";
  
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilExpiry = (expiryDate - now) / msPerDay;
  
  if (daysUntilExpiry < 0) return "EXPIRED";
  if (daysUntilExpiry <= 1) return "EXPIRES_TODAY";
  if (daysUntilExpiry <= 7) return "EXPIRES_SOON";
  return "HEALTHY";
}

/**
 * Calculate days until expiry
 * @param {number|null} expiryDate - Expiry date timestamp
 * @returns {number|null} Days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((expiryDate - now) / msPerDay);
}

/**
 * Calculate total allocated quantity from traceability records
 * @param {TraceabilityRecord[]} traceability - Traceability records
 * @returns {number} Total allocated quantity
 */
export function calculateAllocatedQuantity(traceability) {
  if (!Array.isArray(traceability)) return 0;
  return traceability.reduce((sum, tr) => {
    const supplied = safeNum(tr.quantitySupplied);
    const returned = safeNum(tr.returnedQuantity);
    return sum + (supplied - returned);
  }, 0);
}

/**
 * Calculate total replacement quantity
 * @param {ReplacementRecord[]} replacements - Replacement records
 * @returns {number} Total replacement quantity
 */
export function calculateTotalReplacements(replacements) {
  if (!Array.isArray(replacements)) return 0;
  return replacements.reduce((sum, rep) => sum + safeNum(rep.replacementQuantity), 0);
}

/**
 * Reconcile batch quantities
 * @param {ProductionBatch} batch - Production batch
 * @returns {Object} Reconciliation data
 */
export function reconcileBatchQuantities(batch) {
  const planned = safeNum(batch.plannedQuantity);
  const produced = safeNum(batch.actualProduced);
  const accepted = safeNum(batch.acceptedOutput);
  const rejected = safeNum(batch.rejectedOutput);
  const wastage = safeNum(batch.wastageQuantity);
  const usable = safeNum(batch.finalUsableQuantity);
  
  const allocated = calculateAllocatedQuantity(batch.traceability);
  const totalReplacements = calculateTotalReplacements(batch.replacements);
  
  const outputVariance = calculateOutputVariance(planned, produced);
  const wastagePercent = calculateWastagePercentage(wastage, produced);
  const traceabilityState = calculateTraceabilityState(usable, allocated);
  
  const remaining = Math.max(0, usable - allocated);
  const unresolvedVariance = planned - (accepted + rejected + wastage);
  
  return {
    planned,
    produced,
    accepted,
    rejected,
    wastage,
    usable,
    allocated,
    totalReplacements,
    outputVariance,
    wastagePercent,
    traceabilityState,
    remaining,
    unresolvedVariance
  };
}

// ── Activity tracking ─────────────────────────────────────────────────────────

/**
 * Add activity event to batch
 * @param {ProductionBatch} batch - Batch to update
 * @param {string} type - Event type
 * @param {string} description - Event description
 * @param {string|null} actor - Who performed the action
 * @returns {ProductionBatch} Updated batch
 */
export function addActivityEvent(batch, type, description, actor = null) {
  const newEvent = {
    type,
    description,
    actor: actor || batch.operator || "System",
    timestamp: Date.now()
  };
  
  return {
    ...batch,
    activity: [...batch.activity, newEvent],
    updatedAt: Date.now()
  };
}

/**
 * Create initial activity events for a new batch
 * @param {string} status - Initial batch status
 * @param {string|null} operator - Operator
 * @returns {ActivityEvent[]} Initial activity
 */
export function createInitialActivity(status, operator = null) {
  const events = [
    {
      type: "batch_created",
      description: "Batch created",
      actor: operator || "System",
      timestamp: Date.now()
    }
  ];
  
  if (status === "IN_PROGRESS") {
    events.push({
      type: "production_started",
      description: "Production started",
      actor: operator || "System",
      timestamp: Date.now()
    });
  }
  
  return events;
}

// ── Search and filter ─────────────────────────────────────────────────────────

/**
 * Search batches by query
 * @param {ProductionBatch[]} batches - Batches to search
 * @param {string} query - Search query
 * @returns {ProductionBatch[]} Filtered batches
 */
export function searchBatches(batches, query) {
  if (!query || query.trim().length === 0) {
    return batches;
  }
  
  const q = query.toLowerCase().trim();
  
  return batches.filter(batch => {
    const batchId = batch.id.toLowerCase();
    const product = batch.productName.toLowerCase();
    const operator = (batch.operator || "").toLowerCase();
    const notes = (batch.productionNotes || "").toLowerCase();
    const ref = (batch.referenceNumber || "").toLowerCase();
    
    // Check ingredients
    const ingredientMatch = batch.ingredients.some(ing => 
      ing.ingredientName.toLowerCase().includes(q) ||
      ing.ingredientId.toLowerCase().includes(q)
    );
    
    // Check traceability
    const traceabilityMatch = batch.traceability.some(tr =>
      (tr.customerName || "").toLowerCase().includes(q) ||
      (tr.deliveryReference || "").toLowerCase().includes(q) ||
      (tr.invoiceReference || "").toLowerCase().includes(q)
    );
    
    return (
      batchId.includes(q) ||
      product.includes(q) ||
      operator.includes(q) ||
      notes.includes(q) ||
      ref.includes(q) ||
      ingredientMatch ||
      traceabilityMatch
    );
  });
}

/**
 * Filter batches by status
 * @param {ProductionBatch[]} batches - Batches to filter
 * @param {string[]} statuses - Statuses to include
 * @returns {ProductionBatch[]} Filtered batches
 */
export function filterByStatus(batches, statuses) {
  if (!statuses || statuses.length === 0) return batches;
  return batches.filter(batch => statuses.includes(batch.status));
}

/**
 * Filter batches by date range
 * @param {ProductionBatch[]} batches - Batches to filter
 * @param {number|null} startDate - Start timestamp
 * @param {number|null} endDate - End timestamp
 * @returns {ProductionBatch[]} Filtered batches
 */
export function filterByDateRange(batches, startDate, endDate) {
  if (!startDate && !endDate) return batches;
  
  return batches.filter(batch => {
    const date = batch.productionDate;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });
}

/**
 * Filter batches by expiry state
 * @param {ProductionBatch[]} batches - Batches to filter
 * @param {string[]} groups - Expiry groups to include
 * @returns {ProductionBatch[]} Filtered batches
 */
export function filterByExpiryGroup(batches, groups) {
  if (!groups || groups.length === 0) return batches;
  
  return batches.filter(batch => {
    const group = getExpiryGroup(batch.expiryDate);
    return groups.includes(group);
  });
}

/**
 * Filter batches by QC grade
 * @param {ProductionBatch[]} batches - Batches to filter
 * @param {string[]} grades - QC grades to include
 * @returns {ProductionBatch[]} Filtered batches
 */
export function filterByQCGrade(batches, grades) {
  if (!grades || grades.length === 0) return batches;
  
  return batches.filter(batch => {
    const grade = batch.qualityControl?.grade;
    return grade && grades.includes(grade);
  });
}

/**
 * Filter batches by traceability state
 * @param {ProductionBatch[]} batches - Batches to filter
 * @param {string[]} states - Traceability states to include
 * @returns {ProductionBatch[]} Filtered batches
 */
export function filterByTraceabilityState(batches, states) {
  if (!states || states.length === 0) return batches;
  
  return batches.filter(batch => {
    const reconciliation = reconcileBatchQuantities(batch);
    return states.includes(reconciliation.traceabilityState);
  });
}

// ── Sorting ───────────────────────────────────────────────────────────────────

/**
 * Sort batches by various criteria
 * @param {ProductionBatch[]} batches - Batches to sort
 * @param {string} sortBy - Sort criteria
 * @param {boolean} ascending - Sort direction
 * @returns {ProductionBatch[]} Sorted batches
 */
export function sortBatches(batches, sortBy = "newest", ascending = false) {
  const sorted = [...batches];
  
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => ascending ? a.productionDate - b.productionDate : b.productionDate - a.productionDate);
    
    case "oldest":
      return sorted.sort((a, b) => ascending ? b.productionDate - a.productionDate : a.productionDate - b.productionDate);
    
    case "recently_updated":
      return sorted.sort((a, b) => ascending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt);
    
    case "expiring_soon":
      return sorted.sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.expiryDate) ?? Infinity;
        const daysB = getDaysUntilExpiry(b.expiryDate) ?? Infinity;
        return ascending ? daysA - daysB : daysB - daysA;
      });
    
    case "highest_output":
      return sorted.sort((a, b) => ascending ? a.actualProduced - b.actualProduced : b.actualProduced - a.actualProduced);
    
    case "highest_wastage":
      return sorted.sort((a, b) => ascending ? a.wastageQuantity - b.wastageQuantity : b.wastageQuantity - a.wastageQuantity);
    
    case "qc_pending":
      return sorted.sort((a, b) => {
        const aPending = a.status === "AWAITING_QC" ? 1 : 0;
        const bPending = b.status === "AWAITING_QC" ? 1 : 0;
        return ascending ? aPending - bPending : bPending - aPending;
      });
    
    case "batch_id":
      return sorted.sort((a, b) => ascending ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));
    
    default:
      return sorted;
  }
}
