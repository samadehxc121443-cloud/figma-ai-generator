import React, { useState, useRef, useEffect, useCallback } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://figma-ai-generator.onrender.com";

const TYPES = {
  presentation: { label: "Presentación", icon: "▣", color: "#7C6AF7", desc: "Slides profesionales para pitches y reuniones" },
  social: { label: "Redes Sociales", icon: "◈", color: "#EC4899", desc: "Posts, stories e infografías para redes" },
  flyer: { label: "Flyer / Afiche", icon: "◉", color: "#F59E0B", desc: "Promociones, eventos y anuncios" },
  logo: { label: "Logo / Branding", icon: "◆", color: "#10B981", desc: "Identidad visual y guías de marca" },
  banner: { label: "Banner Web", icon: "▬", color: "#06B6D4", desc: "Headers, banners y portadas digitales" },
  infographic: { label: "Infografía", icon: "◎", color: "#F76C8A", desc: "Datos y procesos visualizados" },
};

const SLIDE_COLORS = [
  { bg: "linear-gradient(135deg, #1a1040 0%, #2d1b69 100%)", accent: "#7C6AF7", text: "#E8E0FF" },
  { bg: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)", accent: "#06B6D4", text: "#E0F7FF" },
  { bg: "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)", accent: "#EC4899", text: "#FFE0F0" },
  { bg: "linear-gradient(135deg, #0d1117 0%, #161b22 100%)", accent: "#10B981", text: "#D1FAE5" },
  { bg: "linear-gradient(135deg, #1c0a00 0%, #3d1c02 100%)", accent: "#F59E0B", text: "#FEF3C7" },
  { bg: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", accent: "#F76C8A", text: "#FFE4E8" },
];

async function aiCall(messages, system) {
  const r = await fetch(`${BACKEND}/api/claude`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, max_tokens: 3000 }),
  });
  if (!r.ok) throw new Error(`Error ${r.status}`);
  const d = await r.json();
  return d.content[0].text;
}

function parseSlides(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  return JSON.parse(clean.slice(start, end + 1));
}

// ─── SLIDE PREVIEW ──────────────────────────────────────────────────────────
const SlidePreview = React.memo(({ slide, index, selected, onClick }) => {
  const scheme = SLIDE_COLORS[index % SLIDE_COLORS.length];
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
        transformStyle: "preserve-3d",
        transform: selected
          ? "scale(1.02) translateZ(8px)"
          : hov
          ? "rotateY(4deg) rotateX(3deg) translateZ(24px) scale(1.01)"
          : "rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)",
        boxShadow: selected
          ? `0 0 0 2px ${scheme.accent}, 0 20px 40px ${scheme.accent}30`
          : hov
          ? `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${scheme.accent}40, -8px 8px 24px ${scheme.accent}15`
          : `0 4px 16px rgba(0,0,0,0.3)`,
        animation: `fadeUp 0.5s ease ${index * 80}ms both`,
      }}
    >
      {/* Slide visual */}
      <div style={{
        aspectRatio: "16/9",
        background: scheme.bg,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `${scheme.accent}18`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: `${scheme.accent}10`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: hov ? "3px" : "2px", width: hov ? "100%" : "70%", background: `linear-gradient(90deg, ${scheme.accent}, ${scheme.accent}80, transparent)`, transition: "height 0.35s cubic-bezier(0.23, 1, 0.32, 1), width 0.35s cubic-bezier(0.23, 1, 0.32, 1)" }} />

        {/* Slide number + type */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${scheme.accent}25`, border: `1px solid ${scheme.accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: scheme.accent }}>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: `${scheme.text}60`, textTransform: "uppercase", letterSpacing: "1px" }}>{slide.type || "Slide"}</span>
          </div>
          {slide.tag && (
            <span style={{ padding: "3px 10px", background: `${scheme.accent}20`, border: `1px solid ${scheme.accent}40`, borderRadius: 20, fontSize: 10, color: scheme.accent, fontWeight: 700 }}>
              {slide.tag}
            </span>
          )}
        </div>

        {/* Main content */}
        <div style={{ zIndex: 1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 8, letterSpacing: "-0.5px", textShadow: `0 2px 20px ${scheme.accent}40` }}>
            {slide.title}
          </h3>
          {slide.subtitle && (
            <p style={{ fontSize: 11.5, color: `${scheme.text}80`, lineHeight: 1.6, marginBottom: 10 }}>{slide.subtitle}</p>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {slide.bullets.slice(0, 3).map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: scheme.accent, flexShrink: 0, marginTop: 5 }} />
                  <span style={{ fontSize: 10.5, color: `${scheme.text}70`, lineHeight: 1.5 }}>{b}</span>
                </div>
              ))}
              {slide.bullets.length > 3 && (
                <div style={{ opacity: 0.5, fontSize: "10px", marginTop: "2px" }}>
                  +{slide.bullets.length - 3} mas
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom accent bar */}
        {slide.metric && (
          <div style={{ zIndex: 1, padding: "8px 12px", background: `${scheme.accent}15`, border: `1px solid ${scheme.accent}30`, borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: scheme.accent }}>{slide.metric}</span>
            <span style={{ fontSize: 10.5, color: `${scheme.text}60` }}>{slide.metricLabel}</span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ background: "#111118", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{slide.title?.slice(0, 28)}{slide.title?.length > 28 ? "…" : ""}</span>
        {selected && <span style={{ fontSize: 10, color: scheme.accent, fontWeight: 700 }}>● Activa</span>}
      </div>
    </div>
  );
});

