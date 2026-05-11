import React, { useState, useRef, useEffect, useCallback } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://figma-ai-generator.onrender.com";

const TYPES = {
  presentation: { label: "Presentación", icon: "▣", color: "#7C6AF7", desc: "Pitches y reuniones" },
  social:       { label: "Redes Sociales", icon: "◈", color: "#EC4899", desc: "Posts e infografías" },
  flyer:        { label: "Flyer / Afiche", icon: "◉", color: "#F59E0B", desc: "Eventos y anuncios" },
  logo:         { label: "Logo / Branding", icon: "◆", color: "#10B981", desc: "Identidad visual" },
  banner:       { label: "Banner Web", icon: "▬", color: "#06B6D4", desc: "Headers y portadas" },
  infographic:  { label: "Infografía", icon: "◎", color: "#F76C8A", desc: "Datos y procesos" },
};

const SLIDE_COLORS = [
  { bg: "linear-gradient(135deg,#1a1040 0%,#2d1b69 100%)",            accent: "#7C6AF7", text: "#E8E0FF" },
  { bg: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)", accent: "#06B6D4", text: "#E0F7FF" },
  { bg: "linear-gradient(135deg,#1a0a2e 0%,#16213e 50%,#0f3460 100%)", accent: "#EC4899", text: "#FFE0F0" },
  { bg: "linear-gradient(135deg,#0d1117 0%,#161b22 100%)",             accent: "#10B981", text: "#D1FAE5" },
  { bg: "linear-gradient(135deg,#1a0829 0%,#2d0f4a 50%,#1a0829 100%)", accent: "#E879F9", text: "#FAE8FF" },
  { bg: "linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%)",             accent: "#F76C8A", text: "#FFE4E8" },
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
  if (!slide) return null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s cubic-bezier(0.23,1,0.32,1)",
        transform: selected
          ? "scale(1.03)"
          : hov
          ? "rotateY(4deg) rotateX(3deg) translateZ(24px) scale(1.01)"
          : "rotateY(0) rotateX(0) translateZ(0) scale(1)",
        boxShadow: selected
          ? `0 0 0 2px ${scheme.accent}, 0 24px 56px ${scheme.accent}30`
          : hov
          ? `0 28px 56px rgba(0,0,0,0.65), 0 0 0 1px ${scheme.accent}45, -8px 8px 28px ${scheme.accent}15`
          : "0 4px 20px rgba(0,0,0,0.4)",
        animation: `fadeUp 0.5s cubic-bezier(0.23,1,0.32,1) ${index * 80}ms both`,
      }}
    >
      {/* ── Slide visual 16:9 ── */}
      <div style={{
        aspectRatio: "16/9",
        background: scheme.bg,
        padding: "18px 22px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative orbs */}
        <div style={{ position:"absolute", top:-55, right:-55, width:190, height:190, borderRadius:"50%", background:`${scheme.accent}12`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-35, left:-35, width:130, height:130, borderRadius:"50%", background:`${scheme.accent}08`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"38%", right:"12%", width:65, height:65, borderRadius:"50%", background:`${scheme.accent}07`, pointerEvents:"none" }} />

        {/* Top accent bar */}
        <div style={{
          position:"absolute", top:0, left:0, right:0,
          height: hov ? "3px" : "2px",
          width: hov ? "100%" : "62%",
          background: `linear-gradient(90deg,${scheme.accent},${scheme.accent}70,transparent)`,
          transition: "height 0.4s ease, width 0.4s ease",
        }} />

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:24, height:24, borderRadius:7, background:`${scheme.accent}20`, border:`1px solid ${scheme.accent}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:10, fontWeight:800, color:scheme.accent }}>{String(index+1).padStart(2,"0")}</span>
            </div>
            <span style={{ fontSize:9, fontWeight:700, color:`${scheme.text}50`, textTransform:"uppercase", letterSpacing:"0.1em" }}>
              {slide.type || "Slide"}
            </span>
          </div>
          {slide.tag && (
            <span style={{ padding:"2px 8px", background:`${scheme.accent}18`, border:`1px solid ${scheme.accent}38`, borderRadius:20, fontSize:9, color:scheme.accent, fontWeight:700 }}>
              {slide.tag}
            </span>
          )}
        </div>

        {/* Main content */}
        <div style={{ zIndex:1, flex:1, display:"flex", flexDirection:"column", justifyContent:"center", paddingTop:6, paddingBottom:4 }}>
          <h3 style={{
            fontSize: slide.title && slide.title.length > 36 ? 13 : 16,
            fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:6,
            letterSpacing:"-0.4px", textShadow:`0 2px 20px ${scheme.accent}35`,
          }}>
            {slide.title}
          </h3>
          {slide.subtitle && (
            <p style={{
              fontSize:9.5, color:`${scheme.text}65`, lineHeight:1.55, marginBottom:7,
              overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            }}>
              {slide.subtitle}
            </p>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {slide.bullets.slice(0,2).map((b, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:scheme.accent, flexShrink:0, marginTop:5.5, boxShadow:`0 0 5px ${scheme.accent}` }} />
                  <span style={{ fontSize:9.5, color:`${scheme.text}60`, lineHeight:1.5 }}>
                    {b && b.length > 65 ? b.slice(0,62)+"…" : b}
                  </span>
                </div>
              ))}
              {slide.bullets.length > 2 && (
                <span style={{ fontSize:9, color:`${scheme.text}30`, paddingLeft:10, marginTop:1 }}>
                  +{slide.bullets.length-2} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Metric */}
        {slide.metric && (
          <div style={{
            zIndex:1, padding:"6px 11px", background:`${scheme.accent}14`, border:`1px solid ${scheme.accent}28`,
            borderRadius:10, display:"inline-flex", alignItems:"center", gap:9, alignSelf:"flex-start",
          }}>
            <span style={{ fontSize:20, fontWeight:900, color:scheme.accent, letterSpacing:"-1px", lineHeight:1 }}>
              {slide.metric}
            </span>
            <span style={{ fontSize:9.5, color:`${scheme.text}55`, maxWidth:90, lineHeight:1.3 }}>
              {slide.metricLabel}
            </span>
          </div>
        )}

        {/* Source badge */}
        {slide.source && (
          <div style={{
            position:"absolute", bottom:7, right:9, zIndex:2,
            display:"inline-flex", alignItems:"center", gap:3,
            padding:"2px 6px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:5, fontSize:8, color:"rgba(255,255,255,0.4)", fontWeight:600,
          }}>
            📖 {slide.source}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        background:"rgba(6,6,14,0.97)", padding:"9px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        borderTop:"1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.36)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"85%" }}>
          {slide.title?.slice(0,32)}{slide.title && slide.title.length > 32 ? "…" : ""}
        </span>
        {selected && <span style={{ fontSize:10, color:scheme.accent, fontWeight:700, flexShrink:0 }}>● Activa</span>}
      </div>
    </div>
  );
});

// ─── SKELETON ───────────────────────────────────────────────────────────────
function SlideSkeleton({ index }) {
  const sh = {
    background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.04) 75%)",
    backgroundSize:"200% 100%", animation:"shimmer 1.8s infinite, fadeUp 0.4s ease both", borderRadius:"5px",
  };
  return (
    <div style={{ borderRadius:18, overflow:"hidden", animation:`fadeUp 0.4s ease ${index*60}ms both` }}>
      <div style={{ aspectRatio:"16/9", background:"rgba(255,255,255,0.04)", position:"relative", overflow:"hidden" }}>
        <div style={{ padding:"18px 22px", display:"flex", flexDirection:"column", gap:11 }}>
          <div style={{ height:9, width:"28%", ...sh }} />
          <div style={{ height:16, width:"72%", ...sh }} />
          <div style={{ height:9, width:"88%", ...sh }} />
          <div style={{ height:9, width:"60%", ...sh }} />
        </div>
      </div>
      <div style={{ background:"rgba(6,6,14,0.97)", padding:"9px 14px" }}>
        <div style={{ height:9, width:"46%", ...sh }} />
      </div>
    </div>
  );
}

// ─── TOAST ──────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div style={{
    position:"fixed", bottom:"28px", left:"50%", transform:"translateX(-50%)",
    background: type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
    border:`1px solid ${type === "success" ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
    backdropFilter:"blur(16px)", borderRadius:"14px", padding:"12px 22px",
    color:"#fff", fontSize:"13px", fontWeight:500,
    display:"flex", alignItems:"center", gap:"10px",
    zIndex:9999, animation:"toastIn 0.3s cubic-bezier(0.23,1,0.32,1) both",
    minWidth:"260px", overflow:"hidden",
    boxShadow: type === "success" ? "0 8px 32px rgba(16,185,129,0.18)" : "0 8px 32px rgba(239,68,68,0.18)",
  }}>
    <span style={{ fontSize:"15px" }}>{type === "success" ? "✓" : "✕"}</span>
    <span style={{ flex:1 }}>{msg}</span>
    <div style={{ position:"absolute", bottom:0, left:0, height:"2px", background: type === "success" ? "#10B981" : "#EF4444", animation:"toastProgress 3s linear forwards" }} />
  </div>
);

