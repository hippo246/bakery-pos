import { useState } from "react";
import { C, input, btn, label } from "../../styles/theme";

function LogVisit({ profile, addVisitEntry }) {
  const [logItems, setLogItems] = useState(profile.fav !== "—" ? profile.fav : "");
  const [logAmt, setLogAmt] = useState("");
  const [error, setError] = useState("");

  const isValid = logItems.trim() !== "" && Number(logAmt) > 0;

  const submit = () => {
    if (!isValid) {
      setError(logItems.trim() === "" ? "Enter the items ordered" : "Enter a valid amount");
      return;
    }
    addVisitEntry(profile.id, logItems.trim(), Number(logAmt));
    setLogItems("");
    setLogAmt("");
    setError("");
  };

  const onKeyDown = e => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: `1px solid ${error ? C.redBorder : C.border2}` }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Log New Visit</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          style={{ ...input, fontSize: 12, padding: "6px 9px", flex: 2 }}
          value={logItems}
          onChange={e => { setLogItems(e.target.value); if (error) setError(""); }}
          onKeyDown={onKeyDown}
          placeholder="Items ordered…"
        />
        <input
          style={{ ...input, fontSize: 12, padding: "6px 9px", flex: 1 }}
          type="number"
          min="0"
          step="0.01"
          value={logAmt}
          onChange={e => { setLogAmt(e.target.value); if (error) setError(""); }}
          onKeyDown={onKeyDown}
          placeholder="₹ amount"
        />
        <button
          style={{ ...btn("primary"), fontSize: 11, whiteSpace: "nowrap", opacity: isValid ? 1 : 0.6, cursor: isValid ? "pointer" : "not-allowed" }}
          onClick={submit}
        >
          + Log
        </button>
      </div>
      {error && <div style={{ fontSize: 10, color: C.warning, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export default LogVisit;
