import { useState, useMemo, useCallback, useEffect } from "react";
import { C, card, btn } from "../../styles/theme";
import { ANALYTICS_DATA } from "../../data/constants";
import { getOrderAmount, getOrderDisplayItems } from "../../domain/orderModel.js";

// CSV fields can legitimately contain commas (e.g. "₹10,792"), so every
// field must be quote-wrapped and internal quotes escaped per RFC 4180.
const csvField = (val) => `"${String(val).replace(/"/g, '""')}"`;
const csvRow = (...fields) => fields.map(csvField).join(",") + "\n";

const PERIOD_LABELS = { today: "Today", week: "This Week", month: "This Month" };

// --- Safety helpers -------------------------------------------------------
// Dev-only warnings so malformed data is visible while building, but silent
// (and cost-free) in production — never spams the real user's console.
const devWarn = (...args) => {
  if (typeof process !== "undefined" && process?.env?.NODE_ENV !== "production") {
    console.warn(...args);
  }
};

const isValidDate = (dt) => dt instanceof Date && !isNaN(dt.getTime());

// Reads an order's createdAt defensively — missing field, bad string, or a
// non-object order all safely resolve to `null` instead of throwing or
// producing an Invalid Date that would silently corrupt period filtering.
const parseOrderDate = (o) => {
  const raw = o && o.createdAt;
  if (!raw) return null;
  const dt = raw instanceof Date ? raw : new Date(raw);
  return isValidDate(dt) ? dt : null;
};

