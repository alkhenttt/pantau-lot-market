"use client";
import { useMemo, useState } from "react";
import { analyze } from "../lib/analysis";

const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const pct = (n) => (n == null ? "-" : (n >= 0 ? "+" : "") + n.toFixed(2) + "%");
const cls = (n) => (n >= 0 ? "up" : "down");
const EMPTY = { maxLot: "", minDay: "", min1m: "", above: false, vol: "" };
const PRESETS = [
  ["Murah per lot (≤ Rp500 ribu)", { ...EMPTY, maxLot: "500000" }],
  ["Momentum naik", { ...EMPTY, min1m: "3", above: true }],
  ["Tenang & di atas MA20", { ...EMPTY, vol: "tenang", above: true }],
];

export default function Screener({ stocks, onPick }) {
  const [f, setF] = useState(EMPTY);
  const rows = useMemo(() => stocks.filter((s) => s.ok).map((s) => {
    const a = analyze(s.closes);
    return { s, a, lot: s.price * 100 };
  }).filter(({ s, a, lot }) => {
    if (f.maxLot !== "" && lot > Number(f.maxLot)) return false;
    if (f.minDay !== "" && s.changePct < Number(f.minDay)) return false;
    if (f.min1m !== "" && !(a?.p1m != null && a.p1m >= Number(f.min1m))) return false;
    if (f.above && !a?.aboveMa) return false;
    if (f.vol && a?.volLabel !== f.vol) return false;
    return true;
  }).sort((x, y) => (y.a?.p1m ?? -999) - (x.a?.p1m ?? -999)), [stocks, f]);
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value.replace(/[^\d.-]/g, "") });

  return (
    <section className="panel" aria-labelledby="sc-h" style={{ marginBottom: 20 }}>
      <h2 id="sc-h">Screener saham</h2>
      <div className="tabs">
        {PRESETS.map(([l, v]) => <button key={l} onClick={() => setF(v)}>{l}</button>)}
        <button onClick={() => setF(EMPTY)}>Reset</button>
      </div>
      <div className="sc-f">
        <label>Harga 1 lot maks. (Rp)<input className="inp" inputMode="numeric" value={f.maxLot} onChange={num("maxLot")} /></label>
        <label>Naik hari ini min. (%)<input className="inp" inputMode="decimal" value={f.minDay} onChange={num("minDay")} /></label>
        <label>Kinerja 1 bulan min. (%)<input className="inp" inputMode="decimal" value={f.min1m} onChange={num("min1m")} /></label>
        <label>Volatilitas
          <select className="inp" value={f.vol} onChange={(e) => setF({ ...f, vol: e.target.value })}>
            <option value="">Semua</option><option value="tenang">Tenang</option><option value="sedang">Sedang</option><option value="liar">Liar</option>
          </select>
        </label>
        <label className="chk"><input type="checkbox" checked={f.above} onChange={(e) => setF({ ...f, above: e.target.checked })} /> Harga di atas rata-rata 20 hari</label>
      </div>
      <p className="muted" style={{ fontSize: ".85rem" }}>{rows.length} dari {stocks.filter((s) => s.ok).length} saham cocok. Klik baris untuk melihat grafik.</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Saham</th><th>Harga 1 lot</th><th>Hari ini</th><th>1 bulan</th><th>Volatilitas</th></tr></thead>
          <tbody>
            {rows.map(({ s, a, lot }) => (
              <tr key={s.symbol} tabIndex={0} onClick={() => onPick(s.symbol)} onKeyDown={(e) => e.key === "Enter" && onPick(s.symbol)}>
                <td><span className="code">{s.code}</span><span className="nm">{s.name}</span></td>
                <td>{rp(lot)}</td>
                <td className={cls(s.changePct)}>{pct(s.changePct)}</td>
                <td className={a?.p1m == null ? "" : cls(a.p1m)}>{pct(a?.p1m)}</td>
                <td>{a ? a.volLabel : "-"}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="muted">Tidak ada saham yang cocok. Longgarkan filter.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="note">Dihitung dari data harga Yahoo Finance pada daftar pantau. Edukasi, bukan saran investasi.</p>
    </section>
  );
}
