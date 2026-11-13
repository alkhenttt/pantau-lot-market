"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthPanel from "./AuthPanel";
import AiBubble from "./AiBubble";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const IC = {
  ai: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
  explore: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  pie: "M12 3v9h9M20.5 15A9 9 0 1 1 9 3.5",
  radar: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12l6-6",
  news: "M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM9 8h5M9 12h5M9 16h3",
  book: "M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  compare: "M5 20V10M12 20V4M19 20v-7",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
  calc: "M5 3h14v18H5zM8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0",
};
const Icon = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]} /></svg>
);

const NAV = [
  { href: "/", label: "Jelajahi", icon: "explore", key: "1" },
  { href: "/wishlist", label: "Wishlist", icon: "star", key: "2", lock: true },
  { href: "/screener", label: "Screener", icon: "filter", key: "3" },
  { href: "/portofolio", label: "Portofolio", icon: "pie", key: "4", lock: true },
  { href: "/radar", label: "Radar Lot Modal", icon: "radar", key: "5" },
  { href: "/kabar", label: "Kabar Harian", icon: "news", key: "6" },
  { href: "/mulai", label: "Mulai di Sini", icon: "book", key: "7" },
  { section: "ALAT" },
  { href: "/sektor", label: "Papan Sektor", icon: "grid", key: "8" },
  { href: "/bandingkan", label: "Bandingkan", icon: "compare", key: "9" },
  { href: "/kalkulator", label: "Kalkulator Lot", icon: "calc", key: "0" },
];
const LINKS = NAV.filter((n) => n.href);

// Perkiraan saja: Senin-Jumat 09.00-16.00 WIB, tidak memperhitungkan jeda siang & hari libur bursa.
const isOpenNow = () => {
  const w = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const m = w.getHours() * 60 + w.getMinutes(), d = w.getDay();
  return d >= 1 && d <= 5 && m >= 540 && m < 960;
};
const JSONH = { "Content-Type": "application/json" };

export default function AppShell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState({});
  const prevPrice = useRef({});
  const [user, setUser] = useState(undefined); // undefined = memeriksa, null = belum login
  const [authReason, setAuthReason] = useState(null); // null = modal tertutup
  const [wl, setWl] = useState([]);
  const [sel, setSel] = useState("^JKSE");
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) throw new Error("Server menjawab " + res.status);
      const j = await res.json();
      const f = {};
      j.stocks.forEach((s) => {
        const o = prevPrice.current[s.symbol];
        if (s.ok && o != null && s.price !== o) f[s.symbol] = s.price > o ? "up" : "down";
        if (s.ok) prevPrice.current[s.symbol] = s.price;
      });
      setFlash(f); setData(j); setError(null);
    } catch (e) { setError("Data belum bisa dimuat (" + e.message + "). Mencoba lagi otomatis."); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  useEffect(() => { fetch("/api/auth").then((r) => r.json()).then((j) => setUser(j.user || null)).catch(() => setUser(null)); }, []);
  const loadWl = useCallback(async () => {
    try { const r = await fetch("/api/wishlist"); const j = await r.json(); setWl(r.ok ? j.items : []); } catch { setWl([]); }
  }, []);
  useEffect(() => { if (user) loadWl(); else setWl([]); }, [user, loadWl]);

  const openAuth = useCallback((reason = "") => setAuthReason(reason), []);
  const toggleWl = async (symbol) => {
    if (!user) return openAuth("Masuk untuk menyimpan wishlist");
    const has = wl.some((w) => w.symbol === symbol);
    await fetch(has ? `/api/wishlist?symbol=${encodeURIComponent(symbol)}` : "/api/wishlist",
      has ? { method: "DELETE" } : { method: "POST", headers: JSONH, body: JSON.stringify({ symbol }) });
    loadWl();
  };
  const logout = async () => { await fetch("/api/auth", { method: "POST", headers: JSONH, body: JSON.stringify({ action: "logout" }) }); setUser(null); };
  const pick = (symbol) => { setSel(symbol); router.push("/"); window.scrollTo({ top: 0 }); };
  const openAI = () => window.dispatchEvent(new Event("open-ai"));

  useEffect(() => { setMenu(false); }, [path]);
  useEffect(() => { setOpen(isOpenNow()); const t = setInterval(() => setOpen(isOpenNow()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("input,textarea,select,[contenteditable]")) return;
      if (e.key === "/") { e.preventDefault(); openAI(); return; }
      const it = LINKS.find((n) => n.key === e.key);
      if (it) router.push(it.href);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [router]);

  const value = { data, error, flash, user, setUser, wl, loadWl, toggleWl, sel, setSel, pick, openAuth, openAI };

  return (
    <Ctx.Provider value={value}>
      <div className="shell">
        {menu && <div className="scrim" onClick={() => setMenu(false)} />}
        <aside className={"side" + (menu ? " open" : "")} aria-label="Navigasi utama">
          <div className="brand">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#1c2430" /><rect x="8" y="16" width="5" height="10" rx="1.5" fill="#3ecf8e" /><rect x="15" y="8" width="5" height="18" rx="1.5" fill="#5b8cff" /><rect x="22" y="12" width="5" height="14" rx="1.5" fill="#ff6b6e" /></svg>
            <div><b>Pantau Lot</b><small>Market watch BEI</small></div>
          </div>
          <span className={"mkt" + (open ? " on" : "")} title="Perkiraan: Senin–Jumat 09.00–16.00 WIB. Tidak memperhitungkan jeda siang dan hari libur bursa."><i />{open == null ? "BEI…" : open ? "BEI buka" : "BEI tutup"}</span>
          <nav>
            <button className="nav-i" onClick={openAI}><Icon n="ai" /><span className="sp">Tanya AI</span><kbd>/</kbd></button>
            {NAV.map((n, i) => n.section ? <p key={i} className="nav-h">{n.section}</p> : (
              <Link key={n.href} href={n.href} className={"nav-i" + (path === n.href ? " act" : "")} aria-current={path === n.href ? "page" : undefined}>
                <Icon n={n.icon} /><span className="sp">{n.label}</span>
                {n.lock && !user && <span title="Perlu masuk"><Icon n="lock" s={14} /></span>}
                <kbd>{n.key}</kbd>
              </Link>
            ))}
          </nav>
          <div className="side-foot">
            {user ? (<><small>Masuk sebagai <b>{user.name}</b></small><button className="btn sm ghost" onClick={logout}>Keluar</button></>)
              : (<button className="btn sm" onClick={() => openAuth("")}>Masuk / Daftar</button>)}
            <small className="muted">Data Yahoo Finance, tertunda ±10 menit. Edukasi, bukan saran investasi.</small>
          </div>
        </aside>
        <div className="main">
          <div className="topbar"><button className="burger" aria-label="Buka menu" onClick={() => setMenu(true)}>☰</button><b>Pantau Lot</b></div>
          <div className="content">{children}</div>
        </div>
        {authReason !== null && <AuthPanel reason={authReason} onClose={() => setAuthReason(null)} onDone={(u) => { setUser(u); setAuthReason(null); }} />}
        <AiBubble user={user} stocks={data?.stocks || []} index={data?.index} sel={sel} wl={wl} onLogin={() => openAuth("Masuk untuk memakai asisten AI")} />
      </div>
    </Ctx.Provider>
  );
}
