import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "./api.js";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const Spinner = ({ size = 14, color = "#fff" }) => (
  <div style={{ width: size, height: size, border: `2px solid ${color}25`,
    borderTopColor: color, borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0 }} />
);

function Toast({ t }) {
  if (!t) return null;
  const ok = t.type === "success";
  return (
    <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
      padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 9999,
      animation: "toastIn .25s ease", whiteSpace: "nowrap", backdropFilter: "blur(12px)",
      background: ok ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)",
      border: `1px solid ${ok ? "rgba(16,185,129,.35)" : "rgba(239,68,68,.35)"}`,
      color: ok ? "#34D399" : "#FC8181" }}>
      {ok ? "✓ " : "⚠ "}{t.msg}
    </div>
  );
}

const TEMPLATE_TYPES = [
  { id: "presentation", label: "Presentación", icon: "🖥", desc: "Slides profesionales", color: "#7C6AF7" },
  { id: "social", label: "Redes Sociales", icon: "📱", desc: "Posts e historias", color: "#EC4899" },
  { id: "flyer", label: "Flyer / Afiche", icon: "📄", desc: "Promociones y eventos", color: "#F59E0B" },
  { id: "logo", label: "Logo / Branding", icon: "✦", desc: "Identidad visual", color: "#10B981" },
  { id: "banner", label: "Banner Web", icon: "🖼", desc: "Banners y headers", color: "#06B6D4" },
  { id: "infographic", label: "Infografía", icon: "📊", desc: "Datos visualizados", color: "#F76C8A" },
];

