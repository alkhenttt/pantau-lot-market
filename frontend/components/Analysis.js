"use client";
import { useEffect, useState } from "react";
import { analyze, summarize } from "../lib/analysis";
import { rp, num, pct, cls } from "../lib/format";

// ===== Analisis emiten: dihitung dari harga & volume asli Yahoo (3 bulan) =====
export default function Analysis({ symbol, label }) {
  const [st, setSt] = useState({ loading: true });
  useEffect(() => {
    let live = true;
    const run = async () => {
      try {
        const res = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=3mo`);
        const j = await res.json().catch(() => ({}));
        if (!j.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
        const a = analyze(j.points.map((p) => p.v), j.points.map((p) => p.vol));
        if (live) setSt({ a });
      } catch (e) { if (live) setSt({ error: e.message }); }
    };
    setSt({ loading: true });
    run();
    const t = setInterval(run, 120000);
    return () => { live = false; clearInterval(t); };
  }, [symbol]);
  const a = st.a;
  const f = (v) => (v == null ? "-" : pct(v));
  const isIdx = symbol === "^JKSE";
  const money = isIdx ? num : rp;
  return (
    <section className="panel" aria-labelledby="an-h" style={{ marginBottom: 20 }}>
      <h2 id="an-h">Analisis {label}</h2>
      {st.loading ? <div className="empty pulse">Menghitung dari data Yahoo Finance…</div>
        : st.error ? <div className="err">Analisis gagal dimuat: {st.error}</div>
        : !a ? <div className="empty">Data belum cukup untuk dianalisis.</div> : (
        <>
          <p className="lead" style={{ fontSize: "1rem", color: "var(--ink)" }}>{summarize(label, a)}</p>
          <div className="an-grid">
            <div className="tile"><small>1 minggu (5 hari bursa)</small><b className={a.p1w == null ? "" : cls(a.p1w)}>{f(a.p1w)}</b></div>
            <div className="tile"><small>1 bulan (20 hari bursa)</small><b className={a.p1m == null ? "" : cls(a.p1m)}>{f(a.p1m)}</b></div>
            <div className="tile"><small>{a.n} hari bursa</small><b className={cls(a.p3m)}>{f(a.p3m)}</b></div>
            <div className="tile"><small>Tertinggi / terendah</small><b>{money(a.hi)}</b><small>{money(a.lo)}</small></div>
            <div className="tile"><small>Rata-rata 20 hari</small><b>{a.ma20 == null ? "-" : money(a.ma20)}</b><small>{a.aboveMa == null ? "" : a.aboveMa ? "Harga di atasnya" : "Harga di bawahnya"}</small></div>
            <div className="tile"><small>Volatilitas harian</small><b>{a.vol.toFixed(2)}%</b><small>Tergolong {a.volLabel}</small></div>
            {!isIdx && a.volRatio != null && (
              <div className="tile"><small>Volume hari ini vs rata-rata</small><b>{a.volRatio.toFixed(1)}x</b><small>Bisa belum penuh jika bursa masih buka</small></div>
            )}
          </div>
          <p className="note">Dihitung otomatis dari harga penutupan Yahoo Finance. Kategori volatilitas (tenang &lt;1,5%, sedang &lt;3%, liar ≥3%) adalah patokan sederhana. Ini bukan saran investasi.</p>
        </>
      )}
    </section>
  );
}
