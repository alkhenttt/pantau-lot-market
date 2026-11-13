// Semua permintaan /api/* diteruskan ke backend, sehingga browser hanya bicara ke satu alamat
// (cookie login tetap berfungsi tanpa pengaturan CORS).
const BACKEND = process.env.BACKEND_URL || "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { proxyTimeout: 120000 }, // AI Gemini bisa butuh waktu lama
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
};
export default nextConfig;
