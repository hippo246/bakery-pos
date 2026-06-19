// Discount and coupon data for BrewCRM

export const INIT_DISCOUNTS = [
  { id: "disc-001", code: "WELCOME10", type: "percentage", value: 10, minOrder: 200, maxDiscount: 100, status: "active", usageCount: 45, maxUsage: 100, expiryDate: "2026-12-31", description: "Welcome discount for new customers" },
  { id: "disc-002", code: "COFFEE20", type: "percentage", value: 20, minOrder: 500, maxDiscount: 200, status: "active", usageCount: 120, maxUsage: 200, expiryDate: "2026-08-31", description: "20% off on orders above ₹500" },
  { id: "disc-003", code: "FLAT100", type: "flat", value: 100, minOrder: 800, maxDiscount: 100, status: "active", usageCount: 78, maxUsage: 150, expiryDate: "2026-09-30", description: "Flat ₹100 off on orders above ₹800" },
  { id: "disc-004", code: "HAPPYHOUR", type: "percentage", value: 15, minOrder: 300, maxDiscount: 150, status: "active", usageCount: 200, maxUsage: 500, expiryDate: "2026-07-31", description: "Happy hour special - 15% off" },
  { id: "disc-005", code: "LOYALTY50", type: "flat", value: 50, minOrder: 400, maxDiscount: 50, status: "active", usageCount: 30, maxUsage: 100, expiryDate: "2026-12-31", description: "Loyalty reward - ₹50 off", tierRequired: "SILVER" },
  { id: "disc-006", code: "SUMMER25", type: "percentage", value: 25, minOrder: 600, maxDiscount: 300, status: "expired", usageCount: 150, maxUsage: 200, expiryDate: "2026-05-31", description: "Summer special discount" },
];

export const DISCOUNT_TYPES = ["percentage", "flat"];
export const DISCOUNT_STATUS = ["All", "active", "expired", "inactive"];
export const TIER_REQUIREMENTS = ["All", "BRONZE", "SILVER", "GOLD", "PLATINUM"];
