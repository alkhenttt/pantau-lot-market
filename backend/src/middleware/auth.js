import { SignJWT, jwtVerify } from "jose";
import { pool } from "../config/db.js";
import { fail, wrap } from "../utils.js";

const key = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET belum diisi (minimal 16 karakter) di backend/.env");
  return new TextEncoder().encode(s);
};

export async function setSession(res, user) {
  const token = await new SignJWT({ uid: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(key());
  res.cookie("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 24 * 3600 * 1000 });
}
export const clearSession = (res) => res.clearCookie("session", { path: "/" });

export async function getUser(req) {
  const token = req.cookies?.session;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const [rows] = await pool.query("SELECT id, email, name FROM users WHERE id = ?", [payload.uid]);
    return rows[0] || null;
  } catch (e) {
    if (String(e.message).includes("JWT_SECRET")) throw e;
    return null;
  }
}

export const requireUser = wrap(async (req, res, next) => {
  const user = await getUser(req);
  if (!user) return fail(res, 401, "Silakan masuk dulu");
  req.user = user;
  next();
});
