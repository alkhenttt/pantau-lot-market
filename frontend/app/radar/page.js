"use client";
import { useApp } from "../../components/AppShell";
import LotRadar from "../../components/LotRadar";

export default function Page() {
  const { data } = useApp();
  return (
    <>
      <header className="top"><div><h1>Radar Lot Modal</h1><p>Fitur unggulan Pantau Lot: ubah modal rupiah menjadi jumlah lot dan lihat kurva nilai modalmu.</p></div></header>
      <div style={{ maxWidth: 640 }}><LotRadar stocks={data?.stocks || []} /></div>
    </>
  );
}
