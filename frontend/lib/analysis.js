// Analisis emiten sederhana. Semua dihitung dari harga penutupan & volume asli Yahoo Finance.
// closes: urut dari terlama -> terbaru. vols: opsional, panjang sama.
const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const perf = (c, back) => (c.length > back ? ((c[c.length - 1] - c[c.length - 1 - back]) / c[c.length - 1 - back]) * 100 : null);

export function analyze(closes, vols) {
  const n = closes.length;
  if (n < 6) return null;
  const last = closes[n - 1];
  const hi = Math.max(...closes), lo = Math.min(...closes);
  const pos = hi === lo ? 50 : ((last - lo) / (hi - lo)) * 100;
  const ma20 = n >= 20 ? avg(closes.slice(-20)) : null;

  // volatilitas = simpangan baku return harian (20 hari terakhir), dalam %
  const rets = [];
  for (let i = Math.max(1, n - 20); i < n; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const m = avg(rets);
  const vol = Math.sqrt(avg(rets.map((r) => (r - m) ** 2))) * 100;
  const volLabel = vol < 1.5 ? "tenang" : vol < 3 ? "sedang" : "liar";

  let volRatio = null;
  if (vols && vols.length === n && n >= 21 && vols[n - 1] > 0) {
    const prev = vols.slice(-21, -1).filter((v) => v > 0);
    if (prev.length >= 10) volRatio = vols[n - 1] / avg(prev);
  }
  return {
    n, last, hi, lo, pos, ma20, vol, volLabel, volRatio,
    p1w: perf(closes, 5), p1m: perf(closes, 20), p3m: ((last - closes[0]) / closes[0]) * 100,
    aboveMa: ma20 == null ? null : last > ma20,
  };
}

export function summarize(label, a) {
  if (!a) return "Data belum cukup untuk dianalisis.";
  const parts = [];
  if (a.p1m != null) parts.push(`${label} ${a.p1m >= 0 ? "naik" : "turun"} ${Math.abs(a.p1m).toFixed(1)}% dalam 1 bulan terakhir.`);
  if (a.aboveMa != null) parts.push(`Harga berada ${a.aboveMa ? "di atas" : "di bawah"} rata-rata 20 hari.`);
  parts.push(`Pergerakannya tergolong ${a.volLabel}, dan harga ada di ${a.pos.toFixed(0)}% rentang ${a.n} hari bursa terakhir.`);
  return parts.join(" ");
}
