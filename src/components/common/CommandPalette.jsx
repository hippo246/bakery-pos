import { useState, useEffect, useCallback, useRef } from "react";

// ── Debounce Hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ── Search Index ───────────────────────────────────────────────────────────────
const SEARCH_INDEX = [
  // Modules
  { id: "dashboard", type: "module", icon: "📊", title: "Dashboard", module: "Dashboard", description: "Overview of cafe operations", shortcut: "D" },
  { id: "orders", type: "module", icon: "📋", title: "Orders", module: "Orders", description: "Manage customer orders", shortcut: "O" },
  { id: "kitchen", type: "module", icon: "👨‍🍳", title: "Kitchen", module: "Kitchen", description: "Kitchen display system", shortcut: "K" },
  { id: "menu", type: "module", icon: "🍽️", title: "Menu", module: "Menu", description: "Menu items and categories", shortcut: "M" },
  { id: "guests", type: "module", icon: "👥", title: "Guests", module: "Guests", description: "Guest book and CRM", shortcut: "G" },
  { id: "tables", type: "module", icon: "🪑", title: "Tables", module: "Tables", description: "Floor plan and seating", shortcut: "T" },
  { id: "reservations", type: "module", icon: "📅", title: "Reservations", module: "Reservations", description: "Booking management", shortcut: "R" },
  { id: "inventory", type: "module", icon: "📦", title: "Inventory", module: "Inventory", description: "Stock management", shortcut: "I" },
  { id: "purchasing", type: "module", icon: "🛒", title: "Purchasing", module: "Purchasing", description: "Purchase orders", shortcut: "P" },
  { id: "production", type: "module", icon: "🏭", title: "Production", module: "Production", description: "Production batches", shortcut: "P" },
  { id: "delivery", type: "module", icon: "🚚", title: "Delivery", module: "Delivery", description: "Delivery management", shortcut: "D" },
  { id: "tracking", type: "module", icon: "📍", title: "Route Tracking", module: "Tracking", description: "Live delivery tracking", shortcut: "T" },
  { id: "performance", type: "module", icon: "📈", title: "Performance Desk", module: "Performance", description: "Analytics and reports", shortcut: "A" },
  { id: "staff", type: "module", icon: "👔", title: "Team Operations", module: "Staff", description: "Staff management", shortcut: "S" },
  { id: "settings", type: "module", icon: "⚙️", title: "Settings", module: "Settings", description: "System configuration", shortcut: "S" },
  { id: "displays", type: "module", icon: "📺", title: "Displays", module: "Displays", description: "Display management", shortcut: "D" },
  { id: "notifications", type: "module", icon: "🔔", title: "Notifications", module: "Notifications", description: "Notification center", shortcut: "N" },
  
  // Quick Actions
  { id: "new-order", type: "action", icon: "➕", title: "New Order", module: "Orders", description: "Create a new order", shortcut: "N" },
  { id: "add-guest", type: "action", icon: "👤", title: "Add Guest", module: "Guests", description: "Add new guest", shortcut: "G" },
  { id: "add-menu-item", type: "action", icon: "🍕", title: "Add Menu Item", module: "Menu", description: "Create menu item", shortcut: "M" },
  { id: "create-reservation", type: "action", icon: "📅", title: "Create Reservation", module: "Reservations", description: "Book a table", shortcut: "R" },
  { id: "add-inventory", type: "action", icon: "📦", title: "Add Inventory Item", module: "Inventory", description: "Add stock item", shortcut: "I" },
  { id: "new-purchase-order", type: "action", icon: "🛒", title: "New Purchase Order", module: "Purchasing", description: "Create PO", shortcut: "P" },
  { id: "new-production-batch", type: "action", icon: "🏭", title: "New Production Batch", module: "Production", description: "Start production", shortcut: "B" },
  { id: "open-dashboard", type: "action", icon: "📊", title: "Open Dashboard", module: "Dashboard", description: "Go to dashboard", shortcut: "D" },
  { id: "open-kitchen", type: "action", icon: "👨‍🍳", title: "Open Kitchen", module: "Kitchen", description: "View kitchen", shortcut: "K" },
  { id: "open-reports", type: "action", icon: "📈", title: "Open Reports", module: "Performance", description: "View analytics", shortcut: "R" },
  { id: "open-settings", type: "action", icon: "⚙️", title: "Open Settings", module: "Settings", description: "System settings", shortcut: "S" },
  { id: "open-displays", type: "action", icon: "📺", title: "Open Displays", module: "Displays", description: "Display hub", shortcut: "D" },
  { id: "clear-notifications", type: "action", icon: "🔔", title: "Clear Notifications", module: "Notifications", description: "Clear all alerts", shortcut: "C" },
  
  // Commands
  { id: "backup", type: "command", icon: "💾", title: "Backup Data", module: "Settings", description: "Create backup", shortcut: "B" },
  { id: "restore", type: "command", icon: "📥", title: "Restore Data", module: "Settings", description: "Restore from backup", shortcut: "R" },
  { id: "export", type: "command", icon: "📤", title: "Export Data", module: "Settings", description: "Export all data", shortcut: "E" },
  { id: "import", type: "command", icon: "📥", title: "Import Data", module: "Settings", description: "Import data", shortcut: "I" },
  { id: "logout", type: "command", icon: "🚪", title: "Logout", module: "Settings", description: "Sign out", shortcut: "L" },
];

