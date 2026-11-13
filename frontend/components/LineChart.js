"use client";
import { useRef, useState } from "react";
import { cls, pct, fmtT } from "../lib/format";

export default function LineChart({ points, fmtV, intraday, base, h = 240 }) {
  const [hi, setHi] = useState(null);
  const ref = useRef(null);
  if (!points || points.length < 2) return <div className="empty">Belum ada data grafik.</div>;
  const W = 640, P = 6;
  const vals = points.map((p) => p.v);
  const mn = Math.min(...vals), mx = Math.max(...vals), g = mx - mn || 1;
  const x = (i) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v) => h - P - ((v - mn) / g) * (h - 2 * P);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const ref0 = base ?? points[0].v;
  const last = points[points.length - 1];
  const color = last.v >= ref0 ? "var(--up)" : "var(--down)";
  const idx = hi ?? points.length - 1;
  const cur = points[idx];
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const f = (cx - r.left) / r.width;
    setHi(Math.max(0, Math.min(points.length - 1, Math.round(f * (points.length - 1)))));
  };
  const d = cur.v - ref0;
  return (
    <div className="chart">
      <div className="chart-head">
        <b>{fmtV(cur.v)}</b>
        <span className={cls(d)}>{pct((d / ref0) * 100)} · <span className="muted">{fmtT(cur.t, intraday)}</span></span>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${h}`} role="img" aria-label="Grafik harga"
        onMouseMove={move} onMouseLeave={() => setHi(null)} onTouchMove={move} onTouchEnd={() => setHi(null)}>
        <path d={`${line}L${x(points.length - 1)},${h}L${x(0)},${h}Z`} fill={color} opacity="0.12" />
        {base != null && base >= mn && base <= mx && (
          <line x1={P} x2={W - P} y1={y(base)} y2={y(base)} stroke="var(--mute)" strokeDasharray="4 4" strokeWidth="1" />
        )}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {hi != null && <line x1={x(hi)} x2={x(hi)} y1={0} y2={h} stroke="var(--ink)" strokeWidth="1" opacity=".5" />}
        <circle cx={x(idx)} cy={y(cur.v)} r="5" fill={color} stroke="var(--panel)" strokeWidth="2" />
      </svg>
    </div>
  );
}
