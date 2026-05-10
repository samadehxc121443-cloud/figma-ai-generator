import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#06060f", color:"#fff", flexDirection:"column", gap:"16px" }}>
        <div style={{ fontSize:"48px" }}>⚠️</div>
        <div style={{ fontSize:"18px", fontWeight:600 }}>Algo salió mal</div>
        <button onClick={() => window.location.reload()} style={{ padding:"10px 20px", background:"#7C6AF7", border:"none", borderRadius:"8px", color:"#fff", cursor:"pointer" }}>Recargar</button>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
