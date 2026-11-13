// Membuat database + tabel otomatis: npm run db:init
import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

const name = process.env.DB_NAME || "pantau_lot";
const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8").replaceAll("pantau_lot", name);
try {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  await c.query(sql);
  await c.end();
  console.log(`✓ Database "${name}" dan tabel users, wishlist, holdings siap dipakai.`);
} catch (e) {
  console.error("✗ Gagal terhubung ke MySQL:", e.code || e.message);
  console.error("  Pastikan MySQL menyala, dan DB_USER / DB_PASSWORD di backend/.env benar.");
  process.exit(1);
}
