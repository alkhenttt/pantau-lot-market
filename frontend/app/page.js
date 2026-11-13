"use client";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../components/AppShell";
import LineChart from "../components/LineChart";
import Analysis from "../components/Analysis";
import AiBox from "../components/AiBox";
import Tape from "../components/Tape";
import { rp, num, pct, cls, RANGES, symLabel } from "../lib/format";

export default function Explore() {
  const { data, error, flash, sel, setSel, wl, toggleWl, user, openAuth } = useApp();
  const [range, setRange] = useState("1d");
  const [chart, setChart] = useState({ loading: true });

  const loadChart = useCallback(async (silent) => {
    if (!silent) setChart({ loading: true });
    try {
      const res = await fetch(`/api/chart?symbol=${encodeURIComponent(sel)}&range=${range}`);
      const j = await res.json().catch(() => ({}));
      if (!j.ok) throw new Error(j.error || "Server tidak merespons. Cek terminal backend.");
      setChart({ points: j.points.map((p) => ({ t: p.t, v: p.v })), base: range === "1d" ? j.prevClose : null });
    } catch (e) { setChart({ error: e.message }); }
  }, [sel, range]);
  useEffect(() => {
    loadChart(false);
    const t = setInterval(() => loadChart(true), range === "1d" || range === "5d" ? 30000 : 120000);
    return () => clearInterval(t);
  }, [loadChart, range]);

  const idx = data?.index;
  const stocks = data?.stocks || [];
  const okStocks = stocks.filter((s) => s.ok);
  const failed = stocks.length - okStocks.length;
  const sorted = [...okStocks].sort((a, b) => b.changePct - a.changePct);
  const selName = symLabel(sel);
  const intraday = range === "1d" || range === "5d";
  const inWl = wl.some((w) => w.symbol === sel);

  return (
    <>
      <Tape items={okStocks} />
      <header className="top">
        <div>
          <h1>Jelajahi pasar</h1>
          <p>Ringkasan pasar saham BEI untuk investor ritel pemula. Semua data dari Yahoo Finance.</p>
          <span className="live"><i /> Diperbarui tiap 15 detik{data ? " · " + new Date(data.updatedAt).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB" : ""}</span>
        </div>
        <div className="ihsg" aria-live="polite">
          <small>IHSG</small>
          {idx?.ok ? (<><b>{num(idx.price)}</b><span className={cls(idx.change)}>{pct(idx.changePct)} ({idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)})</span></>)
            : <b className={data ? "" : "pulse"}>{data ? "Tidak tersedia" : "Memuat…"}</b>}
        </div>
      </header>

      {error && <div className="err" role="alert">{error}</div>}
      {failed > 0 && <div className="err">{failed} saham gagal dimuat dari Yahoo Finance. Mencoba lagi otomatis.</div>}

      <section className="panel" aria-labelledby="c-h" style={{ marginBottom: 20 }}>
        <div className="chart-title">
          <h2 id="c-h">Grafik {selName}</h2>
          {sel !== "^JKSE" && (
            <button className="star" aria-pressed={inWl} onClick={() => toggleWl(sel)}>{inWl ? "★ Di wishlist" : "☆ Tambah ke wishlist"}</button>
          )}
        </div>
        <div className="tabs">
          {RANGES.map(([k, l]) => <button key={k} aria-pressed={range === k} onClick={() => setRange(k)}>{l}</button>)}
          <span className="sep" />
          <button aria-pressed={sel === "^JKSE"} onClick={() => setSel("^JKSE")}>IHSG</button>
        </div>
        {chart.loading ? <div className="empty pulse">Memuat grafik dari Yahoo Finance…</div>
          : chart.error ? <div className="err">Grafik gagal dimuat: {chart.error}</div>
          : <LineChart points={chart.points} base={chart.base} intraday={intraday} fmtV={sel === "^JKSE" ? num : rp} />}
        <p className="note">Arahkan kursor atau sentuh grafik untuk membaca harga tiap titik. Klik saham di daftar untuk menggantinya. Garis putus-putus = penutupan hari sebelumnya (1 Hari).</p>
      </section>

      <Analysis symbol={sel} label={selName} />
      <AiBox user={user} symbol={sel} label={selName} hasWishlist={wl.length > 0} onLogin={() => openAuth("Masuk untuk memakai asisten AI")} />

      <div className="grid">
        <section className="panel" aria-labelledby="w-h">
          <h2 id="w-h">Daftar pantau</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Saham</th><th>Harga</th><th>Perubahan</th><th className="hide-s">Harga 1 lot</th></tr></thead>
              <tbody>
                {!data && <tr><td colSpan={4} className="muted pulse">Memuat data pasar…</td></tr>}
                {okStocks.map((s) => (
                  <tr key={s.symbol} tabIndex={0} className={sel === s.symbol ? "sel" : ""}
                    onClick={() => setSel(s.symbol)} onKeyDown={(e) => e.key === "Enter" && setSel(s.symbol)}>
                    <td><span className="code">{s.code}</span><span className="nm">{s.name}</span></td>
                    <td key={s.price} className={flash[s.symbol] ? "flash-" + flash[s.symbol] : ""}>{rp(s.price)}</td>
                    <td className={cls(s.change)}>{pct(s.changePct)}</td>
                    <td className="hide-s">{rp(s.price * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">Tidak bergerak saat bursa tutup. Data Yahoo bisa tertunda ±10 menit.</p>
        </section>
        <section className="panel" aria-labelledby="m-h">
          <h2 id="m-h">Penguat & pelemah</h2>
          {!okStocks.length ? <div className="empty pulse">Memuat…</div> : (
            <>
              <h3 className="sub">Penguat terbesar</h3>
              {sorted.slice(0, 5).map((s) => <button key={s.symbol} className="row-b" onClick={() => setSel(s.symbol)}><b>{s.code}</b><span>{rp(s.price)}</span><span className={cls(s.changePct)}>{pct(s.changePct)}</span></button>)}
              <h3 className="sub">Pelemah terbesar</h3>
              {sorted.slice(-5).reverse().map((s) => <button key={s.symbol} className="row-b" onClick={() => setSel(s.symbol)}><b>{s.code}</b><span>{rp(s.price)}</span><span className={cls(s.changePct)}>{pct(s.changePct)}</span></button>)}
            </>
          )}
        </section>
      </div>
    </>
  );
}
