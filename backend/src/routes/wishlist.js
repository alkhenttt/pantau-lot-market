import { Router } from "express";
import { pool } from "../config/db.js";
import { requireUser } from "../middleware/auth.js";
import { STOCKS } from "../data/symbols.js";
import { wrap, fail } from "../utils.js";

const router = Router();
const ALLOWED = new Set(STOCKS.map((s) => s.s));

function clean(b) {
  const note = String(b.note ?? "").slice(0, 200);
  let target = b.target ?? null;
  if (target !== null) {
    target = Number(target);
    if (!isFinite(target) || target <= 0 || target > 1e9) return { error: "Harga target tidak valid" };
  }
  return { note, target };
}

router.use(requireUser);

router.get("/", wrap(async (req, res) => {
  const [items] = await pool.query("SELECT symbol, note, target_price, created_at FROM wishlist WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
  res.json({ items });
}));

router.post("/", wrap(async (req, res) => {
  const b = req.body || {};
  if (!ALLOWED.has(b.symbol)) return fail(res, 400, "Saham tidak dikenal");
  const c = clean(b);
  if (c.error) return fail(res, 400, c.error);
  await pool.query("INSERT INTO wishlist (user_id, symbol, note, target_price) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE note = VALUES(note), target_price = VALUES(target_price)", [req.user.id, b.symbol, c.note, c.target]);
  res.json({ ok: true });
}));

router.patch("/", wrap(async (req, res) => {
  const b = req.body || {};
  if (!ALLOWED.has(b.symbol)) return fail(res, 400, "Saham tidak dikenal");
  const c = clean(b);
  if (c.error) return fail(res, 400, c.error);
  const [r] = await pool.query("UPDATE wishlist SET note = ?, target_price = ? WHERE user_id = ? AND symbol = ?", [c.note, c.target, req.user.id, b.symbol]);
  r.affectedRows ? res.json({ ok: true }) : fail(res, 404, "Tidak ada di wishlist");
}));

router.delete("/", wrap(async (req, res) => {
  await pool.query("DELETE FROM wishlist WHERE user_id = ? AND symbol = ?", [req.user.id, String(req.query.symbol || "")]);
  res.json({ ok: true });
}));

export default router;
