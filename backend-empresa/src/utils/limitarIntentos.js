// Frena los intentos de adivinar contraseñas: tras 8 fallos (401) seguidos de una misma IP con un mismo email,
// se bloquea ese par durante 15 minutos. Un ingreso correcto reinicia la cuenta.
const VENTANA_MS = 15 * 60 * 1000;
const MAX_FALLOS = 8;
const fallos = new Map(); // "ip|email" -> { n, desde }

setInterval(() => {
  const ahora = Date.now();
  for (const [clave, v] of fallos) if (ahora - v.desde > VENTANA_MS) fallos.delete(clave);
}, 5 * 60 * 1000).unref();

export const reiniciarLimitador = () => fallos.clear();

export const limitarLogin = (req, res, next) => {
  const clave = `${req.ip}|${String(req.body?.email ?? "").trim().toLowerCase()}`;
  let registro = fallos.get(clave);
  if (registro && Date.now() - registro.desde > VENTANA_MS) {
    fallos.delete(clave);
    registro = undefined;
  }
  if (registro && registro.n >= MAX_FALLOS) {
    return res.status(429).json({ mensaje: "Demasiados intentos fallidos. Esperá unos minutos y probá de nuevo." });
  }

  res.on("finish", () => {
    if (res.statusCode === 401) {
      const actual = fallos.get(clave);
      if (actual && Date.now() - actual.desde <= VENTANA_MS) actual.n++;
      else fallos.set(clave, { n: 1, desde: Date.now() });
    } else if (res.statusCode < 400) {
      fallos.delete(clave);
    }
  });
  next();
};