// ─── SKELETON ───────────────────────────────────────────────────────────────
function SlideSkeleton({ index }) {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", animation: `fadeUp 0.4s ease ${index * 60}ms both` }}>
      <div style={{ aspectRatio: "16/9", background: "rgba(255,255,255,0.04)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", animation: "shimmer 1.5s infinite" }} />
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ height: 10, width: "30%", background: "rgba(255,255,255,0.08)", borderRadius: 5 }} />
          <div style={{ height: 18, width: "70%", background: "rgba(255,255,255,0.1)", borderRadius: 6 }} />
          <div style={{ height: 10, width: "85%", background: "rgba(255,255,255,0.06)", borderRadius: 5 }} />
          <div style={{ height: 10, width: "60%", background: "rgba(255,255,255,0.06)", borderRadius: 5 }} />
        </div>
      </div>
      <div style={{ background: "#111118", padding: "10px 14px" }}>
        <div style={{ height: 10, width: "50%", background: "rgba(255,255,255,0.06)", borderRadius: 5 }} />
      </div>
    </div>
  );
}

// ─── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ t }) {
  if (!t) return null;
  const ok = t.type === "success";
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", padding: "11px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999, animation: "toastIn .2s ease", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", background: ok ? "rgba(16,185,129,.18)" : "rgba(239,68,68,.18)", border: `1px solid ${ok ? "rgba(16,185,129,.4)" : "rgba(239,68,68,.4)"}`, color: ok ? "#34D399" : "#FC8181", boxShadow: `0 8px 32px ${ok ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)"}` }}>
      {ok ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#34D399" strokeWidth="1.5"/><path d="M4.5 7l2 2 3-3" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#FC8181" strokeWidth="1.5"/><path d="M7 4.5v3M7 9v.5" stroke="#FC8181" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )}
      {t.msg}
    </div>
  );
}

