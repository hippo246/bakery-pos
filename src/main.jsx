import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("main.jsx loaded", document.getElementById('root'));

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="color: white; padding: 20px;">Error: Root element not found</div>';
  } else {
    console.log("Creating root...");
    const root = createRoot(rootElement);
    console.log("Rendering app...");
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log("App rendered");
  }
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `<div style="color: white; padding: 20px;">Error: ${error.message}</div>`;
}
