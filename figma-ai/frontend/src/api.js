const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
  return data;
}

export const api = {
  health: () => req("/health"),
  figmaMe: () => req("/api/figma/me"),
  figmaFiles: () => req("/api/figma/files"),
  figmaFile: (key) => req(`/api/figma/file/${key}`),
  figmaImages: (key, ids) => req(`/api/figma/file/${key}/images?ids=${ids}&format=png&scale=2`),
  claude: (body) => req("/api/claude", { method: "POST", body: JSON.stringify(body) }),
};
