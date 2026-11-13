// Semua data harga asli dari Yahoo Finance (endpoint chart v8, tidak resmi).
const HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BEIMarketWatch/1.0)" };
export const RANGES = { "1d": "5m", "5d": "15m", "1mo": "1d", "3mo": "1d" };

async function chart(symbol, range, interval) {
  let last;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = (await res.json())?.chart?.result?.[0];
      if (!r) throw new Error("Data kosong");
      return r;
    } catch (e) { last = e; }
  }
  throw new Error(String(last?.message || last));
}

// Harga terakhir + riwayat 1 bulan (untuk daftar pantau & screener)
export async function getOverview(symbol) {
  try {
    const r = await chart(symbol, "1mo", "1d");
    const q = r.indicators?.quote?.[0]?.close || [];
    const closes = [], times = [];
    (r.timestamp || []).forEach((t, i) => { if (q[i] != null) { closes.push(q[i]); times.push(t * 1000); } });
    const price = r.meta.regularMarketPrice ?? closes[closes.length - 1];
    const prev = closes.length > 1 ? closes[closes.length - 2] : r.meta.chartPreviousClose;
    return { symbol, ok: true, price, prev, change: price - prev, changePct: prev ? ((price - prev) / prev) * 100 : 0, volume: r.meta.regularMarketVolume ?? null, closes, times };
  } catch (e) { return { symbol, ok: false, error: e.message }; }
}

// Titik grafik per rentang (1d/5d intraday, 1mo/3mo harian)
export async function getChartPoints(symbol, range) {
  const r = await chart(symbol, range, RANGES[range]);
  const q = r.indicators?.quote?.[0] || {};
  const points = [];
  (r.timestamp || []).forEach((t, i) => { if (q.close?.[i] != null) points.push({ t: t * 1000, v: q.close[i], vol: q.volume?.[i] ?? 0 }); });
  return { points, prevClose: r.meta.chartPreviousClose ?? null };
}

// Riwayat harian 3 bulan (untuk analisis & AI)
export async function getDaily(symbol) {
  const { points } = await getChartPoints(symbol, "3mo");
  return { closes: points.map((p) => p.v), vols: points.map((p) => p.vol) };
}