// ─── FIGMA FILE CARD ──────────────────────────────────────────────────────────
function FigmaFileCard({ file, onSelect, selected }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(file)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: selected ? "rgba(124,106,247,.12)" : hov ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.025)",
        border: `1px solid ${selected ? "rgba(124,106,247,.4)" : hov ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.07)"}`,
        borderRadius: 12, padding: "12px 14px", cursor: "pointer", transition: "all .2s",
        display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 44, height: 44, background: selected ? "rgba(124,106,247,.2)" : "rgba(255,255,255,.06)",
        borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={selected ? "#9D8EFF" : "rgba(255,255,255,.4)"} strokeWidth="1.5">
          <rect x="3" y="3" width="14" height="14" rx="3"/>
          <path d="M7 8h6M7 11h4"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "#9D8EFF" : "rgba(255,255,255,.75)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 2 }}>
          {file.last_modified ? new Date(file.last_modified).toLocaleDateString("es") : "Figma"}
        </div>
      </div>
      {selected && (
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#7C6AF7",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M2 5l2.5 2.5L8 3"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── PREVIEW CARD ─────────────────────────────────────────────────────────────
function PreviewCard({ slide, index, selected, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(index)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: selected ? "rgba(124,106,247,.1)" : hov ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)",
        border: `1px solid ${selected ? "rgba(124,106,247,.4)" : hov ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.06)"}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all .2s",
        animation: `fadeUp .4s ease ${index * 60}ms both`,
        boxShadow: selected ? "0 0 0 1px rgba(124,106,247,.3), 0 4px 24px rgba(124,106,247,.1)" : "none" }}>
      {/* Slide preview */}
      <div style={{ aspectRatio: "16/9", background: slide.bg || "#1A1A2E",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${slide.color}15, transparent)` }} />
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120,
          borderRadius: "50%", background: `${slide.color}10` }} />
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "1.5px", color: slide.color, marginBottom: 10, zIndex: 1 }}>
          {slide.type}
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", textAlign: "center",
          lineHeight: 1.3, zIndex: 1, letterSpacing: "-0.3px" }}>
          {slide.title}
        </div>
        {slide.subtitle && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 8,
            textAlign: "center", lineHeight: 1.6, zIndex: 1 }}>
            {slide.subtitle}
          </div>
        )}
        {slide.elements && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, zIndex: 1 }}>
            {slide.elements.map((el, i) => (
              <div key={i} style={{ padding: "4px 10px", background: `${slide.color}25`,
                border: `1px solid ${slide.color}40`, borderRadius: 20,
                fontSize: 10, color: slide.color, fontWeight: 600 }}>
                {el}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Slide info */}
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.6)" }}>
            Slide {index + 1}
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.25)", marginTop: 1 }}>
            {slide.type}
          </div>
        </div>
        {selected && (
          <span style={{ fontSize: 10, color: "#9D8EFF", fontWeight: 700 }}>Seleccionado</span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("create"); // create | import
  const [templateType, setTemplateType] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [slides, setSlides] = useState([]);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [projectTitle, setProjectTitle] = useState("Mi Diseño");
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Figma import
  const [figmaFiles, setFigmaFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importedSlides, setImportedSlides] = useState([]);

  // Chat
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [backendOk, setBackendOk] = useState(null);
  const chatEnd = useRef(null);

  const showToast = useCallback((msg, type = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  // Check backend on load
  useEffect(() => {
    api.health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  // Load Figma files when switching to import view
  useEffect(() => {
    if (view === "import" && figmaFiles.length === 0) {
      setLoadingFiles(true);
      api.figmaFiles()
        .then(d => setFigmaFiles(d.files || d.projects || []))
        .catch(() => showToast("Error al cargar archivos de Figma"))
        .finally(() => setLoadingFiles(false));
    }
  }, [view]);

  // ── Generate slides ─────────────────────────────────────────────────────────
  const generateSlides = async () => {
    if (!prompt.trim()) { showToast("Describe qué querés generar"); return; }
    if (!templateType) { showToast("Seleccioná un tipo de plantilla"); return; }
    setGenerating(true); setSlides([]); setChatMsgs([]);
    try {
      const typeDef = TEMPLATE_TYPES.find(t => t.id === templateType);
      const raw = await api.claude({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        system: `Eres un diseñador gráfico experto especializado en crear plantillas visuales para ${typeDef.label}. Responde ÚNICAMENTE con JSON válido, sin backticks ni texto adicional.`,
        messages: [{
          role: "user",
          content: `Crea una plantilla de ${typeDef.label} para: "${prompt}"

Genera entre 4-8 slides/secciones según el tipo. Devuelve un JSON con esta estructura exacta:
{
  "title": "título del proyecto",
  "slides": [
    {
      "type": "tipo de slide (ej: Portada, Introducción, Sección, Conclusión)",
      "title": "título principal del slide",
      "subtitle": "subtítulo o descripción breve (opcional)",
      "content": "contenido principal o puntos clave separados por | ",
      "elements": ["etiqueta1", "etiqueta2"],
      "color": "#hexcolor (usa colores vibrantes que combinen entre sí)",
      "bg": "#hexcolor oscuro para el fondo"
    }
  ],
  "palette": ["#color1", "#color2", "#color3"],
  "style": "descripción del estilo visual en una línea"
}`
        }]
      });
      const result = JSON.parse(raw.content[0].text.replace(/```json|```/g, "").trim());
      setSlides(result.slides || []);
      setProjectTitle(result.title || prompt);
      setSelectedSlide(0);
      const id = Date.now();
      setHistory(h => [{ id, title: result.title || prompt, type: typeDef.label, color: typeDef.color, ts: new Date(), slides: result.slides }, ...h.slice(0, 19)]);
      setChatMsgs([{ role: "ai", content: `Plantilla "${result.title}" generada con ${result.slides?.length} slides. Estilo: ${result.style || "profesional"}. ¿Querés cambiar algo?` }]);
      showToast("Plantilla generada exitosamente", "success");
    } catch (e) { showToast(e.message || "Error al generar"); }
    setGenerating(false);
  };

  // ── Import from Figma ───────────────────────────────────────────────────────
  const importFromFigma = async (file) => {
    setSelectedFile(file);
    setGenerating(true);
    try {
      const fileData = await api.figmaFile(file.key || file.id);
      const pages = fileData.document?.children || [];
      const slides = pages.slice(0, 8).map((page, i) => ({
        type: page.type === "CANVAS" ? "Página" : page.type,
        title: page.name,
        subtitle: `${page.children?.length || 0} elementos`,
        content: page.children?.slice(0, 3).map(c => c.name).join(" | ") || "",
        elements: page.children?.slice(0, 3).map(c => c.type) || [],
        color: ["#7C6AF7", "#EC4899", "#06B6D4", "#10B981", "#F59E0B"][i % 5],
        bg: "#0F0F1A",
        figmaNodeId: page.id,
      }));
      setImportedSlides(slides);
      setSlides(slides);
      setProjectTitle(fileData.name || file.name);
      setSelectedSlide(0);
      setChatMsgs([{ role: "ai", content: `Importé "${fileData.name}" desde Figma con ${slides.length} páginas. ¿Querés que la IA mejore o modifique algo?` }]);
      showToast("Archivo importado exitosamente", "success");
    } catch (e) { showToast(`Error al importar: ${e.message}`); }
    setGenerating(false);
  };

  // ── Chat refinement ─────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || slides.length === 0) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(m => [...m, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const ctx = slides.map((s, i) => `Slide ${i + 1} (${s.type}): ${s.title} — ${s.content || ""}`).join("\n");
      const raw = await api.claude({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `Eres un diseñador gráfico refinando una plantilla visual. El diseño actual:\n${ctx}\n\nCuando pidan cambios, responde ÚNICAMENTE con JSON: {"slides": [...slides modificados...], "message": "descripción del cambio"}. Solo incluye las slides que cambien, manteniendo todos los campos. Sin backticks.`,
        messages: [{ role: "user", content: msg }],
      });
      const text = raw.content[0].text.replace(/```json|```/g, "").trim();
      try {
        const result = JSON.parse(text);
        if (result.slides && Array.isArray(result.slides)) {
          setSlides(prev => {
            const updated = [...prev];
            result.slides.forEach(newSlide => {
              const idx = prev.findIndex((s, i) => i === (result.slideIndex || 0) || s.title === newSlide.title);
              if (idx >= 0) updated[idx] = { ...updated[idx], ...newSlide };
            });
            return updated;
          });
          setChatMsgs(m => [...m, { role: "ai", content: result.message || "Cambios aplicados. ¿Algo más?" }]);
        } else {
          setChatMsgs(m => [...m, { role: "ai", content: text.length < 400 ? text : "Cambios aplicados. ¿Algo más?" }]);
        }
      } catch (_) {
        setChatMsgs(m => [...m, { role: "ai", content: text.length < 400 ? text : "Cambios aplicados." }]);
      }
    } catch (e) {
      setChatMsgs(m => [...m, { role: "ai", content: `Error: ${e.message}` }]);
    }
    setChatLoading(false);
  };

  const resetAll = () => { setSlides([]); setPrompt(""); setSelectedSlide(null); setChatMsgs([]); setSelectedFile(null); setTemplateType(null); };

  const currentSlide = slides[selectedSlide];

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#080810", color: "#E8E8F0",
      fontFamily: "'Inter',system-ui,sans-serif", fontSize: 13, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}
        textarea,input{font-family:'Inter',system-ui,sans-serif;color-scheme:dark}
        textarea::placeholder,input::placeholder{color:rgba(255,255,255,.2)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @media print{.np{display:none!important}body{background:white!important}}
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <div className="np" style={{ width: 234, minWidth: 234, background: "rgba(255,255,255,.02)",
        borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#7C6AF7,#EC4899)",
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 16px rgba(124,106,247,.4)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6">
                <rect x="1" y="3" width="14" height="10" rx="2"/>
                <path d="M5 3V2M11 3V2M1 7h14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px" }}>Figma AI</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.28)", marginTop: 1 }}>Generador de Plantillas</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px",
            background: backendOk === true ? "rgba(16,185,129,.07)" : backendOk === false ? "rgba(239,68,68,.07)" : "rgba(255,255,255,.03)",
            border: `1px solid ${backendOk === true ? "rgba(16,185,129,.2)" : backendOk === false ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.07)"}`,
            borderRadius: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: backendOk === true ? "#10B981" : backendOk === false ? "#EF4444" : "rgba(255,255,255,.3)",
              animation: backendOk === true ? "pulse 2.5s infinite" : "none",
              boxShadow: backendOk === true ? "0 0 8px #10B98180" : "none" }} />
            <span style={{ fontSize: 11.5, fontWeight: 600,
              color: backendOk === true ? "#34D399" : backendOk === false ? "#FC8181" : "rgba(255,255,255,.3)" }}>
              {backendOk === null ? "Conectando..." : backendOk ? "Figma conectado" : "Backend offline"}
            </span>
          </div>
          {backendOk === false && (
            <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.25)", marginTop: 8, lineHeight: 1.65 }}>
              Configura VITE_BACKEND_URL en el frontend.
            </p>
          )}
        </div>

        {/* View toggle */}
        <div style={{ padding: "12px 12px 8px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: 3 }}>
            {[["create", "Crear nuevo"], ["import", "Importar de Figma"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ flex: 1, padding: "7px 8px", borderRadius: 8, border: "none",
                  background: view === v ? "rgba(124,106,247,.2)" : "transparent",
                  color: view === v ? "#9D8EFF" : "rgba(255,255,255,.35)",
                  cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: view === v ? 700 : 400,
                  transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
          {history.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 8px" }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,.22)",
                  textTransform: "uppercase", letterSpacing: "0.9px" }}>Historial ({history.length})</span>
                {confirmClear
                  ? <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setHistory([]); setConfirmClear(false); }}
                        style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Borrar todo</button>
                      <button onClick={() => setConfirmClear(false)}
                        style={{ fontSize: 10, color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>No</button>
                    </div>
                  : <button onClick={() => setConfirmClear(true)}
                      style={{ fontSize: 10, color: "rgba(255,255,255,.18)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .15s" }}
                      onMouseEnter={e => e.target.style.color = "#EF4444"}
                      onMouseLeave={e => e.target.style.color = "rgba(255,255,255,.18)"}>
                      Limpiar
                    </button>
                }
              </div>
              {history.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
                  borderRadius: 9, cursor: "pointer", marginBottom: 2, transition: "background .15s" }}
                  onClick={() => { setSlides(h.slides); setProjectTitle(h.title); setSelectedSlide(0); }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.52)", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{h.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 1 }}>
                      {h.type} · {h.ts.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {deleteId === h.id
                    ? <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={e => { e.stopPropagation(); setHistory(hh => hh.filter(i => i.id !== h.id)); setDeleteId(null); }}
                          style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Sí</button>
                        <button onClick={e => { e.stopPropagation(); setDeleteId(null); }}
                          style={{ fontSize: 10, color: "rgba(255,255,255,.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>No</button>
                      </div>
                    : <button onClick={e => { e.stopPropagation(); setDeleteId(h.id); }}
                        style={{ color: "rgba(255,255,255,.1)", background: "none", border: "none", cursor: "pointer",
                          padding: 3, borderRadius: 5, display: "flex", alignItems: "center", transition: "all .15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.1)"; e.currentTarget.style.background = "none"; }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M1 2.5h9M3.5 2.5V1.5h4v1M2 2.5l.7 7h5.6l.7-7"/>
                        </svg>
                      </button>
                  }
                </div>
              ))}
            </>
          )}
        </div>

        <button onClick={resetAll}
          style={{ margin: 12, padding: "10px", background: "rgba(124,106,247,.12)",
            border: "1px solid rgba(124,106,247,.2)", borderRadius: 12, color: "#9D8EFF",
            fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(124,106,247,.12)"}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
          </svg>
          Nuevo diseño
        </button>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <div className="np" style={{ height: 54, borderBottom: "1px solid rgba(255,255,255,.06)",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
          background: "rgba(255,255,255,.01)" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
            {slides.length > 0 ? projectTitle : "Figma AI Generator"}
          </span>
          {slides.length > 0 && (
            <span style={{ padding: "2px 9px", background: "rgba(16,185,129,.1)",
              border: "1px solid rgba(16,185,129,.22)", borderRadius: 20, fontSize: 10.5,
              color: "#34D399", fontWeight: 700 }}>{slides.length} slides</span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {slides.length > 0 && (
              <>
                <button onClick={() => window.print()}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.5)", fontSize: 12,
                    fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center",
                    gap: 5, fontWeight: 500, transition: "all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.5)"; e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2.5 1.5h7V4h-7zM1 4h10v5H8.5V10h-5V9H1z"/>
                  </svg>
                  Exportar PDF
                </button>
                <button
                  onClick={() => {
                    const data = { title: projectTitle, slides };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `${projectTitle.replace(/\s+/g, "-")}.json`; a.click();
                    showToast("Diseño exportado como JSON", "success");
                  }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(124,106,247,.3)",
                    background: "rgba(124,106,247,.12)", color: "#9D8EFF", fontSize: 12,
                    fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center",
                    gap: 5, fontWeight: 600, transition: "all .15s" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 1v7M3 5l3 3 3-3M1 10h10"/>
                  </svg>
                  Exportar JSON
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Preview area */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, minWidth: 0 }}>
            {slides.length === 0 && !generating ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 28, textAlign: "center", padding: 40 }}>
                <div style={{ width: 90, height: 90, border: "1.5px dashed rgba(255,255,255,.08)",
                  borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.4">
                    <rect x="3" y="8" width="32" height="22" rx="4"/>
                    <path d="M12 8V6M26 8V6M3 16h32"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,.55)",
                    marginBottom: 10, letterSpacing: "-0.5px" }}>
                    {view === "create" ? "Genera una plantilla con IA" : "Importa desde Figma"}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.2)", maxWidth: 340, lineHeight: 1.85 }}>
                    {view === "create"
                      ? "Elegí el tipo de plantilla, describí lo que necesitás y la IA lo genera automáticamente."
                      : "Seleccioná un archivo de tu cuenta de Figma para importarlo y editarlo con IA."}
                  </div>
                </div>
              </div>
            ) : generating ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 20 }}>
                <div style={{ width: 60, height: 60, border: "3px solid rgba(124,106,247,.2)",
                  borderTopColor: "#7C6AF7", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.5)" }}>
                  Generando tu plantilla...
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>La IA está diseñando tus slides</div>
              </div>
            ) : (
              <div style={{ animation: "fadeUp .3s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <input value={projectTitle} onChange={e => setProjectTitle(e.target.value)}
                    style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20,
                      fontWeight: 900, fontFamily: "inherit", outline: "none", flex: 1, letterSpacing: "-0.5px" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)", flexShrink: 0 }}>
                    {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {slides.map((slide, i) => (
                    <PreviewCard key={i} slide={slide} index={i}
                      selected={selectedSlide === i} onSelect={setSelectedSlide} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="np" style={{ width: 314, minWidth: 314, borderLeft: "1px solid rgba(255,255,255,.06)",
            display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {view === "create" ? (
              <>
                {/* Template type selector */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)",
                    textTransform: "uppercase", letterSpacing: "0.85px", marginBottom: 10 }}>
                    Tipo de plantilla
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {TEMPLATE_TYPES.map(t => (
                      <button key={t.id} onClick={() => setTemplateType(t.id)}
                        style={{ padding: "9px 10px", background: templateType === t.id ? `${t.color}18` : "rgba(255,255,255,.03)",
                          border: `1px solid ${templateType === t.id ? t.color + "45" : "rgba(255,255,255,.07)"}`,
                          borderRadius: 10, color: templateType === t.id ? t.color : "rgba(255,255,255,.4)",
                          cursor: "pointer", fontFamily: "inherit", fontWeight: templateType === t.id ? 700 : 400,
                          transition: "all .15s", textAlign: "left" }}>
                        <div style={{ fontSize: 16, marginBottom: 3 }}>{t.icon}</div>
                        <div style={{ fontSize: 11.5 }}>{t.label}</div>
                        <div style={{ fontSize: 10, opacity: .6, marginTop: 1 }}>{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)",
                    textTransform: "uppercase", letterSpacing: "0.85px", marginBottom: 10 }}>
                    Describe qué necesitás
                  </div>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && e.ctrlKey && generateSlides()} rows={4}
                    placeholder={"Describí tu diseño...\n\nEj: Presentación de ventas para empresa de tecnología, estilo moderno y oscuro"}
                    style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                      borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 12.5,
                      padding: "10px 12px", resize: "none", outline: "none", lineHeight: 1.7, transition: "border-color .15s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(124,106,247,.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.07)"} />
                  <button onClick={generateSlides} disabled={generating}
                    style={{ width: "100%", marginTop: 9, padding: "10px",
                      background: generating ? "rgba(124,106,247,.3)" : "linear-gradient(135deg,#7C6AF7,#7C6AF7BB)",
                      border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700,
                      fontFamily: "inherit", cursor: generating ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: generating ? "none" : "0 4px 18px rgba(124,106,247,.35)", opacity: generating ? .7 : 1 }}>
                    {generating ? <><Spinner /> Generando...</> : <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M6.5 1l1.1 3.6H11l-2.8 2 1 3.2-2.8-2-2.8 2 1-3.2L2 4.6h3.4z"/>
                      </svg>
                      Generar plantilla
                    </>}
                  </button>
                  <p style={{ fontSize: 10.5, color: "rgba(255,255,255,.14)", textAlign: "center", marginTop: 6 }}>
                    Ctrl+Enter para generar
                  </p>
                </div>
              </>
            ) : (
              /* Import from Figma */
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", flex: loadingFiles ? 1 : "none" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)",
                  textTransform: "uppercase", letterSpacing: "0.85px", marginBottom: 12 }}>
                  Tus archivos de Figma
                </div>
                {loadingFiles ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: 30, color: "rgba(255,255,255,.3)", fontSize: 13 }}>
                    <Spinner color="#7C6AF7" /> Cargando archivos...
                  </div>
                ) : figmaFiles.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 12.5, lineHeight: 1.7 }}>
                    No se encontraron archivos.<br/>Asegurate que el backend esté corriendo y el token de Figma esté configurado.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                    {figmaFiles.map((file, i) => (
                      <FigmaFileCard key={i} file={file} selected={selectedFile?.key === file.key}
                        onSelect={importFromFigma} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px 9px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.22)",
                  textTransform: "uppercase", letterSpacing: "0.85px" }}>
                  Chat de refinamiento
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {chatMsgs.length === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 8 }}>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,.18)", lineHeight: 1.6 }}>
                      Después de generar podés pedir cambios:
                    </p>
                    {["Cambia los colores a tonos azules", "Hacé el estilo más minimalista", "Agregá una slide de testimonios"].map((s, i) => (
                      <button key={i} onClick={() => slides.length > 0 && setChatInput(s)}
                        style={{ padding: "8px 12px", background: "rgba(255,255,255,.025)",
                          border: "1px solid rgba(255,255,255,.06)", borderRadius: 9,
                          color: "rgba(255,255,255,.28)", fontSize: 11.5, fontFamily: "inherit",
                          cursor: slides.length > 0 ? "pointer" : "default", textAlign: "left", lineHeight: 1.55,
                          transition: "all .15s" }}
                        onMouseEnter={e => slides.length > 0 && (e.currentTarget.style.background = "rgba(255,255,255,.055)")}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.025)"}>
                        "{s}"
                      </button>
                    ))}
                  </div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, animation: "fadeUp .2s ease",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "92%" }}>
                    {m.role === "ai" && (
                      <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#7C6AF7,#EC4899)",
                        borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" strokeWidth="1.4">
                          <path d="M5.5 1l.9 2.8H9l-2.1 1.5.8 2.4-2.1-1.5-2.1 1.5.8-2.4L2.3 3.8h2.3z"/>
                        </svg>
                      </div>
                    )}
                    <div style={{ padding: "9px 12px",
                      borderRadius: m.role === "ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                      fontSize: 12, lineHeight: 1.65,
                      background: m.role === "ai" ? "rgba(255,255,255,.045)" : "rgba(124,106,247,.15)",
                      border: `1px solid ${m.role === "ai" ? "rgba(255,255,255,.07)" : "rgba(124,106,247,.3)"}`,
                      color: m.role === "ai" ? "rgba(255,255,255,.72)" : "#9D8EFF" }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
                    <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#7C6AF7,#EC4899)",
                      borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#fff" strokeWidth="1.4">
                        <path d="M5.5 1l.9 2.8H9l-2.1 1.5.8 2.4-2.1-1.5-2.1 1.5.8-2.4L2.3 3.8h2.3z"/>
                      </svg>
                    </div>
                    <div style={{ padding: "10px 14px", background: "rgba(255,255,255,.045)",
                      border: "1px solid rgba(255,255,255,.07)", borderRadius: "4px 12px 12px 12px",
                      display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, .2, .4].map((d, i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                          background: "#7C6AF7", animation: `pulse 1s infinite ${d}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                    disabled={slides.length === 0}
                    placeholder={slides.length > 0 ? "Pide un cambio..." : "Genera una plantilla primero"}
                    style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                      borderRadius: 9, color: "#fff", fontFamily: "inherit", fontSize: 12.5,
                      padding: "9px 12px", outline: "none", opacity: slides.length > 0 ? 1 : .5,
                      transition: "border-color .15s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(124,106,247,.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.07)"} />
                  <button onClick={sendChat} disabled={slides.length === 0 || !chatInput.trim() || chatLoading}
                    style={{ padding: "9px 14px", background: slides.length > 0 && chatInput.trim() ? "#7C6AF7" : "rgba(255,255,255,.05)",
                      border: "none", borderRadius: 9, color: "#fff", fontSize: 14, fontFamily: "inherit",
                      fontWeight: 700, cursor: slides.length > 0 && chatInput.trim() ? "pointer" : "not-allowed",
                      opacity: slides.length > 0 && chatInput.trim() ? 1 : .4, transition: "all .15s" }}>
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast t={toast} />
    </div>
  );
}
