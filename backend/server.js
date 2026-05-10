require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "https://figma-ai-frontend.onrender.com",
    "https://figma-ai-generator-8c58-j4gsfeact.vercel.app",
    "https://slides-generator.vercel.app",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/api/", apiLimiter);
app.use("/api/claude/", aiLimiter);

// ── HEALTH ────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── FIGMA PROXY ───────────────────────────────────────────────────────────
const figma = axios.create({
  baseURL: "https://api.figma.com/v1",
  headers: { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN },
});

app.get("/api/figma/me", async (req, res) => {
  try { res.json((await figma.get("/me")).data); }
  catch (e) { handleFigmaError(e, res); }
});

app.get("/api/figma/files", async (req, res) => {
  try { res.json((await figma.get("/me/files")).data); }
  catch (e) { handleFigmaError(e, res); }
});

app.get("/api/figma/file/:key", async (req, res) => {
  try { res.json((await figma.get(`/files/${req.params.key}`)).data); }
  catch (e) { handleFigmaError(e, res); }
});

app.get("/api/figma/file/:key/images", async (req, res) => {
  try {
    const { ids, scale, format } = req.query;
    res.json((await figma.get(`/images/${req.params.key}`, { params: { ids, scale: scale || 1, format: format || "png" } })).data);
  } catch (e) { handleFigmaError(e, res); }
});

function handleFigmaError(err, res) {
  console.error("Figma error:", err.response?.status, err.response?.data?.message || err.message);
  if (err.response?.status === 403) return res.status(403).json({ error: "Token de Figma inválido o sin permisos" });
  if (err.response?.status === 404) return res.status(404).json({ error: "Archivo no encontrado en Figma" });
  res.status(err.response?.status || 500).json({ error: err.response?.data?.message || "Error en Figma API" });
}

// ── GROQ AI PROXY (100% gratis — llama-3.3-70b) ───────────────────────────
app.post("/api/claude", async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY no configurada en el servidor" });
  }
  try {
    const { messages, system, max_tokens } = req.body;
    const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 3000, 100), 4000);

    // Construir mensajes en formato OpenAI (que usa Groq)
    const groqMessages = [];
    if (system) groqMessages.push({ role: "system", content: system });
    if (messages) groqMessages.push(...messages);

    const r = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: safeMaxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Convertir respuesta al formato que espera el frontend (compatible con Anthropic)
    const text = r.data.choices[0].message.content;
    res.json({ content: [{ type: "text", text }] });

  } catch (e) {
    console.error("Groq error:", e.response?.status, e.response?.data);
    if (e.response?.status === 429) return res.status(429).json({ error: "Rate limit alcanzado. Espera un momento." });
    if (e.response?.status === 401) return res.status(401).json({ error: "GROQ_API_KEY inválida" });
    res.status(e.response?.status || 500).json({ error: e.response?.data?.error?.message || "Error en AI API" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Figma AI Backend en puerto ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`🎨 Figma: ${process.env.FIGMA_ACCESS_TOKEN ? "✅ configurado" : "❌ falta"}`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? "✅ configurado" : "❌ falta"}\n`);
});


