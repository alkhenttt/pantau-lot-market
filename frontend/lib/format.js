export const TZ = "Asia/Jakarta";
export const rp = (n, d = 0) =>
  n == null ? "-" : "Rp" + Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
export const num = (n) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: 2 });
export const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
export const cls = (n) => (n >= 0 ? "up" : "down");
export const fmtT = (t, intraday) =>
  new Date(t).toLocaleString("id-ID", intraday
    ? { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    : { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
export const RANGES = [["1d", "1 Hari"], ["5d", "5 Hari"], ["1mo", "1 Bulan"], ["3mo", "3 Bulan"]];
export const symLabel = (s) => (s === "^JKSE" ? "IHSG" : s.replace(".JK", ""));