// getOrderAmount can throw on unexpected order shapes — never let a single
// bad order blow up the whole analytics calculation.
const safeAmount = (o) => {
  try {
    const n = getOrderAmount(o);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const money = (n) => "₹" + (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString("en-IN");
const pct = (n) => (Number.isFinite(n) ? Math.round(n) : 0) + "%";

// [start, end) range for the selected period, in local time. `offset` shifts
// by whole periods (-1 = the immediately preceding period), which lets us
// build an honest prior-period comparison from the same order list.
const getPeriodRange = (p, offset = 0) => {
  const now = new Date();
  if (p === "week") {
    const dow = (now.getDay() + 6) % 7; // Monday = 0
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + offset * 7);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return { start, end };
  }
  if (p === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    return { start, end };
  }
  // "today" default
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start, end };
};

function Analytics({ orders: externalOrders, customers: externalCustomers }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [period, setPeriod] = useState("today");
  const d = ANALYTICS_DATA[period];

  // Distinguish "no orders prop at all" (demo/preview mode — show static
  // sample data) from "orders prop given but currently empty" (a connected,
  // real account with zero orders — show an honest empty state, not demo
  // numbers that would look like real activity).
  const isDemoMode = externalOrders == null;
  const orders = Array.isArray(externalOrders) ? externalOrders : [];
  const customers = Array.isArray(externalCustomers) ? externalCustomers : [];

  // Filter real orders into the selected period and the immediately-prior
  // matching period (today/yesterday, this week/last week, this month/last
  // month), using createdAt safely. Orders with a missing or invalid
  // createdAt are excluded rather than guessed at, with a dev-only warning
  // so bad data is visible while building without spamming production.
  const { periodOrders, prevPeriodOrders } = useMemo(() => {
    if (isDemoMode || !orders.length) return { periodOrders: [], prevPeriodOrders: [] };

    const cur = getPeriodRange(period, 0);
    const prev = getPeriodRange(period, -1);
    const inPeriod = [];
    const inPrevPeriod = [];

    orders.forEach(o => {
      const dt = parseOrderDate(o);
      if (!dt) {
        devWarn("Analytics: skipping order with missing/invalid createdAt", o?.id ?? "(no id)");
        return;
      }
      if (dt >= cur.start && dt < cur.end) inPeriod.push(o);
      else if (dt >= prev.start && dt < prev.end) inPrevPeriod.push(o);
    });

    return { periodOrders: inPeriod, prevPeriodOrders: inPrevPeriod };
  }, [orders, period, isDemoMode]);

  // Simple busiest/slowest-hour analysis for the selected period. `null`
  // when there isn't enough dated data to say anything — the UI treats that
  // as "no peak-hour metric" rather than showing a fabricated hour.
  const peakHour = useMemo(() => {
    if (isDemoMode || !periodOrders.length) return null;
    const counts = {};
    periodOrders.forEach(o => {
      const dt = parseOrderDate(o);
      if (!dt) return;
      const h = dt.getHours();
      counts[h] = (counts[h] || 0) + 1;
    });
    const hours = Object.keys(counts);
    if (!hours.length) return null;
    let busiest = hours[0], slowest = hours[0];
    hours.forEach(h => {
      if (counts[h] > counts[busiest]) busiest = h;
      if (counts[h] < counts[slowest]) slowest = h;
    });
    const fmt = (h) => { const hh = Number(h); const ampm = hh >= 12 ? "PM" : "AM"; const h12 = hh % 12 === 0 ? 12 : hh % 12; return `${h12}${ampm}`; };
    return { busiest: fmt(busiest), busiestCount: counts[busiest], slowest: fmt(slowest), slowestCount: counts[slowest] };
  }, [periodOrders, isDemoMode]);

  // Calculate real metrics from orders filtered to the selected period.
  // Prior-period % change is only shown when the prior period actually has
  // data to compare against — otherwise we surface "—" rather than a
  // fabricated percentage.
  const realMetrics = useMemo(() => {
    if (isDemoMode) return d.metrics;

    const src = periodOrders;
    const completedOrders = src.filter(o => o && (o.status === "COMPLETED" || o.status === "READY"));
    const totalRevenue = completedOrders.reduce((sum, o) => sum + safeAmount(o), 0);
    const avgOrderValue = completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0;
    const totalOrders = src.length;
    const activeOrders = src.filter(o => o && !["COMPLETED", "CANCELLED"].includes(o.status)).length;
    const cancelledOrders = src.filter(o => o && o.status === "CANCELLED").length;
    const completionRate = totalOrders ? Math.round((completedOrders.length / totalOrders) * 100) : 0;
    const cancellationRate = totalOrders ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    const prevCompleted = prevPeriodOrders.filter(o => o && (o.status === "COMPLETED" || o.status === "READY"));
    const prevRevenue = prevCompleted.reduce((sum, o) => sum + safeAmount(o), 0);
    const revChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null;
    const ordersChange = prevPeriodOrders.length > 0 ? Math.round(((totalOrders - prevPeriodOrders.length) / prevPeriodOrders.length) * 100) : null;
    const priorLabel = { today: "vs yesterday", week: "vs last week", month: "vs last month" }[period] || "vs prior period";

    // New/repeat customers, identified from whatever customer-linking field
    // the order happens to have — this stays honest without depending on
    // the shape of the separate customers array (which we don't own here).
    const custKey = (o) => (o && (o.customerId || o.customerPhone || o.phone || (o.customer && (o.customer.id || o.customer.phone)))) || null;
    const firstSeen = {};
    orders.forEach(o => {
      const key = custKey(o);
      const dt = parseOrderDate(o);
      if (!key || !dt) return;
      if (!firstSeen[key] || dt < firstSeen[key]) firstSeen[key] = dt;
    });
    const periodCustomerCounts = {};
    src.forEach(o => {
      const key = custKey(o);
      if (!key) return;
      periodCustomerCounts[key] = (periodCustomerCounts[key] || 0) + 1;
    });
    const periodCustomerKeys = Object.keys(periodCustomerCounts);
    const hasCustomerLinks = periodCustomerKeys.length > 0;
    const periodStart = getPeriodRange(period, 0).start;
    const newCustomers = hasCustomerLinks
      ? periodCustomerKeys.filter(k => firstSeen[k] && firstSeen[k] >= periodStart).length
      : null;
    const repeatCustomers = hasCustomerLinks
      ? periodCustomerKeys.filter(k => periodCustomerCounts[k] >= 2).length
      : null;

    const list = [
      { lbl: "Revenue", val: money(totalRevenue), change: revChange === null ? "—" : `${revChange >= 0 ? "+" : ""}${revChange}%`, sub: revChange === null ? "no prior data" : priorLabel, up: revChange === null ? true : revChange >= 0 },
      { lbl: "Orders", val: totalOrders, change: ordersChange === null ? "—" : `${ordersChange >= 0 ? "+" : ""}${ordersChange}%`, sub: ordersChange === null ? "no prior data" : priorLabel, up: ordersChange === null ? true : ordersChange >= 0 },
      { lbl: "Avg Order", val: money(avgOrderValue), change: "—", sub: PERIOD_LABELS[period]?.toLowerCase() || "this period", up: true },
      { lbl: "Active", val: activeOrders, change: `${cancelledOrders} cancelled`, sub: `${pct(cancellationRate)} cancel rate`, up: activeOrders >= cancelledOrders },
      { lbl: "Customers", val: customers.length, change: "—", sub: "total on file", up: true },
      { lbl: "Completion", val: pct(completionRate), change: "—", sub: "of period orders", up: completionRate >= 50 },
    ];

    if (newCustomers !== null) list.push({ lbl: "New Customers", val: newCustomers, change: "—", sub: PERIOD_LABELS[period]?.toLowerCase() || "this period", up: true });
    if (repeatCustomers !== null) list.push({ lbl: "Repeat Customers", val: repeatCustomers, change: "—", sub: "2+ orders", up: true });
    if (peakHour) list.push({ lbl: "Peak Hour", val: peakHour.busiest, change: `${peakHour.busiestCount} orders`, sub: "busiest hour", up: true });

    return list;
  }, [orders, periodOrders, prevPeriodOrders, customers, d.metrics, isDemoMode, period, peakHour]);

  // Calculate real channel breakdown from orders in the selected period.
  // Empty period -> [] here; the demo/empty-state choice happens once,
  // below, via isDemoMode — this hook never invents numbers.
  const realChannels = useMemo(() => {
    if (!periodOrders.length) return [];

    const sourceCounts = {};
    const sourceRevenue = {};
    periodOrders.forEach(o => {
      const key = o && typeof o.source === "string" && o.source ? o.source : "UNKNOWN";
      sourceCounts[key] = (sourceCounts[key] || 0) + 1;
      sourceRevenue[key] = (sourceRevenue[key] || 0) + safeAmount(o);
    });

    const totalOrders = periodOrders.length;

    const channelMap = {
      "SWIGGY": { name: "Swiggy", color: "#FF6B35" },
      "ZOMATO": { name: "Zomato", color: "#E8344E" },
      "WALK_IN": { name: "Walk-in", color: C.green },
      "DIRECT_DELIVERY": { name: "Delivery", color: C.blue },
      "UNKNOWN": { name: "Unknown", color: C.text3 },
    };

    // Iterate over sources actually present (not just the known keys) so an
    // unexpected/missing source falls into "Unknown" instead of silently
    // disappearing from the breakdown.
    return Object.keys(sourceCounts)
      .filter(source => sourceCounts[source] > 0)
      .map(source => {
        const meta = channelMap[source] || channelMap.UNKNOWN;
        return {
          name: meta.name,
          pct: totalOrders ? Math.round((sourceCounts[source] / totalOrders) * 100) : 0,
          rev: money(sourceRevenue[source] || 0),
          orders: sourceCounts[source] || 0,
          color: meta.color,
        };
      })
      .sort((a, b) => b.orders - a.orders);
  }, [periodOrders]);

  // Calculate real top items from completed orders in the selected period
  // (use normalized items array). Returns [] when there's no qualifying
  // data, rather than fabricated demo items.
  const realTopItems = useMemo(() => {
    if (!periodOrders.length) return [];

    const completed = periodOrders.filter(o => o && (o.status === "COMPLETED" || o.status === "READY"));
    const itemCounts = {};
    const itemRevenue = {};

    completed.forEach(o => {
      // Use normalized items array if available
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const name = item && typeof item.name === "string" ? item.name.trim() : "";
          if (!name) {
            devWarn("Analytics: skipping item with missing/invalid name on order", o?.id ?? "(no id)");
            return;
          }
          const qty = Number.isFinite(item.qty) && item.qty > 0 ? item.qty : 1;
          const price = Number.isFinite(item.price) ? item.price : 0;
          itemCounts[name] = (itemCounts[name] || 0) + qty;
          itemRevenue[name] = (itemRevenue[name] || 0) + (price * qty);
        });
      } else {
        // Fallback to parsing string format for backward compatibility
        let items;
        try {
          items = getOrderDisplayItems(o);
        } catch {
          items = "";
        }
        const itemStrs = String(items || "").split(",").map(item => item.trim()).filter(Boolean);
        itemStrs.forEach(item => {
          const match = item.match(/(.+?)\s*×\s*(\d+)/);
          if (!match) return;
          const name = match[1].trim();
          if (!name) return;
          const qty = parseInt(match[2], 10) || 1;
          itemCounts[name] = (itemCounts[name] || 0) + qty;
          // Estimate price at 120 for backward compatibility
          itemRevenue[name] = (itemRevenue[name] || 0) + (qty * 120);
        });
      }
    });

    return Object.entries(itemCounts)
      .map(([name, sold]) => ({
        name,
        sold,
        rev: money(itemRevenue[name] || 0),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [periodOrders]);

  // Demo mode (no orders prop given at all) shows static sample data, clearly
  // marked as such in the UI. A connected account with zero real orders shows
  // the real (empty) arrays instead — never the demo numbers — since those
  // would otherwise read as actual activity.
  const metrics = isDemoMode ? d.metrics : realMetrics;
  const displayChannels = isDemoMode ? [
    { name: "Swiggy", pct: 38, rev: "₹10,792", orders: 54, color: "#FF6B35" },
    { name: "Zomato", pct: 24, rev: "₹6,816", orders: 34, color: "#E8344E" },
    { name: "Walk-in", pct: 21, rev: "₹5,964", orders: 30, color: C.green },
    { name: "Delivery", pct: 17, rev: "₹4,828", orders: 25, color: C.blue },
  ] : realChannels;
  const displayTopItems = isDemoMode ? [
    { name: "Cappuccino", sold: 58, rev: "₹6,960" },
    { name: "Avocado Toast", sold: 34, rev: "₹6,120" },
    { name: "Flat White", sold: 41, rev: "₹5,330" },
    { name: "Matcha Latte", sold: 29, rev: "₹4,640" },
    { name: "Cold Brew", sold: 26, rev: "₹3,900" },
  ] : realTopItems;

  // Math.max(...[]) is -Infinity, which would render every bar at a
  // negative height if a period ever has no data — guard against that.
  const maxVal = d && d.barVals.length ? Math.max(...d.barVals) : 1;

  const exportReport = useCallback((format) => {
    if (!d) return;
    // Exporting an empty, non-demo report (a real, connected account with
    // zero orders in this period) would produce a file that looks like a
    // legitimate report but is empty of any actual figures — bail out with
    // a clear signal instead of writing an empty/misleading file to disk.
    if (!isDemoMode && !periodOrders.length) {
      window.alert("No order data yet for this period — nothing to export.");
      return;
    }

    if (format === "json") {
      const data = {
        period,
        date: new Date().toISOString(),
        isDemoData: isDemoMode,
        metrics,
        barData: { labels: d.barLabels, values: d.barVals },
        channels: displayChannels,
        topItems: displayTopItems,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brewcrm-report-${period}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      let csv = csvRow("Report Type", isDemoMode ? "Demo Data" : "Live Data");
      csv += csvRow("Period", PERIOD_LABELS[period] || period);
      csv += csvRow("Generated", new Date().toISOString());
      csv += "\n" + csvRow("Metric", "Value");
      metrics.forEach(m => {
        csv += csvRow(m.lbl, m.val);
      });
      csv += "\n" + csvRow("Channel", "Percentage", "Revenue", "Orders");
      displayChannels.forEach(c => {
        csv += csvRow(c.name, `${c.pct}%`, c.rev, c.orders);
      });
      csv += "\n" + csvRow("Item", "Sold", "Revenue");
      displayTopItems.forEach(i => {
        csv += csvRow(i.name, i.sold, i.rev);
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brewcrm-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [d, period, metrics, displayChannels, displayTopItems, isDemoMode, periodOrders]);

  // Static demo data — memoized so the array identity is stable across
  // re-renders (matters since it's also used inside useMemo/useCallback deps
  // elsewhere in the component).
  const weekData = useMemo(() => [
    { day: "Mon", orders: 110, rev: 21400 },
    { day: "Tue", orders: 130, rev: 25800 },
    { day: "Wed", orders: 98, rev: 19200 },
    { day: "Thu", orders: 145, rev: 28900 },
    { day: "Fri", orders: 162, rev: 32400 },
    { day: "Sat", orders: 188, rev: 37600 },
    { day: "Sun", orders: 143, rev: 28400 },
  ], []);
  const maxRev = weekData.length ? Math.max(...weekData.map(w => w.rev)) : 1;
  const peakDay = weekData.length
    ? weekData.reduce((best, w) => (w.rev > best.rev ? w : best), weekData[0])
    : null;
  // "Today" is the most recent entry in the week strip rather than a
  // hardcoded day name, so the highlight stays correct if the data changes.
  const todayLabel = weekData.length ? weekData[weekData.length - 1].day : null;

  if (!d) {
    return (
      <div style={{ ...card(), padding: 24, textAlign: "center", color: C.text2, fontSize: 13 }}>
        No analytics data available for "{period}".
      </div>
    );
  }

  return (
    <div>
      {/* Period Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text1, letterSpacing: "-0.01em" }}>Analytics</div>
          <div style={{ fontSize: 11, color: C.text3 }}>Jun 1, 2026 · Main Branch</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div role="group" aria-label="Select time period" style={{ display: "flex", gap: 2, background: C.bg3, padding: 3, borderRadius: 8 }}>
            {["today","week","month"].map(p => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: period === p ? C.bg4 : "transparent", color: period === p ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: period === p ? 600 : 400, minHeight: 36, letterSpacing: period === p ? "-0.01em" : 0, transition: "all .15s" }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" aria-label="Export report as CSV" onClick={() => exportReport("csv")} style={{ ...btn("ghost"), fontSize: 11, padding: "7px 12px", minHeight: 36, gap: 5 }}>
              <span style={{ opacity: 0.7 }}>↓</span> CSV
            </button>
            <button type="button" aria-label="Export report as JSON" onClick={() => exportReport("json")} style={{ ...btn("ghost"), fontSize: 11, padding: "7px 12px", minHeight: 36, gap: 5 }}>
              <span style={{ opacity: 0.7 }}>↓</span> JSON
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 18 }}>
        {metrics.map(m => (
          <div key={m.lbl} style={{ ...card(), padding: "14px 16px", borderLeft: `3px solid ${m.up ? C.amber : C.red}`, position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, marginBottom: 6 }}>{m.lbl}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: C.text1, lineHeight: 1, marginBottom: 8 }}>{m.val}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "monospace", color: m.up ? C.green : C.red, background: m.up ? `${C.green}18` : `${C.red}18`, borderRadius: 4, padding: "1px 5px" }}>{m.change}</span>
              <span style={{ fontSize: 10, color: C.text3 }}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 14 }}>
        {/* Bar Chart (period-aware) */}
        <div style={card()}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3, marginBottom: 2 }}>{d.barCaption}</div>
              <div style={{ fontSize: 11, color: C.amber2, fontFamily: "monospace" }}>{d.barPeak}</div>
            </div>
          </div>
          <div role="img" aria-label={`${d.barCaption}: ${d.barLabels.map((l, i) => `${l} ${d.barVals[i]}`).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", gap: period === "month" ? 2 : 5, height: 110, overflowX: period === "month" ? "auto" : "visible" }}>
            {d.barVals.map((v, i) => {
              const height = Math.round((v / maxVal) * 100);
              const isPeak = v === maxVal;
              const ratio = v / maxVal;
              const barBg = isPeak
                ? `linear-gradient(180deg, ${C.amber} 0%, ${C.amber3} 100%)`
                : ratio > 0.65
                  ? `linear-gradient(180deg, ${C.amber3} 0%, ${C.bg4} 100%)`
                  : C.bg4;
              return (
                <div key={i} title={`${d.barLabels[i]}: ${v}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4, minWidth: period === "month" ? 18 : "auto" }}>
                  <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                    {isPeak && <div style={{ position: "absolute", top: -18, fontSize: 9, color: C.amber2, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 700 }}>{v}</div>}
                    <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: barBg, height, minHeight: 4, transition: "height .35s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  {period !== "month" && <div style={{ fontSize: 9, color: isPeak ? C.amber2 : C.text3, fontFamily: "monospace", fontWeight: isPeak ? 600 : 400 }}>{d.barLabels[i]}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Revenue */}
        <div style={card()}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3, marginBottom: 2 }}>Weekly Revenue</div>
              {peakDay && <div style={{ fontSize: 11, color: C.green, fontFamily: "monospace" }}>↑ {peakDay.day} · ₹{peakDay.rev.toLocaleString("en-IN")}</div>}
            </div>
          </div>
          <div role="img" aria-label={`Weekly revenue: ${weekData.map(w => `${w.day} ₹${w.rev}`).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110 }}>
            {weekData.map((day) => {
              const height = Math.round((day.rev / maxRev) * 100);
              const isToday = day.day === todayLabel;
              const isPeak = peakDay && day.day === peakDay.day;
              const barBg = isToday
                ? `linear-gradient(180deg, ${C.amber} 0%, ${C.amber3} 100%)`
                : isPeak
                  ? `linear-gradient(180deg, ${C.green} 0%, ${C.greenBg} 100%)`
                  : day.rev > 30000 ? C.greenBg : C.bg4;
              return (
                <div key={day.day} title={`${day.day}: ₹${day.rev.toLocaleString("en-IN")} · ${day.orders} orders`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: barBg, border: isToday ? `1px solid ${C.amber3}` : isPeak ? `1px solid ${C.greenBorder}` : "none", height, minHeight: 4, transition: "height .35s cubic-bezier(.4,0,.2,1)" }} />
                  <div style={{ fontSize: 9, color: isToday ? C.amber2 : isPeak ? C.green : C.text3, fontFamily: "monospace", fontWeight: isToday || isPeak ? 700 : 400 }}>{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {/* Channel Breakdown */}
        <div style={card()}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3, marginBottom: 16 }}>Channel Breakdown</div>
          {displayChannels.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: C.text3, fontSize: 12 }}>
              No orders yet for {PERIOD_LABELS[period].toLowerCase()}.
            </div>
          ) : displayChannels.map((c, idx) => (
            <div key={c.name} title={`${c.name}: ${c.pct}% · ${c.orders} orders · ${c.rev}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: idx < displayChannels.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
              <div style={{ fontSize: 12, fontWeight: 600, width: 76, color: C.text1 }}>{c.name}</div>
              <div role="progressbar" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} share`} style={{ flex: 1, height: 4, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: c.color, width: c.pct + "%", transition: "width .55s cubic-bezier(.4,0,.2,1)", opacity: 0.85 }} />
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.text3, width: 26 }}>{c.pct}%</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.text2, width: 34, textAlign: "right" }}>{c.orders} <span style={{ color: C.text3, fontSize: 9 }}>ord</span></div>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: C.amber2, width: 72, textAlign: "right" }}>{c.rev}</div>
            </div>
          ))}
        </div>

        {/* Top Items */}
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.text3 }}>Top Items</div>
            <div style={{ fontSize: 10, color: C.text3, background: C.bg3, borderRadius: 4, padding: "2px 7px" }}>{PERIOD_LABELS[period]}</div>
          </div>
          {displayTopItems.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: C.text3, fontSize: 12 }}>
              No items sold yet for {PERIOD_LABELS[period].toLowerCase()}.
            </div>
          ) : displayTopItems.map((item, i) => (
            <div key={item.name} title={`${item.name}: ${item.sold} sold · ${item.rev}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < displayTopItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: i === 0 ? `${C.amber}22` : C.bg4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: i === 0 ? C.amber2 : C.text3, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{item.sold} sold</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.amber2, flexShrink: 0 }}>{item.rev}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
