"use client";
import { useMemo } from "react";
import { useApp } from "../../components/AppShell";
import { pct, cls } from "../../lib/format";

export default function Page() {
  const { data, pick } = useApp();
  const secs = useMemo(() => {
    const g = {};
    (data?.stocks || []).filter((s) => s.ok).forEach((s) => (g[s.sector || "Lainnya"] ||= []).push(s));
    return Object.entries(g).map(([name, list]) => ({ name, list, avg: list.reduce((a, s) => a + s.changePct, 0) / list.length })).sort((a, b) => b.avg - a.avg);
  }, [data]);
  const heat = (v) => { const a = Math.min(Math.abs(v) / 3, 1) * 0.45 + 0.1; return v >= 0 ? `rgba(62,207,142,${a})` : `rgba(255,107,110,${a})`; };
  return (
    <>
      <header className="top"><div><h1>Papan Sektor</h1><p>Rata-rata perubahan harian per sektor. Makin pekat warnanya, makin besar geraknya. Klik saham untuk melihat grafiknya.</p></div></header>
      {!data ? <div className="empty pulse">Memuat data pasar…</div> : (
        <div className="sec-grid">
          {secs.map((s) => (
            <section key={s.name} className="sec" style={{ background: heat(s.avg) }}>
              <h3>{s.name}</h3>
              <div className={"avg " + cls(s.avg)}>{pct(s.avg)}</div>
              <small>{s.list.length} saham</small>
              <div>{s.list.sort((a, b) => b.changePct - a.changePct).map((x) => <button key={x.symbol} className="pill" onClick={() => pick(x.symbol)}>{x.code} <span className={cls(x.changePct)}>{pct(x.changePct)}</span></button>)}</div>
            </section>
          ))}
        </div>
      )}
      <p className="note">Pengelompokan sektor di sini adalah penyederhanaan buatan Pantau Lot (bukan klasifikasi resmi BEI) dan bisa diubah di backend/src/data/symbols.js. Perubahan dihitung terhadap penutupan sebelumnya.</p>
    </>
  );
}
