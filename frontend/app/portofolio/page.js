"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "../../components/AppShell";
import Gate from "../../components/Gate";
import { rp, pct, cls } from "../../lib/format";
import { resolveOrder } from "../../lib/lot";

const H = { "Content-Type": "application/json" };
const api = async (url, opt) => {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Server tidak merespons. Pastikan backend menyala (cek terminal).");
  return j;
};

function Row({ h, s, reload, pick }) {
  const [lots, setLots] = useState(String(h.lots));
  const [price, setPrice] = useState(String(Math.round(Number(h.buy_price))));
  const [msg, setMsg] = useState("");
  const cost = h.lots * 100 * Number(h.buy_price);
  const val = s?.ok ? h.lots * 100 * s.price : null;
  const pl = val == null ? null : val - cost;
  const dirty = Number(lots) !== h.lots || Number(price) !== Math.round(Number(h.buy_price));
  const save = async () => {
    setMsg("");
    try { await api("/api/portfolio", { method: "PATCH", headers: H, body: JSON.stringify({ id: h.id, lots: Number(lots), price: Number(price) }) }); reload(); }
    catch (e) { setMsg(e.message); }
  };
  const del = async () => { await api(`/api/portfolio?id=${h.id}`, { method: "DELETE" }).catch(() => {}); reload(); };
  return (
    <tr>
      <td><button className="link" onClick={() => pick(h.symbol)}><b>{h.symbol.replace(".JK", "")}</b></button><span className="nm">{h.bought_at || "tanpa tanggal"}</span></td>
      <td><input className="inp mini" aria-label="Jumlah lot" inputMode="numeric" value={lots} onChange={(e) => setLots(e.target.value.replace(/\D/g, ""))} /></td>
      <td><input className="inp mini" aria-label="Harga beli per lembar" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} /></td>
      <td>{s?.ok ? rp(s.price) : "…"}</td>
      <td>{val == null ? "…" : rp(val)}</td>
      <td className={pl == null ? "" : cls(pl)}>{pl == null ? "…" : <>{rp(pl)}<span className="nm">{pct((pl / cost) * 100)}</span></>}</td>
      <td style={{ whiteSpace: "nowrap" }}>
        {dirty && <button className="btn sm" onClick={save}>Simpan</button>} <button className="btn sm ghost" onClick={del}>Hapus</button>
        {msg && <span className="nm err-t">{msg}</span>}
      </td>
    </tr>
  );
}