// ── Command Palette Component ───────────────────────────────────────────────────
export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const recent = localStorage.getItem("cafeos_recent_searches");
      return recent ? JSON.parse(recent) : [];
    } catch (_e) {
      return [];
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      const favs = localStorage.getItem("cafeos_favorites");
      return favs ? JSON.parse(favs) : [];
    } catch (_e) {
      return [];
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef(null);
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 150);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Reset state when closed
  const closedRef = useRef(false);
  useEffect(() => {
    if (!isOpen && !closedRef.current) {
      closedRef.current = true;
      setQuery("");
      setSelectedIndex(0);
    } else if (isOpen) {
      closedRef.current = false;
    }
  }, [isOpen]);
  
  // Detect command mode - derive from query instead of setState
  const isCommandMode = query.startsWith(">");
  
  // Fuzzy match helper
  function fuzzyMatch(query, text) {
    let score = 0;
    let queryIndex = 0;
    let textIndex = 0;
    
    while (queryIndex < query.length && textIndex < text.length) {
      if (query[queryIndex] === text[textIndex]) {
        score += 1;
        queryIndex++;
      }
      textIndex++;
    }
    
    return queryIndex === query.length ? score : 0;
  }
  
  // Handle selection
  const handleSelect = useCallback((item) => {
    // Save to recent searches
    const newRecent = [item.id, ...recentSearches.filter(id => id !== item.id)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem("cafeos_recent_searches", JSON.stringify(newRecent));
    
    onNavigate(item.module);
    onClose();
  }, [recentSearches, onNavigate, onClose]);
  
  // Filter and rank results
  const filteredResults = useCallback(() => {
    const searchQuery = isCommandMode ? debouncedQuery.slice(1).trim().toLowerCase() : debouncedQuery.toLowerCase();
    
    if (!searchQuery) {
      // Show favorites first, then recent searches, then suggested
      const favResults = SEARCH_INDEX.filter(item => favorites.includes(item.id));
      const recentResults = SEARCH_INDEX.filter(item => recentSearches.includes(item.id) && !favorites.includes(item.id));
      const suggested = SEARCH_INDEX.filter(item => 
        !favorites.includes(item.id) && !recentSearches.includes(item.id)
      ).slice(0, 8);
      
      return [...favResults, ...recentResults, ...suggested];
    }
    
    // Search with ranking
    SEARCH_INDEX.map(item => {
      const title = item.title.toLowerCase();
      const description = item.description.toLowerCase();
      const module = item.module.toLowerCase();
      
      let score = 0;
      
      // Exact match
      if (title === searchQuery) score += 100;
      else if (module === searchQuery) score += 90;
      
      // Prefix match
      if (title.startsWith(searchQuery)) score += 80;
      else if (module.startsWith(searchQuery)) score += 70;
      
      // Partial match
      if (title.includes(searchQuery)) score += 50;
      else if (description.includes(searchQuery)) score += 40;
      else if (module.includes(searchQuery)) score += 30;
      
      // Fuzzy match
      const fuzzyScore = fuzzyMatch(searchQuery, title);
      if (fuzzyScore > 0) score += fuzzyScore * 0.5;
      
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
    
  }, [isCommandMode, debouncedQuery, recentSearches, favorites]);
  
  const results = filteredResults();

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else {
          setSelectedIndex(prev => (prev + 1) % results.length);
        }
        break;
    }
  }, [results, selectedIndex, handleSelect, onClose]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((e, itemId) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    setFavorites(newFavorites);
    localStorage.setItem("cafeos_favorites", JSON.stringify(newFavorites));
  }, [favorites]);
  
  // Clear all recent
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.setItem("cafeos_recent_searches", JSON.stringify([]));
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease-out",
        padding: isMobile ? 0 : 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: isMobile ? "100%" : "90%",
          maxWidth: isMobile ? "100%" : 640,
          maxHeight: isMobile ? "100vh" : "80vh",
          background: "var(--cafe-bg-card)",
          border: isMobile ? "none" : "1px solid var(--cafe-border)",
          borderRadius: isMobile ? 0 : 16,
          boxShadow: isMobile ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: isMobile ? "slideUpMobile" : "slideUp 0.2s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{
          padding: isMobile ? 24 : 20,
          borderBottom: "1px solid var(--cafe-border-light)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{ fontSize: isMobile ? 28 : 20 }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isCommandMode ? "Run command..." : "Search orders, guests, tables, staff, inventory, settings..."}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: isMobile ? 18 : 16,
                color: "var(--cafe-text-primary)",
                padding: isMobile ? "12px 0" : 0
              }}
            />
            <kbd style={{
              padding: isMobile ? "8px 12px" : "4px 8px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 4,
              fontSize: isMobile ? 12 : 11,
              color: "var(--cafe-text-tertiary)"
            }}>
              ESC
            </kbd>
          </div>
        </div>
        
        {/* Results */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 8
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: "center",
              color: "var(--cafe-text-tertiary)"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>No results found</div>
              <div style={{ fontSize: 12, marginBottom: 24 }}>Try a different search term</div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center"
              }}>
                <button
                  onClick={() => {
                    setQuery("");
                    if (onNavigate) onNavigate(SEARCH_INDEX.find(i => i.id === "settings"));
                    onClose();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Open Settings
                </button>
                <button
                  onClick={() => {
                    setQuery("");
                    if (onNavigate) onNavigate(SEARCH_INDEX.find(i => i.id === "new-order"));
                    onClose();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Create New Order
                </button>
                <button
                  onClick={() => {
                    setQuery("");
                    if (onNavigate) onNavigate(SEARCH_INDEX.find(i => i.id === "add-guest"));
                    onClose();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Add Guest
                </button>
                <button
                  onClick={() => {
                    setQuery("");
                    onClose();
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 8,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer",
                    fontSize: 12
                  }}
                >
                  Clear Search
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Recent Searches Header */}
              {!query && recentSearches.length > 0 && (
                <div style={{
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--cafe-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Recent Searches
                  <button
                    onClick={clearRecent}
                    style={{
                      marginLeft: 8,
                      background: "none",
                      border: "none",
                      color: "var(--cafe-accent)",
                      cursor: "pointer",
                      fontSize: 10
                    }}
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {/* Results List */}
              {results.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: isMobile ? "16px 20px" : "12px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: index === selectedIndex ? "var(--cafe-accent-bg)" : "transparent",
                    border: index === selectedIndex ? "1px solid var(--cafe-accent-border)" : "1px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 16 : 12,
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ fontSize: isMobile ? 28 : 20 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? 16 : 13,
                      fontWeight: 500,
                      color: "var(--cafe-text-primary)",
                      marginBottom: 2
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: isMobile ? 13 : 11,
                      color: "var(--cafe-text-tertiary)"
                    }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}>
                    <span style={{
                      fontSize: isMobile ? 12 : 10,
                      padding: isMobile ? "4px 8px" : "2px 6px",
                      background: "var(--cafe-bg-surface)",
                      borderRadius: 4,
                      color: "var(--cafe-text-tertiary)",
                      border: "1px solid var(--cafe-border-light)"
                    }}>
                      {item.module}
                    </span>
                    {item.shortcut && (
                      <kbd style={{
                        padding: isMobile ? "4px 8px" : "2px 6px",
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: 4,
                        fontSize: isMobile ? 12 : 10,
                        color: "var(--cafe-text-tertiary)"
                      }}>
                        {item.shortcut}
                      </kbd>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(e, item.id)}
                      style={{
                        padding: isMobile ? 8 : 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: isMobile ? 20 : 14,
                        opacity: favorites.includes(item.id) ? 1 : 0.3
                      }}
                    >
                      {favorites.includes(item.id) ? "⭐" : "☆"}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--cafe-border-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--cafe-text-tertiary)"
        }}>
          <div style={{ display: "flex", gap: 16 }}>
            <span><kbd style={{ padding: "2px 6px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 4 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: "2px 6px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 4 }}>Enter</kbd> Select</span>
            <span><kbd style={{ padding: "2px 6px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 4 }}>Esc</kbd> Close</span>
          </div>
          <div>
            Type <kbd style={{ padding: "2px 6px", background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border)", borderRadius: 4 }}>&gt;</kbd> for commands
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideUpMobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
