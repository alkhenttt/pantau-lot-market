const MODEL = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

export const SYSTEM = `Kamu adalah asisten edukasi saham untuk investor ritel pemula di Indonesia.
Aturan: gunakan HANYA angka yang diberikan pengguna di pesan. Jangan mengarang harga, berita, laporan keuangan, atau fundamental.
Jangan memberi rekomendasi beli/jual/tahan dan jangan memprediksi harga. Jelaskan apa arti angka-angka itu dengan bahasa Indonesia sederhana.
Tulis teks biasa tanpa markdown (tanpa tanda bintang, pagar, atau tabel), maksimal 130 kata. Akhiri dengan satu kalimat bahwa ini edukasi, bukan saran investasi.`;

// history: [{ role: "user" | "model", text }] — riwayat obrolan sebelum pertanyaan terakhir
export async function askGemini(prompt, { system = SYSTEM, history = [] } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Object.assign(new Error("GEMINI_API_KEY belum diisi di backend/.env"), { status: 500 });

  const model = MODEL();
  const generationConfig = { maxOutputTokens: 2048 };
  if (model.startsWith("gemini-3")) {
    const level = process.env.GEMINI_THINKING_LEVEL ?? "low";
    if (level) generationConfig.thinkingConfig = { thinkingLevel: level };
  } else {
    generationConfig.temperature = 0.4;
  }

  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(Number(process.env.GEMINI_TIMEOUT_MS || 60000)),
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig,
      }),
    });
  } catch (e) {
    const timeout = e.name === "TimeoutError";
    throw Object.assign(new Error(timeout ? "Gemini terlalu lama menjawab. Coba lagi sebentar." : "Tidak bisa menghubungi Gemini. Cek koneksi internetmu."), { status: timeout ? 504 : 502 });
  }
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(j?.error?.message || `Gemini HTTP ${res.status}`), { status: 502 });
  const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw Object.assign(new Error("Gemini tidak memberi jawaban"), { status: 502 });
  return text;
}
