export default function App() {
  console.log("App component rendering");
  return (
    <div style={{ padding: 20, color: "#fff", background: "#000", minHeight: "100vh", fontSize: "24px" }}>
      <h1>BrewCRM Test</h1>
      <p>If you can see this, React is working.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <p style={{ color: "red", fontSize: "32px" }}>LARGE TEST TEXT</p>
    </div>
  );
}
