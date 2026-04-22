# Despliegue PymeSmart (Render + Vercel)

## Estructura recomendada

- `api/`: endpoints PHP (backend).
- `config/`: conexión DB, auth y CORS.
- `pages/`: vistas HTML multipágina.
- `assets/`: CSS/JS del frontend.
- `docker/`: arranque de contenedor para Render.
- `scripts/`: utilidades de build.
- `docs/`: documentación del proyecto.

## 1) Backend en Render

Este repo incluye `Dockerfile`, `docker/start.sh` y `render.yaml`.

Variables requeridas en Render:

- `DB_HOST`
- `DB_PORT` (ejemplo: `3306`)
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `ALLOWED_ORIGINS` (lista separada por comas, por ejemplo: `https://tu-frontend.vercel.app,http://localhost:5173`)

Notas:

- El backend corre en `https://TU-SERVICIO-RENDER.onrender.com`.
- Las APIs quedan en `https://TU-SERVICIO-RENDER.onrender.com/api/...`.

## 2) Frontend en Vercel (Vite)

Comandos:

```bash
npm install
npm run build
```

Configuración del proyecto en Vercel:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Variable en Vercel:

- `RENDER_BACKEND_URL` sin `https://`
  - Ejemplo: `mi-api-pymesmart.onrender.com`

`vercel.json` redirige:

- `/` -> `/pages/index.html`
- `/login` -> `/pages/login.html`
- `/dashboard` -> `/pages/dashboard.html`
- `/api/*` -> backend en Render

## 3) Desarrollo local

```bash
npm run dev
```

URL local:

- `http://localhost:5173/pages/index.html`
