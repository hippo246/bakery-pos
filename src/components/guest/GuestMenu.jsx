import React from 'react';
import { useState, useMemo, useEffect, useRef } from "react";
import { card, btn, input, label } from "../../styles/theme";
import { MENU_ITEMS } from "../../data/constants";

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Reward tier the guest is chasing this order — cray cray loyalty flourish
const REWARD_TIERS = [
  { target: 300, label: "Free Cookie", emoji: "🍪" },
  { target: 600, label: "Free Coffee", emoji: "☕" },
  { target: 1000, label: "Free Dessert", emoji: "🍰" }
];
const REWARD_TARGET = REWARD_TIERS[REWARD_TIERS.length - 1].target;

// Small deterministic hash so mock badges/ratings stay stable across re-renders
const hashOf = (item) => {
  let h = 0;
  const s = safeStr(item.id) || safeStr(item.name);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const isHotItem = (item) => hashOf(item) % 5 === 0;
const isNewItem = (item) => hashOf(item) % 7 === 0;
const mockRating = (item) => (3.9 + (hashOf(item) % 11) / 10).toFixed(1); // 3.9 – 4.9
const mockRatingCount = (item) => 12 + (hashOf(item) % 220);
const mockSpiceLevel = (item) => {
  const text = `${safeStr(item.name)} ${safeStr(item.description)} ${safeStr(item.category)}`.toLowerCase();
  if (/(mild|sweet|dessert|cake|shake|smoothie)/.test(text)) return 0;
  return hashOf(item) % 3; // 0-2 chillies for everything else, deterministic
};
const isVegItem = (item) => {
  if (typeof item.isVeg === "boolean") return item.isVeg;
  const text = `${safeStr(item.name)} ${safeStr(item.description)}`.toLowerCase();
  if (/(chicken|mutton|fish|prawn|egg|meat|bacon|pepperoni|beef|pork)/.test(text)) return false;
  return true;
};

const CATEGORY_EMOJI = {
  coffee: "☕", coffees: "☕", tea: "🍵", beverages: "🥤", drinks: "🥤",
  breakfast: "🍳", bakery: "🥐", desserts: "🍰", dessert: "🍰", cakes: "🍰",
  sandwiches: "🥪", burgers: "🍔", pizza: "🍕", pasta: "🍝", salads: "🥗",
  snacks: "🍟", appetizers: "🍤", mains: "🍽️", soups: "🍲"
};
const emojiForCategory = (category) => CATEGORY_EMOJI[safeStr(category).toLowerCase()] || "🍽️";

// Highlight the part of a string that matches the current search query
const highlightMatch = (text, query) => {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: "#fde9b8", color: "#3d2c1f", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// Tiny two-tone "ding" using the Web Audio API — no asset files needed
const playAddSound = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.2);
    });
    setTimeout(() => ctx.close(), 500);
  } catch { /* audio unavailable — silently skip */ }
};

const triggerHaptic = () => {
  try { if (navigator.vibrate) navigator.vibrate(15); } catch { /* not supported */ }
};

const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐", "🥳"];

const GUEST_MENU_STYLE_ID = "guest-menu-cray-styles";
const GUEST_MENU_CSS = `
@keyframes gm-pop { 0% { transform: scale(1); } 35% { transform: scale(1.35) rotate(-6deg); } 60% { transform: scale(0.92); } 100% { transform: scale(1); } }
@keyframes gm-float-up { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-60px) scale(1.4); opacity: 0; } }
@keyframes gm-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
@keyframes gm-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(139,105,20,0.45); } 70% { box-shadow: 0 0 0 10px rgba(139,105,20,0); } 100% { box-shadow: 0 0 0 0 rgba(139,105,20,0); } }
@keyframes gm-confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(540deg); opacity: 0; } }
@keyframes gm-skeleton { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
@keyframes gm-slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes gm-slide-down-out { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(20px); opacity: 0; } }
@keyframes gm-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes gm-toast-in { 0% { opacity: 0; transform: translateY(10px) scale(0.97); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes gm-ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
.gm-cart-bump { animation: gm-pop 0.4s ease; }
.gm-card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
.gm-card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(61,44,31,0.12); }
.gm-card-hover:hover .gm-card-img { transform: scale(1.06); }
.gm-card-img { transition: transform 0.35s ease; }
.gm-skeleton { background: linear-gradient(90deg, #f0ebe3 25%, #f8f4ee 37%, #f0ebe3 63%); background-size: 400px 100%; animation: gm-skeleton 1.4s ease-in-out infinite; }
.gm-sticky-bar { animation: gm-slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.gm-trending-track::-webkit-scrollbar { display: none; }
.gm-toast { animation: gm-toast-in 0.3s ease; }
.gm-waiter-btn { transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.1s ease; }
.gm-waiter-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(61,44,31,0.12); }
.gm-waiter-btn:active { transform: scale(0.97); }
`;

