import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
};

const requerirRol = (rol) => (req, res, next) =>
  req.usuario?.rol === rol
    ? next()
    : res.status(403).json({ mensaje: "No tenés permiso para esta acción" });

// Uso en rutas: router.post("/", ...soloEmpresa, controlador)
export const soloEmpresa = [verificarToken, requerirRol("empresa")]; // dueños / organizadores
export const soloUsuario = [verificarToken, requerirRol("usuario")]; // jugadores
