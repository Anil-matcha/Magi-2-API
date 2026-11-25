// Magi 2 text / image / reference to video through Muapi ($0.10 per second of video). Node 18+ (built-in fetch).
// Usage: MUAPI_API_KEY=... node magi2.mjs "prompt" [--image URL [--last-image URL]] [--reference URL[,URL...]]
//        [--duration 5] [--aspect-ratio 16:9] [--no-audio] [--seed N]
const BASE = "https://api.muapi.ai/api/v1";
const key = process.env.MUAPI_API_KEY;
if (!key) { console.error("Set MUAPI_API_KEY"); process.exit(1); }

const argv = process.argv.slice(2);
const FLAGS = new Set(["no-audio"]);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };
const flag = (name) => argv.includes(`--${name}`);
const prompt = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1]?.startsWith("--") && !FLAGS.has(argv[i - 1].slice(2))));
if (!prompt) { console.error('Usage: node magi2.mjs "prompt" [--image URL] [--reference URL,URL]'); process.exit(1); }

const image = opt("image");
const lastImage = opt("last-image");
const references = opt("reference")?.split(",").filter(Boolean);
if (image && references) { console.error("Use either --image or --reference, not both"); process.exit(1); }

const duration = Number(opt("duration", 5));
if (!Number.isInteger(duration) || duration < 4 || duration > 30) { console.error("--duration must be a whole number from 4 to 30"); process.exit(1); }

const payload = { prompt, duration, generate_audio: !flag("no-audio") };
const ratio = opt("aspect-ratio");
if (ratio) payload.aspect_ratio = ratio;
if (opt("seed") !== undefined) payload.seed = Number(opt("seed"));

let endpoint = "magi-2-text-to-video";
if (image) {
  endpoint = "magi-2-image-to-video";
  payload.image_url = image;
  if (lastImage) payload.last_image = lastImage;
} else if (references?.length) {
  endpoint = "magi-2-reference-to-video";
  payload.images_list = references;
}
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
