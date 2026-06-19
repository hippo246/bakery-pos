import { useState } from "react";
import { C, card, btn } from "../../styles/theme";
import { ANALYTICS_DATA } from "../../data/constants";

function Analytics() {
  const [period, setPeriod] = useState("today");
  const d = ANALYTICS_DATA[period];
  const maxVal = Math.max(...d.barVals);

  const exportReport = (format) => {
    const data = {
      period,
      date: new Date().toISOString(),
      metrics: d.metrics,
      barData: { labels: d.barLabels, values: d.barVals },
      channels: [
        { name: "Swiggy", pct: 38, rev: "₹10,792", orders: 54, color: "#FF6B35" },
        { name: "Zomato", pct: 24, rev: "₹6,816", orders: 34, color: "#E8344E" },
        { name: "Walk-in", pct: 21, rev: "₹5,964", orders: 30, color: C.green },
        { name: "Delivery", pct: 17, rev: "₹4,828", orders: 25, color: C.blue },
      ],
      topItems: [
        { name: "Cappuccino", sold: 58, rev: "₹6,960", trend: "+12%" },
        { name: "Avocado Toast", sold: 34, rev: "₹6,120", trend: "+8%" },
        { name: "Flat White", sold: 41, rev: "₹5,330", trend: "+5%" },
        { name: "Matcha Latte", sold: 29, rev: "₹4,640", trend: "-3%" },
        { name: "Cold Brew", sold: 26, rev: "₹3,900", trend: "+15%" },
      ],
    };

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brewcrm-report-${period}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "csv") {
      let csv = "Metric,Value\n";
      d.metrics.forEach(m => {
        csv += `${m.lbl.replace(/,/g, "")},${m.val}\n`;
      });
      csv += "\nChannel,Percentage,Revenue,Orders\n";
      data.channels.forEach(c => {
        csv += `${c.name},${c.pct}%,${c.rev},${c.orders}\n`;
      });
      csv += "\nItem,Sold,Revenue,Trend\n";
      data.topItems.forEach(i => {
        csv += `${i.name},${i.sold},${i.rev},${i.trend}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brewcrm-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const weekData = [
    { day: "Mon", orders: 110, rev: 21400 },
    { day: "Tue", orders: 130, rev: 25800 },
    { day: "Wed", orders: 98, rev: 19200 },
    { day: "Thu", orders: 145, rev: 28900 },
    { day: "Fri", orders: 162, rev: 32400 },
    { day: "Sat", orders: 188, rev: 37600 },
    { day: "Sun", orders: 143, rev: 28400 },
  ];
  const maxRev = Math.max(...weekData.map(d => d.rev));

  const channels = [
    { name: "Swiggy", pct: 38, rev: "₹10,792", orders: 54, color: "#FF6B35" },
    { name: "Zomato", pct: 24, rev: "₹6,816", orders: 34, color: "#E8344E" },
    { name: "Walk-in", pct: 21, rev: "₹5,964", orders: 30, color: C.green },
    { name: "Delivery", pct: 17, rev: "₹4,828", orders: 25, color: C.blue },
  ];

  const topItems = [
    { name: "Cappuccino", sold: 58, rev: "₹6,960", trend: "+12%" },
    { name: "Avocado Toast", sold: 34, rev: "₹6,120", trend: "+8%" },
    { name: "Flat White", sold: 41, rev: "₹5,330", trend: "+5%" },
    { name: "Matcha Latte", sold: 29, rev: "₹4,640", trend: "-3%" },
    { name: "Cold Brew", sold: 26, rev: "₹3,900", trend: "+15%" },
  ];

  return (
    <div>
      {/* Period Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.text2 }}>Jun 1, 2026 · Main Branch</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, background: C.bg3, padding: 3, borderRadius: 8 }}>
            {["today","week","month"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: period === p ? C.bg4 : "transparent", color: period === p ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: period === p ? 600 : 400 }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => exportReport("csv")} style={{ ...btn("ghost"), fontSize: 11, padding: "5px 10px" }}>📄 CSV</button>
            <button onClick={() => exportReport("json")} style={{ ...btn("ghost"), fontSize: 11, padding: "5px 10px" }}>{`{ }`} JSON</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 16 }}>
        {d.metrics.map(m => (
          <div key={m.lbl} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text2, marginTop: 3 }}>{m.lbl}</div>
            <div style={{ fontSize: 11, marginTop: 5, fontFamily: "monospace", color: m.up ? C.green : C.red }}>
              {m.change} <span style={{ color: C.text3, fontSize: 10 }}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Bar Chart (period-aware) */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>{d.barCaption}</span>
            <span style={{ fontSize: 11, color: C.text3 }}>{d.barPeak}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: period === "month" ? 2 : 5, height: 110, overflowX: period === "month" ? "auto" : "visible" }}>
            {d.barVals.map((v, i) => {
              const height = Math.round((v / maxVal) * 100);
              const isPeak = v === maxVal;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4, minWidth: period === "month" ? 18 : "auto" }}>
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
            <span style={{ fontSize: 11, color: C.green }}>↑ Sat peak</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110 }}>
            {weekData.map((d) => {
              const height = Math.round((d.rev / maxRev) * 100);
              const isToday = d.day === "Sun";
              return (
                <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: isToday ? C.amber : d.rev > 30000 ? "#4CAF7240" : C.bg4, border: isToday ? `1px solid ${C.amber3}` : "none", height, minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: isToday ? C.amber2 : C.text3, fontFamily: "monospace", fontWeight: isToday ? 700 : 400 }}>{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Channel Breakdown */}
        <div style={card()}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Channel Breakdown</div>
          {channels.map(c => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 500, width: 80 }}>{c.name}</div>
              <div style={{ flex: 1, height: 5, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
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
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Top Items Today</div>
          {topItems.map((item, i) => (
            <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < topItems.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: C.bg4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.text3, fontFamily: "monospace", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{item.sold} sold</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber2 }}>{item.rev}</div>
                <div style={{ fontSize: 10, color: item.trend.startsWith("+") ? C.green : C.red, fontFamily: "monospace" }}>{item.trend}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
