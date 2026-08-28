import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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
  { id: "reports", type: "module", icon: "📈", title: "Reports", module: "Reports", description: "Analytics and insights", shortcut: "R" },
  { id: "crm", type: "module", icon: "👤", title: "Customers", module: "CRM", description: "Customer relationship management", shortcut: "C" },
  { id: "staff", type: "module", icon: "👥", title: "Staff", module: "Staff", description: "Staff management", shortcut: "S" },
  { id: "recipes", type: "module", icon: "📜", title: "Recipes", module: "Recipes", description: "Recipe management", shortcut: "R" },
  { id: "waste", type: "module", icon: "♻️", title: "Waste", module: "Waste", description: "Waste tracking", shortcut: "W" },
  { id: "tokens", type: "module", icon: "🎫", title: "Tokens", module: "Tokens", description: "Token management", shortcut: "T" },
  { id: "waiters", type: "module", icon: "🛎️", title: "Waiters", module: "Waiters", description: "Waiter management", shortcut: "W" },

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
  { id: "help", type: "command", icon: "❓", title: "Get Help", module: "Help", description: "Show help documentation", shortcut: "H" },
  { id: "ai-assist", type: "command", icon: "🤖", title: "AI Assistant", module: "AI", description: "Get AI-powered assistance", shortcut: "A" },
];

