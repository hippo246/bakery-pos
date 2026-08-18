// Production constants and seed data for CafeOS

import {
  BATCH_STATUS,
  QC_GRADES,
  QC_STATUS,
  WASTAGE_REASONS,
  REPLACEMENT_REASONS,
  TRACEABILITY_STATES,
  EXPIRY_GROUPS,
  QUALITY_CHECK_TYPES,
  CHECK_RESULTS
} from "../domain/productionModel.js";
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

// ── Seed production batches ───────────────────────────────────────────────────
// PRODUCTION SAFETY: This is demo data, forbidden in production

export const LEGACY_INIT_PRODUCTION_BATCHES = [
  {
    id: "BATCH-20240723-001",
    productId: "m1",
    productName: "Cappuccino",
    status: "COMPLETED",
    productionDate: Date.now() - (2 * 24 * 60 * 60 * 1000),
    operator: "Ravi Kumar",
    branch: "Main",
    plannedQuantity: 50,
    unit: "cups",
    plannedServings: 50,
    targetCompletionTime: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000),
    actualProduced: 48,
    acceptedOutput: 46,
    rejectedOutput: 2,
    wastageQuantity: 1,
    finalUsableQuantity: 45,
    ingredients: [
      { ingredientId: "ing1", ingredientName: "Espresso Shot", plannedQuantity: 48, actualQuantity: 48, unit: "shots", variance: 0, sourceBatch: null },
      { ingredientId: "ing2", ingredientName: "Steamed Milk", plannedQuantity: 960, actualQuantity: 950, unit: "ml", variance: -10, sourceBatch: null },
      { ingredientId: "ing3", ingredientName: "Milk Foam", plannedQuantity: 240, actualQuantity: 230, unit: "ml", variance: -10, sourceBatch: null }
    ],
    qualityControl: {
      grade: "A",
      status: "PASSED",
      checks: [
        { name: "Appearance", result: "PASS", notes: "Perfect crema" },
        { name: "Texture", result: "PASS", notes: "Smooth foam" },
        { name: "Taste", result: "PASS", notes: "Excellent balance" },
        { name: "Temperature", result: "PASS", notes: "65°C" },
        { name: "Packaging", result: "PASS", notes: null }
      ],
      temperature: 65,
      appearance: "Perfect crema, consistent color",
      texture: "Smooth microfoam",
      taste: "Excellent balance of espresso and milk",
      packaging: "Standard cups",
      notes: "Excellent batch",
      checkedBy: "Priya Sharma",
      checkedAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000),
      correctiveAction: null
    },
    manufactureDate: Date.now() - (2 * 24 * 60 * 60 * 1000),
    bestBeforeDate: Date.now() - (2 * 24 * 60 * 60 * 1000) + (15 * 60 * 1000),
    expiryDate: Date.now() - (2 * 24 * 60 * 60 * 1000) + (30 * 60 * 1000),
    shelfLife: "30 minutes",
    storageInstruction: "Keep warm, serve within 30 minutes",
    traceability: [
      { id: "TRACE-001", customerId: "c1", customerName: "Rohan Mehta", deliveryId: null, deliveryReference: null, invoiceReference: "ORD-001", quantitySupplied: 20, unit: "cups", dateSupplied: Date.now() - (2 * 24 * 60 * 60 * 1000) + (30 * 60 * 1000), returnedQuantity: 0, replacementQuantity: 0, note: null, mode: "MANUAL", createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (35 * 60 * 1000) },
      { id: "TRACE-002", customerId: "c3", customerName: "Vikram Desai", deliveryId: null, deliveryReference: null, invoiceReference: "ORD-002", quantitySupplied: 25, unit: "cups", dateSupplied: Date.now() - (2 * 24 * 60 * 60 * 1000) + (40 * 60 * 1000), returnedQuantity: 0, replacementQuantity: 0, note: null, mode: "MANUAL", createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (45 * 60 * 1000) }
    ],
    replacements: [],
    productionNotes: "Standard morning production run",
    internalNote: "No issues",
    referenceNumber: null,
    attachments: [],
    activity: [
      { type: "batch_created", description: "Batch created", actor: "Ravi Kumar", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) },
      { type: "production_started", description: "Production started", actor: "Ravi Kumar", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (5 * 60 * 1000) },
      { type: "output_recorded", description: "Output recorded: 48 cups", actor: "Ravi Kumar", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "qc_submitted", description: "QC submitted", actor: "Priya Sharma", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "qc_approved", description: "QC approved - Grade A", actor: "Priya Sharma", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "batch_completed", description: "Batch completed", actor: "Ravi Kumar", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) }
    ],
    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)
  },
  {
    id: "BATCH-20240723-002",
    productId: "m2",
    productName: "Matcha Latte",
    status: "IN_PROGRESS",
    productionDate: Date.now(),
    operator: "Anita Patel",
    branch: "Main",
    plannedQuantity: 30,
    unit: "cups",
    plannedServings: 30,
    targetCompletionTime: Date.now() + (1 * 60 * 60 * 1000),
    actualProduced: 0,
    acceptedOutput: 0,
    rejectedOutput: 0,
    wastageQuantity: 0,
    finalUsableQuantity: 0,
    ingredients: [
      { ingredientId: "ing4", ingredientName: "Matcha Powder", plannedQuantity: 60, actualQuantity: 0, unit: "g", variance: -60, sourceBatch: null },
      { ingredientId: "ing2", ingredientName: "Steamed Milk", plannedQuantity: 600, actualQuantity: 0, unit: "ml", variance: -600, sourceBatch: null },
      { ingredientId: "ing5", ingredientName: "Honey", plannedQuantity: 90, actualQuantity: 0, unit: "ml", variance: -90, sourceBatch: null }
    ],
    qualityControl: null,
    manufactureDate: Date.now(),
    bestBeforeDate: null,
    expiryDate: null,
    shelfLife: null,
    storageInstruction: null,
    traceability: [],
    replacements: [],
    productionNotes: "Afternoon matcha production",
    internalNote: null,
    referenceNumber: null,
    attachments: [],
    activity: [
      { type: "batch_created", description: "Batch created", actor: "Anita Patel", timestamp: Date.now() },
      { type: "production_started", description: "Production started", actor: "Anita Patel", timestamp: Date.now() + (10 * 60 * 1000) }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "BATCH-20240722-001",
    productId: "m3",
    productName: "Cold Brew",
    status: "AWAITING_QC",
    productionDate: Date.now() - (1 * 24 * 60 * 60 * 1000),
    operator: "Suresh Reddy",
    branch: "Main",
    plannedQuantity: 20,
    unit: "liters",
    plannedServings: 80,
    targetCompletionTime: Date.now() - (1 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000),
    actualProduced: 19,
    acceptedOutput: 0,
    rejectedOutput: 0,
    wastageQuantity: 0,
    finalUsableQuantity: 0,
    ingredients: [
      { ingredientId: "ing6", ingredientName: "Coffee Beans", plannedQuantity: 2000, actualQuantity: 1950, unit: "g", variance: -50, sourceBatch: "BATCH-BEANS-001" },
      { ingredientId: "ing7", ingredientName: "Water", plannedQuantity: 19000, actualQuantity: 19000, unit: "ml", variance: 0, sourceBatch: null }
    ],
    qualityControl: {
      grade: null,
      status: "PENDING",
      checks: [],
      temperature: null,
      appearance: null,
      texture: null,
      taste: null,
      packaging: null,
      notes: "Awaiting quality check after 24-hour steep",
      checkedBy: null,
      checkedAt: null,
      correctiveAction: null
    },
    manufactureDate: Date.now() - (1 * 24 * 60 * 60 * 1000),
    bestBeforeDate: Date.now() - (1 * 24 * 60 * 60 * 1000) + (5 * 24 * 60 * 60 * 1000),
    expiryDate: Date.now() - (1 * 24 * 60 * 60 * 1000) + (7 * 24 * 60 * 60 * 1000),
    shelfLife: "7 days",
    storageInstruction: "Refrigerate at 4°C",
    traceability: [],
    replacements: [],
    productionNotes: "24-hour cold brew steep",
    internalNote: "Needs QC before release",
    referenceNumber: null,
    attachments: [],
    activity: [
      { type: "batch_created", description: "Batch created", actor: "Suresh Reddy", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) },
      { type: "production_started", description: "Production started", actor: "Suresh Reddy", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) + (5 * 60 * 1000) },
      { type: "output_recorded", description: "Output recorded: 19 liters", actor: "Suresh Reddy", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) },
      { type: "qc_submitted", description: "QC submitted for review", actor: "Suresh Reddy", timestamp: Date.now() - (1 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) }
    ],
    createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (1 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000)
  },
  {
    id: "BATCH-20240721-001",
    productId: "m4",
    productName: "Croissant",
    status: "COMPLETED",
    productionDate: Date.now() - (2 * 24 * 60 * 60 * 1000),
    operator: "Meena Singh",
    branch: "Main",
    plannedQuantity: 40,
    unit: "pcs",
    plannedServings: 40,
    targetCompletionTime: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000),
    actualProduced: 38,
    acceptedOutput: 35,
    rejectedOutput: 3,
    wastageQuantity: 2,
    finalUsableQuantity: 33,
    ingredients: [
      { ingredientId: "ing8", ingredientName: "Flour", plannedQuantity: 5000, actualQuantity: 4900, unit: "g", variance: -100, sourceBatch: null },
      { ingredientId: "ing9", ingredientName: "Butter", plannedQuantity: 2500, actualQuantity: 2450, unit: "g", variance: -50, sourceBatch: null },
      { ingredientId: "ing10", ingredientName: "Yeast", plannedQuantity: 100, actualQuantity: 100, unit: "g", variance: 0, sourceBatch: null }
    ],
    qualityControl: {
      grade: "B",
      status: "PASSED",
      checks: [
        { name: "Appearance", result: "PASS", notes: "Good lamination" },
        { name: "Texture", result: "NEEDS_REVIEW", notes: "Slightly dense" },
        { name: "Taste", result: "PASS", notes: "Good flavor" },
        { name: "Packaging", result: "PASS", notes: null }
      ],
      temperature: null,
      appearance: "Good lamination, golden color",
      texture: "Slightly dense in center",
      taste: "Good butter flavor",
      packaging: "Paper bags",
      notes: "Acceptable quality, slight texture issue",
      checkedBy: "Priya Sharma",
      checkedAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000),
      correctiveAction: "Adjust proofing time for next batch"
    },
    manufactureDate: Date.now() - (2 * 24 * 60 * 60 * 1000),
    bestBeforeDate: Date.now() - (2 * 24 * 60 * 60 * 1000) + (1 * 24 * 60 * 60 * 1000),
    expiryDate: Date.now() - (2 * 24 * 60 * 60 * 1000) + (2 * 24 * 60 * 60 * 1000),
    shelfLife: "2 days",
    storageInstruction: "Store in airtight container at room temperature",
    traceability: [
      { id: "TRACE-003", customerId: "c2", customerName: "Sneha Kulkarni", deliveryId: null, deliveryReference: null, invoiceReference: "ORD-003", quantitySupplied: 15, unit: "pcs", dateSupplied: Date.now() - (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), returnedQuantity: 0, replacementQuantity: 0, note: null, mode: "MANUAL", createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000) },
      { id: "TRACE-004", customerId: "c5", customerName: "Karan Joshi", deliveryId: null, deliveryReference: null, invoiceReference: "ORD-004", quantitySupplied: 18, unit: "pcs", dateSupplied: Date.now() - (2 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000), returnedQuantity: 0, replacementQuantity: 0, note: null, mode: "MANUAL", createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000) }
    ],
    replacements: [
      { id: "REPL-001", customerId: "c2", customerName: "Sneha Kulkarni", deliveryId: null, orderReference: "ORD-003", originalQuantity: 15, replacementQuantity: 1, unit: "pcs", reason: "quality_issue", replacementDate: Date.now() - (2 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000), replacementBatchId: null, approvedBy: "Meena Singh", note: "Slightly dense croissant replaced", createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000) }
    ],
    productionNotes: "Morning pastry production",
    internalNote: "Monitor proofing consistency",
    referenceNumber: null,
    attachments: [],
    activity: [
      { type: "batch_created", description: "Batch created", actor: "Meena Singh", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) },
      { type: "production_started", description: "Production started", actor: "Meena Singh", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (30 * 60 * 1000) },
      { type: "output_recorded", description: "Output recorded: 38 pcs", actor: "Meena Singh", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) },
      { type: "qc_submitted", description: "QC submitted", actor: "Priya Sharma", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) },
      { type: "qc_approved", description: "QC approved - Grade B", actor: "Priya Sharma", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) },
      { type: "batch_completed", description: "Batch completed", actor: "Meena Singh", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) },
      { type: "replacement_added", description: "Replacement recorded for Sneha Kulkarni", actor: "Meena Singh", timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000) }
    ],
    createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now() - (2 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000)
  },
  {
    id: "BATCH-20240720-001",
    productId: "m5",
    productName: "Banana Bread",
    status: "EXPIRED",
    productionDate: Date.now() - (3 * 24 * 60 * 60 * 1000),
    operator: "Meena Singh",
    branch: "Main",
    plannedQuantity: 15,
    unit: "loaves",
    plannedServings: 60,
    targetCompletionTime: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000),
    actualProduced: 14,
    acceptedOutput: 14,
    rejectedOutput: 0,
    wastageQuantity: 0,
    finalUsableQuantity: 14,
    ingredients: [
      { ingredientId: "ing11", ingredientName: "Ripe Bananas", plannedQuantity: 2100, actualQuantity: 2100, unit: "g", variance: 0, sourceBatch: null },
      { ingredientId: "ing8", ingredientName: "Flour", plannedQuantity: 1750, actualQuantity: 1700, unit: "g", variance: -50, sourceBatch: null },
      { ingredientId: "ing12", ingredientName: "Sugar", plannedQuantity: 700, actualQuantity: 700, unit: "g", variance: 0, sourceBatch: null }
    ],
    qualityControl: {
      grade: "A",
      status: "PASSED",
      checks: [
        { name: "Appearance", result: "PASS", notes: "Good rise" },
        { name: "Texture", result: "PASS", notes: "Moist" },
        { name: "Taste", result: "PASS", notes: "Excellent" },
        { name: "Packaging", result: "PASS", notes: null }
      ],
      temperature: null,
      appearance: "Good rise, golden crust",
      texture: "Moist crumb",
      taste: "Excellent banana flavor",
      packaging: "Wrapped in film",
      notes: "Excellent quality",
      checkedBy: "Priya Sharma",
      checkedAt: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000),
      correctiveAction: null
    },
    manufactureDate: Date.now() - (3 * 24 * 60 * 60 * 1000),
    bestBeforeDate: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 24 * 60 * 60 * 1000),
    expiryDate: Date.now() - (3 * 24 * 60 * 60 * 1000) + (3 * 24 * 60 * 60 * 1000),
    shelfLife: "3 days",
    storageInstruction: "Store at room temperature, consume within 3 days",
    traceability: [
      { id: "TRACE-005", customerId: "c4", customerName: "Ayesha Khan", deliveryId: null, deliveryReference: null, invoiceReference: "ORD-005", quantitySupplied: 14, unit: "loaves", dateSupplied: Date.now() - (3 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000), returnedQuantity: 0, replacementQuantity: 0, note: null, mode: "MANUAL", createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000) }
    ],
    replacements: [],
    productionNotes: "Banana bread production",
    internalNote: "Expired - retained for audit",
    referenceNumber: null,
    attachments: [],
    activity: [
      { type: "batch_created", description: "Batch created", actor: "Meena Singh", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) },
      { type: "production_started", description: "Production started", actor: "Meena Singh", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + (20 * 60 * 1000) },
      { type: "output_recorded", description: "Output recorded: 14 loaves", actor: "Meena Singh", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "qc_submitted", description: "QC submitted", actor: "Priya Sharma", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "qc_approved", description: "QC approved - Grade A", actor: "Priya Sharma", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "batch_completed", description: "Batch completed", actor: "Meena Singh", timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) },
      { type: "expiry_status_changed", description: "Batch expired", actor: "System", timestamp: Date.now() - (0 * 24 * 60 * 60 * 1000) }
    ],
    createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
    updatedAt: Date.now()
  }
];

