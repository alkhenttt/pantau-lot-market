"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyze } from "../lib/analysis";

const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const H = { "Content-Type": "application/json" };

export default function AiBubble({ user, stocks, index, sel, wl, onLogin }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [override, setOverride] = useState(null); // konteks dari saran (mis. saham wishlist)
  const endRef = useRef(null);

  useEffect(() => setOverride(null), [sel]);
  useEffect(() => { const h = () => setOpen(true); window.addEventListener("open-ai", h); return () => window.removeEventListener("open-ai", h); }, []);
  const ctx = override || sel;
  const label = ctx === "^JKSE" ? "IHSG" : ctx.replace(".JK", "");

  // Saran proaktif: muncul otomatis saat ada kejadian yang layak ditanyakan
  const nudges = useMemo(() => {
    const out = [];
    const by = (sym) => stocks.find((s) => s.symbol === sym && s.ok);
    const move = (s) => ({
      id: `mv-${s.symbol}`, symbol: s.symbol,
      text: `${s.code} ${s.changePct >= 0 ? "naik" : "turun"} ${Math.abs(s.changePct).toFixed(1)}% hari ini. Mau tahu konteksnya?`,
      q: `${s.code} ${s.changePct >= 0 ? "naik" : "turun"} ${Math.abs(s.changePct).toFixed(1)}% hari ini. Apa arti pergerakan ini jika dilihat dari datanya?`,
    });
    wl.forEach((w) => {
      const s = by(w.symbol);
      if (s && w.target_price != null && s.price >= Number(w.target_price))
        out.push({ id: `tgt-${w.symbol}`, symbol: w.symbol, text: `Harga target ${s.code} (${rp(w.target_price)}) tercapai!`, q: `Harga target ${s.code} di wishlist saya sudah tercapai. Apa yang bisa saya pelajari dari data ${s.code} sekarang?` });
    });
    const cur = by(sel);
    if (cur) {
      if (Math.abs(cur.changePct) >= 3) out.push(move(cur));
      const a = analyze(cur.closes);
      if (a?.volLabel === "liar")
        out.push({ id: `vol-${cur.symbol}`, symbol: cur.symbol, text: `${cur.code} tergolong bergerak liar. Mau saya jelaskan artinya?`, q: `Volatilitas ${cur.code} tergolong liar. Apa artinya buat investor pemula?` });
    }
    wl.forEach((w) => { const s = by(w.symbol); if (s && s.symbol !== sel && Math.abs(s.changePct) >= 3) out.push(move(s)); });
    if (index?.ok && Math.abs(index.changePct) >= 1) {
      const dir = index.changePct >= 0 ? "naik" : "turun";
      out.push({ id: `idx-${dir}`, symbol: "^JKSE", text: `IHSG ${dir} ${Math.abs(index.changePct).toFixed(1)}% hari ini. Mau tahu artinya?`, q: `IHSG ${dir} ${Math.abs(index.changePct).toFixed(1)}% hari ini. Apa arti pergerakan ini untuk investor pemula?` });
    }
    return out;
  }, [stocks, wl, sel, index]);
  const nudge = open ? null : nudges.find((n) => !dismissed.includes(n.id));

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, busy, open]);

  const send = async (text, symbol = ctx) => {
    text = text.trim();
    if (!text || busy) return;
    if (!user) return onLogin();
    const next = [...msgs, { role: "user", text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const history = next.filter((m) => !m.error).map(({ role, text }) => ({ role, text })).slice(-8);
      const r = await fetch("/api/ai/chat", { method: "POST", headers: H, body: JSON.stringify({ symbol, messages: history }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
      setMsgs([...next, { role: "model", text: j.text }]);
    } catch (e) {
      setMsgs([...next, { role: "model", text: e.message, error: true }]);
    } finally { setBusy(false); }
  };

  const go = (n) => {
    setDismissed((d) => [...d, n.id]);
    setOverride(n.symbol);
    setOpen(true);
    send(n.q, n.symbol);
  };
  const chips = [ctx === "^JKSE" ? "Jelaskan IHSG hari ini" : `Jelaskan ${label}`, "Apa itu volatilitas?", "Apa arti rata-rata 20 hari?", "Apa itu 1 lot?"];

  return (
    <div className="fab-wrap">
      {nudge && (
        <div className="nudge" role="status">
          <button className="nudge-go" onClick={() => go(nudge)}>{nudge.text}<small>Klik untuk tanya AI</small></button>
          <button className="nudge-x" aria-label="Tutup saran" onClick={() => setDismissed((d) => [...d, nudge.id])}>×</button>
        </div>
      )}
      {open && (
        <section className="chat" role="dialog" aria-label="Asisten AI">
          <header>
            <div><b>Asisten AI</b><small>Membahas: {label}</small></div>
            <button aria-label="Tutup" onClick={() => setOpen(false)}>×</button>
          </header>
          <div className="chat-log" role="log" aria-live="polite">
            {!user ? (
              <p className="muted">Masuk dulu untuk ngobrol dengan asisten AI. <button className="link" onClick={onLogin}>Masuk / Daftar</button></p>
            ) : !msgs.length ? (
              <>
                <div className="m ai">Hai! Aku bisa menjelaskan angka {label} dan istilah saham dengan bahasa sederhana. Tanya apa saja ya.</div>
                <div className="chips">{chips.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>
              </>
            ) : msgs.map((m, i) => <div key={i} className={"m " + (m.role === "user" ? "user" : m.error ? "ai err" : "ai")}>{m.text}</div>)}
            {busy && <div className="m ai pulse">Sedang mengetik…</div>}
            <div ref={endRef} />
          </div>
          <form className="chat-in" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input aria-label="Pertanyaan" maxLength={300} placeholder="Tanya sesuatu…" value={input} onChange={(e) => setInput(e.target.value)} disabled={!user} />
            <button className="btn sm" disabled={busy || !input.trim() || !user}>Kirim</button>
          </form>
          <small className="chat-note">Edukasi dari data Yahoo Finance, bukan saran investasi.</small>
        </section>
      )}
      <button className={"fab" + (nudge ? " ping" : "")} aria-label={open ? "Tutup asisten AI" : "Buka asisten AI"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "×" : "✦"}</button>
    </div>
  );
}
