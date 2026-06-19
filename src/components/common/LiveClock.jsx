import { useState, useEffect } from "react";
import { C } from "../../styles/theme";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = String(h % 12 || 12).padStart(2,"0");
  const mm = String(m).padStart(2,"0");
  const ss = String(s).padStart(2,"0");
  return (
    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text3, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
      <span style={{ color: C.text2, fontSize: 12, fontWeight: 600 }}>{hh}:{mm}:<span style={{ color: C.text3 }}>{ss}</span> {ampm}</span>
      <span>{days[now.getDay()]}, {months[now.getMonth()]} {now.getDate()} {now.getFullYear()}</span>
    </div>
  );
}

export default LiveClock;