// ── Normalized production batches ───────────────────────────────────────────────

import { normalizeProductionBatches } from "../domain/productionModel.js";

export const INIT_PRODUCTION_BATCHES = () => {
  if (!isDatasetAllowed('INIT_PRODUCTION_BATCHES')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeProductionBatches(LEGACY_INIT_PRODUCTION_BATCHES);
};

// ── Production UI configuration ───────────────────────────────────────────────────

export const PRODUCTION_SECTIONS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "batches", label: "Batches", icon: "📦" },
  { id: "quality", label: "Quality & Output", icon: "✅" },
  { id: "ingredients", label: "Ingredients", icon: "🥄" },
  { id: "wastage", label: "Wastage", icon: "♻️" },
  { id: "expiry", label: "Expiry", icon: "⏰" },
  { id: "traceability", label: "Traceability", icon: "🔍" },
  { id: "replacements", label: "Replacements", icon: "🔄" }
];

export const BATCH_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "recently_updated", label: "Recently Updated" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "highest_output", label: "Highest Output" },
  { value: "highest_wastage", label: "Highest Wastage" },
  { value: "qc_pending", label: "QC Pending" },
  { value: "batch_id", label: "Batch ID" }
];

export const PRODUCTION_EXPORT_FORMATS = ["CSV", "XLSX", "PDF", "Print"];

