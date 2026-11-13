"use client";
import { useMemo, useState } from "react";
import LineChart from "./LineChart";
import { rp, pct, cls } from "../lib/format";

// ===== FITUR UNGGULAN: Radar Lot Modal =====
// Dua arah: modal (Rp) -> jumlah lot, atau jumlah lot -> modal yang dibutuhkan.
// Kurva nilai modal dihitung dari harga penutupan asli Yahoo 1 bulan terakhir.
export default function LotRadar({ stocks }) {
  const [mode, setMode] = useState("budget"); // "budget": modal -> lot, "lots": lot -> modal
  const [budget, setBudget] = useState(1000000);
  const [want, setWant] = useState(1);
  const [pickSym, setPickSym] = useState(null);

  const rows = useMemo(() => stocks.filter((s) => s.ok).map((s) => {
    const lotPrice = s.price * 100;
    const lots = mode === "budget" ? Math.floor(budget / lotPrice) : want;
    const first = s.closes[0];
    return { ...s, lotPrice, lots, sisa: budget - lots * lotPrice, need: want * lotPrice, now: lots * 100 * s.price, ret: first ? ((s.price - first) / first) * 100 : 0 };
  }).sort((a, b) => mode === "budget" ? (b.lots > 0) - (a.lots > 0) || a.lotPrice - b.lotPrice : a.lotPrice - b.lotPrice), [stocks, budget, want, mode]);

  const ok = rows.filter((r) => r.lots > 0);
  const pick = rows.find((r) => r.symbol === pickSym && r.lots > 0) || ok[0];
  const curve = pick ? pick.times.map((t, i) => ({ t, v: pick.lots * 100 * pick.closes[i] })) : [];

  return (
    <section className="panel radar" aria-labelledby="radar-h">
      <span className="badge">Fitur unggulan</span>
      <h2 id="radar-h">Radar Lot Modal</h2>
      <div className="tabs" role="group" aria-label="Arah hitungan">
        <button aria-pressed={mode === "budget"} onClick={() => setMode("budget")}>Modal → lot</button>
        <button aria-pressed={mode === "lots"} onClick={() => setMode("lots")}>Lot → modal</button>
      </div>

      {mode === "budget" ? (
        <>
          <p className="lead">Geser modal kamu. Radar menunjukkan saham yang terjangkau, berapa lot, dan kurva nilai modalmu kalau dibeli 1 bulan lalu.</p>
          <label htmlFor="bud">Modal kamu</label>
          <div className="field"><span>Rp</span>
            <input id="bud" inputMode="numeric" value={budget.toLocaleString("id-ID")} onChange={(e) => setBudget(Number(e.target.value.replace(/\D/g, "")) || 0)} />
          </div>
          <input type="range" min="100000" max="20000000" step="100000" value={Math.min(Math.max(budget, 100000), 20000000)} onChange={(e) => setBudget(Number(e.target.value))} aria-label="Geser modal" />
          <div className="chips">{[100000, 500000, 1000000, 5000000, 10000000].map((v) => <button key={v} onClick={() => setBudget(v)}>{rp(v)}</button>)}</div>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: ".85rem" }}>{ok.length} dari {rows.length} saham terjangkau dengan modal {rp(budget)}.</p>
        </>
      ) : (
        <>
          <p className="lead">Isi jumlah lot yang kamu incar. Radar menunjukkan modal yang dibutuhkan di tiap saham, dari yang termurah.</p>
          <label htmlFor="want">Jumlah lot</label>
          <div className="field"><span>Lot</span>
            <input id="want" inputMode="numeric" value={want ? want.toLocaleString("id-ID") : ""} onChange={(e) => setWant(Math.min(Number(e.target.value.replace(/\D/g, "")) || 0, 100000))} />
          </div>
          <div className="chips">{[1, 2, 5, 10, 50].map((v) => <button key={v} onClick={() => setWant(v)}>{v} lot</button>)}</div>
          <p className="muted" style={{ margin: "0 0 10px", fontSize: ".85rem" }}>{want} lot = {(want * 100).toLocaleString("id-ID")} lembar.</p>
        </>
      )}

      {pick && (
        <div className="curve">
          <h3>Kurva modal di {pick.code} ({pick.lots} lot)</h3>
          <LineChart points={curve} fmtV={rp} h={150} />
        </div>
      )}
      {rows.slice(0, 8).map((r) => (
        <button key={r.symbol} disabled={!r.lots} className={"card" + (r.lots ? "" : " no") + (pick?.symbol === r.symbol ? " pick" : "")} onClick={() => setPickSym(r.symbol)}>
          <div>
            <b>{r.code}</b>
            <small>{mode === "lots"
              ? (r.lots ? `${r.lots} lot (${(r.lots * 100).toLocaleString("id-ID")} lembar) butuh ${rp(r.need)}` : "Isi jumlah lot")
              : (r.lots ? `${r.lots} lot (${r.lots * 100} lembar) · sisa ${rp(r.sisa)}` : `Butuh min. ${rp(r.lotPrice)} per lot`)}</small>
          </div>
          {r.lots > 0 && <div className="r"><b className={cls(r.ret)}>{rp(mode === "lots" ? r.need : r.now)}</b><small>{mode === "lots" ? `${pct(r.ret)} dalam 1 bulan` : `${pct(r.ret)} dalam 1 bulan`}</small></div>}
        </button>
      ))}
      <p className="note">Simulasi edukasi dari harga penutupan Yahoo Finance 1 bulan terakhir, tanpa biaya broker/pajak. Hasil masa lalu tidak menjamin masa depan. Bukan saran investasi. Untuk menghitung dengan biaya, pakai Kalkulator Lot.</p>
    </section>
  );
}
