# Figma AI — Generador de Plantillas con IA

Genera plantillas visuales (presentaciones, posts, flyers, logos, banners, infografías) con IA y conecta con Figma para importar/exportar diseños.

---

## Deploy en Railway (gratis)

### 1. Backend

1. En Railway → **New Project** → **GitHub Repository**
2. Seleccioná `figma-ai-generator` → carpeta `backend`
3. En **Variables** agregá:
   ```
   FIGMA_ACCESS_TOKEN=figd__fUvD3WYK4o3AW7h6J83lvTj1CJp6RSoKKr6_-F0
   ANTHROPIC_API_KEY=sk-ant-TU_KEY_AQUI
   PORT=3001
   ```
4. Railway te da una URL como `https://figma-ai-backend.up.railway.app`
5. Guardá esa URL

### 2. Frontend

1. En Railway → **New Project** → **GitHub Repository**
2. Seleccioná `figma-ai-generator` → carpeta `frontend`
3. En **Variables** agregá:
   ```
   VITE_BACKEND_URL=https://figma-ai-backend.up.railway.app
   ```
4. Deploy → Railway te da otra URL para el frontend

### 3. Actualizar CORS

En el backend, agregá la URL del frontend a la variable:
```
FRONTEND_URL=https://figma-ai-frontend.up.railway.app
```

---

## Funcionalidades

- **Crear plantillas**: Elegí tipo (presentación, post, flyer, logo, banner, infografía) → describí qué necesitás → la IA genera todos los slides
- **Importar de Figma**: Conectá tu cuenta y traé archivos existentes
- **Chat de refinamiento**: Pedí cambios en lenguaje natural
- **Exportar PDF**: Imprime/exporta desde el navegador
- **Exportar JSON**: Guarda el diseño como archivo

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `FIGMA_ACCESS_TOKEN` | Token de Figma (figma.com → Settings → Personal access tokens) |
| `ANTHROPIC_API_KEY` | Key de Claude (console.anthropic.com) |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `VITE_BACKEND_URL` | URL del backend (para el frontend) |
