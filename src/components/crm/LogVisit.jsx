import React from 'react';
import { useState, useEffect, useRef } from "react";
import { C, input, btn, label } from "../../styles/theme";

const MAX_ITEMS_LEN = 300;
const MAX_AMOUNT    = 100000;

// Returns true if string has at least one alphanumeric character
const hasAlphanumeric = (s) => /[a-zA-Z0-9\u0900-\u097F]/.test(s);

function LogVisit({ profile, addVisitEntry }) {
  // Safe defaults if profile is missing/malformed
  const profileId  = profile?.id   ?? null;
  const profileFav = typeof profile?.fav === "string" && profile.fav !== "—" && profile.fav.trim() ? profile.fav.trim() : "";

  const [logItems,    setLogItems]    = useState(profileFav);
  const [logAmt,      setLogAmt]      = useState("");
  const [error,       setError]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const composingRef  = useRef(false);   // IME composition guard
  const prevFavRef    = useRef(profileFav);

  // If the profile's favourite changes (e.g. parent selects a different customer)
  // and the items field still holds the OLD favourite (user hasn't typed anything custom),
  // update it to the new favourite. If the user has edited the field, leave it alone.
  useEffect(() => {
    setLogItems(prev => {
      if (prev === prevFavRef.current) {
        prevFavRef.current = profileFav;
        return profileFav;
      }
      prevFavRef.current = profileFav;
      return prev;
    });
    setLogAmt("");
    setError("");
  }, [profile?.id]); // re-run when customer changes, not on every render

  if (!profile || !profileId) {
    return (
      <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: `1px solid ${C.border2}`, opacity: 0.5, fontSize: 12, color: C.text3 }}>
        Log New Visit — no customer selected
      </div>
    );
  }

  // ── Validation ───────────────────────────────────────────────
  const itemsTrimmed = logItems.trim().slice(0, MAX_ITEMS_LEN);
  const itemsValid   = itemsTrimmed.length > 0 && hasAlphanumeric(itemsTrimmed);
  const amtNum       = parseFloat(logAmt);
  const amtValid     = isFinite(amtNum) && amtNum > 0 && amtNum <= MAX_AMOUNT;
  const isValid      = itemsValid && amtValid && !submitting;

  // ── Submit ───────────────────────────────────────────────────
  const submit = async () => {
    if (submitting) return;

    // Validate and surface specific error
    if (!itemsValid) {
      setError(logItems.trim() === "" ? "Enter the items ordered" : "Items must contain at least one letter or digit (max 300 chars)");
      return;
    }
    if (!amtValid) {
      if (logAmt === "" || logAmt == null) { setError("Enter a valid amount"); return; }
      if (!isFinite(amtNum) || isNaN(amtNum)) { setError("Amount must be a valid number"); return; }
      if (amtNum <= 0)        { setError("Amount must be greater than 0"); return; }
      if (amtNum > MAX_AMOUNT) { setError(`Amount cannot exceed ₹${MAX_AMOUNT.toLocaleString()}`); return; }
      setError("Enter a valid amount");
      return;
    }
    if (typeof addVisitEntry !== "function") {
      setError("Cannot save visit — please refresh and try again");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const roundedAmt = Math.round(amtNum * 100) / 100;
      addVisitEntry(profileId, itemsTrimmed, roundedAmt);
      // Clear amount; keep favourite pre-fill in items, or clear if user had typed custom
      setLogAmt("");
      setLogItems(profileFav); // reset to favourite (or empty) after submit
      prevFavRef.current = profileFav;
    } catch (err) {
      setError("Could not save visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Keyboard handlers ────────────────────────────────────────
  const onKeyDown = (e) => {
    if (e.key === "Escape") { setError(""); return; }
    if (e.key === "Enter" && !composingRef.current) { submit(); }
  };

  const onCompositionStart = () => { composingRef.current = true; };
  const onCompositionEnd   = () => { composingRef.current = false; };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16, border: `1px solid ${error ? C.redBorder : C.border2}` }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>Log New Visit</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input
          style={{ ...input, fontSize: 12, padding: "6px 9px", flex: "2 1 120px", minWidth: 0 }}
          value={logItems}
          maxLength={MAX_ITEMS_LEN}
          onChange={e => { setLogItems(e.target.value); if (error) setError(""); }}
          onKeyDown={onKeyDown}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder="Items ordered…"
          disabled={submitting}
        />
        <input
          style={{ ...input, fontSize: 12, padding: "6px 9px", flex: "1 1 80px", minWidth: 0 }}
          type="number"
          inputMode="decimal"
          min="0.01"
          max={MAX_AMOUNT}
          step="0.01"
          value={logAmt}
          onChange={e => { setLogAmt(e.target.value); if (error) setError(""); }}
          onKeyDown={onKeyDown}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder="₹ amount"
          disabled={submitting}
        />
        <button
          style={{ ...btn("primary"), fontSize: 11, whiteSpace: "nowrap", opacity: isValid ? 1 : 0.6, cursor: isValid ? "pointer" : "not-allowed", flexShrink: 0, minHeight: 36 }}
          onClick={submit}
          disabled={!isValid}
          aria-disabled={!isValid}
        >
          {submitting ? "Saving…" : "+ Log"}
        </button>
      </div>
      {error && (
        <div style={{ fontSize: 10, color: C.warning, marginTop: 6, wordBreak: "break-word" }}>{error}</div>
      )}
    </div>
  );
}

export default LogVisit;
