// Daftar saham BEI (suffix .JK = Bursa Efek Indonesia di Yahoo Finance).
// `sec` = pengelompokan sektor sederhana (metadata statis, bukan data harga). Silakan ubah.
export const INDEX_SYMBOL = "^JKSE"; // IHSG

export const STOCKS = [
  { s: "BBCA.JK", n: "Bank Central Asia", sec: "Perbankan" },
  { s: "BBRI.JK", n: "Bank Rakyat Indonesia", sec: "Perbankan" },
  { s: "BMRI.JK", n: "Bank Mandiri", sec: "Perbankan" },
  { s: "BBNI.JK", n: "Bank Negara Indonesia", sec: "Perbankan" },
  { s: "TLKM.JK", n: "Telkom Indonesia", sec: "Telekomunikasi" },
  { s: "ASII.JK", n: "Astra International", sec: "Otomotif & Industri" },
  { s: "UNVR.JK", n: "Unilever Indonesia", sec: "Barang Konsumsi" },
  { s: "ICBP.JK", n: "Indofood CBP", sec: "Barang Konsumsi" },
  { s: "INDF.JK", n: "Indofood Sukses Makmur", sec: "Barang Konsumsi" },
  { s: "ADRO.JK", n: "Adaro Energy", sec: "Energi" },
  { s: "PGAS.JK", n: "Perusahaan Gas Negara", sec: "Energi" },
  { s: "ANTM.JK", n: "Aneka Tambang", sec: "Pertambangan" },
  { s: "MDKA.JK", n: "Merdeka Copper Gold", sec: "Pertambangan" },
  { s: "GOTO.JK", n: "GoTo Gojek Tokopedia", sec: "Teknologi" },
  { s: "KLBF.JK", n: "Kalbe Farma", sec: "Kesehatan" },
];
