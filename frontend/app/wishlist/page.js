"use client";
import { useApp } from "../../components/AppShell";
import Gate from "../../components/Gate";
import Wishlist from "../../components/Wishlist";

export default function Page() {
  const { user, wl, loadWl, data, pick, openAuth } = useApp();
  return (
    <>
      <header className="top"><div><h1>Wishlist</h1><p>Saham favoritmu, lengkap dengan catatan dan harga target. Tersimpan per akun di MySQL.</p></div></header>
      <Gate name="Wishlist">
        <Wishlist user={user} items={wl} stocks={data?.stocks || []} onChange={loadWl} onPick={pick} onLogin={() => openAuth("")} />
      </Gate>
    </>
  );
}
