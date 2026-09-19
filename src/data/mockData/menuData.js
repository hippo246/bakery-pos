// Mock data for Menu and Navigation
// This file contains all hardcoded mock data used in menu and navigation

export const MENU_ITEMS = [
  // Beers
  { id: "beer-1", code: "ALL", name: "Allagash White", price: 8.00, cat: "Beers", desc: "Belgian-style wheat ale", emoji: "🍺", popular: true, eightySixed: false, active: true },
  { id: "beer-2", code: "STL", name: "Stella Artois", price: 7.00, cat: "Beers", desc: "Belgian lager", emoji: "🍺", popular: true, eightySixed: false, active: true },
  { id: "beer-3", code: "STN", name: "Stone Ipa", price: 9.00, cat: "Beers", desc: "India Pale Ale", emoji: "🍺", popular: false, eightySixed: false, active: true },
  { id: "beer-4", code: "GUI", name: "Guinness Stout", price: 8.00, cat: "Beers", desc: "Irish dry stout", emoji: "🍺", popular: true, eightySixed: false, active: true },
  { id: "beer-5", code: "HEI", name: "Heineken", price: 7.50, cat: "Beers", desc: "Dutch lager", emoji: "🍺", popular: false, eightySixed: false, active: true },
  { id: "beer-6", code: "COR", name: "Corona", price: 6.50, cat: "Beers", desc: "Mexican lager", emoji: "🍺", popular: false, eightySixed: false, active: true },
  
  // Cocktails
  { id: "cocktail-1", code: "MOJ", name: "Mojito", price: 12.00, cat: "Cocktails", desc: "Rum, mint, lime", emoji: "🍹", popular: true, eightySixed: false, active: true },
  { id: "cocktail-2", code: "MAR", name: "Margarita", price: 11.00, cat: "Cocktails", desc: "Tequila, lime, triple sec", emoji: "🍹", popular: true, eightySixed: false, active: true },
  { id: "cocktail-3", code: "OLD", name: "Old Fashioned", price: 13.00, cat: "Cocktails", desc: "Bourbon, bitters, sugar", emoji: "🍹", popular: false, eightySixed: false, active: true },
  { id: "cocktail-4", code: "MAR", name: "Martini", price: 14.00, cat: "Cocktails", desc: "Gin or vodka, vermouth", emoji: "🍸", popular: false, eightySixed: false, active: true },
  
  // Red Wines
  { id: "red-1", code: "CAB", name: "Cabernet Sauvignon", price: 12.00, cat: "Red Wines", desc: "Full-bodied red", emoji: "🍷", popular: true, eightySixed: false, active: true },
  { id: "red-2", code: "MER", name: "Merlot", price: 11.00, cat: "Red Wines", desc: "Smooth red", emoji: "🍷", popular: false, eightySixed: false, active: true },
  { id: "red-3", code: "PIN", name: "Pinot Noir", price: 13.00, cat: "Red Wines", desc: "Light-bodied red", emoji: "🍷", popular: false, eightySixed: false, active: true },
  
  // White Wines
  { id: "white-1", code: "CHA", name: "Chardonnay", price: 11.00, cat: "White Wines", desc: "Full-bodied white", emoji: "�", popular: true, eightySixed: false, active: true },
  { id: "white-2", code: "SAU", name: "Sauvignon Blanc", price: 10.00, cat: "White Wines", desc: "Crisp white", emoji: "🍷", popular: false, eightySixed: false, active: true },
  { id: "white-3", code: "PIN", name: "Pinot Grigio", price: 10.00, cat: "White Wines", desc: "Light white", emoji: "🍷", popular: false, eightySixed: false, active: true },
  
  // Breakfast
  { id: "breakfast-1", code: "EGG", name: "Eggs Benedict", price: 14.00, cat: "Breakfast", desc: "Poached eggs, hollandaise", emoji: "🍳", popular: true, eightySixed: false, active: true },
  { id: "breakfast-2", code: "PAN", name: "Pancakes", price: 10.00, cat: "Breakfast", desc: "Stack of 3 with syrup", emoji: "🥞", popular: false, eightySixed: false, active: true },
  { id: "breakfast-3", code: "OME", name: "Omelette", price: 12.00, cat: "Breakfast", desc: "Three eggs with choice", emoji: "🍳", popular: false, eightySixed: false, active: true },
  
  // Beverages
  { id: "bev-1", code: "COF", name: "Coffee", price: 3.00, cat: "Beverages", desc: "Fresh brewed", emoji: "☕", popular: true, eightySixed: false, active: true },
  { id: "bev-2", code: "ESP", name: "Espresso", price: 4.00, cat: "Beverages", desc: "Single shot", emoji: "☕", popular: false, eightySixed: false, active: true },
  { id: "bev-3", code: "TEA", name: "Tea", price: 2.50, cat: "Beverages", desc: "Hot or iced", emoji: "🍵", popular: false, eightySixed: false, active: true },
  { id: "bev-4", code: "OJ", name: "Orange Juice", price: 4.00, cat: "Beverages", desc: "Fresh squeezed", emoji: "🍊", popular: false, eightySixed: false, active: true },
  
  // Appetizer
  { id: "app-1", code: "NAC", name: "Nachos", price: 12.00, cat: "Appetizer", desc: "Loaded with cheese", emoji: "🌮", popular: true, eightySixed: false, active: true },
  { id: "app-2", code: "WIN", name: "Wings", price: 11.00, cat: "Appetizer", desc: "Buffalo style", emoji: "🍗", popular: false, eightySixed: false, active: true },
  { id: "app-3", code: "MOZ", name: "Mozzarella Sticks", price: 9.00, cat: "Appetizer", desc: "Marinara sauce", emoji: "🧀", popular: false, eightySixed: false, active: true },
  
  // Salads
  { id: "salad-1", code: "CAE", name: "Caesar Salad", price: 10.00, cat: "Salads", desc: "Romaine, parmesan", emoji: "🥗", popular: true, eightySixed: false, active: true },
  { id: "salad-2", code: "GRE", name: "Greek Salad", price: 11.00, cat: "Salads", desc: "Feta, olives", emoji: "🥗", popular: false, eightySixed: false, active: true },
  { id: "salad-3", code: "GAR", name: "Garden Salad", price: 8.00, cat: "Salads", desc: "Mixed greens", emoji: "🥗", popular: false, eightySixed: false, active: true },
  
  // Entrees
  { id: "entree-1", code: "STE", name: "Steak", price: 28.00, cat: "Entrees", desc: "Grilled ribeye", emoji: "🥩", popular: true, eightySixed: false, active: true },
  { id: "entree-2", code: "SAL", name: "Salmon", price: 24.00, cat: "Entrees", desc: "Grilled Atlantic", emoji: "🐟", popular: false, eightySixed: false, active: true },
  { id: "entree-3", code: "CHI", name: "Chicken", price: 18.00, cat: "Entrees", desc: "Grilled breast", emoji: "🍗", popular: false, eightySixed: false, active: true },
  
  // Sandwich
  { id: "sand-1", code: "CLU", name: "Club Sandwich", price: 14.00, cat: "Sandwich", desc: "Turkey, bacon", emoji: "🥪", popular: true, eightySixed: false, active: true },
  { id: "sand-2", code: "BLT", name: "BLT", price: 11.00, cat: "Sandwich", desc: "Bacon, lettuce, tomato", emoji: "🥪", popular: false, eightySixed: false, active: true },
  { id: "sand-3", code: "GRI", name: "Grilled Cheese", price: 9.00, cat: "Sandwich", desc: "Melted cheddar", emoji: "🥪", popular: false, eightySixed: false, active: true },
  
  // Sides
  { id: "side-1", code: "FRI", name: "Fries", price: 5.00, cat: "Sides", desc: "Crispy", emoji: "🍟", popular: true, eightySixed: false, active: true },
  { id: "side-2", code: "ONI", name: "Onion Rings", price: 6.00, cat: "Sides", desc: "Battered", emoji: "🧅", popular: false, eightySixed: false, active: true },
  { id: "side-3", code: "COL", name: "Coleslaw", price: 4.00, cat: "Sides", desc: "Creamy", emoji: "🥗", popular: false, eightySixed: false, active: true },
  
  // Brunch
  { id: "brunch-1", code: "AVO", name: "Avocado Toast", price: 12.00, cat: "Brunch", desc: "Sourdough, poached egg", emoji: "🥑", popular: true, eightySixed: false, active: true },
  { id: "brunch-2", code: "EGF", name: "Eggs Florentine", price: 13.00, cat: "Brunch", desc: "Spinach, hollandaise", emoji: "🍳", popular: false, eightySixed: false, active: true },
  { id: "brunch-3", code: "QUI", name: "Quiche", price: 11.00, cat: "Brunch", desc: "Vegetable or meat", emoji: "🥧", popular: false, eightySixed: false, active: true },
  
  // Other
  { id: "other-1", code: "WAT", name: "Water", price: 2.00, cat: "Other", desc: "Bottled", emoji: "💧", popular: true, eightySixed: false, active: true },
  { id: "other-2", code: "SOD", name: "Soda", price: 3.00, cat: "Other", desc: "Various flavors", emoji: "�", popular: false, eightySixed: false, active: true },
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
