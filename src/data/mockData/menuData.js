// Mock data for Menu and Navigation
// This file contains all hardcoded mock data used in menu and navigation

export const MENU_ITEMS = [
  // Mocktails
  { id: "mocktail-1", code: "PAS", name: "Passionfruit Fizz", price: 240.00, cat: "Mocktails", desc: "Passionfruit, mint, sparkling soda", emoji: "🍹", popular: true, eightySixed: false, active: true },
  { id: "mocktail-2", code: "VIR", name: "Virgin Mojito", price: 220.00, cat: "Mocktails", desc: "Fresh mint, lime, crushed ice", emoji: "🍹", popular: true, eightySixed: false, active: true },
  { id: "mocktail-3", code: "BER", name: "Berry Breeze", price: 260.00, cat: "Mocktails", desc: "Mixed berries, basil, tonic", emoji: "🍹", popular: false, eightySixed: false, active: true },
  { id: "mocktail-4", code: "CIT", name: "Citrus Ginger Ale", price: 210.00, cat: "Mocktails", desc: "Fresh ginger, lemon, sparkling water", emoji: "🍸", popular: false, eightySixed: false, active: true },
  
  // Specialty Teas
  { id: "tea-1", code: "JAS", name: "Jasmine Green Tea", price: 180.00, cat: "Specialty Teas", desc: "Organic fragrant green tea", emoji: "🍵", popular: true, eightySixed: false, active: true },
  { id: "tea-2", code: "CHA", name: "Masala Chai Latte", price: 160.00, cat: "Specialty Teas", desc: "Spiced Indian tea with steamed milk", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "tea-3", code: "EAR", name: "Earl Grey Reserve", price: 190.00, cat: "Specialty Teas", desc: "Bergamot infused black tea", emoji: "🍵", popular: false, eightySixed: false, active: true },
  
  // Artisanal Coffees
  { id: "cof-1", code: "CAP", name: "Vanilla Cappuccino", price: 220.00, cat: "Artisanal Coffees", desc: "Espresso, steamed milk, vanilla bean", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "cof-2", code: "COL", name: "Hazelnut Cold Brew", price: 250.00, cat: "Artisanal Coffees", desc: "18-hour cold brew with hazelnut", emoji: "🧊", popular: false, eightySixed: false, active: true },
  { id: "cof-3", code: "FLA", name: "Flat White", price: 210.00, cat: "Artisanal Coffees", desc: "Double ristretto, velvety microfoam", emoji: "☕", popular: false, eightySixed: false, active: true },
  
  // Breakfast
  { id: "breakfast-1", code: "EGG", name: "Eggs Benedict", price: 340.00, cat: "Breakfast", desc: "Poached eggs, hollandaise, English muffin", emoji: "🍳", popular: true, eightySixed: false, active: true },
  { id: "breakfast-2", code: "PAN", name: "Fluffy Pancakes Stack", price: 290.00, cat: "Breakfast", desc: "Stack of 3 with maple syrup & butter", emoji: "🥞", popular: false, eightySixed: false, active: true },
  { id: "breakfast-3", code: "OME", name: "Truffle Mushroom Omelette", price: 320.00, cat: "Breakfast", desc: "Three eggs with wild mushrooms & cheese", emoji: "🍳", popular: false, eightySixed: false, active: true },
  
  // Beverages
  { id: "bev-1", code: "COF", name: "House Brewed Coffee", price: 140.00, cat: "Beverages", desc: "Fresh dark roast", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "bev-2", code: "ESP", name: "Double Espresso", price: 160.00, cat: "Beverages", desc: "Rich double shot espresso", emoji: "☕", popular: false, eightySixed: false, active: true },
  { id: "bev-3", code: "TEA", name: "Fresh Mint Ice Tea", price: 180.00, cat: "Beverages", desc: "Refreshing lemon iced tea", emoji: "🍹", popular: false, eightySixed: false, active: true },
  { id: "bev-4", code: "OJ", name: "Fresh Orange Juice", price: 220.00, cat: "Beverages", desc: "100% fresh squeezed", emoji: "🍊", popular: false, eightySixed: false, active: true },
  
  // Appetizer
  { id: "app-1", code: "NAC", name: "Loaded Cheese Nachos", price: 340.00, cat: "Appetizer", desc: "Loaded with queso, jalapeños & salsa", emoji: "🌮", popular: true, eightySixed: false, active: true },
  { id: "app-2", code: "WIN", name: "Crispy Garlic Wings", price: 380.00, cat: "Appetizer", desc: "Glazed with honey garlic sauce", emoji: "🍗", popular: false, eightySixed: false, active: true },
  { id: "app-3", code: "MOZ", name: "Mozzarella Sticks", price: 280.00, cat: "Appetizer", desc: "Served with marinara sauce", emoji: "🧀", popular: false, eightySixed: false, active: true },
  
  // Salads
  { id: "salad-1", code: "CAE", name: "Classic Caesar Salad", price: 320.00, cat: "Salads", desc: "Romaine lettuce, parmesan, croutons", emoji: "🥗", popular: true, eightySixed: false, active: true },
  { id: "salad-2", code: "GRE", name: "Mediterranean Greek Salad", price: 340.00, cat: "Salads", desc: "Feta, kalamata olives, cucumber", emoji: "🥗", popular: false, eightySixed: false, active: true },
  { id: "salad-3", code: "GAR", name: "Fresh Garden Salad", price: 260.00, cat: "Salads", desc: "Mixed greens with balsamic vinaigrette", emoji: "🥗", popular: false, eightySixed: false, active: true },
  
  // Entrees
  { id: "entree-1", code: "STE", name: "Grilled Cottage Cheese Steak", price: 480.00, cat: "Entrees", desc: "Herbed marinade with roasted veggies", emoji: "🧆", popular: true, eightySixed: false, active: true },
  { id: "entree-2", code: "SAL", name: "Pan-Seared Salmon Fillet", price: 680.00, cat: "Entrees", desc: "Wild salmon with lemon butter sauce", emoji: "🐟", popular: false, eightySixed: false, active: true },
  { id: "entree-3", code: "CHI", name: "Roast Herb Chicken", price: 520.00, cat: "Entrees", desc: "Half chicken with mashed potatoes", emoji: "🍗", popular: false, eightySixed: false, active: true },
  
  // Sandwich
  { id: "sand-1", code: "CLU", name: "Artisan Club Sandwich", price: 360.00, cat: "Sandwich", desc: "Triple decker with chicken & egg", emoji: "🥪", popular: true, eightySixed: false, active: true },
  { id: "sand-2", code: "BLT", name: "Avocado Veggie Club", price: 320.00, cat: "Sandwich", desc: "Fresh avocado, tomato, lettuce", emoji: "🥪", popular: false, eightySixed: false, active: true },
  { id: "sand-3", code: "GRI", name: "Three-Cheese Melt", price: 290.00, cat: "Sandwich", desc: "Melted cheddar, mozzarella, parmesan", emoji: "🥪", popular: false, eightySixed: false, active: true },
  
  // Sides
  { id: "side-1", code: "FRI", name: "Truffle Parmesan Fries", price: 220.00, cat: "Sides", desc: "Crispy french fries with truffle oil", emoji: "🍟", popular: true, eightySixed: false, active: true },
  { id: "side-2", code: "ONI", name: "Golden Onion Rings", price: 190.00, cat: "Sides", desc: "Crispy battered onion rings", emoji: "🧅", popular: false, eightySixed: false, active: true },
  { id: "side-3", code: "COL", name: "Classic Coleslaw", price: 140.00, cat: "Sides", desc: "Fresh creamy slaw", emoji: "🥗", popular: false, eightySixed: false, active: true },
  
  // Brunch
  { id: "brunch-1", code: "AVO", name: "Avocado Sourdough Toast", price: 340.00, cat: "Brunch", desc: "Toasted sourdough, poached egg, chili flakes", emoji: "🥑", popular: true, eightySixed: false, active: true },
  { id: "brunch-2", code: "EGF", name: "Eggs Florentine", price: 360.00, cat: "Brunch", desc: "Spinach, poached egg, hollandaise", emoji: "🍳", popular: false, eightySixed: false, active: true },
  { id: "brunch-3", code: "QUI", name: "Spinach & Feta Quiche", price: 280.00, cat: "Brunch", desc: "Baked savoury tart with side salad", emoji: "🥧", popular: false, eightySixed: false, active: true },
  
  // Other
  { id: "other-1", code: "WAT", name: "Sparkling Water", price: 120.00, cat: "Other", desc: "500ml glass bottle", emoji: "💧", popular: true, eightySixed: false, active: true },
  { id: "other-2", code: "SOD", name: "Craft Soda", price: 150.00, cat: "Other", desc: "Natural botanicals soda", emoji: "🥤", popular: false, eightySixed: false, active: true },
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
  { id: "gst", label: "GST Reports", icon: "🧾" },
];
