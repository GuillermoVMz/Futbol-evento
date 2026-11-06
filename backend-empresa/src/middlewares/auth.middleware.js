import jwt from "jsonwebtoken";
import { pool } from "../data/db.js";

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

// Si un super admin suspende una cuenta, deja de funcionar al instante (no hay que esperar a que venza su sesión).
// Responde 401 para que el navegador cierre la sesión.
const empresaHabilitada = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT aprobada FROM empresas WHERE id_empresa = $1", [req.usuario.id_empresa]);
    if (!rows[0]?.aprobada) {
      return res.status(401).json({ mensaje: "Tu cuenta no está habilitada. Contactá a los administradores." });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Lo mismo para un super admin eliminado
const superadminVigente = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("SELECT 1 FROM superadmins WHERE id_superadmin = $1", [req.usuario.id_superadmin]);
    if (rowCount === 0) return res.status(401).json({ mensaje: "Tu cuenta de super admin ya no existe" });
    next();
  } catch (error) {
    next(error);
  }
};

// Uso en rutas: router.post("/", ...soloEmpresa, controlador)
export const soloEmpresa = [verificarToken, requerirRol("empresa"), empresaHabilitada]; // dueños / organizadores
export const soloUsuario = [verificarToken, requerirRol("usuario")]; // jugadores
export const soloSuperadmin = [verificarToken, requerirRol("superadmin"), superadminVigente]; // el equipo
