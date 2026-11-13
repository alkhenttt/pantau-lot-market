"use client";
import { useState } from "react";

export default function AuthPanel({ onDone, onClose, reason }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, ...form }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
      onDone(j.user);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-h" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="panel mbox" onSubmit={submit}>
        <h2 id="auth-h">{mode === "login" ? "Masuk" : "Daftar akun"}</h2>
        {reason && <p className="muted" style={{ margin: "0 0 8px" }}>{reason}</p>}
        {mode === "register" && (<><label htmlFor="au-n">Nama</label><input id="au-n" className="inp" value={form.name} onChange={set("name")} autoComplete="name" required /></>)}
        <label htmlFor="au-e">Email</label>
        <input id="au-e" className="inp" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        <label htmlFor="au-p">Kata sandi{mode === "register" ? " (minimal 8 karakter)" : ""}</label>
        <input id="au-p" className="inp" type="password" value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}</button>
        <p className="note" style={{ textAlign: "center" }}>
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>{mode === "login" ? "Daftar" : "Masuk"}</button>
          {" · "}<button type="button" className="link" onClick={onClose}>Tutup</button>
        </p>
      </form>
    </div>
  );
}
