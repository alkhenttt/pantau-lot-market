"use client";
import LotCalculator from "../../components/LotCalculator";

export default function Page() {
  return (
    <>
      <header className="top"><div><h1>Kalkulator Lot</h1><p>Isi satu angka (lot, lembar, atau nominal) dan sisanya dihitung otomatis. Harga acuan otomatis dari Yahoo Finance.</p></div></header>
      <div style={{ maxWidth: 680 }}><LotCalculator /></div>
    </>
  );
}
