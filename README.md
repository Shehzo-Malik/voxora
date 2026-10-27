# Voxora - AI Assistant

Static web app (HTML + CSS + JS). No build step.

```
voxora/
├── public/                 <- the website (this folder is what gets published)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── config.js       <- the ONLY file you normally edit (proxy URL, Google client ID)
│       ├── core.js         <- constants, prompts, helpers
│       ├── theme.js        <- themes, dark/light, model picker
│       ├── auth.js         <- login, accounts, memory
│       ├── chat.js         <- chats, file upload, markdown rendering
│       └── ai.js           <- Gemini / free chat / free images / map data / send flow
├── worker/worker.js        <- Cloudflare Worker that hides your Gemini key
├── .github/workflows/pages.yml   <- auto-deploy to GitHub Pages
├── Dockerfile  nginx.conf  docker-compose.yml  .dockerignore
└── .gitignore  README.md
```

## Run locally
- Double-click `public/index.html`, or
- Docker: `docker compose up --build` then open http://localhost:8080

## Deploy
1. Push to GitHub (branch `main`).
2. Repo > Settings > Pages > Source: **GitHub Actions**.
3. Site: `https://<username>.github.io/<repo>/`

## Secret key
Never commit a real API key. Deploy `worker/worker.js` on Cloudflare, add `GEMINI_KEYS` as a Secret,
and put the Worker URL in `public/js/config.js` as `PROXY_URL`.
