// Pembungkus agar error di handler async diteruskan ke penangan error pusat.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const fail = (res, status, error) => res.status(status).json({ error });
