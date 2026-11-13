"use client";
import { useState } from "react";

const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
const H = { "Content-Type": "application/json" };

function Row({ w, s, onChange, onPick }) {
  const [note, setNote] = useState(w.note || "");
  const [target, setTarget] = useState(w.target_price ?? "");
  const [msg, setMsg] = useState("");
  const save = async () => {
    setMsg("");
    try {
      const r = await fetch("/api/wishlist", { method: "PATCH", headers: H, body: JSON.stringify({ symbol: w.symbol, note, target: target === "" ? null : Number(target) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
      setMsg("Tersimpan"); onChange();
    } catch (e) { setMsg(e.message); }
  };
  const del = async () => { await fetch(`/api/wishlist?symbol=${encodeURIComponent(w.symbol)}`, { method: "DELETE" }); onChange(); };
  const hit = s?.ok && w.target_price != null && s.price >= Number(w.target_price);
  return (
    <div className="card wl" style={{ display: "block", cursor: "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <button className="link" onClick={() => onPick(w.symbol)}><b>{w.symbol.replace(".JK", "")}</b></button>
        <span>{s?.ok ? <>{rp(s.price)} <b className={s.change >= 0 ? "up" : "down"}>{pct(s.changePct)}</b></> : <span className="muted">…</span>}</span>
      </div>
      {hit && <div className="hit">Target {rp(w.target_price)} tercapai</div>}
      <div className="wl-f">
        <input className="inp" aria-label="Harga target" inputMode="numeric" placeholder="Harga target (Rp)" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} />
        <input className="inp" aria-label="Catatan" maxLength={200} placeholder="Catatan" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn sm" onClick={save}>Simpan</button>
        <button className="btn sm ghost" onClick={del}>Hapus</button>
      </div>
      {msg && <small className="muted">{msg}</small>}
    </div>
  );
}

export default function Wishlist({ user, items, stocks, onChange, onPick, onLogin }) {
  return (
    <section className="panel" aria-labelledby="wl-h" style={{ marginBottom: 20 }}>
      <h2 id="wl-h">Wishlist saya</h2>
      {!user ? (
        <div className="empty">Masuk untuk menyimpan saham favorit per akun. <button className="link" onClick={onLogin}>Masuk / Daftar</button></div>
      ) : !items.length ? (
        <div className="empty">Belum ada saham. Pilih saham di grafik lalu klik “Tambah ke wishlist”.</div>
      ) : items.map((w) => (
        <Row key={w.symbol + w.note + w.target_price} w={w} s={stocks.find((x) => x.symbol === w.symbol)} onChange={onChange} onPick={onPick} />
      ))}
    </section>
  );
}
