import { useState, useMemo, useCallback, useEffect } from "react";
import { C, card, btn } from "../../styles/theme";
import { ANALYTICS_DATA } from "../../data/constants";
import { getOrderAmount, getOrderDisplayItems } from "../../domain/orderModel.js";

// CSV fields can legitimately contain commas (e.g. "₹10,792"), so every
// field must be quote-wrapped and internal quotes escaped per RFC 4180.
const csvField = (val) => `"${String(val).replace(/"/g, '""')}"`;
const csvRow = (...fields) => fields.map(csvField).join(",") + "\n";

const PERIOD_LABELS = { today: "Today", week: "This Week", month: "This Month" };

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
  const orders = externalOrders || [];
  const customers = externalCustomers || [];

  // Calculate real metrics from actual orders.
  // NOTE: we only have a single snapshot of `orders` — there's no prior-period
  // dataset to diff against — so period-over-period change can't be computed
  // honestly here. Rather than fabricate a percentage (the previous behavior),
  // we surface "—" for change/sub on the metrics that would need a baseline,
  // and keep real change figures only where we can derive them from this
  // dataset alone (e.g. completion rate, which doesn't need a prior period).
  const realMetrics = useMemo(() => {
    if (isDemoMode) return d.metrics;

    const completedOrders = orders.filter(o => o.status === "COMPLETED" || o.status === "READY");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    const avgOrderValue = completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0;
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status)).length;
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;
    const completionRate = totalOrders ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

    return [
      { lbl: "Revenue", val: "₹" + totalRevenue.toLocaleString(), change: "—", sub: "no prior period", up: true },
      { lbl: "Orders", val: totalOrders, change: "—", sub: "no prior period", up: true },
      { lbl: "Avg Order", val: "₹" + avgOrderValue, change: "—", sub: "no prior period", up: true },
      { lbl: "Active", val: activeOrders, change: cancelledOrders ? `${cancelledOrders} cancelled` : "0 cancelled", sub: "currently", up: activeOrders >= cancelledOrders },
      { lbl: "Customers", val: customers.length, change: "—", sub: "total", up: true },
      { lbl: "Completion", val: completionRate + "%", change: "—", sub: "of all orders", up: completionRate >= 50 },
    ];
  }, [orders, customers, d.metrics, isDemoMode]);

  // Calculate real channel breakdown from orders.
  // Empty orders -> [] here; the demo/empty-state choice happens once,
  // below, via isDemoMode — this hook never invents numbers.
  const realChannels = useMemo(() => {
    if (!orders.length) return [];

    const sourceCounts = {};
    const sourceRevenue = {};
    orders.forEach(o => {
      sourceCounts[o.source] = (sourceCounts[o.source] || 0) + 1;
      sourceRevenue[o.source] = (sourceRevenue[o.source] || 0) + getOrderAmount(o);
    });
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    
    const channelMap = {
      "SWIGGY": { name: "Swiggy", color: "#FF6B35" },
      "ZOMATO": { name: "Zomato", color: "#E8344E" },
      "WALK_IN": { name: "Walk-in", color: C.green },
      "DIRECT_DELIVERY": { name: "Delivery", color: C.blue },
    };
    
    return Object.keys(channelMap)
      .filter(source => sourceCounts[source] > 0)
      .map(source => ({
        name: channelMap[source].name,
        pct: totalOrders ? Math.round((sourceCounts[source] / totalOrders) * 100) : 0,
        rev: "₹" + (sourceRevenue[source] || 0).toLocaleString(),
        orders: sourceCounts[source] || 0,
        color: channelMap[source].color,
      }))
      .sort((a, b) => b.orders - a.orders);
  }, [orders]);

  // Calculate real top items from orders (use normalized items array).
  // Returns [] when there are no orders, rather than fabricated demo items.
  const realTopItems = useMemo(() => {
    if (!orders.length) return [];

    const itemCounts = {};
    const itemRevenue = {};
    
    orders.forEach(o => {
      // Use normalized items array if available
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const name = item.name;
          const qty = item.qty || 1;
          const price = item.price || 0;
          itemCounts[name] = (itemCounts[name] || 0) + qty;
          itemRevenue[name] = (itemRevenue[name] || 0) + (price * qty);
        });
      } else {
        // Fallback to parsing string format for backward compatibility
        const items = getOrderDisplayItems(o);
        const itemStrs = items.split(',').map(item => item.trim());
        itemStrs.forEach(item => {
          const match = item.match(/(.+?)\s*×\s*(\d+)/);
          if (match) {
            const name = match[1].trim();
            const qty = parseInt(match[2], 10);
            itemCounts[name] = (itemCounts[name] || 0) + qty;
            // Estimate price at 120 for backward compatibility
            itemRevenue[name] = (itemRevenue[name] || 0) + (qty * 120);
          }
        });
      }
    });
    
    return Object.entries(itemCounts)
      .map(([name, sold]) => ({
        name,
        sold,
        rev: "₹" + (itemRevenue[name] || 0).toLocaleString(),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orders]);

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
    // zero orders) would produce a file that looks like a legitimate report
    // but is empty of any actual figures — bail out with a clear signal
    // instead of writing an empty/misleading file to disk.
    if (!isDemoMode && !orders.length) {
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
  }, [d, period, metrics, displayChannels, displayTopItems, isDemoMode, orders.length]);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 16, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
        <div style={{ fontSize: 12, color: C.text2 }}>Jun 1, 2026 · Main Branch</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div role="group" aria-label="Select time period" style={{ display: "flex", gap: 4, background: C.bg3, padding: 3, borderRadius: 8 }}>
            {["today","week","month"].map(p => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                style={{ padding: "10px 14px", borderRadius: 6, border: "none", background: period === p ? C.bg4 : "transparent", color: period === p ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: period === p ? 600 : 400, minHeight: 44 }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" aria-label="Export report as CSV" onClick={() => exportReport("csv")} style={{ ...btn("ghost"), fontSize: 12, padding: "10px 14px", minHeight: 44 }}>📄 CSV</button>
            <button type="button" aria-label="Export report as JSON" onClick={() => exportReport("json")} style={{ ...btn("ghost"), fontSize: 12, padding: "10px 14px", minHeight: 44 }}>{`{ }`} JSON</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 16 }}>
        {metrics.map(m => (
          <div key={m.lbl} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text2, marginTop: 3 }}>{m.lbl}</div>
            <div style={{ fontSize: 11, marginTop: 5, fontFamily: "monospace", color: m.up ? C.green : C.red }}>
              {m.change} <span style={{ color: C.text3, fontSize: 10 }}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 14 }}>
        {/* Bar Chart (period-aware) */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>{d.barCaption}</span>
            <span style={{ fontSize: 11, color: C.text3 }}>{d.barPeak}</span>
          </div>
          <div role="img" aria-label={`${d.barCaption}: ${d.barLabels.map((l, i) => `${l} ${d.barVals[i]}`).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", gap: period === "month" ? 2 : 5, height: 110, overflowX: period === "month" ? "auto" : "visible" }}>
            {d.barVals.map((v, i) => {
              const height = Math.round((v / maxVal) * 100);
              const isPeak = v === maxVal;
              return (
                <div key={i} title={`${d.barLabels[i]}: ${v}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4, minWidth: period === "month" ? 18 : "auto" }}>
                  <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                    {isPeak && <div style={{ position: "absolute", top: -18, fontSize: 9, color: C.amber2, fontFamily: "monospace", whiteSpace: "nowrap" }}>{v}</div>}
                    <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: isPeak ? C.amber : v > maxVal * 0.65 ? C.amber3 : C.bg4, height, minHeight: 4, transition: "height .3s" }} />
                  </div>
                  {period !== "month" && <div style={{ fontSize: 9, color: C.text3, fontFamily: "monospace" }}>{d.barLabels[i]}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Revenue */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>Weekly Revenue</span>
            {peakDay && <span style={{ fontSize: 11, color: C.green }}>↑ {peakDay.day} peak</span>}
          </div>
          <div role="img" aria-label={`Weekly revenue: ${weekData.map(w => `${w.day} ₹${w.rev}`).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110 }}>
            {weekData.map((day) => {
              const height = Math.round((day.rev / maxRev) * 100);
              const isToday = day.day === todayLabel;
              return (
                <div key={day.day} title={`${day.day}: ₹${day.rev.toLocaleString("en-IN")} · ${day.orders} orders`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: isToday ? C.amber : day.rev > 30000 ? C.greenBg : C.bg4, border: isToday ? `1px solid ${C.amber3}` : day.rev > 30000 ? `1px solid ${C.greenBorder}` : "none", height, minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: isToday ? C.amber2 : C.text3, fontFamily: "monospace", fontWeight: isToday ? 700 : 400 }}>{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        {/* Channel Breakdown */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Channel Breakdown</div>
          {displayChannels.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: C.text3, fontSize: 12 }}>
              No orders yet for {PERIOD_LABELS[period].toLowerCase()}.
            </div>
          ) : displayChannels.map(c => (
            <div key={c.name} title={`${c.name}: ${c.pct}% · ${c.orders} orders · ${c.rev}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 500, width: 80 }}>{c.name}</div>
              <div role="progressbar" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name} share`} style={{ flex: 1, height: 5, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: c.color, width: c.pct + "%", transition: "width .5s" }} />
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text2, width: 28 }}>{c.pct}%</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text2, width: 36, textAlign: "right" }}>{c.orders}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber2, width: 72, textAlign: "right" }}>{c.rev}</div>
            </div>
          ))}
        </div>

        {/* Top Items */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Top Items · {PERIOD_LABELS[period]}</div>
          {displayTopItems.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: C.text3, fontSize: 12 }}>
              No items sold yet for {PERIOD_LABELS[period].toLowerCase()}.
            </div>
          ) : displayTopItems.map((item, i) => (
            <div key={item.name} title={`${item.name}: ${item.sold} sold · ${item.rev}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < displayTopItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: C.bg4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.text3, fontFamily: "monospace", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{item.sold} sold</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber2 }}>{item.rev}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
