import Link from "next/link";

const TERMS = [
  ["Saham", "Bukti kepemilikan sebagian kecil sebuah perusahaan. Harganya naik turun mengikuti jual beli di bursa."],
  ["Lot", "Satuan beli saham di BEI. 1 lot = 100 lembar saham. Jadi harga 1 lot = harga per lembar x 100. Itu sebabnya Radar Lot Modal dibuat."],
  ["IHSG", "Indeks Harga Saham Gabungan, ukuran gerak pasar saham Indonesia secara keseluruhan."],
  ["Perubahan harian", "Selisih harga sekarang dengan harga penutupan sebelumnya, dalam persen."],
  ["Rata-rata 20 hari (MA20)", "Rata-rata harga penutupan 20 hari bursa terakhir. Harga di atasnya berarti geraknya sedang lebih tinggi dari kebiasaan 20 hari terakhir."],
  ["Volatilitas", "Seberapa lebar harga naik turun. Makin besar, makin liar. Di Pantau Lot dihitung dari simpangan baku perubahan harian."],
  ["Volume", "Jumlah lembar saham yang diperdagangkan. Volume jauh di atas biasanya berarti saham sedang ramai."],
];
const STEPS = [
  ["/", "Jelajahi", "Lihat IHSG, grafik, dan analisis tiap saham."],
  ["/radar", "Radar Lot Modal", "Masukkan modalmu, lihat saham dan jumlah lot yang terjangkau."],
  ["/screener", "Screener", "Saring saham sesuai kriteriamu."],
  ["/bandingkan", "Bandingkan", "Adu kinerja beberapa saham pada periode yang sama."],
  ["/kalkulator", "Kalkulator Lot", "Isi lot, lembar, atau nominal, sisanya dihitung otomatis."],
  ["/wishlist", "Wishlist", "Simpan favorit dengan catatan dan harga target (perlu masuk)."],
  ["/portofolio", "Portofolio", "Catat pembelian simulasi dan lihat untung ruginya (perlu masuk)."],
];

export default function Page() {
  return (
    <>
      <header className="top"><div><h1>Mulai di Sini</h1><p>Panduan singkat untuk pemula: istilah dasar dan cara memakai Pantau Lot.</p></div></header>
      <section className="panel" style={{ marginBottom: 20 }}>
        <h2>Istilah dasar</h2>
        <dl className="gl">{TERMS.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
      </section>
      <section className="panel" style={{ marginBottom: 20 }}>
        <h2>Cara memakai Pantau Lot</h2>
        {STEPS.map(([href, name, d], i) => <Link key={href} href={href} className="row-b"><b>{i + 1}. {name}</b><span className="muted">{d}</span></Link>)}
        <p className="note">Tips: tekan angka 0 sampai 9 untuk pindah halaman, dan tombol / untuk membuka asisten AI.</p>
      </section>
      <section className="panel">
        <h2>Catatan penting</h2>
        <p className="muted">Data harga berasal dari Yahoo Finance dan tertunda sekitar 10 menit. Pantau Lot adalah alat belajar, bukan penasihat investasi, dan tidak menjual atau membeli saham. Investasi saham memiliki risiko kerugian.</p>
      </section>
    </>
  );
}