export const PRODUCTION_PRINT_LAYOUTS = [
  { id: "batch_sheet", label: "Batch Sheet" },
  { id: "production_record", label: "Production Record" },
  { id: "qc_sheet", label: "Quality Control Sheet" },
  { id: "wastage_record", label: "Wastage Record" },
  { id: "traceability_report", label: "Traceability Report" },
  { id: "replacement_record", label: "Replacement Record" },
  { id: "expiry_report", label: "Expiry Report" }
];

// ── Helper functions ─────────────────────────────────────────────────────────────

/**
 * Format quantity with unit
 * @param {number} quantity - Quantity value
 * @param {string} unit - Unit string
 * @returns {string} Formatted quantity
 */
export function formatQuantity(quantity, unit = "") {
  const q = Number(quantity);
  if (!Number.isFinite(q)) return "-";
  const formatted = q.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date
 */
export function formatProductionDate(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/**
 * Format timestamp to readable datetime
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted datetime
 */
export function formatProductionDateTime(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Get relative time string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Relative time (e.g., "2 days ago")
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) return "-";
  
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

/**
 * Calculate production statistics
 * @param {Array} batches - Production batches
 * @returns {Object} Statistics
 */
export function calculateProductionStats(batches) {
  const now = Date.now();
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  
  const todayBatches = batches.filter(b => b.productionDate >= todayStart);
  const activeBatches = batches.filter(b => 
    ["PLANNED", "IN_PROGRESS", "AWAITING_QC"].includes(b.status)
  );
  const completedToday = todayBatches.filter(b => b.status === "COMPLETED");
  const qcPending = batches.filter(b => b.status === "AWAITING_QC");
  
  const totalPlanned = todayBatches.reduce((sum, b) => sum + b.plannedQuantity, 0);
  const totalActual = todayBatches.reduce((sum, b) => sum + b.actualProduced, 0);
  const totalWastage = todayBatches.reduce((sum, b) => sum + b.wastageQuantity, 0);
  
  const expiringSoon = batches.filter(b => {
    const days = getDaysUntilExpiry(b.expiryDate);
    return days !== null && days >= 0 && days <= 7;
  });
  
  const missingTraceability = batches.filter(b => {
    const reconciliation = reconcileBatchQuantities(b);
    return reconciliation.traceabilityState === "MISSING" || reconciliation.traceabilityState === "PARTIAL";
  });
  
  const totalReplacements = batches.reduce((sum, b) => {
    return sum + b.replacements.reduce((rSum, r) => rSum + r.replacementQuantity, 0);
  }, 0);
  
  return {
    activeBatches: activeBatches.length,
    completedToday: completedToday.length,
    plannedOutput: totalPlanned,
    actualOutput: totalActual,
    outputVariance: totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0,
    wastageToday: totalWastage,
    wastagePercentage: totalActual > 0 ? (totalWastage / totalActual) * 100 : 0,
    qcPending: qcPending.length,
    expiringSoon: expiringSoon.length,
    traceabilityMissing: missingTraceability.length,
    replacements: totalReplacements
  };
}

/**
 * Reconcile batch quantities (re-exported from domain model)
 */
import { reconcileBatchQuantities, getDaysUntilExpiry } from "../domain/productionModel.js";