function Portfolio() {
  const { data, pick } = useApp();
  const stocks = data?.stocks || [];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ symbol: "BBCA.JK", lots: "1", price: "", date: "" });
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    try { setItems((await api("/api/portfolio")).items); setErr(""); } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const cur = stocks.find((s) => s.symbol === form.symbol);
  const [say, setSay] = useState("");
  const [sayMsg, setSayMsg] = useState(null);
  const fill = () => {
    const r = resolveOrder(say, stocks.filter((x) => x.ok));
    if (r.error) return setSayMsg({ err: true, text: r.error });
    setForm({ ...form, symbol: r.symbol, lots: String(r.lots), price: r.usedLive ? "" : String(Math.round(r.price)) });
    setSayMsg({ text: `Terbaca: ${r.code} · ${r.lots} lot · harga ${rp(r.price)}${r.usedLive ? " (harga Yahoo)" : ""}. Cek dulu isiannya, lalu klik Tambah.` });
  };
  const nowPrice = Number(form.price) || (cur?.ok ? Math.round(cur.price) : 0);
  const nLots = Number(form.lots) || 0;
  const add = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await api("/api/portfolio", { method: "POST", headers: H, body: JSON.stringify({ symbol: form.symbol, lots: Number(form.lots), price: Number(form.price || (cur?.ok ? Math.round(cur.price) : 0)), date: form.date || null }) });
      setForm({ ...form, lots: "1", price: "", date: "" }); reload();
    } catch (x) { setErr(x.message); }
  };

  const sum = useMemo(() => {
    let cost = 0, val = 0, missing = 0;
    items.forEach((h) => {
      const s = stocks.find((x) => x.symbol === h.symbol);
      cost += h.lots * 100 * Number(h.buy_price);
      if (s?.ok) val += h.lots * 100 * s.price; else missing++;
    });
    return { cost, val, pl: val - cost, missing };
  }, [items, stocks]);

  return (
    <>
      <div className="stats">
        <div className="stat"><small>Modal tercatat</small><b>{rp(sum.cost)}</b></div>
        <div className="stat"><small>Nilai sekarang</small><b>{rp(sum.val)}</b></div>
        <div className="stat"><small>Untung / rugi</small><b className={cls(sum.pl)}>{rp(sum.pl)}</b>{sum.cost > 0 && <small className={cls(sum.pl)}>{pct((sum.pl / sum.cost) * 100)}</small>}</div>
      </div>
      {sum.missing > 0 && <div className="err">Harga {sum.missing} saham belum termuat dari Yahoo, jadi angka di atas belum lengkap.</div>}

      <section className="panel" style={{ marginBottom: 20 }}>
        <h2>Catat pembelian</h2>
        <label htmlFor="say">Isi dengan kalimat (opsional)</label>
        <div className="say">
          <input id="say" className="inp" placeholder="contoh: beli 3 lot BBCA di 9000, atau BBRI 2 juta" value={say} onChange={(e) => setSay(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), fill())} />
          <button type="button" className="btn sm" onClick={fill} disabled={!say.trim()}>Isi otomatis</button>
        </div>
        {sayMsg && <p className={sayMsg.err ? "err-t" : "note"} role="status" style={{ marginTop: -4 }}>{sayMsg.text}</p>}
        <form className="pf-f" onSubmit={add}>
          <label>Saham<select className="inp" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>{stocks.length ? stocks.map((s) => <option key={s.symbol} value={s.symbol}>{s.code} — {s.name}</option>) : <option value="BBCA.JK">BBCA</option>}</select></label>
          <label>Jumlah lot<input className="inp" inputMode="numeric" value={form.lots} onChange={(e) => setForm({ ...form, lots: e.target.value.replace(/\D/g, "") })} /></label>
          <label>Harga beli per lembar (Rp)<input className="inp" inputMode="numeric" placeholder={cur?.ok ? `Kosong = ${Math.round(cur.price)} (harga kini)` : ""} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} /></label>
          <label>Tanggal (opsional)<input className="inp" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <button className="btn">Tambah</button>
        </form>
        {nLots > 0 && nowPrice > 0 && <p className="note">= <b>{(nLots * 100).toLocaleString("id-ID")} lembar</b> · modal <b>{rp(nLots * 100 * nowPrice)}</b> (harga {rp(nowPrice)} per lembar, belum termasuk biaya).</p>}
        {err && <div className="err" role="alert" style={{ marginTop: 10 }}>{err}</div>}
      </section>

      <section className="panel">
        <h2>Catatan portofolio</h2>
        {loading ? <div className="empty pulse">Memuat…</div> : !items.length ? <div className="empty">Belum ada catatan. Tambahkan pembelian simulasi di atas.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Saham</th><th>Lot</th><th>Harga beli</th><th>Harga kini</th><th>Nilai</th><th>Untung / rugi</th><th /></tr></thead>
              <tbody>{items.map((h) => <Row key={h.id + "-" + h.lots + "-" + h.buy_price} h={h} s={stocks.find((x) => x.symbol === h.symbol)} reload={reload} pick={pick} />)}</tbody>
            </table>
          </div>
        )}
        <p className="note">Portofolio simulasi untuk belajar, bukan akun sekuritas. 1 lot = 100 lembar. Tanpa biaya broker dan pajak. Harga kini dari Yahoo Finance.</p>
      </section>
    </>
  );
}

export default function Page() {
  return (
    <>
      <header className="top"><div><h1>Portofolio</h1><p>Catat pembelian simulasi dan lihat untung ruginya dari harga terbaru. Tersimpan per akun di MySQL.</p></div></header>
      <Gate name="Portofolio"><Portfolio /></Gate>
    </>
  );
}
