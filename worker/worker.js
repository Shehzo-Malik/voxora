// Cloudflare Worker: keeps your Gemini API key(s) SECRET and rotates them on rate limits.
// Settings > Variables and secrets:
//   GEMINI_KEYS     (Secret)  one key, or several separated by commas
//   ALLOWED_ORIGINS (Text)    e.g. https://yourname.github.io   (comma separated, or * for any)
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes("*") || allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes("*") ? "*" : (ok ? origin : allowed[0]),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!ok) return new Response("Forbidden", { status: 403, headers: cors });

    const keys = (env.GEMINI_KEYS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!keys.length) return new Response("GEMINI_KEYS is not set", { status: 500, headers: cors });

    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.text() : undefined;
    const start = Math.floor(Math.random() * keys.length);
    let res;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(start + i) % keys.length];
      res = await fetch("https://generativelanguage.googleapis.com/v1beta" + url.pathname + url.search, {
        method: req.method,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body
      });
      if (res.status !== 429) break; // try next key only when this one is rate limited
    }
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) h.set(k, v);
    return new Response(res.body, { status: res.status, headers: h });
  }
};
