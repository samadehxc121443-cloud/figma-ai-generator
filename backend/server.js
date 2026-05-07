require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://figma-ai-frontend.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const claudeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use("/api/", apiLimiter);
app.use("/api/claude/", claudeLimiter);

// ── HEALTH ────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    figma_configured: !!process.env.FIGMA_ACCESS_TOKEN,
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
  });
});

// ── FIGMA PROXY ───────────────────────────────────────────────────────────
const figma = axios.create({
  baseURL: "https://api.figma.com/v1",
  headers: { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN },
});

// GET /api/figma/me — user info
app.get("/api/figma/me", async (req, res) => {
  try {
    const r = await figma.get("/me");
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// GET /api/figma/projects — list user projects
app.get("/api/figma/projects", async (req, res) => {
  try {
    const me = await figma.get("/me");
    const teamId = me.data.id;
    const r = await figma.get(`/users/${teamId}/projects`);
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// GET /api/figma/files — list recent files
app.get("/api/figma/files", async (req, res) => {
  try {
    const r = await figma.get("/me/files");
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// GET /api/figma/file/:key — get file details
app.get("/api/figma/file/:key", async (req, res) => {
  try {
    const r = await figma.get(`/files/${req.params.key}`);
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// GET /api/figma/file/:key/images — get rendered images
app.get("/api/figma/file/:key/images", async (req, res) => {
  try {
    const { ids, scale, format } = req.query;
    const r = await figma.get(`/images/${req.params.key}`, {
      params: { ids, scale: scale || 1, format: format || "png" }
    });
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// GET /api/figma/file/:key/thumbnails — get file thumbnail
app.get("/api/figma/file/:key/thumbnails", async (req, res) => {
  try {
    const r = await figma.get(`/files/${req.params.key}/thumbnails`);
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

// POST /api/figma/file/:key/comments — add comment
app.post("/api/figma/file/:key/comments", async (req, res) => {
  try {
    const r = await figma.post(`/files/${req.params.key}/comments`, req.body);
    res.json(r.data);
  } catch (e) { handleFigmaError(e, res); }
});

function handleFigmaError(err, res) {
  console.error("Figma error:", err.response?.status, err.response?.data?.message || err.message);
  if (err.response?.status === 403) return res.status(403).json({ error: "Token de Figma inválido o sin permisos" });
  if (err.response?.status === 404) return res.status(404).json({ error: "Archivo no encontrado en Figma" });
  res.status(err.response?.status || 500).json({ error: err.response?.data?.message || "Error en Figma API" });
}

// ── ANTHROPIC PROXY ───────────────────────────────────────────────────────
app.post("/api/claude", async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada" });
  }
  try {
    const r = await axios.post(
      "https://api.anthropic.com/v1/messages",
      req.body,
      {
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );
    res.json(r.data);
  } catch (e) {
    if (e.response?.status === 429) return res.status(429).json({ error: "Rate limit alcanzado. Espera un momento." });
    res.status(e.response?.status || 500).json({ error: e.response?.data?.error?.message || "Error en Claude API" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Figma AI Backend en puerto ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`🎨 Figma: ${process.env.FIGMA_ACCESS_TOKEN ? "configurado" : "❌ falta FIGMA_ACCESS_TOKEN"}`);
  console.log(`🤖 Claude: ${process.env.ANTHROPIC_API_KEY ? "configurado" : "❌ falta ANTHROPIC_API_KEY"}\n`);
});

