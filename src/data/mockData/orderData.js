// Mock data for Orders and Customers
// This file contains all hardcoded mock data used in order management

// Legacy order data - will be normalized on import
export const LEGACY_INIT_ORDERS = [
  { id: "ORD-001", source: "WALK_IN", customer: "Rohan Mehta", items: "Cappuccino × 2, Croissant", amount: 330, status: "PREPARING", time: 8, payStatus: "PAID" },
  { id: "ORD-002", source: "SWIGGY", customer: "Priya Sharma", items: "Cold Brew × 1, Banana Bread × 2", amount: 350, status: "NEW", time: 2, payStatus: "PAID" },
  { id: "ORD-003", source: "ZOMATO", customer: "Ankit Patel", items: "Matcha Latte × 1, Avocado Toast × 1", amount: 340, status: "ACCEPTED", time: 5, payStatus: "PAID" },
  { id: "ORD-004", source: "DIRECT_DELIVERY", customer: "Sneha Kulkarni", items: "Flat White × 2, Croissant × 1", amount: 350, status: "OUT_FOR_DELIVERY", time: 18, payStatus: "COD" },
  { id: "ORD-005", source: "WALK_IN", customer: "Vikram Desai", items: "Espresso × 1", amount: 80, status: "COMPLETED", time: 32, payStatus: "PAID" },
  { id: "ORD-006", source: "SWIGGY", customer: "Meera Singh", items: "Cappuccino × 3, Banana Bread × 1", amount: 460, status: "READY", time: 12, payStatus: "PAID" },
];

// Legacy customer data - will be normalized on import
export const LEGACY_INIT_CUSTOMERS = [
  { id: "c1", name: "Rohan Mehta", phone: "9876543210", email: "rohan@email.com", visits: 42, spend: 12400, tier: "GOLD", tags: ["Morning Regular", "High Spender"], fav: "Cappuccino", lastVisit: Date.now() - (2 * 24 * 60 * 60 * 1000), notes: "Prefers oat milk. Table by window." },
  { id: "c2", name: "Sneha Kulkarni", phone: "8765432109", email: "sneha@email.com", visits: 18, spend: 4800, tier: "SILVER", tags: ["Weekend Visitor"], fav: "Matcha Latte", lastVisit: Date.now() - (5 * 24 * 60 * 60 * 1000), notes: "Allergic to nuts." },
  { id: "c3", name: "Vikram Desai", phone: "7654321098", email: "", visits: 61, spend: 18900, tier: "PLATINUM", tags: ["High Spender", "Morning Regular", "Daily Customer"], fav: "Espresso", lastVisit: Date.now(), notes: "Loyal since Day 1. Always espresso, never sugar." },
  { id: "c4", name: "Ayesha Khan", phone: "6543210987", email: "ayesha@email.com", visits: 8, spend: 2100, tier: "BRONZE", tags: ["New Customer"], fav: "Cold Brew", lastVisit: Date.now() - (12 * 24 * 60 * 60 * 1000), notes: "" },
  { id: "c5", name: "Karan Joshi", phone: "9512345678", email: "karan@email.com", visits: 23, spend: 6700, tier: "SILVER", tags: ["Afternoon Regular"], fav: "Flat White", lastVisit: Date.now() - (1 * 24 * 60 * 60 * 1000), notes: "Usually orders for 2." },
];

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
