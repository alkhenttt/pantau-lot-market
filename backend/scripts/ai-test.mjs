// Mencari model Gemini yang cepat & berfungsi untuk API key kamu: npm run ai:test
import "dotenv/config";
import { askGemini } from "../src/services/gemini.js";

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("✗ GEMINI_API_KEY belum diisi di backend/.env"); process.exit(1); }

let available = [];
try {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(20000) });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || "HTTP " + res.status);
  available = (j.models || []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace("models/", ""));
  console.log(`✓ API key valid. ${available.length} model tersedia.\n`);
} catch (e) {
  console.error("✗ API key / koneksi bermasalah:", e.message);
  process.exit(1);
}

// Urutan dicoba: alias terbaru & model ringan dulu (biasanya paling cepat)
const preferred = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-3.8-flash"];
const candidates = preferred.filter((m) => available.includes(m));
console.log("Mencoba model satu per satu (maks. 25 detik tiap model)…\n");

process.env.GEMINI_TIMEOUT_MS = "25000";
for (const model of candidates) {
  process.env.GEMINI_MODEL = model;
  const t = Date.now();
  try {
    const text = await askGemini("Jelaskan dalam 2 kalimat apa itu 1 lot saham di BEI.");
    const s = ((Date.now() - t) / 1000).toFixed(1);
    console.log(`✓ ${model}  berhasil dalam ${s} detik`);
    console.log(`\nJawaban contoh: ${text}\n`);
    console.log(`>>> Tulis ini di backend/.env lalu restart (Ctrl+C, npm run dev):\n    GEMINI_MODEL=${model}\n`);
    process.exit(0);
  } catch (e) {
    console.log(`✗ ${model}  gagal setelah ${((Date.now() - t) / 1000).toFixed(1)} detik: ${e.message.slice(0, 120)}`);
  }
}
console.error("\nTidak ada model yang berhasil. Kirim hasil di atas ke saya.");
process.exit(1);
