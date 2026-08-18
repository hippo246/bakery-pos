import { normalizeOrders, normalizeCustomers, normalizeKdsCards } from '../domain/normalize.js';
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

export const MENU_ITEMS = [
  { id: "m1", code: "ESP", name: "Espresso", price: 80, cat: "Coffee", desc: "Double shot, intense & smooth", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "m2", code: "CAP", name: "Cappuccino", price: 120, cat: "Coffee", desc: "Espresso with steamed milk foam", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "m3", code: "CBR", name: "Cold Brew", price: 150, cat: "Coffee", desc: "12-hour steeped, chilled", emoji: "🧋", popular: false, eightySixed: false, active: true },
  { id: "m4", code: "MLT", name: "Matcha Latte", price: 160, cat: "Special", desc: "Ceremonial grade, oat milk", emoji: "🍵", popular: true, eightySixed: false, active: true },
  { id: "m5", code: "CRS", name: "Croissant", price: 90, cat: "Food", desc: "Butter-layered, baked fresh", emoji: "🥐", popular: false, eightySixed: false, active: true },
  { id: "m6", code: "ATO", name: "Avocado Toast", price: 180, cat: "Food", desc: "Smashed avo, chilli flakes, EVOO", emoji: "🥑", popular: true, eightySixed: false, active: true },
  { id: "m7", code: "BBD", name: "Banana Bread", price: 100, cat: "Food", desc: "Moist, walnut-studded", emoji: "🍞", popular: false, eightySixed: false, active: true },
  { id: "m8", code: "FWH", name: "Flat White", price: 130, cat: "Coffee", desc: "Velvety microfoam, smooth", emoji: "☕", popular: false, eightySixed: false, active: true },
  { id: "m9", code: "LEM", name: "Lemonade", price: 110, cat: "Special", desc: "Fresh-squeezed, mint, sea salt", emoji: "🍋", popular: false, eightySixed: false, active: true },
  { id: "m10", code: "BLM", name: "Blueberry Muffin", price: 95, cat: "Food", desc: "Jumbo, streusel-topped", emoji: "🫐", popular: false, eightySixed: false, active: true },
];

// Navigation menu items for the app
export const NAV_MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "orders", label: "Orders", icon: "📝" },
  { id: "kitchen", label: "Kitchen", icon: "👨‍🍳" },
  { id: "crm", label: "CRM", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "menu", label: "Menu", icon: "🍽️" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "staff", label: "Staff", icon: "👤" },
  { id: "tables", label: "Tables", icon: "🪑" },
  { id: "classicpos", label: "Classic POS", icon: "🖥️" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "delivery", label: "Delivery", icon: "🚚" },
  { id: "expenses", label: "Expenses", icon: "💰" },
  { id: "qr", label: "QR Ordering", icon: "📱" },
  { id: "production", label: "Production", icon: "🏭" },
  { id: "tracking", label: "Tracking", icon: "🗺️" },
  { id: "purchasing", label: "Purchasing", icon: "🛒" },
  { id: "documents", label: "Documents", icon: "📄" },
  { id: "backup", label: "Backup", icon: "💾" },
  { id: "operations", label: "Operations", icon: "⚡" },
  { id: "workflows", label: "Workflows", icon: "🔄" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "intelligence", label: "Intelligence", icon: "🧠" },
  { id: "health", label: "Health", icon: "🏥" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "activity", label: "Activity", icon: "📋" },
];

// Legacy order data - will be normalized on import
export const LEGACY_INIT_ORDERS = [
  { id: "ORD-001", source: "WALK_IN", customer: "Rohan Mehta", items: "Cappuccino × 2, Croissant", amount: 330, status: "PREPARING", time: 8, payStatus: "PAID" },
  { id: "ORD-002", source: "SWIGGY", customer: "Priya Sharma", items: "Cold Brew × 1, Banana Bread × 2", amount: 350, status: "NEW", time: 2, payStatus: "PAID" },
  { id: "ORD-003", source: "ZOMATO", customer: "Ankit Patel", items: "Matcha Latte × 1, Avocado Toast × 1", amount: 340, status: "ACCEPTED", time: 5, payStatus: "PAID" },
  { id: "ORD-004", source: "DIRECT_DELIVERY", customer: "Sneha Kulkarni", items: "Flat White × 2, Croissant × 1", amount: 350, status: "OUT_FOR_DELIVERY", time: 18, payStatus: "COD" },
  { id: "ORD-005", source: "WALK_IN", customer: "Vikram Desai", items: "Espresso × 1", amount: 80, status: "COMPLETED", time: 32, payStatus: "PAID" },
  { id: "ORD-006", source: "SWIGGY", customer: "Meera Singh", items: "Cappuccino × 3, Banana Bread × 1", amount: 460, status: "READY", time: 12, payStatus: "PAID" },
];

