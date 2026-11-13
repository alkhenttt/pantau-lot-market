import { Router } from "express";
import { STOCKS, INDEX_SYMBOL } from "../data/symbols.js";
import { getOverview, getChartPoints, RANGES } from "../services/yahoo.js";
import { wrap, fail } from "../utils.js";

const router = Router();
const TTL = 15000; // cache 15 detik agar tidak kena rate-limit Yahoo
let overview = { t: 0, data: null };
const charts = new Map();
const ALLOWED = new Set([INDEX_SYMBOL, ...STOCKS.map((s) => s.s)]);

// Dipakai juga oleh rute AI (ringkasan harian)
export async function snapshot() {
  if (!overview.data || Date.now() - overview.t > TTL) {
    const [index, ...rows] = await Promise.all([INDEX_SYMBOL, ...STOCKS.map((x) => x.s)].map(getOverview));
    const stocks = rows.map((r) => {
      const meta = STOCKS.find((x) => x.s === r.symbol);
      return { ...r, name: meta?.n, sector: meta?.sec, code: r.symbol.replace(".JK", "") };
    });
    overview = { t: Date.now(), data: { updatedAt: new Date().toISOString(), index, stocks } };
  }
  return overview.data;
}

router.get("/market", wrap(async (_req, res) => res.json(await snapshot())));

router.get("/chart", wrap(async (req, res) => {
  const { symbol } = req.query;
  const range = req.query.range || "1d";
  if (!ALLOWED.has(symbol) || !RANGES[range]) return fail(res, 400, "Parameter tidak valid");
  const k = `${symbol}:${range}`, hit = charts.get(k);
  if (hit && Date.now() - hit.t < TTL) return res.json(hit.data);
  try {
    const data = { ok: true, symbol, range, ...(await getChartPoints(symbol, range)) };
    charts.set(k, { t: Date.now(), data });
    res.json(data);
  } catch (e) { res.status(502).json({ ok: false, error: e.message }); }
}));

export default router;
