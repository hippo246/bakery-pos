import { normalizeOrders, normalizeCustomers, normalizeKdsCards } from '../domain/normalize.js';
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';
import { MENU_ITEMS, NAV_MENU_ITEMS } from './mockData/menuData.js';
import { 
  LEGACY_INIT_ORDERS, 
  LEGACY_INIT_CUSTOMERS, 
  INIT_HIST, 
  LEGACY_INIT_KDS 
} from './mockData/orderData.js';

// Re-export for backwards compatibility
export { MENU_ITEMS, NAV_MENU_ITEMS };
export { 
  LEGACY_INIT_ORDERS, 
  LEGACY_INIT_CUSTOMERS, 
  INIT_HIST, 
  LEGACY_INIT_KDS 
};

// Normalized orders using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_ORDERS = () => {
  if (!isDatasetAllowed('INIT_ORDERS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeOrders(LEGACY_INIT_ORDERS);
};

// Normalized customers using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_CUSTOMERS = () => {
  if (!isDatasetAllowed('INIT_CUSTOMERS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeCustomers(LEGACY_INIT_CUSTOMERS);
};

// Normalized KDS cards using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_KDS = () => {
  if (!isDatasetAllowed('INIT_KDS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeKdsCards(LEGACY_INIT_KDS);
};

export const MENU_CATS = ["ALL", "Other", "Msgs", "Beers", "Cocktails", "Red Wines", "White Wines", "Breakfast", "Beverages", "Brunch", "Appetizer", "Salads", "Entrees", "Sandwich", "Sides"];

// Modifier categories and options for menu items
export const MODIFIER_CATEGORIES = {
  MILK: {
    id: "milk",
    name: "Milk",
    icon: "🥛",
    options: [
      { id: "regular", name: "Regular", price: 0 },
      { id: "oat", name: "Oat Milk", price: 20 },
      { id: "almond", name: "Almond Milk", price: 20 },
      { id: "soy", name: "Soy Milk", price: 15 },
      { id: "coconut", name: "Coconut Milk", price: 25 },
    ]
  },
  SIZE: {
    id: "size",
    name: "Size",
    icon: "📏",
    options: [
      { id: "small", name: "Small", price: -10 },
      { id: "regular", name: "Regular", price: 0 },
      { id: "large", name: "Large", price: 20 },
    ]
  },
  EXTRAS: {
    id: "extras",
    name: "Extras",
    icon: "➕",
    options: [
      { id: "extra_shot", name: "Extra Shot", price: 30 },
      { id: "whipped_cream", name: "Whipped Cream", price: 15 },
      { id: "chocolate_sauce", name: "Chocolate Sauce", price: 20 },
      { id: "caramel", name: "Caramel Drizzle", price: 15 },
      { id: "vanilla_syrup", name: "Vanilla Syrup", price: 10 },
    ]
  },
  TEMPERATURE: {
    id: "temperature",
    name: "Temperature",
    icon: "🌡️",
    options: [
      { id: "hot", name: "Hot", price: 0 },
      { id: "iced", name: "Iced", price: 10 },
    ]
  },
  SPICE: {
    id: "spice",
    name: "Spice Level",
    icon: "🌶️",
    options: [
      { id: "mild", name: "Mild", price: 0 },
      { id: "medium", name: "Medium", price: 0 },
      { id: "spicy", name: "Spicy", price: 0 },
      { id: "extra_spicy", name: "Extra Spicy", price: 5 },
    ]
  }
};

// Map modifier categories to menu item categories
export const MENU_MODIFIER_MAP = {
  "Coffee": ["MILK", "SIZE", "EXTRAS", "TEMPERATURE"],
  "Special": ["MILK", "SIZE", "EXTRAS", "TEMPERATURE"],
  "Food": ["SPICE", "EXTRAS"],
};

// Quick order templates for common combinations
export const QUICK_ORDER_TEMPLATES = [
  {
    id: "morning_combo",
    name: "Morning Combo",
    description: "Coffee + Pastry",
    items: [
      { menuItemId: "m2", qty: 1 }, // Cappuccino
      { menuItemId: "m5", qty: 1 }, // Croissant
    ],
    icon: "☕",
    discount: 10, // 10% off
  },
  {
    id: "breakfast_special",
    name: "Breakfast Special",
    description: "Coffee + Avocado Toast",
    items: [
      { menuItemId: "m1", qty: 1 }, // Espresso
      { menuItemId: "m6", qty: 1 }, // Avocado Toast
    ],
    icon: "🍳",
    discount: 15,
  },
  {
    id: "afternoon_treat",
    name: "Afternoon Treat",
    description: "Special + Muffin",
    items: [
      { menuItemId: "m4", qty: 1 }, // Matcha Latte
      { menuItemId: "m10", qty: 1 }, // Blueberry Muffin
    ],
    icon: "🧁",
    discount: 5,
  },
  {
    id: "coffee_lover",
    name: "Coffee Lover",
    description: "3 Coffees",
    items: [
      { menuItemId: "m1", qty: 2 }, // 2 Espresso
      { menuItemId: "m2", qty: 1 }, // 1 Cappuccino
    ],
    icon: "☕",
    discount: 20,
  },
];

// Pre-saved order notes templates for quick insertion
export const ORDER_NOTES_TEMPLATES = [
  { id: "no_onions", text: "No onions", shortcut: "Ctrl+1" },
  { id: "extra_spicy", text: "Extra spicy", shortcut: "Ctrl+2" },
  { id: "no_ice", text: "No ice", shortcut: "Ctrl+3" },
  { id: "dairy_free", text: "Dairy-free milk", shortcut: "Ctrl+4" },
  { id: "gluten_free", text: "Gluten-free", shortcut: "Ctrl+5" },
  { id: "allergy_nuts", text: "Nut allergy - no nuts", shortcut: "Ctrl+6" },
  { id: "well_done", text: "Well done", shortcut: "Ctrl+7" },
  { id: "medium", text: "Medium", shortcut: "Ctrl+8" },
  { id: "rare", text: "Rare", shortcut: "Ctrl+9" },
  { id: "no_salt", text: "No salt", shortcut: "Ctrl+0" },
  { id: "extra_sauce", text: "Extra sauce", shortcut: "Ctrl+Q" },
  { id: "on_side", text: "Sauce on side", shortcut: "Ctrl+W" },
];

// Allergen information for menu items
export const ALLERGENS = {
  DAIRY: { id: "dairy", name: "Dairy", icon: "🥛", severity: "high" },
  NUTS: { id: "nuts", name: "Nuts", icon: "🥜", severity: "high" },
  GLUTEN: { id: "gluten", name: "Gluten", icon: "🌾", severity: "high" },
  EGGS: { id: "eggs", name: "Eggs", icon: "🥚", severity: "medium" },
  SOY: { id: "soy", name: "Soy", icon: "🫘", severity: "medium" },
  SHELLFISH: { id: "shellfish", name: "Shellfish", icon: "🦐", severity: "high" },
  FISH: { id: "fish", name: "Fish", icon: "🐟", severity: "high" },
  PEANUTS: { id: "peanuts", name: "Peanuts", icon: "🥜", severity: "high" },
};

// Menu item allergen mapping (example - would be populated from actual menu data)
export const MENU_ITEM_ALLERGENS = {
  "m1": ["dairy"], // Espresso - milk
  "m2": ["dairy"], // Cappuccino - milk
  "m3": ["dairy"], // Latte - milk
  "m4": ["dairy"], // Matcha Latte - milk
  "m5": ["gluten", "dairy", "eggs"], // Croissant - gluten, dairy, eggs
  "m6": ["gluten", "eggs"], // Avocado Toast - gluten (bread), eggs
  "m7": ["gluten", "dairy"], // Sandwich - gluten, dairy
  "m8": ["gluten", "dairy"], // Burger - gluten (bun), dairy (cheese)
  "m9": ["gluten", "dairy", "eggs"], // Cake - gluten, dairy, eggs
  "m10": ["gluten", "dairy", "eggs", "nuts"], // Muffin - gluten, dairy, eggs, nuts
};

// Refund/Void reasons for order cancellation
export const REFUND_VOID_REASONS = [
  { id: "customer_request", label: "Customer Request", type: "refund" },
  { id: "wrong_order", label: "Wrong Order", type: "void" },
  { id: "food_quality", label: "Food Quality Issue", type: "refund" },
  { id: "long_wait", label: "Long Wait Time", type: "refund" },
  { id: "duplicate_order", label: "Duplicate Order", type: "void" },
  { id: "payment_error", label: "Payment Error", type: "refund" },
  { id: "staff_mistake", label: "Staff Mistake", type: "void" },
  { id: "other", label: "Other (specify)", type: "both" },
];

// Price override reasons
export const PRICE_OVERRIDE_REASONS = [
  { id: "customer_discount", label: "Customer Discount" },
  { id: "price_match", label: "Price Match" },
  { id: "loyalty_reward", label: "Loyalty Reward" },
  { id: "bulk_order", label: "Bulk Order" },
  { id: "promotion", label: "Promotion" },
  { id: "staff_discount", label: "Staff Discount" },
  { id: "compensation", label: "Customer Compensation" },
  { id: "other", label: "Other (specify)" },
];

export const PEAK_SOP = [
  { id: "p1", threshold: 3, stat: "NEW", label: "Queue Backup", msg: "3+ new orders pending — call in backup or notify kitchen.", level: "warn" },
  { id: "p2", threshold: 2, stat: "READY", label: "Pick-up Delay", msg: "2+ orders sitting Ready — alert front-of-house for pickup.", level: "alert" },
  { id: "p3", threshold: 4, stat: "PREPARING", label: "High Kitchen Load", msg: "4+ orders in prep simultaneously — prioritise delivery orders.", level: "warn" },
];

export const TIER_COLORS = {
  BRONZE: { bg: "var(--tier-bronze-bg)", color: "var(--tier-bronze-color)", glow: "var(--tier-bronze-glow)" },
  SILVER: { bg: "var(--tier-silver-bg)", color: "var(--tier-silver-color)", glow: "var(--tier-silver-glow)" },
  GOLD: { bg: "var(--tier-gold-bg)", color: "var(--tier-gold-color)", glow: "var(--tier-gold-glow)" },
  PLATINUM: { bg: "var(--tier-platinum-bg)", color: "var(--tier-platinum-color)", glow: "var(--tier-platinum-glow)" },
};

export const STATUS_COLORS = {
  NEW: { bg: "var(--status-new-bg)", border: "var(--status-new-border)", color: "var(--status-new-color)", label: "New" },
  ACCEPTED: { bg: "var(--status-accepted-bg)", border: "var(--status-accepted-border)", color: "var(--status-accepted-color)", label: "Accepted" },
  PREPARING: { bg: "var(--status-preparing-bg)", border: "var(--status-preparing-border)", color: "var(--status-preparing-color)", label: "Preparing" },
  READY: { bg: "var(--status-ready-bg)", border: "var(--status-ready-border)", color: "var(--status-ready-color)", label: "Ready" },
  COMPLETED: { bg: "var(--status-completed-bg)", border: "var(--status-completed-border)", color: "var(--status-completed-color)", label: "Completed" },
  CANCELLED: { bg: "var(--status-cancelled-bg)", border: "var(--status-cancelled-border)", color: "var(--status-cancelled-color)", label: "Cancelled" },
  OUT_FOR_DELIVERY: { bg: "var(--status-delivery-bg)", border: "var(--status-delivery-border)", color: "var(--status-delivery-color)", label: "Out for Delivery" },
};

export const SRC_COLORS = {
  WALK_IN:          { bg: "var(--src-walkin-bg)", color: "var(--src-walkin-color)" },
  SWIGGY:           { bg: "var(--src-swiggy-bg)", color: "var(--src-swiggy-color)" },
  ZOMATO:           { bg: "var(--src-zomato-bg)", color: "var(--src-zomato-color)" },
  DIRECT_DELIVERY:  { bg: "var(--src-delivery-bg)", color: "var(--src-delivery-color)" },
  QR_ORDERING:      { bg: "var(--src-qr-bg)", color: "var(--src-qr-color)" },
};

export const ANALYTICS_DATA = {
  today: {
    metrics: [
      { val: "₹28,400", lbl: "Today's Revenue", change: "↑ 12%", up: true, sub: "vs yesterday" },
      { val: "143", lbl: "Orders Today", change: "↑ 8%", up: true, sub: "vs yesterday" },
      { val: "₹199", lbl: "Avg Order Value", change: "↓ 3%", up: false, sub: "vs yesterday" },
      { val: "68%", lbl: "Repeat Customers", change: "↑ 5%", up: true, sub: "this week" },
      { val: "4.2m", lbl: "Avg Prep Time", change: "↓ 0.3m", up: true, sub: "faster today" },
      { val: "97%", lbl: "Fulfillment Rate", change: "↑ 2%", up: true, sub: "vs last week" },
    ],
    barVals: [12,28,45,62,88,95,78,55,40,52,70,48],
    barLabels: ["8a","9a","10a","11a","12p","1p","2p","3p","4p","5p","6p","7p"],
    barCaption: "Orders by Hour",
    barPeak: "Peak: 1pm",
  },
  week: {
    metrics: [
      { val: "₹1,94,300", lbl: "Week Revenue", change: "↑ 9%", up: true, sub: "vs last week" },
      { val: "921", lbl: "Orders This Week", change: "↑ 6%", up: true, sub: "vs last week" },
      { val: "₹211", lbl: "Avg Order Value", change: "↑ 4%", up: true, sub: "vs last week" },
      { val: "65%", lbl: "Repeat Customers", change: "↑ 2%", up: true, sub: "vs last week" },
      { val: "4.5m", lbl: "Avg Prep Time", change: "↓ 0.1m", up: true, sub: "vs last week" },
      { val: "96%", lbl: "Fulfillment Rate", change: "→ 0%", up: true, sub: "vs last week" },
    ],
    barVals: [110,130,98,145,162,188,143],
    barLabels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    barCaption: "Orders by Day",
    barPeak: "Peak: Sat",
  },
  month: {
    metrics: [
      { val: "₹8,12,000", lbl: "Month Revenue", change: "↑ 15%", up: true, sub: "vs last month" },
      { val: "3,840", lbl: "Orders This Month", change: "↑ 11%", up: true, sub: "vs last month" },
      { val: "₹211", lbl: "Avg Order Value", change: "↑ 3%", up: true, sub: "vs last month" },
      { val: "71%", lbl: "Repeat Customers", change: "↑ 8%", up: true, sub: "vs last month" },
      { val: "4.4m", lbl: "Avg Prep Time", change: "↓ 0.5m", up: true, sub: "vs last month" },
      { val: "95%", lbl: "Fulfillment Rate", change: "↓ 1%", up: false, sub: "vs last month" },
    ],
    barVals: [180,210,165,230,245,260,195,220,240,180,200,215,190,225,250,270,200,230,215,240,220,195,260,280,210,195,240,230,225,280],
    barLabels: Array.from({length:30},(_,i)=>`${i+1}`),
    barCaption: "Orders by Date",
    barPeak: "Peak: 30th",
  },
};
