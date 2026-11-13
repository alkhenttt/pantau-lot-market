"use client";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../../components/AppShell";
import Gate from "../../components/Gate";
import { rp, num, pct, cls } from "../../lib/format";

function Feed() {
  const { data, pick } = useApp();
  const [st, setSt] = useState({ loading: true });
  const load = useCallback(async () => {
    setSt({ loading: true });
    try {
      const r = await fetch("/api/ai/daily", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
      setSt({ text: j.text, at: j.at });
    } catch (e) { setSt({ error: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ok = (data?.stocks || []).filter((s) => s.ok);
  const sorted = [...ok].sort((a, b) => b.changePct - a.changePct);
  const idx = data?.index;
  return (
    <>
      <section className="panel ai" style={{ marginBottom: 20 }}>
        <span className="badge">Ditulis AI Gemini</span>
        <h2>Ringkasan pasar</h2>
        {st.loading ? <div className="empty pulse">Gemini sedang menulis ringkasan dari data Yahoo…</div>
          : st.error ? <div className="err" role="alert">{st.error}</div>
          : <div className="ai-out"><p style={{ whiteSpace: "pre-wrap", margin: 0, color: "var(--ink)" }}>{st.text}</p><small className="muted">Dibuat {new Date(st.at).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB · disimpan 10 menit</small></div>}
        <div className="tabs" style={{ marginTop: 12 }}><button disabled={st.loading} onClick={load}>Segarkan</button></div>
        <p className="note">AI hanya menulis ulang angka di bawah dan tidak menyebut berita atau penyebab. Edukasi, bukan saran investasi.</p>
      </section>
      <section className="panel">
        <h2>Data dasar ringkasan</h2>
        {!ok.length ? <div className="empty pulse">Memuat…</div> : (
          <>
            <p>IHSG: <b>{idx?.ok ? `${num(idx.price)} (${pct(idx.changePct)})` : "tidak tersedia"}</b> · {ok.filter((s) => s.change > 0).length} saham naik, {ok.filter((s) => s.change < 0).length} turun</p>
            <div className="grid2">
              <div><h3 className="sub">Penguat terbesar</h3>{sorted.slice(0, 3).map((s) => <button key={s.symbol} className="row-b" onClick={() => pick(s.symbol)}><b>{s.code}</b><span>{rp(s.price)}</span><span className={cls(s.changePct)}>{pct(s.changePct)}</span></button>)}</div>
              <div><h3 className="sub">Pelemah terbesar</h3>{sorted.slice(-3).reverse().map((s) => <button key={s.symbol} className="row-b" onClick={() => pick(s.symbol)}><b>{s.code}</b><span>{rp(s.price)}</span><span className={cls(s.changePct)}>{pct(s.changePct)}</span></button>)}</div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default function Page() {
  return (
    <>
      <header className="top"><div><h1>Kabar Harian</h1><p>Ringkasan pasar hari ini dalam bahasa sederhana, ditulis AI dari data Yahoo Finance.</p></div></header>
      <Gate name="Kabar Harian"><Feed /></Gate>
    </>
  );
}
