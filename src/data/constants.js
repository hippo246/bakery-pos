import { normalizeOrders, normalizeCustomers, normalizeKdsCards } from '../domain/normalize.js';

export const MENU_ITEMS = [
  { id: "m1", name: "Espresso", price: 80, cat: "Coffee", desc: "Double shot, intense & smooth", emoji: "☕", popular: true, eightySixed: false },
  { id: "m2", name: "Cappuccino", price: 120, cat: "Coffee", desc: "Espresso with steamed milk foam", emoji: "☕", popular: true, eightySixed: false },
  { id: "m3", name: "Cold Brew", price: 150, cat: "Coffee", desc: "12-hour steeped, chilled", emoji: "🧋", popular: false, eightySixed: false },
  { id: "m4", name: "Matcha Latte", price: 160, cat: "Special", desc: "Ceremonial grade, oat milk", emoji: "🍵", popular: true, eightySixed: false },
  { id: "m5", name: "Croissant", price: 90, cat: "Food", desc: "Butter-layered, baked fresh", emoji: "🥐", popular: false, eightySixed: false },
  { id: "m6", name: "Avocado Toast", price: 180, cat: "Food", desc: "Smashed avo, chilli flakes, EVOO", emoji: "🥑", popular: true, eightySixed: false },
  { id: "m7", name: "Banana Bread", price: 100, cat: "Food", desc: "Moist, walnut-studded", emoji: "🍞", popular: false, eightySixed: false },
  { id: "m8", name: "Flat White", price: 130, cat: "Coffee", desc: "Velvety microfoam, smooth", emoji: "☕", popular: false, eightySixed: false },
  { id: "m9", name: "Lemonade", price: 110, cat: "Special", desc: "Fresh-squeezed, mint, sea salt", emoji: "🍋", popular: false, eightySixed: false },
  { id: "m10", name: "Blueberry Muffin", price: 95, cat: "Food", desc: "Jumbo, streusel-topped", emoji: "🫐", popular: false, eightySixed: false },
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
export const INIT_ORDERS = normalizeOrders(LEGACY_INIT_ORDERS);

// Legacy customer data - will be normalized on import
export const LEGACY_INIT_CUSTOMERS = [
  { id: "c1", name: "Rohan Mehta", phone: "9876543210", email: "rohan@email.com", visits: 42, spend: 12400, tier: "GOLD", tags: ["Morning Regular", "High Spender"], fav: "Cappuccino", lastVisit: "2 days ago", notes: "Prefers oat milk. Table by window." },
  { id: "c2", name: "Sneha Kulkarni", phone: "8765432109", email: "sneha@email.com", visits: 18, spend: 4800, tier: "SILVER", tags: ["Weekend Visitor"], fav: "Matcha Latte", lastVisit: "5 days ago", notes: "Allergic to nuts." },
  { id: "c3", name: "Vikram Desai", phone: "7654321098", email: "", visits: 61, spend: 18900, tier: "PLATINUM", tags: ["High Spender", "Morning Regular", "Daily Customer"], fav: "Espresso", lastVisit: "Today", notes: "Loyal since Day 1. Always espresso, never sugar." },
  { id: "c4", name: "Ayesha Khan", phone: "6543210987", email: "ayesha@email.com", visits: 8, spend: 2100, tier: "BRONZE", tags: ["New Customer"], fav: "Cold Brew", lastVisit: "12 days ago", notes: "" },
  { id: "c5", name: "Karan Joshi", phone: "9512345678", email: "karan@email.com", visits: 23, spend: 6700, tier: "SILVER", tags: ["Afternoon Regular"], fav: "Flat White", lastVisit: "Yesterday", notes: "Usually orders for 2." },
];

// Normalized customers using new domain model
export const INIT_CUSTOMERS = normalizeCustomers(LEGACY_INIT_CUSTOMERS);

export const INIT_HIST = {
  c1: [{ date: "May 29", items: "Cappuccino × 2, Croissant", amt: 330 }, { date: "May 27", items: "Cappuccino × 1", amt: 120 }, { date: "May 24", items: "Flat White, Banana Bread", amt: 230 }],
  c2: [{ date: "May 26", items: "Matcha Latte × 1", amt: 160 }, { date: "May 20", items: "Matcha Latte × 2, Croissant", amt: 410 }],
  c3: [{ date: "May 31", items: "Espresso × 1", amt: 80 }, { date: "May 30", items: "Espresso × 1", amt: 80 }, { date: "May 29", items: "Espresso × 2", amt: 160 }],
  c4: [{ date: "May 19", items: "Cold Brew × 1", amt: 150 }, { date: "May 12", items: "Cold Brew, Avocado Toast", amt: 330 }],
  c5: [{ date: "May 30", items: "Flat White × 2", amt: 260 }, { date: "May 28", items: "Flat White × 2, Croissant × 2", amt: 440 }],
};

// Legacy KDS data - will be normalized on import
export const LEGACY_INIT_KDS = [
  { id: "ORD-001", source: "WALK_IN", station: "Bar", items: [{ name: "Cappuccino", qty: 2, mod: "Oat milk" }, { name: "Croissant", qty: 1, mod: "" }], note: "Window table", startedAt: Date.now() - 8 * 60 * 1000, urgency: "soon" },
  { id: "ORD-002", source: "SWIGGY", station: "Bar", items: [{ name: "Cold Brew", qty: 1, mod: "" }, { name: "Banana Bread", qty: 2, mod: "Warmed please" }], note: "", startedAt: Date.now() - 2 * 60 * 1000, urgency: "urgent" },
  { id: "ORD-003", source: "ZOMATO", station: "Kitchen", items: [{ name: "Matcha Latte", qty: 1, mod: "Less sugar" }, { name: "Avocado Toast", qty: 1, mod: "Extra chili" }], note: "", startedAt: Date.now() - 5 * 60 * 1000, urgency: "urgent" },
  { id: "ORD-006", source: "SWIGGY", station: "Bar", items: [{ name: "Cappuccino", qty: 3, mod: "" }, { name: "Banana Bread", qty: 1, mod: "" }], note: "3 separate cups", startedAt: Date.now() - 12 * 60 * 1000, urgency: "ok" },
];

// Normalized KDS cards using new domain model
export const INIT_KDS = normalizeKdsCards(LEGACY_INIT_KDS);

export const MENU_CATS = ["ALL", "Coffee", "Special", "Food"];

export const PEAK_SOP = [
  { id: "p1", threshold: 3, stat: "NEW", label: "Queue Backup", msg: "3+ new orders pending — call in backup or notify kitchen.", level: "warn" },
  { id: "p2", threshold: 2, stat: "READY", label: "Pick-up Delay", msg: "2+ orders sitting Ready — alert front-of-house for pickup.", level: "alert" },
  { id: "p3", threshold: 4, stat: "PREPARING", label: "High Kitchen Load", msg: "4+ orders in prep simultaneously — prioritise delivery orders.", level: "warn" },
];

export const TIER_COLORS = {
  BRONZE: { bg: "#2a1a08", color: "#CD7F32", glow: "rgba(205,127,50,0.3)" },
  SILVER: { bg: "#1e1e1e", color: "#C0C0C0", glow: "rgba(192,192,192,0.2)" },
  GOLD: { bg: "#2a2008", color: "#E8A020", glow: "rgba(232,160,32,0.3)" },
  PLATINUM: { bg: "#0a1a1a", color: "#4AD9D9", glow: "rgba(74,217,217,0.3)" },
};

export const STATUS_COLORS = {
  NEW: { bg: "#0d1528", border: "#1a2a4a", color: "#5B9BD5", label: "New" },
  ACCEPTED: { bg: "#1a0d28", border: "#2e1a44", color: "#9B72CF", label: "Accepted" },
  PREPARING: { bg: "#281f00", border: "#4a3800", color: "#E8A020", label: "Preparing" },
  READY: { bg: "#0d2218", border: "#1a4030", color: "#4CAF72", label: "Ready" },
  COMPLETED: { bg: "#0d1a10", border: "#1a3020", color: "#6AAF80", label: "Completed" },
  CANCELLED: { bg: "#280d0d", border: "#441a1a", color: "#E05252", label: "Cancelled" },
  OUT_FOR_DELIVERY: { bg: "#001a1a", border: "#003333", color: "#3DD5C8", label: "Out for Delivery" },
};

export const SRC_COLORS = {
  WALK_IN: { bg: "#0d2218", color: "#4CAF72" },
  SWIGGY: { bg: "#281408", color: "#FF6B35" },
  ZOMATO: { bg: "#280808", color: "#E8344E" },
  DIRECT_DELIVERY: { bg: "#0d1528", color: "#5B9BD5" },
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
