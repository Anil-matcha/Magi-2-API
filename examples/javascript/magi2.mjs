// Magi 2 text-to-video / image-to-video through Muapi. Node 18+ (built-in fetch).
// Usage: MUAPI_API_KEY=... node magi2.mjs "prompt" [--image URL] [--resolution 1080p] [--aspect-ratio 16:9]
const BASE = "https://api.muapi.ai/api/v1";
const key = process.env.MUAPI_API_KEY;
if (!key) { console.error("Set MUAPI_API_KEY"); process.exit(1); }

const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const prompt = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!prompt) { console.error('Usage: node magi2.mjs "prompt" [--image URL]'); process.exit(1); }

const image = opt("image");
const payload = { prompt, resolution: opt("resolution", "1080p"), aspect_ratio: opt("aspect-ratio", "16:9") };
if (image) payload.image_url = image;
const endpoint = image ? "magi-2-image-to-video" : "magi-2-text-to-video";
const headers = { "x-api-key": key, "Content-Type": "application/json" };

const sub = await fetch(`${BASE}/${endpoint}`, { method: "POST", headers, body: JSON.stringify(payload) });
if (!sub.ok) throw new Error(`submit failed: ${sub.status} ${await sub.text()}`);
const { request_id } = await sub.json();
console.log("request_id:", request_id);

for (;;) {
  const res = await fetch(`${BASE}/predictions/${request_id}/result`, { headers });
  if (!res.ok) throw new Error(`poll failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log("status:", data.status);
  if (data.status === "completed") { console.log("video:", data.outputs[0]); break; }
  if (data.status === "failed") throw new Error(`failed: ${JSON.stringify(data)}`);
  await new Promise((r) => setTimeout(r, 5000));
}
