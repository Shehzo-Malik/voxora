/* ============ OWNER CONFIG (edit only this block) ============ */
const CONFIG={
  API_KEY:"",          // DO NOT put your real key here on a public GitHub repo. Use PROXY_URL (see worker/worker.js) instead.
  PROXY_URL:"",        // Your Cloudflare Worker URL, e.g. "https://voxora-api.shehzalmalik9.workers.dev"
  API_KEYS:[],         // Optional: extra Gemini keys. When one hits its free limit, the next one is used automatically.
  GOOGLE_CLIENT_ID:"", // Optional: enables "Continue with Google" (Gmail) - easiest setup, no Firebase needed.
  FREE_CHAT:true,      // true = when the Gemini limit is reached (or there is no key) chat continues through a free service
  FREE_IMAGES:true,    // true = images are generated for free first (no key needed)
  FIREBASE:{apiKey:"",authDomain:"",projectId:"",appId:""}   // Optional: Google / Apple sign-in through Firebase
};
/* =============================================================== */
