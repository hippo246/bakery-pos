import { useState, useEffect } from "react";
import { C, pill } from "../../styles/theme";

function ElapsedTimer({ startedAt, urgency }) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000));
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const color = urgency === "urgent" ? C.red : urgency === "soon" ? C.amber : C.green;
  const bg = urgency === "urgent" ? "#2a1010" : urgency === "soon" ? "#2a1a08" : "#102010";
  return (
    <span style={{ ...pill(bg, color), fontSize: 12, padding: "4px 10px", minWidth: 52, justifyContent: "center" }}>
      {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default ElapsedTimer;
