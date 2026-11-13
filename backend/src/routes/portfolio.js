import { Router } from "express";
import { pool } from "../config/db.js";
import { requireUser } from "../middleware/auth.js";
import { STOCKS } from "../data/symbols.js";
import { wrap, fail } from "../utils.js";

const router = Router();
const ALLOWED = new Set(STOCKS.map((s) => s.s));

function clean(b) {
  const lots = Number(b.lots), price = Number(b.price);
  if (!Number.isInteger(lots) || lots < 1 || lots > 1000000) return { error: "Jumlah lot harus bilangan bulat 1 sampai 1.000.000" };
  if (!isFinite(price) || price <= 0 || price > 1e7) return { error: "Harga beli tidak valid" };
  let date = null;
  if (b.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || isNaN(Date.parse(b.date))) return { error: "Tanggal tidak valid" };
    date = b.date;
  }
  return { lots, price, date };
}

router.use(requireUser);

router.get("/", wrap(async (req, res) => {
  const [items] = await pool.query("SELECT id, symbol, lots, buy_price, DATE_FORMAT(bought_at, '%Y-%m-%d') AS bought_at FROM holdings WHERE user_id = ? ORDER BY created_at DESC, id DESC", [req.user.id]);
  res.json({ items });
}));

router.post("/", wrap(async (req, res) => {
  const b = req.body || {};
  if (!ALLOWED.has(b.symbol)) return fail(res, 400, "Saham tidak dikenal");
  const c = clean(b);
  if (c.error) return fail(res, 400, c.error);
  const [[{ n }]] = await pool.query("SELECT COUNT(*) AS n FROM holdings WHERE user_id = ?", [req.user.id]);
  if (n >= 50) return fail(res, 400, "Maksimal 50 catatan portofolio");
  await pool.query("INSERT INTO holdings (user_id, symbol, lots, buy_price, bought_at) VALUES (?, ?, ?, ?, ?)", [req.user.id, b.symbol, c.lots, c.price, c.date]);
  res.json({ ok: true });
}));

router.patch("/", wrap(async (req, res) => {
  const b = req.body || {};
  const c = clean(b);
  if (c.error) return fail(res, 400, c.error);
  const [r] = await pool.query("UPDATE holdings SET lots = ?, buy_price = ? WHERE id = ? AND user_id = ?", [c.lots, c.price, Number(b.id), req.user.id]);
  r.affectedRows ? res.json({ ok: true }) : fail(res, 404, "Catatan tidak ditemukan");
}));

router.delete("/", wrap(async (req, res) => {
  await pool.query("DELETE FROM holdings WHERE id = ? AND user_id = ?", [Number(req.query.id), req.user.id]);
  res.json({ ok: true });
}));

export default router;
