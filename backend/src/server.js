import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import wishlistRoutes from "./routes/wishlist.js";
import aiRoutes from "./routes/ai.js";
import marketRoutes from "./routes/market.js";
import portfolioRoutes from "./routes/portfolio.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", marketRoutes); // /api/market, /api/chart
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/ai", aiRoutes);
app.use((_req, res) => res.status(404).json({ error: "Tidak ditemukan" }));

// Penangan error pusat
app.use((err, _req, res, _next) => {
  console.error(err);
  const msg = String(err.message || "");
  if (msg.includes("JWT_SECRET")) return res.status(500).json({ error: msg });
  if (err.status) return res.status(err.status).json({ error: msg });
  if (err.code === "ECONNREFUSED" || err.code?.startsWith("ER_") || err.code === "PROTOCOL_CONNECTION_LOST")
    return res.status(500).json({ error: "Database belum bisa dihubungi. Cek MySQL dan file backend/.env." });
  res.status(500).json({ error: "Terjadi kesalahan di server" });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`✓ Backend siap di http://localhost:${PORT}`));
