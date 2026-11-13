import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { setSession, clearSession, getUser } from "../middleware/auth.js";
import { wrap, fail } from "../utils.js";

const router = Router();

// Pembatas percobaan sederhana: maks. 10 permintaan masuk/daftar per 15 menit per IP
const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 10;
};

router.get("/", wrap(async (req, res) => {
  try { res.json({ user: await getUser(req) }); } catch { res.json({ user: null }); }
}));

router.post("/", wrap(async (req, res) => {
  const b = req.body || {};
  if (b.action === "logout") { clearSession(res); return res.json({ ok: true }); }
  if (limited(req.ip)) return fail(res, 429, "Terlalu banyak percobaan. Coba lagi 15 menit lagi.");

  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 190) return fail(res, 400, "Email tidak valid");

  if (b.action === "register") {
    const name = String(b.name || "").trim();
    if (name.length < 2 || name.length > 60) return fail(res, 400, "Nama 2 sampai 60 karakter");
    if (password.length < 8 || password.length > 72) return fail(res, 400, "Kata sandi 8 sampai 72 karakter");
    try {
      const hash = await bcrypt.hash(password, 10);
      const [r] = await pool.query("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)", [email, name, hash]);
      const user = { id: r.insertId, email, name };
      await setSession(res, user);
      return res.json({ user });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return fail(res, 409, "Email sudah terdaftar");
      throw e;
    }
  }
  if (b.action === "login") {
    const [rows] = await pool.query("SELECT id, email, name, password_hash FROM users WHERE email = ?", [email]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash))) return fail(res, 401, "Email atau kata sandi salah");
    const user = { id: u.id, email: u.email, name: u.name };
    await setSession(res, user);
    return res.json({ user });
  }
  fail(res, 400, "Aksi tidak dikenal");
}));

export default router;
