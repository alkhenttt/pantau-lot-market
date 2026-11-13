// Hitungan lot, lembar, dan rupiah. 1 lot = 100 lembar (aturan BEI). Semua murni hitungan, tanpa AI.
export const LOT = 100;
export const digits = (v) => Number(String(v ?? "").replace(/\D/g, "")) || 0;

// src: "lots" | "shares" | "amount" (sumber yang diisi pengguna), val: angkanya,
// price: Rp per lembar, fee: biaya beli dalam % (diisi pengguna; bawaan 0)
export function calc(src, val, price, fee = 0) {
  if (!(price > 0)) return null;
  const f = Math.max(0, Number(fee) || 0) / 100;
  const lotCost = price * LOT * (1 + f);
  let lots, note = "";
  if (src === "lots") lots = Math.floor(val);
  else if (src === "shares") {
    lots = Math.floor(val / LOT);
    if (val % LOT !== 0 && val > 0) note = `BEI membeli per lot (${LOT} lembar), jadi ${val} lembar dibulatkan ke bawah menjadi ${lots} lot.`;
  } else lots = Math.floor(val / lotCost);
  lots = Math.max(0, lots);
  const shares = lots * LOT;
  const gross = shares * price;
  const feeRp = gross * f;
  const total = gross + feeRp;
  return { lots, shares, gross, feeRp, total, lotPrice: price * LOT, sisa: src === "amount" ? val - total : null, note };
}

// ===== Isi dengan kalimat (aturan sederhana, bukan AI) =====
const UNIT = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6 };
function toNum(str, unit) {
  let v;
  if (unit && /^\d+\.\d{1,2}$/.test(str)) v = Number(str); // "2.5 juta"
  else v = Number(str.replace(/\./g, "").replace(",", ".")); // "9.000" -> 9000, "2,5" -> 2.5
  if (!isFinite(v)) return null;
  return unit ? v * UNIT[unit] : v;
}

export function parseOrder(text, codes) {
  let t = ` ${String(text || "").toLowerCase()} `;
  const code = codes.map((c) => c.toLowerCase()).find((c) => new RegExp(`\\b${c}\\b`).test(t)) || null;
  const out = { code, lots: null, shares: null, amount: null, price: null };
  let m = t.match(/(?:\bdi\b|@|\bharga\b|\bseharga\b)\s*(?:rp\.?\s*)?(\d[\d.,]*)\s*(rb|ribu|k|jt|juta)?\b/);
  if (m) { out.price = toNum(m[1], m[2]); t = t.replace(m[0], " "); }
  m = t.match(/(\d[\d.,]*)\s*lot\b/);
  if (m) { out.lots = toNum(m[1]); t = t.replace(m[0], " "); }
  m = t.match(/(\d[\d.,]*)\s*(?:lembar|lbr)\b/);
  if (m) { out.shares = toNum(m[1]); t = t.replace(m[0], " "); }
  m = t.match(/(?:rp\.?\s*|modal\s*|uang\s*|dengan\s*)?(\d[\d.,]*)\s*(rb|ribu|jt|juta)\b/);
  if (m) out.amount = toNum(m[1], m[2]);
  else if ((m = t.match(/(?:rp\.?\s*|modal\s+|uang\s+)(\d[\d.,]*)/))) out.amount = toNum(m[1]);
  return out;
}

// Mengubah kalimat menjadi isian siap pakai. stocks: [{ code, symbol, price, ok }]
export function resolveOrder(text, stocks) {
  const o = parseOrder(text, stocks.map((s) => s.code));
  const st = o.code ? stocks.find((s) => s.code.toLowerCase() === o.code) : null;
  if (!st) return { error: "Kode saham tidak ditemukan. Contoh: beli 3 lot BBCA di 9000" };
  const price = o.price ?? (st.ok ? st.price : null);
  if (!(price > 0)) return { error: "Harga belum tersedia. Tulis harganya, misalnya: di 9000" };
  let src, val, lots;
  if (o.lots != null) { src = "lots"; val = Math.floor(o.lots); lots = val; }
  else if (o.shares != null) { src = "shares"; val = Math.floor(o.shares); lots = Math.floor(val / LOT); }
  else if (o.amount != null) { src = "amount"; val = Math.floor(o.amount); lots = Math.floor(val / (price * LOT)); }
  else return { error: "Jumlah tidak ditemukan. Contoh: beli 3 lot BBCA di 9000" };
  if (lots < 1) return { error: src === "amount" ? "Nominal itu belum cukup untuk 1 lot pada harga tersebut." : "Jumlah minimal 1 lot (100 lembar)." };
  return { ok: true, symbol: st.symbol, code: st.code, src, val, lots, price, usedLive: o.price == null };
}
