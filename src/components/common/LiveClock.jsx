import { useState, useEffect, useRef } from "react";
import { C } from "../../styles/theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FALLBACK_TIME = "--:--:--";

function getSafeNow() {
  try {
    const d = new Date();
    return Number.isFinite(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

function ElapsedDisplay(now) {
  if (!now) {
    return { hh: "--", mm: "--", ss: "--", ampm: "", dayStr: "", monthStr: "", date: "", year: "", timeText: FALLBACK_TIME, fullLabel: "Current time: unavailable" };
  }
  try {
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = String(h % 12 || 12).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    const dayStr = DAYS[now.getDay()] ?? "";
    const monthStr = MONTHS[now.getMonth()] ?? "";
    const date = now.getDate();
    const year = now.getFullYear();
    const timeText = `${hh}:${mm}:${ss}`;
    const fullLabel = `Current time: ${hh}:${mm}:${ss} ${ampm}, ${dayStr} ${monthStr} ${date} ${year}`;
    return { hh, mm, ss, ampm, dayStr, monthStr, date, year, timeText, fullLabel };
  } catch {
    return { hh: "--", mm: "--", ss: "--", ampm: "", dayStr: "", monthStr: "", date: "", year: "", timeText: FALLBACK_TIME, fullLabel: "Current time: unavailable" };
  }
}

function LiveClock() {
  const [now, setNow] = useState(() => getSafeNow());
  const lastSecondRef = useRef(now ? now.getSeconds() : null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const id = setInterval(() => {
      const next = getSafeNow();
      const nextSecond = next ? next.getSeconds() : null;
      if (nextSecond !== lastSecondRef.current) {
        lastSecondRef.current = nextSecond;
        setNow(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const { hh, mm, ss, ampm, dayStr, monthStr, date, year, fullLabel } = ElapsedDisplay(now);

  return (
    <div
      title={fullLabel}
      aria-label={fullLabel}
      style={{ fontSize: 11, color: C.text3, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}
    >
      <span style={{ display: "flex", alignItems: "baseline", gap: 1, letterSpacing: "-0.01em" }}>
        <span style={{ color: C.text, fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{hh}:{mm}</span>
        <span style={{ color: C.text3, fontSize: 10, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>:{ss}</span>
        <span style={{ color: C.text3, fontSize: 9.5, fontWeight: 500, marginLeft: 2 }}>{ampm}</span>
      </span>
      <span style={{ fontSize: 9.5, letterSpacing: "0.02em", color: C.text3 }}>{dayStr}{dayStr ? " · " : ""}{monthStr} {date}</span>
    </div>
  );
}

export default LiveClock;
