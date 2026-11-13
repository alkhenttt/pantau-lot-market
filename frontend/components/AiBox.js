"use client";
import { useState } from "react";

export default function AiBox({ user, symbol, label, hasWishlist, onLogin }) {
  const [st, setSt] = useState({});
  const ask = async (body, title) => {
    if (!user) return onLogin();
    setSt({ loading: true, title });
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
      setSt({ text: j.text, title });
    } catch (e) { setSt({ error: e.message, title }); }
  };
  const isIdx = symbol === "^JKSE";
  return (
    <section className="panel ai" aria-labelledby="ai-h" style={{ marginBottom: 20 }}>
      <span className="badge">AI Gemini</span>
      <h2 id="ai-h">Asisten AI untuk pemula</h2>
      <p className="lead">AI menjelaskan arti angka analisis dengan bahasa sederhana. Ia hanya memakai angka dari Yahoo Finance di atas dan tidak memberi rekomendasi beli atau jual.</p>
      <div className="tabs">
        <button disabled={isIdx || st.loading} onClick={() => ask({ mode: "stock", symbol }, `Penjelasan ${label}`)}>Jelaskan {isIdx ? "saham (pilih saham dulu)" : label}</button>
        <button disabled={st.loading || (user && !hasWishlist)} onClick={() => ask({ mode: "watchlist" }, "Briefing wishlist")}>Briefing wishlist saya</button>
      </div>
      {!user && <p className="note">Masuk dulu untuk memakai AI.</p>}
      {st.loading && <div className="empty pulse">Gemini sedang menulis…</div>}
      {st.error && <div className="err" role="alert">{st.error}</div>}
      {st.text && <div className="ai-out"><b>{st.title}</b><p style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{st.text}</p></div>}
    </section>
  );
}