// ─── CHAT MESSAGE ─────────────────────────────────────────────────────────────
function ChatMsg({ msg, accentColor }) {
  const isAi = msg.role === "ai";
  return (
    <div style={{ display:"flex", gap:8, alignSelf:isAi?"flex-start":"flex-end", maxWidth:"92%", animation:"fadeUp 0.25s ease" }}>
      {isAi && (
        <div style={{ width:26, height:26, borderRadius:8, background:`linear-gradient(135deg,${accentColor},#EC4899)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2, boxShadow:`0 4px 14px ${accentColor}40` }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M6 1l1 3.2H10l-2.6 1.9.9 3L6 7.2 3.7 9.1l.9-3L2 4.2h3z"/></svg>
        </div>
      )}
      <div style={isAi ? {
        maxWidth:"86%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:"15px 15px 15px 4px", padding:"10px 14px", fontSize:"13px", lineHeight:"1.55", color:"rgba(255,255,255,0.82)",
      } : {
        maxWidth:"86%", background:"linear-gradient(135deg,rgba(124,106,247,0.22),rgba(91,78,214,0.14))",
        border:"1px solid rgba(124,106,247,0.28)", borderRadius:"15px 15px 4px 15px",
        padding:"10px 14px", fontSize:"13px", lineHeight:"1.55", color:"rgba(255,255,255,0.9)",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedType, setSelectedType] = useState("presentation");
  const [slides, setSlides] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("slides_history");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [title, setTitle] = useState("Mi Diseño");
  const [prompt, setPrompt] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [promptFocused, setPromptFocused] = useState(false);
  const [generateBtnHovered, setGenerateBtnHovered] = useState(false);

  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFocused, setChatFocused] = useState(false);
  const chatEnd = useRef(null);
  const chatInputRef = useRef(null);

  const def = TYPES[selectedType] || TYPES.presentation;

  const showToast = useCallback((msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  useEffect(() => {
    try { localStorage.setItem("slides_history", JSON.stringify(history)); } catch {}
  }, [history]);

  const extractKeywords = async (userPrompt) => {
    try {
      const r = await fetch(`${BACKEND}/api/claude`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[{ role:"user", content:userPrompt }], system:"Respond with ONLY 1-3 keywords in English that best summarize this topic. No punctuation, no explanation.", max_tokens:20 }),
      });
      const data = await r.json();
      return data?.content?.[0]?.text?.trim() || userPrompt.slice(0,50);
    } catch { return userPrompt.slice(0,50); }
  };

  const fetchResearchContext = async (topic) => {
    try {
      const r = await fetch(`${BACKEND}/api/research`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ topic }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data.found ? data : null;
    } catch { return null; }
  };

  const buildGeneratePrompt = (type, userPrompt, userTitle, research = null) => {
    const typeDef = TYPES[type];
    const researchBlock = research?.context
      ? `\nCONTEXTO VERIFICADO:\n${research.context}\n${research.facts?.length > 0 ? `DATOS REALES: ${research.facts.join(", ")}` : ""}\n`
      : "";
    return `Eres un experto en storytelling visual. Crea una ${typeDef.label} impactante y memorable${userTitle ? ` titulada "${userTitle}"` : ""} sobre: "${userPrompt}"
${researchBlock}
Genera 7-8 slides con narrativa progresiva y emotiva. Devuelve ÚNICAMENTE un array JSON:
[
  {
    "type": "Portada | Problema | Contexto | Datos | Insight | Solución | Historia | Conclusión | CTA",
    "title": "Título poderoso, directo y específico (máx 7 palabras)",
    "subtitle": "Contexto rico que añade información NUEVA al título (2-3 oraciones concretas)",
    "bullets": ["Hecho concreto o dato específico","Ejemplo real o contraste revelador","Consecuencia o beneficio tangible"],
    "metric": "número o dato impactante",
    "metricLabel": "qué representa ese número en contexto",
    "tag": "etiqueta temática corta",
    "source": "Wikipedia"
  }
]

REGLAS:
- Narrativa: gancho → desarrollo → cierre accionable
- Títulos: específicos y potentes (no "La Importancia de X")
- Métricas: usa estadísticas conocidas del tema
- Solo incluye "source":"Wikipedia" si usaste el CONTEXTO VERIFICADO`;
  };

  const buildChatSystemPrompt = (currentSlides) => {
    return `Eres un experto en diseño visual. El usuario quiere modificar sus slides.

SLIDES ACTUALES:
${JSON.stringify(currentSlides, null, 2)}

INSTRUCCIONES CRÍTICAS:
1. Cuando el usuario pida cambios, devuelve el array JSON COMPLETO actualizado
2. Aplica EXACTAMENTE los cambios pedidos
3. Mantén la estructura: {type, title, subtitle, bullets, metric, metricLabel, tag}
4. Responde ÚNICAMENTE con el array JSON, sin backticks ni texto adicional`;
  };

  const generate = async () => {
    if (!prompt.trim()) { showToast("Describí qué querés generar"); return; }
    setGenerating(true); setSlides([]); setSelectedSlide(null); setChatMsgs([]);
    try {
      const keywords = await extractKeywords(prompt);
      const research = await fetchResearchContext(keywords);
      const enrichedPrompt = buildGeneratePrompt(selectedType, prompt, title, research);
      const raw = await aiCall(
        [{ role:"user", content:enrichedPrompt }],
        "Eres un experto en storytelling visual y presentaciones de alto impacto. Crea contenido específico y poderoso. NUNCA uses frases genéricas. Responde ÚNICAMENTE con el array JSON, sin backticks."
      );
      const result = parseSlides(raw);
      setSlides(result);
      setSelectedSlide(0);
      const id = Date.now();
      setHistory(h => [{ id, title, type:def.label, color:def.color, ts:new Date(), slides:result }, ...h.slice(0,19)]);
      setChatMsgs([{ role:"ai", content:`✓ Generé ${result.length} slides para "${prompt}". ¿Querés cambiar algo?` }]);
      showToast(`${result.length} slides generados`, "success");
    } catch (err) {
      const status = err?.message?.match(/Error (\d+)/)?.[1];
      const msg = status === "429" ? "Límite de IA alcanzado. Esperá 1 minuto."
        : status === "401" ? "Error de configuración del servidor."
        : !navigator.onLine ? "Sin conexión a internet."
        : "Error al generar. Intentá de nuevo.";
      showToast(msg, "error");
    }
    setGenerating(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || slides.length === 0) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(m => [...m, { role:"user", content:msg }]);
    setChatLoading(true);
    try {
      const history = chatMsgs
        .filter(m => m.role === "user" || m.role === "ai")
        .map(m => ({ role:m.role === "ai" ? "assistant" : "user", content:m.content }));
      const raw = await aiCall([...history, { role:"user", content:msg }], buildChatSystemPrompt(slides));
      let updated;
      try { updated = parseSlides(raw); } catch { updated = null; }
      if (updated && updated.length > 0) {
        setSlides(updated);
        setChatMsgs(prev => [...prev, { role:"ai", content:"✓ Slides actualizadas." }]);
        showToast("Slides actualizados", "success");
      } else {
        setChatMsgs(prev => [...prev, {
          role:"ai",
          content: typeof raw === "string" && raw.length < 300 ? raw : "No pude interpretar la respuesta. Reformulá tu pedido.",
        }]);
      }
    } catch (err) {
      const status = err?.message?.match(/Error (\d+)/)?.[1];
      setChatMsgs(prev => [...prev, {
        role:"ai",
        content: status === "429" ? "Límite de IA alcanzado." : !navigator.onLine ? "Sin conexión." : "Error al conectar con la IA.",
      }]);
    }
    setChatLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 50);
  };

  const resetAll = () => { setSlides([]); setPrompt(""); setSelectedSlide(null); setChatMsgs([]); };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", background:"#050509", color:"#E8E8F0", fontFamily:"'Inter',system-ui,sans-serif", fontSize:13, overflow:"hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        textarea, input { font-family: 'Inter', system-ui, sans-serif; color-scheme: dark; }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.2); }
        button { font-family: 'Inter', system-ui, sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-18px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(14px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes toastProgress { from { width:100%; } to { width:0%; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-6px); opacity:1; } }
        @keyframes glowPulse { 0%,100% { opacity:0.55; transform:translate(-50%,-50%) scale(1); } 50% { opacity:0.9; transform:translate(-50%,-50%) scale(1.12); } }
        @keyframes borderGlow { 0%,100% { box-shadow:0 0 0 0 rgba(124,106,247,0); } 50% { box-shadow:0 0 0 4px rgba(124,106,247,0.2); } }
        .history-item .del-btn { opacity:0; transition:opacity 0.15s; }
        .history-item:hover .del-btn { opacity:1; }
        .type-btn:hover { background:rgba(255,255,255,0.04) !important; }
        @media print { .np { display:none !important; } }
      `}</style>

      {/* ── Ambient orbs ────────────────────────────────────────────────── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"6%", left:"16%", width:520, height:520, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,106,247,0.07) 0%,transparent 70%)", filter:"blur(90px)" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"14%", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.05) 0%,transparent 70%)", filter:"blur(90px)" }} />
        <div style={{ position:"absolute", top:"48%", left:"58%", width:360, height:360, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.04) 0%,transparent 70%)", filter:"blur(90px)" }} />
      </div>

      {/* ── Layout wrapper ───────────────────────────────────────────────── */}
      <div style={{ display:"flex", width:"100%", height:"100%", position:"relative", zIndex:1 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div className="np" style={{
          width:244, minWidth:244,
          background:"rgba(255,255,255,0.022)",
          borderRight:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          animation:"slideInLeft 0.45s cubic-bezier(0.23,1,0.32,1) both",
          backdropFilter:"blur(20px)",
        }}>
          {/* Logo */}
          <div style={{ padding:"18px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:11 }}>
              <div style={{ width:38, height:38, background:"linear-gradient(135deg,#7C6AF7,#EC4899)", borderRadius:13, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 6px 24px rgba(124,106,247,0.55)" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.6">
                  <rect x="1" y="1" width="7" height="7" rx="1.5"/>
                  <rect x="10" y="1" width="7" height="7" rx="1.5"/>
                  <rect x="1" y="10" width="7" height="7" rx="1.5"/>
                  <rect x="10" y="10" width="7" height="7" rx="1.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize:"17px", fontWeight:800, letterSpacing:"-0.03em", background:"linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.75) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Slides AI</div>
                <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", marginTop:1 }}>Generador con IA</div>
              </div>
            </div>
          </div>

          {/* Type selector */}
          <div style={{ padding:"14px 12px 8px" }}>
            <div style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", marginBottom:"10px", padding:"0 4px" }}>Tipo de diseño</div>
            {Object.entries(TYPES).map(([k, v]) => {
              const active = selectedType === k;
              return (
                <button key={k} className="type-btn"
                  onClick={() => {
                    if (slides.length > 0 && !window.confirm("Cambiar el tipo borrará las slides actuales. ¿Continuar?")) return;
                    setSelectedType(k); setSlides([]); setSelectedSlide(null); setChatMsgs([]);
                  }}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
                    borderRadius:10, border:"none", cursor:"pointer", fontSize:12.5, textAlign:"left",
                    fontWeight: active ? 700 : 400, marginBottom:2,
                    background: active ? `${v.color}16` : "transparent",
                    color: active ? v.color : "rgba(255,255,255,0.42)",
                    borderLeft:`2.5px solid ${active ? v.color : "transparent"}`,
                    transition:"background 0.15s, color 0.15s",
                  }}>
                  <span style={{ fontSize:15, opacity:0.85, flexShrink:0 }}>{v.icon}</span>
                  <span style={{ flex:1 }}>{v.label}</span>
                  {active && <span style={{ width:5, height:5, borderRadius:"50%", background:v.color, flexShrink:0, boxShadow:`0 0 6px ${v.color}` }} />}
                </button>
              );
            })}
          </div>

          {/* History */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 12px" }}>
            {history.length > 0 && (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 4px 8px" }}>
                  <span style={{ fontSize:"9.5px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>Historial ({history.length})</span>
                  {confirmClear
                    ? <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => { setHistory([]); setConfirmClear(false); }} style={{ fontSize:10, color:"#EF4444", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>Borrar</button>
                        <button onClick={() => setConfirmClear(false)} style={{ fontSize:10, color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer" }}>No</button>
                      </div>
                    : <button onClick={() => setConfirmClear(true)} style={{ fontSize:10, color:"rgba(255,255,255,0.16)", background:"none", border:"none", cursor:"pointer", transition:"color 0.15s" }} onMouseEnter={e => e.target.style.color="#EF4444"} onMouseLeave={e => e.target.style.color="rgba(255,255,255,0.16)"}>Limpiar</button>
                  }
                </div>
                {history.map(h => (
                  <div key={h.id} className="history-item"
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", borderRadius:10, cursor:"pointer", marginBottom:2, transition:"background 0.15s" }}
                    onClick={() => { if (Array.isArray(h.slides) && h.slides.length > 0) { setSlides(h.slides); setTitle(h.title || "Mi Diseño"); setSelectedSlide(0); } }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:h.color || "#7C6AF7", flexShrink:0, boxShadow:`0 0 6px ${h.color || "#7C6AF7"}80` }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.58)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{h.title || "Sin título"}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.22)", marginTop:1 }}>{h.type || "—"} · {new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                    {deleteId === h.id
                      ? <div style={{ display:"flex", gap:4 }}>
                          <button onClick={e => { e.stopPropagation(); setHistory(hh => hh.filter(i => i.id !== h.id)); setDeleteId(null); }} style={{ fontSize:10, color:"#EF4444", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>Sí</button>
                          <button onClick={e => { e.stopPropagation(); setDeleteId(null); }} style={{ fontSize:10, color:"rgba(255,255,255,0.3)", background:"none", border:"none", cursor:"pointer" }}>No</button>
                        </div>
                      : <button className="del-btn" onClick={e => { e.stopPropagation(); setDeleteId(h.id); }}
                          style={{ color:"rgba(255,255,255,0.12)", background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, display:"flex", transition:"all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.color="#EF4444"; e.currentTarget.style.background="rgba(239,68,68,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.12)"; e.currentTarget.style.background="none"; }}>
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 2.5h9M3.5 2.5V1.5h4v1M2 2.5l.7 7h5.6l.7-7"/></svg>
                        </button>
                    }
                  </div>
                ))}
              </>
            )}
          </div>

          {/* New design button */}
          <button onClick={resetAll}
            style={{ margin:12, padding:"10px 14px", background:"rgba(124,106,247,0.1)", border:"1px solid rgba(124,106,247,0.22)", borderRadius:12, color:"#A89EFF", fontSize:13, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background="rgba(124,106,247,0.2)"; e.currentTarget.style.borderColor="rgba(124,106,247,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(124,106,247,0.1)"; e.currentTarget.style.borderColor="rgba(124,106,247,0.22)"; }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6.5" y1="1" x2="6.5" y2="12"/><line x1="1" y1="6.5" x2="12" y2="6.5"/></svg>
            Nuevo diseño
          </button>
        </div>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Topbar */}
          <div className="np" style={{ height:56, borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", padding:"0 24px", gap:12, flexShrink:0, background:"rgba(255,255,255,0.01)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
              <span style={{ fontSize:13, fontWeight:600, color:`${def.color}`, opacity:0.7 }}>{def.icon}</span>
              <span style={{ fontSize:15, fontWeight:800, color:"rgba(255,255,255,0.9)", letterSpacing:"-0.3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {slides.length > 0 ? title : "Slides AI Generator"}
              </span>
              {slides.length > 0 && (
                <span style={{ padding:"2px 9px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.22)", borderRadius:20, fontSize:10.5, color:"#34D399", fontWeight:700, flexShrink:0 }}>
                  {slides.length} slides
                </span>
              )}
            </div>
            {slides.length > 0 && (
              <button onClick={() => window.print()}
                style={{ padding:"5px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:500, transition:"all 0.15s", flexShrink:0 }}
                onMouseEnter={e => { e.currentTarget.style.color="#fff"; e.currentTarget.style.background="rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color="rgba(255,255,255,0.5)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2.5 1.5h7V4h-7zM1 4h10v5H8.5V10h-5V9H1z"/></svg>
                Exportar PDF
              </button>
            )}
          </div>

          {/* Slides area */}
          <div style={{ flex:1, overflowY:"auto", padding:slides.length > 0 || generating ? "0" : "0" }}>
            {slides.length === 0 && !generating ? (
              /* ── Empty state ── */
              <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:32, textAlign:"center", padding:48, position:"relative" }}>
                {/* Ambient glow orb */}
                <div style={{ position:"absolute", top:"50%", left:"50%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${def.color}16 0%,transparent 70%)`, filter:"blur(60px)", pointerEvents:"none", animation:"glowPulse 4s ease-in-out infinite" }} />

                {/* Type icon circle */}
                <div style={{ width:96, height:96, borderRadius:28, border:`1.5px solid ${def.color}30`, background:`${def.color}0C`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1 }}>
                  <span style={{ fontSize:38, opacity:0.6, filter:`drop-shadow(0 0 12px ${def.color}60)` }}>{def.icon}</span>
                </div>

                {/* Headline */}
                <div style={{ position:"relative", zIndex:1 }}>
                  <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.5px", lineHeight:1.15, marginBottom:12, background:"linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.65) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                    Crea tu próxima gran
                    <br />{def.label} con IA
                  </h1>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.3)", maxWidth:380, lineHeight:1.8, margin:"0 auto" }}>
                    Describí tu idea y la IA generará slides visuales completas,<br />con estructura narrativa y datos reales.
                  </p>
                </div>

                {/* Type chip grid */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:9, justifyContent:"center", maxWidth:440, position:"relative", zIndex:1 }}>
                  {Object.entries(TYPES).map(([k, v]) => (
                    <button key={k} onClick={() => setSelectedType(k)}
                      style={{ padding:"8px 16px", background: k === selectedType ? `${v.color}18` : "rgba(255,255,255,0.03)", border:`1px solid ${k === selectedType ? v.color+"45" : "rgba(255,255,255,0.07)"}`, borderRadius:10, color: k === selectedType ? v.color : "rgba(255,255,255,0.32)", fontSize:12.5, cursor:"pointer", fontWeight: k === selectedType ? 700 : 400, transition:"all 0.2s", display:"flex", alignItems:"center", gap:7 }}>
                      <span>{v.icon}</span> {v.label}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize:12, color:"rgba(255,255,255,0.16)", position:"relative", zIndex:1 }}>
                  Escribí en el panel derecho y presioná Generar →
                </p>
              </div>
            ) : (
              /* ── Slides grid ── */
              <div style={{ padding:"20px 24px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    style={{ background:"transparent", border:"none", color:"rgba(255,255,255,0.9)", fontSize:22, fontWeight:900, fontFamily:"inherit", outline:"none", flex:1, letterSpacing:"-0.5px" }}
                    placeholder="Título del proyecto..." />
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.18)", flexShrink:0 }}>
                    {new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"22px", perspective:"1200px" }}>
                  {generating
                    ? Array.from({length:6}).map((_,i) => <SlideSkeleton key={i} index={i} />)
                    : slides.map((slide, i) => (
                        <SlidePreview key={i} slide={slide} index={i} selected={selectedSlide === i} onClick={() => setSelectedSlide(selectedSlide === i ? null : i)} />
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div className="np" style={{
          width:320, minWidth:320,
          borderLeft:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          animation:"slideInRight 0.45s cubic-bezier(0.23,1,0.32,1) both",
          background:"rgba(255,255,255,0.018)",
          backdropFilter:"blur(20px)",
        }}>

          {/* ── Generation section ── */}
          <div style={{ padding:"18px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:22, height:22, borderRadius:7, background:`${def.color}22`, border:`1px solid ${def.color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:11 }}>{def.icon}</span>
              </div>
              <span style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Generación</span>
              <span style={{ marginLeft:"auto", fontSize:10, color:def.color, fontWeight:600, opacity:0.8 }}>{def.label}</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {/* Title input */}
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del proyecto..."
                style={{
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${promptFocused ? def.color+"60" : "rgba(255,255,255,0.08)"}`,
                  borderRadius:10, color:"rgba(255,255,255,0.9)", fontFamily:"inherit", fontSize:13, fontWeight:600,
                  padding:"9px 12px", outline:"none", width:"100%", transition:"border-color 0.2s",
                }}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)} />

              {/* Prompt textarea */}
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && e.ctrlKey && generate()} rows={5}
                placeholder={"Describí tu idea con detalle...\n\nEj: Presentación de pitch para startup de delivery saludable, inversores Serie A, foco en métricas de crecimiento"}
                style={{
                  background:"rgba(255,255,255,0.04)",
                  border:`1px solid ${promptFocused ? "rgba(124,106,247,0.55)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: promptFocused ? "0 0 0 3px rgba(124,106,247,0.12)" : "none",
                  borderRadius:10, color:"rgba(255,255,255,0.88)", fontFamily:"inherit", fontSize:12.5,
                  padding:"10px 12px", resize:"none", outline:"none", lineHeight:1.7, width:"100%",
                  transition:"border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={() => setPromptFocused(true)}
                onBlur={() => setPromptFocused(false)} />

              {/* Generate button */}
              <button onClick={generate} disabled={generating}
                onMouseEnter={() => setGenerateBtnHovered(true)}
                onMouseLeave={() => setGenerateBtnHovered(false)}
                style={{
                  width:"100%", padding:"13px",
                  background: generating ? "rgba(124,106,247,0.35)" : generateBtnHovered ? "linear-gradient(135deg,#8B7AFF,#6B5CE7)" : "linear-gradient(135deg,#7C6AF7,#5B4ED6)",
                  border: generating ? "1px solid rgba(124,106,247,0.5)" : "none",
                  borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, letterSpacing:"0.02em",
                  cursor: generating ? "not-allowed" : "pointer",
                  transform: generateBtnHovered && !generating ? "translateY(-1px)" : "none",
                  boxShadow: generateBtnHovered && !generating ? "0 10px 28px rgba(124,106,247,0.45)" : "0 4px 16px rgba(124,106,247,0.25)",
                  transition:"all 0.2s cubic-bezier(0.23,1,0.32,1)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                  animation: generating ? "borderGlow 1.5s ease-in-out infinite" : "none",
                }}>
                {generating
                  ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Generando slides...</>
                  : <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 1.5l1.2 3.8H12l-3 2.2 1.1 3.4L7 8.6 3.9 10.9 5 7.5 2 5.3h3.8z"/></svg>Generar {def.label}</>
                }
              </button>

              <p style={{ fontSize:10.5, color:"rgba(255,255,255,0.14)", textAlign:"center" }}>
                Ctrl+Enter para generar · {slides.length > 0 ? `${slides.length} slides activos` : "Describí con detalle"}
              </p>
            </div>
          </div>

          {/* ── Chat section ── */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 18px 10px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Refinamiento con IA</span>
                {slides.length > 0 && <span style={{ fontSize:10, color:def.color, fontWeight:700, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:5, height:5, borderRadius:"50%", background:def.color, display:"inline-block", boxShadow:`0 0 6px ${def.color}` }} />Activo</span>}
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:9 }}>
              {chatMsgs.length === 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:7, paddingTop:6 }}>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.22)", lineHeight:1.7, marginBottom:2 }}>
                    Después de generar, pedí cambios precisos:
                  </p>
                  {[
                    "Cambia todos los títulos para que sean más impactantes",
                    "Agrega una slide de métricas con datos reales",
                    "Ajusta el tono a más corporativo y formal",
                  ].map((s, i) => (
                    <button key={i} onClick={() => slides.length > 0 && setChatInput(s)}
                      style={{ padding:"8px 12px", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, color:"rgba(255,255,255,0.32)", fontSize:11.5, cursor: slides.length > 0 ? "pointer" : "default", textAlign:"left", lineHeight:1.55, transition:"all 0.15s" }}
                      onMouseEnter={e => slides.length > 0 && (e.currentTarget.style.background="rgba(255,255,255,0.05)")}
                      onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.025)"}>
                      "{s}"
                    </button>
                  ))}
                </div>
              )}
              {chatMsgs.map((m, i) => <ChatMsg key={i} msg={m} accentColor={def.color} />)}
              {chatLoading && (
                <div style={{ display:"flex", gap:8, alignSelf:"flex-start" }}>
                  <div style={{ width:26, height:26, borderRadius:8, background:`linear-gradient(135deg,${def.color},#EC4899)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.5"><path d="M6 1l1 3.2H10l-2.6 1.9.9 3L6 7.2 3.7 9.1l.9-3L2 4.2h3z"/></svg>
                  </div>
                  <div style={{ display:"flex", gap:"5px", alignItems:"center", padding:"10px 0" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#7C6AF7", animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            <div style={{ padding:"10px 16px 16px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex", gap:8 }}>
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendChat())}
                  disabled={slides.length === 0}
                  rows={2}
                  placeholder={slides.length > 0 ? "Describí exactamente qué cambiar..." : "Generá slides primero"}
                  style={{
                    flex:1, background:"rgba(255,255,255,0.04)",
                    border:`1px solid ${chatFocused ? def.color+"60" : "rgba(255,255,255,0.07)"}`,
                    borderRadius:9, color:"rgba(255,255,255,0.9)", fontFamily:"inherit", fontSize:12.5,
                    padding:"9px 12px", outline:"none", resize:"none",
                    opacity: slides.length > 0 ? 1 : 0.45,
                    transition:"border-color 0.15s", lineHeight:1.6,
                  }}
                  onFocus={() => setChatFocused(true)}
                  onBlur={() => setChatFocused(false)} />
                <button onClick={sendChat} disabled={slides.length === 0 || !chatInput.trim() || chatLoading}
                  style={{
                    padding:"9px 14px",
                    background: slides.length > 0 && chatInput.trim() ? `linear-gradient(135deg,${def.color},${def.color}BB)` : "rgba(255,255,255,0.05)",
                    border:"none", borderRadius:9, color:"#fff", fontSize:18, cursor: slides.length > 0 && chatInput.trim() ? "pointer" : "not-allowed",
                    opacity: slides.length > 0 && chatInput.trim() ? 1 : 0.3,
                    transition:"all 0.15s", alignSelf:"stretch", display:"flex", alignItems:"center",
                    boxShadow: slides.length > 0 && chatInput.trim() ? `0 4px 14px ${def.color}40` : "none",
                  }}>
                  →
                </button>
              </div>
              <p style={{ fontSize:10.5, color:"rgba(255,255,255,0.14)", marginTop:6 }}>Enter para enviar · Shift+Enter nueva línea</p>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
