"use client";
import { useApp } from "../../components/AppShell";
import Screener from "../../components/Screener";

export default function Page() {
  const { data, pick } = useApp();
  return (
    <>
      <header className="top"><div><h1>Screener</h1><p>Saring saham berdasarkan harga 1 lot, kinerja, tren, dan volatilitas. Klik baris untuk membuka grafiknya.</p></div></header>
      <Screener stocks={data?.stocks || []} onPick={pick} />
    </>
  );
}