// Normalized orders using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_ORDERS = () => {
  if (!isDatasetAllowed('INIT_ORDERS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeOrders(LEGACY_INIT_ORDERS);
};

// Legacy customer data - will be normalized on import
export const LEGACY_INIT_CUSTOMERS = [
  { id: "c1", name: "Rohan Mehta", phone: "9876543210", email: "rohan@email.com", visits: 42, spend: 12400, tier: "GOLD", tags: ["Morning Regular", "High Spender"], fav: "Cappuccino", lastVisit: Date.now() - (2 * 24 * 60 * 60 * 1000), notes: "Prefers oat milk. Table by window." },
  { id: "c2", name: "Sneha Kulkarni", phone: "8765432109", email: "sneha@email.com", visits: 18, spend: 4800, tier: "SILVER", tags: ["Weekend Visitor"], fav: "Matcha Latte", lastVisit: Date.now() - (5 * 24 * 60 * 60 * 1000), notes: "Allergic to nuts." },
  { id: "c3", name: "Vikram Desai", phone: "7654321098", email: "", visits: 61, spend: 18900, tier: "PLATINUM", tags: ["High Spender", "Morning Regular", "Daily Customer"], fav: "Espresso", lastVisit: Date.now(), notes: "Loyal since Day 1. Always espresso, never sugar." },
  { id: "c4", name: "Ayesha Khan", phone: "6543210987", email: "ayesha@email.com", visits: 8, spend: 2100, tier: "BRONZE", tags: ["New Customer"], fav: "Cold Brew", lastVisit: Date.now() - (12 * 24 * 60 * 60 * 1000), notes: "" },
  { id: "c5", name: "Karan Joshi", phone: "9512345678", email: "karan@email.com", visits: 23, spend: 6700, tier: "SILVER", tags: ["Afternoon Regular"], fav: "Flat White", lastVisit: Date.now() - (1 * 24 * 60 * 60 * 1000), notes: "Usually orders for 2." },
];

// Normalized customers using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_CUSTOMERS = () => {
  if (!isDatasetAllowed('INIT_CUSTOMERS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeCustomers(LEGACY_INIT_CUSTOMERS);
};

export const INIT_HIST = {
  c1: [{ date: "May 29", items: "Cappuccino × 2, Croissant", amt: 330 }, { date: "May 27", items: "Cappuccino × 1", amt: 120 }, { date: "May 24", items: "Flat White, Banana Bread", amt: 230 }],
  c2: [{ date: "May 26", items: "Matcha Latte × 1", amt: 160 }, { date: "May 20", items: "Matcha Latte × 2, Croissant", amt: 410 }],
  c3: [{ date: "May 31", items: "Espresso × 1", amt: 80 }, { date: "May 30", items: "Espresso × 1", amt: 80 }, { date: "May 29", items: "Espresso × 2", amt: 160 }],
  c4: [{ date: "May 19", items: "Cold Brew × 1", amt: 150 }, { date: "May 12", items: "Cold Brew, Avocado Toast", amt: 330 }],
  c5: [{ date: "May 30", items: "Flat White × 2", amt: 260 }, { date: "May 28", items: "Flat White × 2, Croissant × 2", amt: 440 }],
};

// Legacy KDS data - will be normalized on import
export const LEGACY_INIT_KDS = [
  { id: "KDS-001", orderId: "ORD-001", source: "WALK_IN", station: "Bar", status: "PREPARING", items: [{ name: "Cappuccino", qty: 2, mod: "Oat milk" }, { name: "Croissant", qty: 1, mod: "" }], note: "Window table", startedAt: Date.now() - 8 * 60 * 1000, urgency: "soon", tableNumber: 2, createdAt: Date.now() - 8 * 60 * 1000 },
  { id: "KDS-002", orderId: "ORD-002", source: "SWIGGY", station: "Bar", status: "NEW", items: [{ name: "Cold Brew", qty: 1, mod: "" }, { name: "Banana Bread", qty: 2, mod: "Warmed please" }], note: "", startedAt: Date.now() - 2 * 60 * 1000, urgency: "urgent", tableNumber: null, createdAt: Date.now() - 2 * 60 * 1000 },
  { id: "KDS-003", orderId: "ORD-003", source: "ZOMATO", station: "Kitchen", status: "ACCEPTED", items: [{ name: "Matcha Latte", qty: 1, mod: "Less sugar" }, { name: "Avocado Toast", qty: 1, mod: "Extra chili" }], note: "", startedAt: Date.now() - 5 * 60 * 1000, urgency: "urgent", tableNumber: null, createdAt: Date.now() - 5 * 60 * 1000 },
  { id: "KDS-004", orderId: "ORD-006", source: "SWIGGY", station: "Bar", status: "READY", items: [{ name: "Cappuccino", qty: 3, mod: "" }, { name: "Banana Bread", qty: 1, mod: "" }], note: "3 separate cups", startedAt: Date.now() - 12 * 60 * 1000, urgency: "ok", tableNumber: null, createdAt: Date.now() - 12 * 60 * 1000 },
];

// Normalized KDS cards using new domain model
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_KDS = () => {
  if (!isDatasetAllowed('INIT_KDS')) {
    throw new Error(getProductionBackendError());
  }
  return normalizeKdsCards(LEGACY_INIT_KDS);
};

export const MENU_CATS = ["ALL", "Coffee", "Special", "Food", "Popular", "Available only"];

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