// ── Command Palette Component ───────────────────────────────────────────────────
export default function CommandPalette({ isOpen, onClose, onNavigate, currentTab = null }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const recent = localStorage.getItem("cafeos_recent_searches");
      return recent ? JSON.parse(recent) : [];
    } catch (_e) {
      console.warn('Failed to load recent searches from localStorage');
      return [];
    }
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      const favs = localStorage.getItem("cafeos_favorites");
      return favs ? JSON.parse(favs) : [];
    } catch (_e) {
      console.warn('Failed to load favorites from localStorage');
      return [];
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState(null);
  const inputRef = useRef(null);
  
  // Debounce search query for performance
  const debouncedQuery = useDebounce(query, 150);

  // Autocomplete suggestion based on search index - optimized with debounce
  useEffect(() => {
    if (query.length > 0) {
      const match = SEARCH_INDEX.find(item => 
        item.title.toLowerCase().startsWith(query.toLowerCase()) ||
        item.module.toLowerCase().startsWith(query.toLowerCase())
      );
      
      if (match) {
        const suggestionText = match.title.toLowerCase().startsWith(query.toLowerCase()) 
          ? match.title 
          : match.module;
        setAutocompleteSuggestion(suggestionText);
      } else {
        setAutocompleteSuggestion(null);
      }
    } else {
      setAutocompleteSuggestion(null);
    }
  }, [debouncedQuery]); // Use debouncedQuery instead of query for better performance

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
  
  // Handle selection with autocomplete acceptance
  const handleSelect = useCallback((item) => {
    // Save to recent searches
    const newRecent = [item.id, ...recentSearches.filter(id => id !== item.id)].slice(0, 10);
    setRecentSearches(newRecent);
    try {
      localStorage.setItem("cafeos_recent_searches", JSON.stringify(newRecent));
    } catch (e) {
      console.warn('Failed to save recent searches:', e);
    }
    
    setAutocompleteSuggestion(null);
    onNavigate(item.module);
    onClose();
  }, [recentSearches, onNavigate, onClose]);

  // Toggle favorite
  const toggleFavorite = useCallback((e, itemId) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    setFavorites(newFavorites);
    try {
      localStorage.setItem("cafeos_favorites", JSON.stringify(newFavorites));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  }, [favorites]);

  // Filter and rank results with tab-aware prioritization - memoized for performance
  const results = useMemo(() => {
    const searchQuery = isCommandMode ? debouncedQuery.slice(1).trim().toLowerCase() : debouncedQuery.toLowerCase();

    if (!searchQuery) {
      // Show favorites first, then current tab items, then recent searches, then others
      const favResults = SEARCH_INDEX.filter(item => favorites.includes(item.id));
      
      // Prioritize current tab items
      const currentTabItems = currentTab 
        ? SEARCH_INDEX.filter(item => 
            item.module.toLowerCase() === currentTab.toLowerCase() && 
            !favorites.includes(item.id)
          ).slice(0, 6)
        : [];
      
      const recentResults = SEARCH_INDEX.filter(item => 
        recentSearches.includes(item.id) && 
        !favorites.includes(item.id) &&
        !currentTabItems.find(ct => ct.id === item.id)
      );
      
      const otherItems = SEARCH_INDEX.filter(item => 
        !favorites.includes(item.id) && 
        !recentSearches.includes(item.id) &&
        !currentTabItems.find(ct => ct.id === item.id)
      ).slice(0, 8);
      
      return [...favResults, ...currentTabItems, ...recentResults, ...otherItems];
    }

    // Search with ranking and tab awareness
    return SEARCH_INDEX.map(item => {
      const title = item.title.toLowerCase();
      const description = item.description.toLowerCase();
      const module = item.module.toLowerCase();
      
      let score = 0;
      
      // Boost score if matches current tab
      if (currentTab && module === currentTab.toLowerCase()) {
        score += 50;
      }
      
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

  }, [isCommandMode, debouncedQuery, recentSearches, favorites, currentTab]);

  // Accept autocomplete suggestion with Tab
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case "ArrowDown":
        e?.preventDefault();
        if (results.length > 0) {
          setSelectedIndex(prev => (prev + 1) % results.length);
        }
        break;
      case "ArrowUp":
        e?.preventDefault();
        if (results.length > 0) {
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        }
        break;
      case "Tab":
        e?.preventDefault();
        if (autocompleteSuggestion && !e.shiftKey) {
          setQuery(autocompleteSuggestion);
          setAutocompleteSuggestion(null);
        } else if (e.shiftKey) {
          if (results.length > 0) {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
          }
        } else {
          if (results.length > 0) {
            setSelectedIndex(prev => (prev + 1) % results.length);
          }
        }
        break;
      case "Enter":
        e?.preventDefault();
        if (autocompleteSuggestion) {
          setQuery(autocompleteSuggestion);
          setAutocompleteSuggestion(null);
        } else if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e?.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, handleSelect, onClose, autocompleteSuggestion]);
  
  // Clear all recent
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.setItem("cafeos_recent_searches", JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
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
        background: "rgba(0, 0, 0, 0.6)",
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
          maxWidth: isMobile ? "100%" : 720,
          maxHeight: isMobile ? "100vh" : "85vh",
          background: "#1e1e2e",
          border: isMobile ? "none" : "1px solid #3d3d5c",
          borderRadius: isMobile ? 0 : "16px",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: isMobile ? "slideUpMobile" : "slideUp 0.25s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{
          padding: isMobile ? 28 : 24,
          borderBottom: "1px solid #3d3d5c"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "#2d2d44",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "2px solid #3d3d5c",
            transition: "all 0.2s ease",
          }}>
            <span style={{ fontSize: isMobile ? 32 : 24 }}>🔍</span>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isCommandMode ? "Run command..." : "Search orders, guests, tables, staff, inventory, settings..."}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: isMobile ? 20 : 18,
                  color: "#e0e0e0",
                  padding: 0
                }}
                onFocus={(e) => {
                  e.currentTarget.parentElement.parentElement.style.borderColor = "#6366f1";
                  e.currentTarget.parentElement.parentElement.style.boxShadow = "0 0 0 4px rgba(99, 102, 241, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement.parentElement.style.borderColor = "#3d3d5c";
                  e.currentTarget.parentElement.parentElement.style.boxShadow = "none";
                }}
              />
              {autocompleteSuggestion && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none",
                  color: "#6366f1",
                  fontSize: isMobile ? 20 : 18,
                  opacity: 0.5,
                  whiteSpace: "nowrap"
                }}>
                  {autocompleteSuggestion}
                </div>
              )}
            </div>
            <kbd style={{
              padding: isMobile ? "10px 14px" : "6px 10px",
              background: "#1e1e2e",
              border: "1px solid #3d3d5c",
              borderRadius: "6px",
              fontSize: isMobile ? 13 : 12,
              color: "#8b8b9e",
              fontWeight: 600
            }}>
              ESC
            </kbd>
          </div>
          {currentTab && (
            <div style={{
              marginTop: 12,
              fontSize: 12,
              color: "#6366f1",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span>📍</span>
              <span>Context: {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}</span>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 16
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: 48,
              textAlign: "center",
              color: "#8b8b9e"
            }}>
              <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>🔍</div>
              <div style={{ fontSize: 16, marginBottom: 10, fontWeight: 600, color: "#e0e0e0" }}>No results found</div>
              <div style={{ fontSize: 13, marginBottom: 28 }}>Try a different search term</div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                alignItems: "center"
              }}>
                <button
                  onClick={() => {
                    setQuery("");
                    if (onNavigate) onNavigate(SEARCH_INDEX.find(i => i.id === "settings"));
                    onClose();
                  }}
                  style={{
                    padding: "12px 24px",
                    background: "#2d2d44",
                    border: "1px solid #3d3d5c",
                    borderRadius: "10px",
                    color: "#e0e0e0",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "#3d3d5c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#3d3d5c";
                    e.currentTarget.style.background = "#2d2d44";
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
                    padding: "12px 24px",
                    background: "#2d2d44",
                    border: "1px solid #3d3d5c",
                    borderRadius: "10px",
                    color: "#e0e0e0",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "#3d3d5c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#3d3d5c";
                    e.currentTarget.style.background = "#2d2d44";
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
                    padding: "12px 24px",
                    background: "#2d2d44",
                    border: "1px solid #3d3d5c",
                    borderRadius: "10px",
                    color: "#e0e0e0",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "#3d3d5c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#3d3d5c";
                    e.currentTarget.style.background = "#2d2d44";
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
                    padding: "12px 24px",
                    background: "#2d2d44",
                    border: "1px solid #3d3d5c",
                    borderRadius: "10px",
                    color: "#e0e0e0",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.background = "#3d3d5c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#3d3d5c";
                    e.currentTarget.style.background = "#2d2d44";
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
                  fontWeight: 700,
                  color: "#8b8b9e",
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
                      color: "#6366f1",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 600,
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 0.7}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
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
                    padding: isMobile ? "20px 24px" : "16px 20px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: index === selectedIndex ? "rgba(99, 102, 241, 0.2)" : "#2d2d44",
                    border: index === selectedIndex ? "1px solid #6366f1" : "1px solid #3d3d5c",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 20 : 16,
                    transition: "all 0.15s ease",
                    marginBottom: 8
                  }}
                  onMouseEnter={(e) => {
                    if (index !== selectedIndex) {
                      e.currentTarget.style.background = "#3d3d5c";
                      e.currentTarget.style.borderColor = "#6366f1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== selectedIndex) {
                      e.currentTarget.style.background = "#2d2d44";
                      e.currentTarget.style.borderColor = "#3d3d5c";
                    }
                  }}
                >
                  <span style={{ fontSize: isMobile ? 32 : 24 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: isMobile ? 18 : 15,
                      fontWeight: 600,
                      color: index === selectedIndex ? "#6366f1" : "#e0e0e0",
                      marginBottom: 4
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: isMobile ? 14 : 12,
                      color: "#8b8b9e"
                    }}>
                      {item.description}
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}>
                    <span style={{
                      fontSize: isMobile ? 13 : 11,
                      padding: isMobile ? "6px 10px" : "4px 8px",
                      background: "#1e1e2e",
                      borderRadius: "6px",
                      color: "#8b8b9e",
                      border: "1px solid #3d3d5c",
                      fontWeight: 600
                    }}>
                      {item.module}
                    </span>
                    {item.shortcut && (
                      <kbd style={{
                        padding: isMobile ? "6px 10px" : "4px 8px",
                        background: "#1e1e2e",
                        border: "1px solid #3d3d5c",
                        borderRadius: "6px",
                        fontSize: isMobile ? 13 : 11,
                        color: "#8b8b9e",
                        fontWeight: 600
                      }}>
                        {item.shortcut}
                      </kbd>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(e, item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: isMobile ? 20 : 16,
                        padding: 4,
                        opacity: favorites.includes(item.id) ? 1 : 0.4,
                        transition: "opacity 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = favorites.includes(item.id) ? 1 : 0.4}
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
          borderTop: "1px solid #3d3d5c",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#8b8b9e",
          background: "#2d2d44"
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span><kbd style={{ padding: "2px 6px", background: "#1e1e2e", border: "1px solid #3d3d5c", borderRadius: "4px", fontWeight: 600 }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ padding: "2px 6px", background: "#1e1e2e", border: "1px solid #3d3d5c", borderRadius: "4px", fontWeight: 600 }}>Enter</kbd> Select</span>
            <span><kbd style={{ padding: "2px 6px", background: "#1e1e2e", border: "1px solid #3d3d5c", borderRadius: "4px", fontWeight: 600 }}>Esc</kbd> Close</span>
            <span><kbd style={{ padding: "2px 6px", background: "#1e1e2e", border: "1px solid #3d3d5c", borderRadius: "4px", fontWeight: 600 }}>Tab</kbd> Navigate</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Type</span>
            <kbd style={{ padding: "2px 6px", background: "#1e1e2e", border: "1px solid #3d3d5c", borderRadius: "4px", fontWeight: 600 }}>&gt;</kbd>
            <span>for commands</span>
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