// ─── CHAT MESSAGE ────────────────────────────────────────────────────────────
function ChatMsg({ msg, accentColor }) {
  const isAi = msg.role === "ai";
  return (
    <div style={{ display: "flex", gap: 8, alignSelf: isAi ? "flex-start" : "flex-end", maxWidth: "90%", animation: "fadeUp 0.2s ease" }}>
      {isAi && (
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${accentColor}, #EC4899)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M6 1l1 3.2H10l-2.6 1.9.9 3L6 7.2 3.7 9.1l.9-3L2 4.2h3z"/></svg>
        </div>
      )}
      <div style={{
        padding: "9px 13px",
        borderRadius: isAi ? "4px 13px 13px 13px" : "13px 4px 13px 13px",
        fontSize: 12.5,
        lineHeight: 1.65,
        background: isAi ? "rgba(255,255,255,0.05)" : `${accentColor}20`,
        border: `1px solid ${isAi ? "rgba(255,255,255,0.08)" : accentColor + "35"}`,
        color: isAi ? "rgba(255,255,255,0.78)" : accentColor,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedType, setSelectedType] = useState("presentation");
  const [slides, setSlides] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("slides_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [title, setTitle] = useState("Mi Diseño");
  const [prompt, setPrompt] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [promptFocused, setPromptFocused] = useState(false);

  // Chat
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFocused, setChatFocused] = useState(false);
  const chatEnd = useRef(null);
  const chatInputRef = useRef(null);

  const def = TYPES[selectedType];

  const showToast = useCallback((msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  useEffect(() => {
    try {
      localStorage.setItem("slides_history", JSON.stringify(history));
    } catch {}
  }, [history]);

  const SYSTEM_GENERATE = `Eres un experto en diseño visual y comunicación. Genera slides visualmente impactantes y profesionales. Responde ÚNICAMENTE con un array JSON válido, sin backticks ni texto adicional.`;

  const buildGeneratePrompt = (type, prompt, title) => {
    const def = TYPES[type];
    return `Genera una ${def.label} completa y visualmente impactante${title ? ` titulada "${title}"` : ""} sobre: "${prompt}"

Crea entre 6-10 slides. Devuelve ÚNICAMENTE un array JSON con esta estructura exacta para cada slide:
[
  {
    "type": "Portada | Agenda | Problema | Solución | Datos | Equipo | Propuesta | Conclusión | etc",
    "title": "Título impactante y conciso (máx 8 palabras)",
    "subtitle": "Subtítulo o descripción que amplía el título (1-2 oraciones)",
    "bullets": ["Punto clave 1 específico", "Punto clave 2 específico", "Punto clave 3 específico"],
    "metric": "75%",
    "metricLabel": "descripción de la métrica (opcional, solo si hay datos)",
    "tag": "etiqueta corta (opcional)",
    "content": "Párrafo adicional de contexto o detalle importante (1-2 oraciones)"
  }
]

REGLAS CRÍTICAS:
- Cada slide debe tener contenido ÚNICO y específico para "${prompt}"
- Los títulos deben ser poderosos y directos
- Los bullets deben ser concretos y accionables (no genéricos)
- Incluye métricas reales/estimadas cuando aplique
- NO incluyas bullets vacíos o genéricos como "Punto 1"
- Varía los tipos de slide para crear narrativa visual`;
  };

  const buildChatSystemPrompt = (slides) => {
    const current = JSON.stringify(slides, null, 2);
    return `Eres un experto en diseño visual. El usuario quiere modificar sus slides.

SLIDES ACTUALES:
${current}

INSTRUCCIONES CRÍTICAS:
1. Cuando el usuario pida cambios, devuelve el array JSON COMPLETO actualizado
2. Aplica EXACTAMENTE los cambios pedidos - sé específico y preciso
3. Mantén la estructura de cada slide: {type, title, subtitle, bullets, metric, metricLabel, tag, content}
4. Si pide cambiar colores o estilo, actualiza el "tag" o "type" para reflejarlo
5. Si pide agregar/quitar slides, hazlo en el array
6. Responde ÚNICAMENTE con el array JSON válido, sin texto adicional, sin backticks
7. SIEMPRE devuelve el array completo, no solo las slides modificadas`;
  };

  const generate = async () => {
    if (!prompt.trim()) { showToast("Describí qué querés generar"); return; }
    setGenerating(true); setSlides([]); setSelectedSlide(null); setChatMsgs([]);
    try {
      const raw = await aiCall([{ role: "user", content: buildGeneratePrompt(selectedType, prompt, title) }], SYSTEM_GENERATE);
      const result = parseSlides(raw);
      setSlides(result);
      setSelectedSlide(0);
      const id = Date.now();
      setHistory(h => [{ id, title, type: def.label, color: def.color, ts: new Date(), slides: result }, ...h.slice(0, 19)]);
      setChatMsgs([{ role: "ai", content: `✓ Generé ${result.length} slides para "${prompt}". ¿Querés cambiar algo? Describí exactamente qué modificar.` }]);
      showToast(`${result.length} slides generados`, "success");
    } catch (err) {
      const status = err?.message?.match(/Error (\d+)/)?.[1];
      const msg = status === "429"
        ? "Límite de IA alcanzado. Esperá 1 minuto."
        : status === "401"
        ? "Error de configuración del servidor."
        : !navigator.onLine
        ? "Sin conexión a internet."
        : "Error al generar. Intentá de nuevo.";
      showToast(msg, "error");
      console.error(err);
    }
    setGenerating(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || slides.length === 0) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(m => [...m, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      // Build conversation history for AI context
      const conversationHistory = chatMsgs
        .filter(m => m.role === "user" || m.role === "ai")
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

      const raw = await aiCall(
        [...conversationHistory, { role: "user", content: msg }],
        buildChatSystemPrompt(slides)
      );
      let updated;
      try {
        updated = parseSlides(raw);
      } catch (parseErr) {
        updated = null;
      }

      if (updated && updated.length > 0) {
        setSlides(updated);
        setChatMsgs(prev => [...prev, { role: "ai", content: "✓ Slides actualizadas." }]);
        showToast("Slides actualizados", "success");
      } else {
        const isShortText = typeof raw === "string" && raw.length < 300;
        setChatMsgs(prev => [...prev, {
          role: "ai",
          content: isShortText ? raw : "No pude interpretar la respuesta de la IA. Intentá reformular tu pedido."
        }]);
      }
    } catch (err) {
      const status = err?.message?.match(/Error (\d+)/)?.[1];
      const chatErrMsg = status === "429"
        ? "Límite de IA alcanzado. Esperá 1 minuto."
        : !navigator.onLine
        ? "Sin conexión a internet."
        : "Error al conectar con la IA.";
      setChatMsgs(prev => [...prev, { role: "ai", content: chatErrMsg }]);
    }
    setChatLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 50);
  };

  const resetAll = () => { setSlides([]); setPrompt(""); setSelectedSlide(null); setChatMsgs([]); };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#06060f", color: "#E8E8F0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
        textarea, input { font-family: 'Inter', system-ui, sans-serif; color-scheme: dark; }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,.2); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @media print { .np { display: none !important; } }
      `}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <div className="np" style={{ width: 230, minWidth: 230, background: "rgba(255,255,255,.025)", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #7C6AF7, #EC4899)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(124,106,247,.5)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.6">
                <rect x="1" y="1" width="7" height="7" rx="1.5"/>
                <rect x="10" y="1" width="7" height="7" rx="1.5"/>
                <rect x="1" y="10" width="7" height="7" rx="1.5"/>
                <rect x="10" y="10" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Slides AI</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Generador de Plantillas</div>
            </div>
          </div>
        </div>

        {/* Types */}
        <div style={{ padding: "12px 10px 8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px", marginTop: "20px", padding: "0 4px" }}>Tipo de Diseño</div>
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} onClick={() => {
                if (slides.length > 0) {
                  if (!window.confirm("Cambiar el tipo borrará las slides actuales. ¿Continuar?")) return;
                }
                setSelectedType(k); setSlides([]); setSelectedSlide(null); setChatMsgs([]);
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10, border: "none", background: selectedType === k ? `${v.color}18` : "transparent", color: selectedType === k ? v.color : "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", textAlign: "left", transition: "all .15s", marginBottom: 2, fontWeight: selectedType === k ? 700 : 400, borderLeft: `2px solid ${selectedType === k ? v.color : "transparent"}` }}>
              <span style={{ fontSize: 14, opacity: 0.8 }}>{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
          {history.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: "20px" }}>Historial ({history.length})</span>
                {confirmClear
                  ? <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setHistory([]); setConfirmClear(false); }} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Borrar</button>
                      <button onClick={() => setConfirmClear(false)} style={{ fontSize: 10, color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>No</button>
                    </div>
                  : <button onClick={() => setConfirmClear(true)} style={{ fontSize: 10, color: "rgba(255,255,255,.18)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .15s" }} onMouseEnter={e => e.target.style.color = "#EF4444"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.18)"}>Limpiar</button>
                }
              </div>
              {history.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 9, cursor: "pointer", marginBottom: 2, transition: "background .15s" }}
                  onClick={() => { setSlides(h.slides); setTitle(h.title); setSelectedSlide(0); }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{h.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.22)", marginTop: 1 }}>{h.type} · {new Date(h.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  {deleteId === h.id
                    ? <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); setHistory(hh => hh.filter(i => i.id !== h.id)); setDeleteId(null); }} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Sí</button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(null); }} style={{ fontSize: 10, color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>No</button>
                      </div>
                    : <button onClick={e => { e.stopPropagation(); setDeleteId(h.id); }} style={{ color: "rgba(255,255,255,.1)", background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 5, display: "flex", transition: "all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.1)"; e.currentTarget.style.background = "none"; }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 2.5h9M3.5 2.5V1.5h4v1M2 2.5l.7 7h5.6l.7-7"/></svg>
                      </button>
                  }
                </div>
              ))}
            </>
          )}
        </div>

        <button onClick={resetAll} style={{ margin: 12, padding: 10, background: "rgba(124,106,247,.12)", border: "1px solid rgba(124,106,247,.2)", borderRadius: 12, color: "#9D8EFF", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(124,106,247,.12)"}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
          Nuevo diseño
        </button>
      </div>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <div className="np" style={{ height: 54, borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0, background: "rgba(255,255,255,.01)" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            {slides.length > 0 ? title : "Slides Generator"}
          </span>
          {slides.length > 0 && (
            <span style={{ padding: "2px 9px", background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.22)", borderRadius: 20, fontSize: 10.5, color: "#34D399", fontWeight: 700 }}>
              {slides.length} slides
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {slides.length > 0 && (
              <button onClick={() => window.print()} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", fontSize: 12, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 500, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.55)"; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 1.5h7V4h-7zM1 4h10v5H8.5V10h-5V9H1z"/></svg>
                Exportar PDF
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Slides grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, minWidth: 0 }}>
            {slides.length === 0 && !generating ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, textAlign: "center", padding: 40 }}>
                <div style={{ width: 100, height: 100, border: "1.5px dashed rgba(255,255,255,.08)", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 36, opacity: 0.15 }}>{def.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,.55)", marginBottom: 10, letterSpacing: "-0.5px" }}>Genera tu diseño con IA</div>
                  <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.22)", maxWidth: 340, lineHeight: 1.85 }}>
                    Describí tu idea en el panel derecho y la IA generará slides visuales completas para tu <span style={{ color: def.color, fontWeight: 700 }}>{def.label}</span>.
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 400 }}>
                  {Object.entries(TYPES).map(([k, v]) => (
                    <button key={k} onClick={() => setSelectedType(k)} style={{ padding: "8px 14px", background: k === selectedType ? `${v.color}18` : "rgba(255,255,255,.03)", border: `1px solid ${k === selectedType ? v.color + "50" : "rgba(255,255,255,.07)"}`, borderRadius: 10, color: k === selectedType ? v.color : "rgba(255,255,255,.3)", fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: k === selectedType ? 700 : 400, transition: "all .2s" }}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, fontWeight: 900, fontFamily: "inherit", outline: "none", flex: 1, letterSpacing: "-0.5px" }} placeholder="Título del proyecto..." />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)", flexShrink: 0 }}>{new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", padding: "32px", perspective: "1200px" }}>
                  {generating
                    ? Array.from({ length: 6 }).map((_, i) => <SlideSkeleton key={i} index={i} />)
                    : slides.map((slide, i) => (
                        <SlidePreview key={i} slide={slide} index={i} selected={selectedSlide === i} onClick={() => setSelectedSlide(selectedSlide === i ? null : i)} />
                      ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="np" style={{ width: 316, minWidth: 316, borderLeft: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Generate */}
            <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)", textTransform: "uppercase", letterSpacing: "0.85px", marginBottom: 10 }}>Generación</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del proyecto..." style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderColor: promptFocused ? def.color + "70" : "rgba(255,255,255,.07)", borderRadius: 9, color: "#fff", fontFamily: "inherit", fontSize: 12.5, padding: "8px 11px", outline: "none", width: "100%", transition: "border-color .15s" }}
                  onFocus={() => setPromptFocused(true)}
                  onBlur={() => setPromptFocused(false)} />
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && e.ctrlKey && generate()} rows={5}
                  placeholder={"Describí tu idea con detalle...\n\nEj: Presentación de pitch para startup de delivery de comida saludable, dirigida a inversores Serie A, con foco en métricas de crecimiento y modelo de negocio"}
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderColor: promptFocused ? def.color + "70" : "rgba(255,255,255,.07)", borderRadius: 9, color: "#fff", fontFamily: "inherit", fontSize: 12.5, padding: "10px 11px", resize: "none", outline: "none", lineHeight: 1.7, width: "100%", transition: "border-color .15s" }}
                  onFocus={() => setPromptFocused(true)}
                  onBlur={() => setPromptFocused(false)} />
                <button onClick={generate} disabled={generating} style={{ padding: "11px", background: generating ? "rgba(124,106,247,.3)" : `linear-gradient(135deg, ${def.color}, ${def.color}BB)`, border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: generating ? "none" : `0 4px 20px ${def.color}35`, opacity: generating ? .7 : 1, transition: "all .2s" }}>
                  {generating
                    ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Generando slides...</>
                    : <><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6.5 1l1.1 3.6H11l-2.8 2 1 3.2-2.8-2-2.8 2 1-3.2L2 4.6h3.4z"/></svg> Generar {def.label}</>
                  }
                </button>
                <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.14)", textAlign: "center" }}>Ctrl+Enter · {slides.length > 0 ? `${slides.length} slides activos` : "Describe con detalle para mejores resultados"}</p>
              </div>
            </div>

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px 9px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)", textTransform: "uppercase", letterSpacing: "0.85px" }}>Refinamiento con IA</div>
                  {slides.length > 0 && <span style={{ fontSize: 10, color: def.color, fontWeight: 600 }}>● Activo</span>}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {chatMsgs.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8 }}>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.2)", lineHeight: 1.65 }}>Después de generar, pedí cambios precisos:</p>
                    {[
                      "Cambia todos los títulos para que sean más impactantes",
                      "Agrega una slide de métricas con números reales",
                      "Cambia el tono a más corporativo y formal",
                    ].map((s, i) => (
                      <button key={i} onClick={() => slides.length > 0 && setChatInput(s)}
                        style={{ padding: "8px 12px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 9, color: "rgba(255,255,255,.3)", fontSize: 11.5, fontFamily: "inherit", cursor: slides.length > 0 ? "pointer" : "default", textAlign: "left", lineHeight: 1.55, transition: "all .15s" }}
                        onMouseEnter={e => slides.length > 0 && (e.currentTarget.style.background = "rgba(255,255,255,.055)")}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.025)"}>
                        "{s}"
                      </button>
                    ))}
                  </div>
                )}
                {chatMsgs.map((m, i) => <ChatMsg key={i} msg={m} accentColor={def.color} />)}
                {chatLoading && (
                  <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${def.color}, #EC4899)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M6 1l1 3.2H10l-2.6 1.9.9 3L6 7.2 3.7 9.1l.9-3L2 4.2h3z"/></svg>
                    </div>
                    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "4px 13px 13px 13px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, .2, .4].map((d, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: def.color, animation: `pulse 1s infinite ${d}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                    disabled={slides.length === 0}
                    rows={2}
                    placeholder={slides.length > 0 ? "Describí exactamente qué cambiar..." : "Generá slides primero"}
                    style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderColor: chatFocused ? def.color + "70" : "rgba(255,255,255,.07)", borderRadius: 9, color: "#fff", fontFamily: "inherit", fontSize: 12.5, padding: "9px 12px", outline: "none", resize: "none", opacity: slides.length > 0 ? 1 : .5, transition: "border-color .15s", lineHeight: 1.6 }}
                    onFocus={() => setChatFocused(true)}
                    onBlur={() => setChatFocused(false)}
                  />
                  <button onClick={sendChat} disabled={slides.length === 0 || !chatInput.trim() || chatLoading}
                    style={{ padding: "9px 14px", background: slides.length > 0 && chatInput.trim() ? def.color : "rgba(255,255,255,.05)", border: "none", borderRadius: 9, color: "#fff", fontSize: 18, fontFamily: "inherit", fontWeight: 700, cursor: slides.length > 0 && chatInput.trim() ? "pointer" : "not-allowed", opacity: slides.length > 0 && chatInput.trim() ? 1 : .4, transition: "all .15s", alignSelf: "stretch", display: "flex", alignItems: "center" }}>
                    →
                  </button>
                </div>
                <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.14)", marginTop: 6 }}>Enter para enviar · Shift+Enter nueva línea</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast t={toast} />
    </div>
  );
}