export default function GuestMenu({ qrCode, tableId, menuItems = MENU_ITEMS, onAddToCart, onCallWaiter, onRequestBill }) {
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById(GUEST_MENU_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = GUEST_MENU_STYLE_ID;
      el.textContent = GUEST_MENU_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    menuItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [menuItems]);

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showItemDetail, setShowItemDetail] = useState(null);
  const [showWaiterCall, setShowWaiterCall] = useState(false);
  const [showBillRequest, setShowBillRequest] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [allergyNote, setAllergyNote] = useState("");
  const [cartBump, setCartBump] = useState(0);
  const [flyEmojis, setFlyEmojis] = useState([]);
  const [justUnlockedReward, setJustUnlockedReward] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [undoSnack, setUndoSnack] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const flyIdRef = useRef(0);
  const prevTierRef = useRef(0);

  // Post-order state
  const [placedOrders, setPlacedOrders] = useState([]); // list of {id, items, total, placedAt, status}
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [waiterCallSent, setWaiterCallSent] = useState(null); // { type, label, sentAt } — shows confirmation
  const [waiterNote, setWaiterNote] = useState("");
  const [showWaiterNoteInput, setShowWaiterNoteInput] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  const fireAddFeedback = () => {
    setCartBump(b => b + 1);
    const id = ++flyIdRef.current;
    setFlyEmojis(list => [...list, id]);
    setTimeout(() => setFlyEmojis(list => list.filter(i => i !== id)), 700);
    playAddSound();
    triggerHaptic();
  };

  const burstConfetti = (count = 30) => {
    const pieces = Array.from({ length: count }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.2,
      emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 3200);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.active) return false;
      
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, search]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const rewardProgress = Math.min(1, cartTotal / REWARD_TARGET);
  const currentTierIndex = REWARD_TIERS.reduce((acc, tier, i) => (cartTotal >= tier.target ? i + 1 : acc), 0);
  const nextTier = REWARD_TIERS[currentTierIndex] || null;
  const rewardRemaining = nextTier ? Math.max(0, nextTier.target - cartTotal) : 0;

  useEffect(() => {
    if (currentTierIndex > prevTierRef.current) {
      setJustUnlockedReward(true);
      burstConfetti(currentTierIndex >= REWARD_TIERS.length ? 50 : 26);
      const t = setTimeout(() => setJustUnlockedReward(false), 2200);
      prevTierRef.current = currentTierIndex;
      return () => clearTimeout(t);
    }
    prevTierRef.current = currentTierIndex;
  }, [currentTierIndex]);

  // Trending Now: top few "hot" items across the whole menu, for the carousel
  const trendingItems = useMemo(() => {
    return menuItems.filter(item => item.active && isHotItem(item)).slice(0, 8);
  }, [menuItems]);

  // Suggested pairing shown in the item detail modal — pick a deterministic item from a different category
  const getPairingSuggestion = (item) => {
    if (!item) return null;
    const candidates = menuItems.filter(m => m.active && m.category !== item.category);
    if (candidates.length === 0) return null;
    const idx = hashOf(item) % candidates.length;
    return candidates[idx];
  };

  const handleAddToCart = (item, qty = 1, itemNotes = "", itemAllergyNote = "") => {
    const existingIndex = cart.findIndex(c => c.id === item.id && c.notes === itemNotes && c.allergyNote === itemAllergyNote);
    
    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: qty,
        notes: itemNotes,
        allergyNote: itemAllergyNote
      }]);
    }
    
    setShowItemDetail(null);
    setQuantity(1);
    setNotes("");
    setAllergyNote("");
    fireAddFeedback();
  };

  const handleRemoveFromCart = (index) => {
    const removedItem = cart[index];
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    if (undoSnack?.timeoutId) clearTimeout(undoSnack.timeoutId);
    const timeoutId = setTimeout(() => setUndoSnack(null), 5000);
    setUndoSnack({ item: removedItem, index, timeoutId });
  };

  const handleUndoRemove = () => {
    if (!undoSnack) return;
    clearTimeout(undoSnack.timeoutId);
    setCart(prev => {
      const updated = [...prev];
      updated.splice(Math.min(undoSnack.index, updated.length), 0, undoSnack.item);
      return updated;
    });
    setUndoSnack(null);
  };

  const handleUpdateQuantity = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const handleOpenItemDetail = (item) => {
    setShowItemDetail(item);
    setQuantity(1);
    setNotes("");
    setAllergyNote("");
  };

  const handleCallWaiter = (type, note = "") => {
    const WAITER_LABELS = {
      NEED_ASSISTANCE: "Need Assistance",
      WATER: "Water Requested",
      CUTLERY: "Cutlery Requested",
      EXTRA_NAPKINS: "Extra Napkins Requested",
      TAKEAWAY_BOX: "Takeaway Box Requested",
      OTHER: note ? `"${note}"` : "Request Sent"
    };
    if (onCallWaiter) onCallWaiter(type, note);
    setWaiterCallSent({ type, label: WAITER_LABELS[type] || "Request Sent", sentAt: Date.now() });
    setShowWaiterCall(false);
    setShowWaiterNoteInput(false);
    setWaiterNote("");
    triggerHaptic();
    // Auto-clear confirmation after 8 seconds
    setTimeout(() => setWaiterCallSent(null), 8000);
  };

  const handleRequestBill = () => {
    if (onRequestBill) onRequestBill();
    setBillRequested(true);
    setShowBillRequest(false);
    triggerHaptic();
  };

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(`category-${category}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Quick add/remove controls live on the card itself, operating on the "plain" cart line (no notes/allergy)
  const getQuickCartQty = (itemId) => {
    const line = cart.find(c => c.id === itemId && !c.notes && !c.allergyNote);
    return line ? line.quantity : 0;
  };

  const handleQuickIncrement = (item, e) => {
    e.stopPropagation();
    handleAddToCart(item, 1);
  };

  const handleQuickDecrement = (item, e) => {
    e.stopPropagation();
    const index = cart.findIndex(c => c.id === item.id && !c.notes && !c.allergyNote);
    if (index === -1) return;
    if (cart[index].quantity <= 1) {
      handleRemoveFromCart(index);
    } else {
      handleUpdateQuantity(index, -1);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", paddingBottom: cart.length > 0 ? 150 : 80, position: "relative" }}>
      {/* Confetti overlay — fires when a reward tier is unlocked */}
      {confettiPieces.length > 0 && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1300, overflow: "hidden" }}>
          {confettiPieces.map(p => (
            <span key={p.id} style={{
              position: "absolute",
              top: -20,
              left: `${p.left}%`,
              fontSize: 22,
              animation: `gm-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`
            }}>
              {p.emoji}
            </span>
          ))}
        </div>
      )}
      {/* Header */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        backgroundColor: "#faf8f5", 
        zIndex: 100, 
        borderBottom: "1px solid #e8e4df",
        padding: isMobile ? "12px 16px" : "16px 24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#3d2c1f" }}>
              Cafe Menu
            </div>
            <div style={{ fontSize: 12, color: "#8b7355" }}>
              {tableId ? `Table ${tableId}` : "Takeaway Order"}
            </div>
          </div>
          <button
            key={cartBump}
            className={cartBump > 0 ? "gm-cart-bump" : ""}
            style={{ 
              position: "relative",
              ...btn("primary"),
              padding: "8px 16px",
              fontSize: 14
            }}
            onClick={() => setShowCart(true)}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "#e74c3c",
                color: "var(--cafe-text-primary)",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600
              }}>
                {cartCount}
              </span>
            )}
            {flyEmojis.map(id => (
              <span key={id} style={{
                position: "absolute",
                top: -4,
                right: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "#27ae60",
                pointerEvents: "none",
                animation: "gm-float-up 0.7s ease-out forwards"
              }}>
                +1
              </span>
            ))}
          </button>
        </div>

        {cartTotal > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b7355", marginBottom: 4 }}>
              <span>
                {nextTier
                  ? (justUnlockedReward ? `🎉 ${REWARD_TIERS[currentTierIndex - 1]?.label} unlocked!` : `${nextTier.emoji} ${formatCurrency(rewardRemaining)} more for ${nextTier.label}`)
                  : "🏆 All rewards unlocked — you're a legend!"}
              </span>
              <span>{Math.round(rewardProgress * 100)}%</span>
            </div>
            <div style={{ position: "relative", height: 8, backgroundColor: "#e8e4df", borderRadius: 4, overflow: "visible" }}>
              <div style={{
                height: "100%",
                width: `${rewardProgress * 100}%`,
                borderRadius: 4,
                background: justUnlockedReward
                  ? "linear-gradient(90deg,#27ae60,#f1c40f,#27ae60)"
                  : "linear-gradient(90deg,#c9a86a,#8b6914)",
                backgroundSize: "200px 100%",
                animation: justUnlockedReward ? "gm-shimmer 0.8s linear infinite" : "none",
                transition: "width 0.4s ease",
                overflow: "hidden",
                borderRadius: 4
              }} />
              {REWARD_TIERS.map((tier, i) => (
                <div key={tier.target} title={`${tier.label} at ${formatCurrency(tier.target)}`} style={{
                  position: "absolute",
                  top: -3,
                  left: `calc(${Math.min(100, (tier.target / REWARD_TARGET) * 100)}% - 7px)`,
                  fontSize: 13,
                  filter: cartTotal >= tier.target ? "none" : "grayscale(1) opacity(0.5)",
                  transition: "filter 0.3s ease"
                }}>
                  {tier.emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ position: "relative" }}>
          <input
            type="search"
            aria-label="Search menu items"
            style={{
              ...input,
              width: "100%",
              padding: "10px 40px 10px 16px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid #d4c4b0",
              backgroundColor: "var(--cafe-bg-card)",
              boxSizing: "border-box"
            }}
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              aria-label="Clear search"
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: 18,
                color: "#a89070",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 4px"
              }}
            >×</button>
          )}
        </div>
      </div>

      {/* Welcome State */}
      {search === "" && selectedCategory === "All" && cart.length === 0 && (
        <div style={{ padding: isMobile ? 16 : 24, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>
            Welcome to our cafe
          </div>
          <div style={{ fontSize: 14, color: "#8b7355", marginBottom: 16 }}>
            {tableId ? `You're ordering for Table ${tableId}` : "Browse our menu and place your order"}
          </div>
          <div style={{ fontSize: 13, color: "#a89070" }}>
            Browse the menu below to get started
          </div>
        </div>
      )}

      {/* Trending Now carousel */}
      {trendingItems.length > 0 && search === "" && (
        <div style={{ padding: isMobile ? "16px 0 0" : "20px 0 0" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3d2c1f", padding: `0 ${isMobile ? 16 : 24}px`, marginBottom: 10 }}>
            🔥 Trending Now
          </div>
          <div className="gm-trending-track" style={{ display: "flex", gap: 12, overflowX: "auto", padding: `0 ${isMobile ? 16 : 24}px 4px`, WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}>
{trendingItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleOpenItemDetail(item)}
                style={{
                  ...card,
                  flex: "0 0 auto",
                  width: 140,
                  backgroundColor: "var(--cafe-bg-card)",
                  border: "1px solid #e8e4df",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  scrollSnapAlign: "start"
                }}
              >
                <div style={{ height: 90, backgroundColor: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#d4c4b0" }}>{emojiForCategory(item.category)}</span>
                  )}
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#3d2c1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#8b6914", marginTop: 2 }}>
                    {formatCurrency(item.price)}
                  </div>
                </div>
              </div>
            ))}
            {/* right sentinel — prevents last card clipping in overflow */}
            <div style={{ flex: "0 0 1px" }} aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Category Navigation */}
      <div style={{
        position: "sticky",
        top: isMobile ? 130 : 140,
        backgroundColor: "#faf8f5",
        zIndex: 90,
        borderBottom: "1px solid #e8e4df",
        padding: "12px 16px",
        overflowX: "auto",
        whiteSpace: "nowrap",
        WebkitOverflowScrolling: "touch"
      }}>
        <button
          style={{
            ...btn(selectedCategory === "All" ? "primary" : "ghost"),
            padding: "8px 16px",
            fontSize: 13,
            borderRadius: 20,
            marginRight: 8,
            backgroundColor: selectedCategory === "All" ? "#8b6914" : "transparent",
            color: selectedCategory === "All" ? "white" : "#3d2c1f",
            border: selectedCategory === "All" ? "none" : "1px solid #d4c4b0"
          }}
          onClick={() => scrollToCategory("All")}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            style={{
              ...btn(selectedCategory === category ? "primary" : "ghost"),
              padding: "8px 16px",
              fontSize: 13,
              borderRadius: 20,
              marginRight: 8,
              backgroundColor: selectedCategory === category ? "#8b6914" : "transparent",
              color: selectedCategory === category ? "white" : "#3d2c1f",
              border: selectedCategory === category ? "none" : "1px solid #d4c4b0"
            }}
            onClick={() => scrollToCategory(category)}
          >
            {emojiForCategory(category)} {category}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div style={{ padding: isMobile ? 16 : 24 }}>
        {filteredItems.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 16, color: "#8b7355", marginBottom: 8 }}>No items found</div>
            <div style={{ fontSize: 14, color: "#a89070" }}>Try a different search or category</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredItems.map(item => {
              const quickQty = getQuickCartQty(item.id);
              const spice = mockSpiceLevel(item);
              return (
              <div
                key={item.id}
                id={`category-${item.category}`}
                className="gm-card-hover"
                style={{
                  ...card,
                  backgroundColor: "var(--cafe-bg-card)",
                  border: "1px solid #e8e4df",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative"
                }}
                onClick={() => handleOpenItemDetail(item)}
              >
                <div style={{ position: "absolute", top: 10, left: 10, right: 10, zIndex: 2, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {isHotItem(item) && (
                      <span style={{ backgroundColor: "#e74c3c", color: "var(--cafe-text-primary)", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, boxShadow: "0 2px 6px rgba(231,76,60,0.4)" }}>
                        🔥 Popular
                      </span>
                    )}
                    {isNewItem(item) && (
                      <span style={{ backgroundColor: "#3498db", color: "var(--cafe-text-primary)", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, boxShadow: "0 2px 6px rgba(52,152,219,0.4)" }}>
                        ✨ New
                      </span>
                    )}
                  </div>
                  <span title={isVegItem(item) ? "Vegetarian" : "Non-vegetarian"} style={{
                    width: 16, height: 16, borderRadius: 3, border: `2px solid ${isVegItem(item) ? "#27ae60" : "#c0392b"}`,
                    backgroundColor: "var(--cafe-bg-card)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isVegItem(item) ? "#27ae60" : "#c0392b" }} />
                  </span>
                </div>
                <div style={{ 
                  height: 160, 
                  backgroundColor: "#f5f0e8", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: 48,
                  overflow: "hidden",
                  position: "relative"
                }}>
                  {item.image ? (
                    <>
                      {!loadedImages[item.id] && <div className="gm-skeleton" style={{ position: "absolute", inset: 0 }} />}
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="gm-card-img"
                        onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loadedImages[item.id] ? 1 : 0, transition: "opacity 0.25s ease" }}
                      />
                    </>
                  ) : (
                    <span style={{ color: "#d4c4b0" }}>{emojiForCategory(item.category)}</span>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 4 }}>
                    {highlightMatch(item.name, search.trim())}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 11, color: "#a89070" }}>
                    <span>⭐ {mockRating(item)} <span style={{ color: "#c4b59a" }}>({mockRatingCount(item)})</span></span>
                    {spice > 0 && <span>{"🌶️".repeat(spice)}</span>}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 8, lineHeight: 1.4 }}>
                      {item.description.length > 60 ? item.description.substring(0, 60) + "..." : item.description}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#8b6914" }}>
                      {formatCurrency(item.price)}
                    </div>
                    {quickQty > 0 ? (
                      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#8b6914", borderRadius: 20, padding: "2px 4px" }}>
                        <button
                          style={{ background: "transparent", border: "none", color: "var(--cafe-text-primary)", width: 26, height: 26, borderRadius: "50%", fontSize: 16, cursor: "pointer" }}
                          onClick={(e) => handleQuickDecrement(item, e)}
                        >
                          −
                        </button>
                        <span style={{ color: "var(--cafe-text-primary)", fontSize: 13, fontWeight: 700, minWidth: 14, textAlign: "center" }}>{quickQty}</span>
                        <button
                          style={{ background: "transparent", border: "none", color: "var(--cafe-text-primary)", width: 26, height: 26, borderRadius: "50%", fontSize: 16, cursor: "pointer" }}
                          onClick={(e) => handleQuickIncrement(item, e)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{
                          ...btn("primary"),
                          padding: "6px 12px",
                          fontSize: 13,
                          borderRadius: 6
                        }}
                        onClick={(e) => handleQuickIncrement(item, e)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>

      {/* Sticky View Cart bar */}
      {cart.length > 0 && (
        <div className="gm-sticky-bar" style={{
          position: "fixed",
          bottom: 64,
          left: 16,
          right: 16,
          zIndex: 110,
          backgroundColor: "#8b6914",
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 8px 24px rgba(139,105,20,0.35)",
          cursor: "pointer"
        }}
        onClick={() => setShowCart(true)}
        >
          <span style={{ color: "var(--cafe-text-primary)", fontSize: 14, fontWeight: 600 }}>
            🛒 {cartCount} item{cartCount === 1 ? "" : "s"}
          </span>
          <span style={{ color: "var(--cafe-text-primary)", fontSize: 15, fontWeight: 700 }}>
            View Cart • {formatCurrency(cartTotal)}
          </span>
        </div>
      )}

      {/* Waiter call sent confirmation toast */}
      {waiterCallSent && (
        <div className="gm-toast" style={{
          position: "fixed",
          top: 80,
          left: 16,
          right: 16,
          zIndex: 1200,
          backgroundColor: "#1a3a2a",
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <span style={{
              position: "absolute", inset: -2, borderRadius: "50%",
              border: "2px solid #27ae60",
              animation: "gm-ping 1.2s ease-out infinite"
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)" }}>Waiter notified!</div>
            <div style={{ fontSize: 12, color: "#7ec8a0" }}>{waiterCallSent.label} · staff will be with you shortly</div>
          </div>
          <button
            onClick={() => setWaiterCallSent(null)}
            style={{ background: "none", border: "none", color: "#7ec8a0", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}
          >×</button>
        </div>
      )}

      {/* Post-order banner — shows after placing an order, persists while browsing */}
      {placedOrders.length > 0 && (
        <div style={{
          margin: isMobile ? "12px 16px 0" : "16px 24px 0",
          padding: "14px 16px",
          backgroundColor: "#e8f8ef",
          borderRadius: 12,
          border: "1px solid #a8dbbe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5c35" }}>
                {placedOrders.length === 1 ? "Order placed!" : `${placedOrders.length} orders placed`} · kitchen has it
              </div>
              <div style={{ fontSize: 11, color: "#3d8c5f" }}>
                Want more? Keep browsing and add to a new order.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowOrderStatus(true)}
            style={{
              ...btn("ghost"),
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #a8dbbe",
              color: "#1a5c35",
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            View →
          </button>
        </div>
      )}

      {/* Bottom Actions */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--cafe-bg-card)",
        borderTop: "1px solid #e8e4df",
        padding: "10px 16px",
        display: "flex",
        gap: 10,
        zIndex: 100
      }}>
        <button
          style={{
            ...btn("ghost"),
            flex: 1,
            padding: "11px 8px",
            fontSize: 13,
            border: "1px solid #d4c4b0",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
          }}
          onClick={() => setShowWaiterCall(true)}
        >
          <span style={{ fontSize: 18 }}>🙋</span>
          <span>Call Waiter</span>
        </button>
        <button
          style={{
            ...btn("ghost"),
            flex: 1,
            padding: "11px 8px",
            fontSize: 13,
            border: billRequested ? "1px solid #a8dbbe" : "1px solid #d4c4b0",
            borderRadius: 8,
            backgroundColor: billRequested ? "#e8f8ef" : "transparent",
            color: billRequested ? "#1a5c35" : undefined,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
          }}
          onClick={() => billRequested ? null : setShowBillRequest(true)}
        >
          <span style={{ fontSize: 18 }}>{billRequested ? "✅" : "🧾"}</span>
          <span>{billRequested ? "Bill Sent" : "Request Bill"}</span>
        </button>
        {placedOrders.length > 0 && (
          <button
            style={{
              ...btn("ghost"),
              flex: 1,
              padding: "11px 8px",
              fontSize: 13,
              border: "1px solid #d4c4b0",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2
            }}
            onClick={() => setShowOrderStatus(true)}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            <span>My Orders</span>
          </button>
        )}
      </div>

      {/* Cart Sheet */}
      {showCart && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "flex-end", 
          zIndex: 1000 
        }}>
          <div style={{
            ...card,
            width: "100%",
            maxHeight: "90vh",
            backgroundColor: "var(--cafe-bg-card)",
            borderRadius: "20px 20px 0 0",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #e8e4df" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#3d2c1f" }}>Your Cart</h2>
                <button
                  style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }}
                  onClick={() => setShowCart(false)}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                  <div style={{ fontSize: 16, color: "#8b7355", marginBottom: 8 }}>Your cart is empty</div>
                  <div style={{ fontSize: 14, color: "#a89070" }}>Add items to get started</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      paddingBottom: 16,
                      borderBottom: "1px solid #f0ebe3"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 4 }}>
                          {item.name}
                        </div>
                        {item.notes && (
                          <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 2 }}>
                            Note: {item.notes}
                          </div>
                        )}
                        {item.allergyNote && (
                          <div style={{ fontSize: 12, color: "#c0392b", marginBottom: 2 }}>
                            ⚠️ Allergy: {item.allergyNote}
                          </div>
                        )}
                        <div style={{ fontSize: 14, color: "#8b6914", fontWeight: 600 }}>
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 16, border: "1px solid #d4c4b0", borderRadius: 4 }}
                            onClick={() => handleUpdateQuantity(index, -1)}
                          >
                            −
                          </button>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", minWidth: 24, textAlign: "center" }}>
                            {item.quantity}
                          </span>
                          <button
                            style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 16, border: "1px solid #d4c4b0", borderRadius: 4 }}
                            onClick={() => handleUpdateQuantity(index, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          style={{ ...btn("ghost"), color: "#e74c3c", padding: "4px 8px", fontSize: 12 }}
                          onClick={() => handleRemoveFromCart(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "20px", borderTop: "1px solid #e8e4df", backgroundColor: "#faf8f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 16, color: "#8b7355" }}>Subtotal</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#3d2c1f" }}>{formatCurrency(cartTotal)}</span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    style={{ ...btn("ghost"), flex: 1, padding: "14px", fontSize: 15, border: "1px solid #d4c4b0", borderRadius: 8 }}
                    onClick={() => setShowCart(false)}
                  >
                    Continue Browsing
                  </button>
                  <button
                    style={{ ...btn("primary"), flex: 1, padding: "14px", fontSize: 15, borderRadius: 8 }}
                    onClick={() => {
                      const order = {
                        id: "ORD-" + Date.now(),
                        items: [...cart],
                        total: cartTotal,
                        placedAt: Date.now(),
                        status: "SENT"
                      };
                      setPlacedOrders(prev => [...prev, order]);
                      if (onAddToCart) onAddToCart(cart);
                      setCart([]);
                      setShowCart(false);
                      burstConfetti(28);
                      setShowOrderStatus(true);
                    }}
                  >
                    Place Order • {formatCurrency(cartTotal)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {showItemDetail && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "flex-end", 
          zIndex: 1000 
        }}>
          <div style={{
            ...card,
            width: "100%",
            maxHeight: "90vh",
            backgroundColor: "var(--cafe-bg-card)",
            borderRadius: "20px 20px 0 0",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #e8e4df" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#3d2c1f" }}>{showItemDetail.name}</h2>
                <button
                  style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }}
                  onClick={() => setShowItemDetail(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {showItemDetail.description && (
                <div style={{ fontSize: 14, color: "#8b7355", marginBottom: 16, lineHeight: 1.5 }}>
                  {showItemDetail.description}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 12, color: "#a89070" }}>
                <span>⭐ {mockRating(showItemDetail)} ({mockRatingCount(showItemDetail)})</span>
                {mockSpiceLevel(showItemDetail) > 0 && <span>{"🌶️".repeat(mockSpiceLevel(showItemDetail))}</span>}
                <span style={{ color: isVegItem(showItemDetail) ? "#27ae60" : "#c0392b", fontWeight: 600 }}>
                  {isVegItem(showItemDetail) ? "● Veg" : "● Non-Veg"}
                </span>
              </div>

              {(() => {
                const pairing = getPairingSuggestion(showItemDetail);
                if (!pairing) return null;
                return (
                  <div
                    onClick={() => handleAddToCart(pairing, 1)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      marginBottom: 20,
                      backgroundColor: "#fdf6e8",
                      border: "1px dashed #d4b76a",
                      borderRadius: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#a8892f", fontWeight: 700, marginBottom: 2 }}>GOES GREAT WITH</div>
                      <div style={{ fontSize: 13, color: "#3d2c1f", fontWeight: 600 }}>{emojiForCategory(pairing.category)} {pairing.name} · {formatCurrency(pairing.price)}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#8b6914" }}>+ Add</span>
                  </div>
                );
              })()}

              <div style={{ marginBottom: 20 }}>
                <label style={{ ...label, marginBottom: 8 }}>Quantity</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    style={{ ...btn("ghost"), padding: "8px 16px", fontSize: 18, border: "1px solid #d4c4b0", borderRadius: 6 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#3d2c1f", minWidth: 40, textAlign: "center" }}>
                    {quantity}
                  </span>
                  <button
                    style={{ ...btn("ghost"), padding: "8px 16px", fontSize: 18, border: "1px solid #d4c4b0", borderRadius: 6 }}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ ...label, marginBottom: 8 }}>Special Instructions (optional)</label>
                <textarea
                  style={{
                    ...input,
                    resize: "none",
                    minHeight: 80,
                    borderRadius: 8,
                    border: "1px solid #d4c4b0"
                  }}
                  placeholder="Any special requests?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ ...label, marginBottom: 8 }}>Allergy Information (optional)</label>
                <textarea
                  style={{
                    ...input,
                    resize: "none",
                    minHeight: 60,
                    borderRadius: 8,
                    border: "1px solid #d4c4b0"
                  }}
                  placeholder="Please mention any allergies"
                  value={allergyNote}
                  onChange={(e) => setAllergyNote(e.target.value)}
                />
                <div style={{ fontSize: 11, color: "#c0392b", marginTop: 4 }}>
                  ⚠️ Please tell staff about severe allergies. Ingredient information may not cover cross-contact.
                </div>
              </div>

              <div style={{ 
                padding: 16, 
                backgroundColor: "#f5f0e8", 
                borderRadius: 8, 
                marginBottom: 20 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "#8b7355" }}>Total</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#8b6914" }}>
                    {formatCurrency(showItemDetail.price * quantity)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px", borderTop: "1px solid #e8e4df", backgroundColor: "#faf8f5" }}>
              <button
                style={{ ...btn("primary"), width: "100%", padding: "16px", fontSize: 16, borderRadius: 8 }}
                onClick={() => handleAddToCart(showItemDetail, quantity, notes, allergyNote)}
              >
                Add to Order • {formatCurrency(showItemDetail.price * quantity)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiter Call Modal — rich, full options */}
      {showWaiterCall && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowWaiterCall(false); setShowWaiterNoteInput(false); setWaiterNote(""); }}}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 1000
          }}
        >
          <div style={{
            ...card,
            width: "100%",
            backgroundColor: "var(--cafe-bg-card)",
            borderRadius: "20px 20px 0 0",
            padding: 0,
            overflow: "hidden"
          }}>
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e8e4df" }} />
            </div>

            <div style={{ padding: "16px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3d2c1f" }}>Call Waiter</div>
                {tableId && <div style={{ fontSize: 12, color: "#8b7355" }}>Table {tableId}</div>}
              </div>
              <button
                onClick={() => { setShowWaiterCall(false); setShowWaiterNoteInput(false); setWaiterNote(""); }}
                style={{ background: "none", border: "none", fontSize: 22, color: "#a89070", cursor: "pointer", lineHeight: 1, padding: 4 }}
              >×</button>
            </div>

            <div style={{ padding: "8px 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { type: "NEED_ASSISTANCE", icon: "🙋", label: "Need assistance", sub: "Staff will come to your table" },
                { type: "WATER", icon: "💧", label: "Water please", sub: "Refill or a fresh glass" },
                { type: "CUTLERY", icon: "🍴", label: "Cutlery / napkins", sub: "Extra utensils or napkins" },
                { type: "EXTRA_NAPKINS", icon: "🧻", label: "Extra napkins", sub: "More napkins at the table" },
                { type: "TAKEAWAY_BOX", icon: "📦", label: "Takeaway box", sub: "Pack up remaining food" },
              ].map(({ type, icon, label, sub }) => (
                <button
                  key={type}
                  className="gm-waiter-btn"
                  style={{
                    background: "white",
                    border: "1px solid #e8e4df",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%"
                  }}
                  onClick={() => handleCallWaiter(type)}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#8b7355" }}>{sub}</div>
                  </div>
                </button>
              ))}

              {/* Custom message option */}
              {!showWaiterNoteInput ? (
                <button
                  className="gm-waiter-btn"
                  style={{
                    background: "white",
                    border: "1px dashed #d4c4b0",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%"
                  }}
                  onClick={() => setShowWaiterNoteInput(true)}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>✏️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>Something else</div>
                    <div style={{ fontSize: 12, color: "#8b7355" }}>Type a custom message to staff</div>
                  </div>
                </button>
              ) : (
                <div style={{ border: "1px solid #d4c4b0", borderRadius: 12, padding: 14, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>✏️ Your message to staff</div>
                  <textarea
                    autoFocus
                    style={{
                      ...input,
                      width: "100%",
                      resize: "none",
                      minHeight: 72,
                      borderRadius: 8,
                      border: "1px solid #d4c4b0",
                      fontSize: 14,
                      boxSizing: "border-box"
                    }}
                    placeholder="e.g. Can we get a high chair? The AC is too cold…"
                    value={waiterNote}
                    onChange={(e) => setWaiterNote(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      style={{ ...btn("ghost"), flex: 1, padding: "10px", fontSize: 13, border: "1px solid #d4c4b0", borderRadius: 8 }}
                      onClick={() => { setShowWaiterNoteInput(false); setWaiterNote(""); }}
                    >Cancel</button>
                    <button
                      style={{ ...btn("primary"), flex: 2, padding: "10px", fontSize: 13, borderRadius: 8, opacity: waiterNote.trim() ? 1 : 0.5 }}
                      disabled={!waiterNote.trim()}
                      onClick={() => handleCallWaiter("OTHER", waiterNote.trim())}
                    >Send to Waiter</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Request Modal */}
      {showBillRequest && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 1000 
        }}>
          <div style={{ ...card, width: isMobile ? "90%" : 400, backgroundColor: "white", borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#3d2c1f" }}>Request Bill</h2>
            <p style={{ fontSize: 14, color: "#8b7355", marginBottom: 20 }}>
              {tableId ? `Request the bill for Table ${tableId}?` : "Request your bill?"}
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                style={{ ...btn("ghost"), flex: 1, padding: "14px", fontSize: 15, border: "1px solid #d4c4b0", borderRadius: 8 }}
                onClick={() => setShowBillRequest(false)}
              >
                Cancel
              </button>
              <button
                style={{ ...btn("primary"), flex: 1, padding: "14px", fontSize: 15, borderRadius: 8 }}
                onClick={handleRequestBill}
              >
                Request Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Sheet — post-order "my orders" panel */}
      {showOrderStatus && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowOrderStatus(false); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 1000
          }}
        >
          <div style={{
            ...card,
            width: "100%",
            maxHeight: "85vh",
            backgroundColor: "var(--cafe-bg-card)",
            borderRadius: "20px 20px 0 0",
            display: "flex",
            flexDirection: "column",
            padding: 0
          }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e8e4df" }} />
            </div>

            <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e8e4df" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3d2c1f" }}>My Orders</div>
                {tableId && <div style={{ fontSize: 12, color: "#8b7355" }}>Table {tableId}</div>}
              </div>
              <button
                onClick={() => setShowOrderStatus(false)}
                style={{ background: "none", border: "none", fontSize: 22, color: "#a89070", cursor: "pointer", lineHeight: 1, padding: 4 }}
              >×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {placedOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, color: "#8b7355" }}>No orders placed yet</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[...placedOrders].reverse().map((order, i) => {
                    const elapsed = Math.floor((Date.now() - order.placedAt) / 60000);
                    const elapsedLabel = elapsed < 1 ? "just now" : elapsed === 1 ? "1 min ago" : `${elapsed} min ago`;
                    return (
                      <div key={order.id} style={{
                        border: "1px solid #e8e4df",
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: i === 0 ? "#faf8f5" : "white"
                      }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0ebe3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#3d2c1f" }}>
                              {i === placedOrders.length - 1 ? "Latest order" : `Order #${placedOrders.length - i}`}
                            </span>
                            <span style={{ fontSize: 12, color: "#a89070", marginLeft: 8 }}>{elapsedLabel}</span>
                          </div>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 20,
                            backgroundColor: order.status === "SENT" ? "#fef9e7" : order.status === "READY" ? "#e8f8ef" : "#fef9e7",
                            color: order.status === "SENT" ? "#d68910" : order.status === "READY" ? "#1a5c35" : "#d68910"
                          }}>
                            {order.status === "SENT" ? "⏳ In kitchen" : order.status === "READY" ? "✅ Ready!" : "🍽️ Served"}
                          </span>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5a3e2b", paddingBottom: idx < order.items.length - 1 ? 6 : 0 }}>
                              <span>{item.quantity}× {item.name}</span>
                              <span style={{ color: "#8b6914", fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0ebe3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#8b7355" }}>Order total</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#3d2c1f" }}>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Grand total across all orders */}
                  {placedOrders.length > 1 && (
                    <div style={{
                      padding: "14px 16px",
                      backgroundColor: "#3d2c1f",
                      borderRadius: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: 14, color: "#c9a86a", fontWeight: 600 }}>Total across all orders</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                        {formatCurrency(placedOrders.reduce((s, o) => s + o.total, 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: "16px 20px", borderTop: "1px solid #e8e4df", display: "flex", gap: 10 }}>
              <button
                style={{ ...btn("ghost"), flex: 1, padding: "13px", fontSize: 14, border: "1px solid #d4c4b0", borderRadius: 10 }}
                onClick={() => { setShowOrderStatus(false); setShowWaiterCall(true); }}
              >🙋 Call Waiter</button>
              <button
                style={{
                  ...btn("ghost"),
                  flex: 1,
                  padding: "13px",
                  fontSize: 14,
                  border: billRequested ? "1px solid #a8dbbe" : "1px solid #d4c4b0",
                  borderRadius: 10,
                  backgroundColor: billRequested ? "#e8f8ef" : "transparent",
                  color: billRequested ? "#1a5c35" : undefined
                }}
                onClick={() => { if (!billRequested) { setShowOrderStatus(false); setShowBillRequest(true); } }}
              >{billRequested ? "✅ Bill Requested" : "🧾 Request Bill"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Undo snackbar */}
      {undoSnack && (
        <div style={{
          position: "fixed",
          bottom: cart.length > 0 ? 148 : 84,
          left: 16,
          right: 16,
          zIndex: 1050,
          backgroundColor: "#3d2c1f",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          animation: "gm-slide-up 0.25s ease"
        }}>
          <span style={{ color: "var(--cafe-text-primary)", fontSize: 13 }}>
            Removed {undoSnack.item?.name}
          </span>
          <button
            style={{ background: "transparent", border: "none", color: "#f1c40f", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            onClick={handleUndoRemove}
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
}
