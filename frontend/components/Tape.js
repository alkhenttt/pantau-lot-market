import { rp, pct, cls } from "../lib/format";

export default function Tape({ items }) {
  if (!items.length) return null;
  const row = items.map((s) => (
    <span key={s.symbol}><b>{s.code}</b>{rp(s.price)}<em className={cls(s.change)} style={{ fontStyle: "normal" }}>{pct(s.changePct)}</em></span>
  ));
  return <div className="tape" aria-hidden="true"><div className="tape-in"><div style={{display:"inline-flex",gap:28}}>{row}</div><div style={{display:"inline-flex",gap:28}}>{row}</div></div></div>;
}
