import { useState } from "react";
import { C, input, btn, label } from "../../styles/theme";

function LogVisit({ profile, addVisitEntry }) {
  const [logItems, setLogItems] = useState(profile.fav !== "—" ? profile.fav : "");
  const [logAmt, setLogAmt] = useState("");
  return (
    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: `1px solid ${C.border2}` }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Log New Visit</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...input, fontSize: 12, padding: "6px 9px", flex: 2 }} value={logItems} onChange={e => setLogItems(e.target.value)} placeholder="Items ordered…" />
        <input style={{ ...input, fontSize: 12, padding: "6px 9px", flex: 1 }} type="number" value={logAmt} onChange={e => setLogAmt(e.target.value)} placeholder="₹ amount" />
        <button style={{ ...btn("primary"), fontSize: 11, whiteSpace: "nowrap" }} onClick={() => { if (!logItems || !logAmt) return; addVisitEntry(profile.id, logItems, logAmt); setLogAmt(""); }}>+ Log</button>
      </div>
    </div>
  );
}

export default LogVisit;
