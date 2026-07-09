import { useState, useEffect, useRef } from "react";
import { C, pill } from "../../styles/theme";

// Safely converts startedAt to elapsed seconds. Never returns NaN or negative values.
function getSafeElapsedSeconds(startedAt) {
  let ts;
  if (startedAt instanceof Date) {
    ts = startedAt.getTime();
  } else if (typeof startedAt === "string") {
    ts = new Date(startedAt).getTime();
  } else if (typeof startedAt === "number") {
    ts = startedAt;
  } else {
    ts = NaN;
  }

  if (!Number.isFinite(ts) || ts <= 0) {
    if (process.env.NODE_ENV !== "production" && startedAt != null) {
      // eslint-disable-next-line no-console
      console.warn("ElapsedTimer: invalid startedAt value", startedAt);
    }
    return 0;
  }

  const diffSeconds = Math.floor((Date.now() - ts) / 1000);
  // Clamp: negative (future startedAt) becomes 0, never NaN.
  return Number.isFinite(diffSeconds) && diffSeconds > 0 ? diffSeconds : 0;
}

// Formats seconds as m:ss (under 1hr) or h:mm:ss (1hr+), safely.
function formatElapsed(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function ElapsedTimer({ startedAt, urgency }) {
  const [elapsed, setElapsed] = useState(() => getSafeElapsedSeconds(startedAt));
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;

  useEffect(() => {
    // Recompute immediately when startedAt changes.
    setElapsed(getSafeElapsedSeconds(startedAt));
    const id = setInterval(() => {
      const next = getSafeElapsedSeconds(startedAt);
      if (next !== elapsedRef.current) {
        setElapsed(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const safeUrgency = urgency === "urgent" || urgency === "soon" ? urgency : "ok";
  const color = safeUrgency === "urgent" ? C.red : safeUrgency === "soon" ? C.amber : C.green;
  const bg = safeUrgency === "urgent" ? C.redBg : safeUrgency === "soon" ? C.amberBg : C.greenBg;

  const display = formatElapsed(elapsed);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = `Elapsed time: ${mins} minute${mins === 1 ? "" : "s"} ${secs} second${secs === 1 ? "" : "s"}`;

  return (
    <span
      title={label}
      aria-label={label}
      style={{
        ...pill(bg, color),
        fontSize: 11,
        padding: "3px 8px",
        minWidth: 48,
        justifyContent: "center",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
        gap: 0,
      }}
    >
      {/* Split hh:mm from :ss so seconds are visually quieter */}
      {display.length > 4
        ? <><span style={{ fontWeight: 700 }}>{display.slice(0, -3)}</span><span style={{ opacity: 0.6, fontWeight: 400 }}>{display.slice(-3)}</span></>
        : <span style={{ fontWeight: 700 }}>{display}</span>
      }
    </span>
  );
}

export default ElapsedTimer;
