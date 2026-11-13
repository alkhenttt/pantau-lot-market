"use client";
import { useState } from "react";
import { useApp } from "./AppShell";
import { calc, digits, resolveOrder } from "../lib/lot";
import { rp } from "../lib/format";

const fmt = (n) => (n === "" || n == null ? "" : Number(n).toLocaleString("id-ID"));

export default function LotCalculator() {
  const { data } = useApp();
  const stocks = (data?.stocks || []).filter((s) => s.ok);
  const [sym, setSym] = useState("BBCA.JK");
  const [priceStr, setPriceStr] = useState(""); // kosong = pakai harga Yahoo
  const [src, setSrc] = useState("lots");
  const [val, setVal] = useState("1");
  const [fee, setFee] = useState("0");
  const [say, setSay] = useState("");
  const [sayMsg, setSayMsg] = useState(null);

  const cur = stocks.find((s) => s.symbol === sym);
  const live = cur ? cur.price : null;
  const price = priceStr !== "" ? digits(priceStr) : live;
  const feeNum = Number(String(fee).replace(",", ".")) || 0;
  const res = calc(src, Number(val) || 0, price, feeNum);

  const shown = (f) => (src === f ? fmt(val) : res ? fmt(f === "lots" ? res.lots : f === "shares" ? res.shares : Math.round(res.total)) : "");
  const edit = (f) => (e) => { setSrc(f); setVal(e.target.value.replace(/\D/g, "")); };

  const fill = () => {
    const r = resolveOrder(say, stocks);
    if (r.error) return setSayMsg({ err: true, text: r.error });
    setSym(r.symbol);
    setPriceStr(r.usedLive ? "" : String(Math.round(r.price)));
    setSrc(r.src); setVal(String(r.val));
    setSayMsg({ text: `Terbaca: ${r.code} · ${r.lots} lot · harga ${rp(r.price)}${r.usedLive ? " (harga Yahoo)" : ""}. Cek angkanya di bawah.` });
  };

  return (
    <section className="panel calc" aria-labelledby="calc-h">
      <h2 id="calc-h">Hitung otomatis</h2>

      <label htmlFor="say">Isi dengan kalimat (opsional)</label>
      <div className="say">
        <input id="say" className="inp" placeholder="contoh: beli 3 lot BBCA di 9000, atau BBRI 2 juta" value={say}
          onChange={(e) => setSay(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fill()} />
        <button className="btn sm" onClick={fill} disabled={!say.trim()}>Isi otomatis</button>
      </div>
      {sayMsg && <p className={sayMsg.err ? "err-t" : "note"} role="status" style={{ marginTop: -4 }}>{sayMsg.text}</p>}

      <div className="calc-top">
        <label>Saham
          <select className="inp" value={sym} onChange={(e) => { setSym(e.target.value); setPriceStr(""); }}>
            {stocks.length ? stocks.map((s) => <option key={s.symbol} value={s.symbol}>{s.code} — {s.name}</option>) : <option value="BBCA.JK">BBCA</option>}
          </select>
        </label>
        <label>Harga per lembar (Rp)
          <input className="inp" inputMode="numeric" placeholder={live ? `Harga Yahoo: ${Math.round(live)}` : "Menunggu harga…"} value={priceStr === "" ? "" : fmt(priceStr)}
            onChange={(e) => setPriceStr(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <p className="note" style={{ marginTop: -4 }}>
        {priceStr === "" ? (live ? `Memakai harga Yahoo ${rp(live)} (tertunda ±10 menit).` : "Harga Yahoo belum termuat.") : <>Memakai harga yang kamu isi. <button className="link" onClick={() => setPriceStr("")}>Pakai harga Yahoo</button></>}
      </p>

      <div className="calc-grid">
        <label>Jumlah lot<input className="inp big" inputMode="numeric" value={shown("lots")} onChange={edit("lots")} aria-describedby="calc-hint" /></label>
        <label>Jumlah lembar<input className="inp big" inputMode="numeric" value={shown("shares")} onChange={edit("shares")} /></label>
        <label>Nominal (total bayar, Rp)<input className="inp big" inputMode="numeric" value={shown("amount")} onChange={edit("amount")} /></label>
      </div>
      <p id="calc-hint" className="note" style={{ marginTop: -4 }}>Isi salah satu kolom, dua lainnya terisi sendiri. 1 lot = 100 lembar.</p>

      <label>Biaya beli (%), isi sendiri sesuai sekuritasmu
        <input className="inp" style={{ maxWidth: 160 }} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.,]/g, ""))} />
      </label>

      {res ? (
        <div className="res">
          <div><span>Harga 1 lot</span><b>{rp(res.lotPrice)}</b></div>
          <div><span>Nilai saham ({res.lots} lot)</span><b>{rp(res.gross)}</b></div>
          <div><span>Biaya ({feeNum}%)</span><b>{rp(res.feeRp)}</b></div>
          <div className="tot"><span>Total bayar</span><b>{rp(res.total)}</b></div>
          {res.sisa != null && <div><span>Sisa uang yang tidak cukup untuk 1 lot lagi</span><b>{rp(res.sisa)}</b></div>}
          {src === "amount" && res.lots === 0 && <p className="err-t">Nominal itu belum cukup untuk 1 lot.</p>}
          {res.note && <p className="note">{res.note}</p>}
        </div>
      ) : <p className="muted">Menunggu harga untuk menghitung…</p>}
      <p className="note">Hitungan perkiraan dari harga Yahoo yang tertunda ±10 menit. Bawaan biaya 0% karena tiap sekuritas berbeda. Edukasi, bukan saran investasi.</p>
    </section>
  );
}
