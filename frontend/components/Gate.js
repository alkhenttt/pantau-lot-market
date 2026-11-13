"use client";
import { useApp } from "./AppShell";

export default function Gate({ name, children }) {
  const { user, openAuth } = useApp();
  if (user === undefined) return <div className="empty pulse">Memeriksa sesi…</div>;
  if (!user) return (
    <div className="gate panel">
      <h2>Masuk untuk membuka {name}</h2>
      <p className="muted">Pantau Lot gratis. Daftar dengan email dan kata sandi untuk menyimpan data milikmu sendiri.</p>
      <button className="btn" onClick={() => openAuth(`Masuk untuk membuka ${name}`)}>Masuk / Daftar</button>
    </div>
  );
  return children;
}
