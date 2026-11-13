"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../../components/AppShell";
import { analyze } from "../../lib/analysis";
import { pct, cls, fmtT, symLabel } from "../../lib/format";

const COLORS = ["#5b8cff", "#f5b942", "#3ecf8e"];

function MultiLine({ series, h = 260 }) {
  const [hi, setHi] = useState(null);
  const ref = useRef(null);
  const n = series[0].vals.length, W = 640, P = 6;
  const all = series.flatMap((s) => s.vals);
  const mn = Math.min(0, ...all), mx = Math.max(0, ...all), g = mx - mn || 1;
  const x = (i) => P + (i / (n - 1)) * (W - 2 * P);
  const y = (v) => h - P - ((v - mn) / g) * (h - 2 * P);
  const idx = hi ?? n - 1;
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    setHi(Math.max(0, Math.min(n - 1, Math.round(((cx - r.left) / r.width) * (n - 1)))));
  };
  return (
    <div className="chart">
      <div className="chart-head">
        <span className="muted">{fmtT(series[0].t[idx], false)}</span>
        <span className="legend">{series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name} <b className={cls(s.vals[idx])}>{pct(s.vals[idx])}</b></span>)}</span>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${h}`} role="img" aria-label="Perbandingan kinerja saham"
        onMouseMove={move} onMouseLeave={() => setHi(null)} onTouchMove={move} onTouchEnd={() => setHi(null)}>
        <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} stroke="var(--mute)" strokeDasharray="4 4" />
        {series.map((s) => <path key={s.name} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" d={s.vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")} />)}
        {hi != null && <line x1={x(hi)} x2={x(hi)} y1={0} y2={h} stroke="var(--ink)" opacity=".4" />}
        {series.map((s) => <circle key={s.name} cx={x(idx)} cy={y(s.vals[idx])} r="4.5" fill={s.color} stroke="var(--panel)" strokeWidth="2" />)}
      </svg>
    </div>
  );
}

export default function Page() {
  const { data } = useApp();
  const [picks, setPicks] = useState(["BBCA.JK", "BBRI.JK"]);
  const [range, setRange] = useState("1mo");
  const [st, setSt] = useState({ loading: true });
  const options = [{ symbol: "^JKSE" }, ...((data?.stocks || []).map((s) => ({ symbol: s.symbol })))];

  const toggle = (sym) => setPicks((p) => p.includes(sym) ? (p.length > 1 ? p.filter((x) => x !== sym) : p) : [...p, sym].slice(-3));

  useEffect(() => {
    let live = true;
    setSt({ loading: true });
    Promise.all(picks.map(async (sym) => {
      const r = await fetch(`/api/chart?symbol=${encodeURIComponent(sym)}&range=${range}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Server tidak merespons. Cek terminal backend.");
      return { sym, points: j.points };
    })).then((res) => {
      if (!live) return;
      const L = Math.min(...res.map((r) => r.points.length));
      if (L < 2) throw new Error("Data belum cukup untuk dibandingkan");
      setSt({ series: res.map((r, i) => {
        const p = r.points.slice(-L), b = p[0].v;
        return { name: symLabel(r.sym), color: COLORS[i], vals: p.map((q) => (q.v / b - 1) * 100), t: p.map((q) => q.t), closes: p.map((q) => q.v) };
      }) });
    }).catch((e) => live && setSt({ error: e.message }));
    return () => { live = false; };
  }, [picks, range]);

  return (
    <>
      <header className="top"><div><h1>Bandingkan</h1><p>Bandingkan hingga 3 saham atau IHSG. Semua dimulai dari 0%, jadi kamu melihat siapa yang lebih kuat pada periode yang sama.</p></div></header>
      <section className="panel">
        <div className="tabs">
          {[["1mo", "1 Bulan"], ["3mo", "3 Bulan"]].map(([k, l]) => <button key={k} aria-pressed={range === k} onClick={() => setRange(k)}>{l}</button>)}
        </div>
        <div className="tabs" role="group" aria-label="Pilih saham (maks. 3)">
          {options.map((o) => <button key={o.symbol} aria-pressed={picks.includes(o.symbol)} onClick={() => toggle(o.symbol)}>{symLabel(o.symbol)}</button>)}
        </div>
        {st.loading ? <div className="empty pulse">Memuat grafik dari Yahoo Finance…</div>
          : st.error ? <div className="err">Gagal memuat: {st.error}</div>
          : (
            <>
              <MultiLine series={st.series} />
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr><th>Saham</th><th>Kinerja periode</th><th>Volatilitas harian</th></tr></thead>
                  <tbody>{st.series.map((s) => { const a = analyze(s.closes); const last = s.vals[s.vals.length - 1]; return (
                    <tr key={s.name}><td><span className="dot" style={{ background: s.color }} /><b>{s.name}</b></td><td className={cls(last)}>{pct(last)}</td><td>{a ? `${a.vol.toFixed(2)}% (${a.volLabel})` : "-"}</td></tr>
                  ); })}</tbody>
                </table>
              </div>
            </>
          )}
        <p className="note">Hari bursa disejajarkan dari yang terbaru. Garis putus-putus = 0%. Edukasi, bukan saran investasi.</p>
      </section>
    </>
  );
}
