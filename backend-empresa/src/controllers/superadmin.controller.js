import bcrypt from "bcryptjs";
import { pool } from "../data/db.js";
import { esId, limpiarEmail, emailValido } from "../utils/validar.js";

const responderError = (res, nombre, error) => {
  if (error.code === "23505") return res.status(409).json({ mensaje: "Ya existe una cuenta con ese email" });
  console.error(`${nombre}:`, error);
  res.status(500).json({ mensaje: "Error en el servidor" });
};

const passwordValida = (p, minimo = 6) => typeof p === "string" && p.length >= minimo;

// ------------------------- Complejos / organizadores -------------------------

// Todas las cuentas de complejo, las pendientes primero. Nunca incluye la contraseña.
export const listarEmpresas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id_empresa, e.nombre_complejo, e.socios, e.email, e.direccion, e.aprobada,
              (e.password IS NOT NULL) AS tiene_password,
              (SELECT COUNT(*) FROM canchas c WHERE c.id_empresa = e.id_empresa) AS canchas,
              (SELECT COUNT(*) FROM torneos t WHERE t.id_empresa = e.id_empresa) AS torneos,
              (SELECT COUNT(*) FROM eventos v WHERE v.id_empresa = e.id_empresa) AS eventos
       FROM empresas e
       ORDER BY e.aprobada ASC, e.id_empresa DESC`,
    );
    res.json(rows);
  } catch (error) {
    responderError(res, "listarEmpresas", error);
  }
};

// Dar de alta un complejo directamente: queda aprobado y con la contraseña que se le indique
export const crearEmpresa = async (req, res) => {
  try {
    const { socios, nombre_complejo, direccion, password } = req.body;
    const email = limpiarEmail(req.body.email);
    if (!socios || !nombre_complejo || !direccion || !email) {
      return res.status(400).json({ mensaje: "Responsable, nombre del complejo, dirección y email son obligatorios" });
    }
    if (!emailValido(email)) return res.status(400).json({ mensaje: "El email no es válido" });
    if (!passwordValida(password)) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO empresas (socios, nombre_complejo, direccion, email, password, aprobada)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id_empresa`,
      [socios, nombre_complejo, direccion, email, hash],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    responderError(res, "crearEmpresa", error);
  }
};

// Aprobar (dar de alta) o suspender (dar de baja) una cuenta
export const cambiarAprobacion = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (typeof req.body.aprobada !== "boolean") {
      return res.status(400).json({ mensaje: "Indicá aprobada: true o false" });
    }
    const { rows } = await pool.query(
      "UPDATE empresas SET aprobada = $1 WHERE id_empresa = $2 RETURNING id_empresa, aprobada",
      [req.body.aprobada, req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Complejo no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    responderError(res, "cambiarAprobacion", error);
  }
};

// Poner o restablecer la contraseña de un complejo (por ejemplo, las cuentas de prueba que no tienen)
export const establecerPassword = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (!passwordValida(req.body.password)) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    const { rowCount } = await pool.query("UPDATE empresas SET password = $1 WHERE id_empresa = $2", [
      hash,
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ mensaje: "Complejo no encontrado" });
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (error) {
    responderError(res, "establecerPassword", error);
  }
};

// Solo se elimina una cuenta suspendida o pendiente que no tenga nada cargado (para no borrar datos por error)
export const eliminarEmpresa = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query(
      `SELECT e.aprobada,
              (SELECT COUNT(*) FROM canchas WHERE id_empresa = e.id_empresa) AS canchas,
              (SELECT COUNT(*) FROM torneos WHERE id_empresa = e.id_empresa) AS torneos,
              (SELECT COUNT(*) FROM eventos WHERE id_empresa = e.id_empresa) AS eventos
       FROM empresas e WHERE e.id_empresa = $1`,
      [req.params.id],
    );
    const e = rows[0];
    if (!e) return res.status(404).json({ mensaje: "Complejo no encontrado" });
    if (e.aprobada) {
      return res.status(409).json({ mensaje: "Primero suspendé la cuenta; recién después se puede eliminar" });
    }
    if (e.canchas + e.torneos + e.eventos > 0) {
      return res.status(409).json({
        mensaje: "Tiene canchas, torneos o eventos cargados: dejala suspendida en vez de eliminarla",
      });
    }
    await pool.query("DELETE FROM empresas WHERE id_empresa = $1", [req.params.id]);
    res.json({ mensaje: "Cuenta eliminada" });
  } catch (error) {
    responderError(res, "eliminarEmpresa", error);
  }
};

// ------------------------- Super admins -------------------------

export const listarSuperadmins = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_superadmin, nombre, email, fecha_creacion FROM superadmins ORDER BY id_superadmin",
    );
    res.json(rows);
  } catch (error) {
    responderError(res, "listarSuperadmins", error);
  }
};

export const crearSuperadmin = async (req, res) => {
  try {
    const nombre = String(req.body.nombre ?? "").trim();
    const email = limpiarEmail(req.body.email);
    if (!nombre || !email) return res.status(400).json({ mensaje: "Nombre y email son obligatorios" });
    if (!emailValido(email)) return res.status(400).json({ mensaje: "El email no es válido" });
    if (!passwordValida(req.body.password, 8)) {
      return res.status(400).json({ mensaje: "La contraseña de un super admin debe tener al menos 8 caracteres" });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const { rows } = await pool.query(
      "INSERT INTO superadmins (nombre, email, password) VALUES ($1, $2, $3) RETURNING id_superadmin",
      [nombre, email, hash],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    responderError(res, "crearSuperadmin", error);
  }
};

export const eliminarSuperadmin = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (String(req.params.id) === String(req.usuario.id_superadmin)) {
      return res.status(409).json({ mensaje: "No podés eliminar tu propia cuenta" });
    }
    const { rowCount } = await pool.query("DELETE FROM superadmins WHERE id_superadmin = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ mensaje: "Super admin no encontrado" });
    res.json({ mensaje: "Super admin eliminado" });
  } catch (error) {
    responderError(res, "eliminarSuperadmin", error);
  }
};

export const cambiarMiPassword = async (req, res) => {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !passwordValida(nueva, 8)) {
      return res.status(400).json({ mensaje: "Indicá tu contraseña actual y una nueva de al menos 8 caracteres" });
    }
    const { rows } = await pool.query("SELECT password FROM superadmins WHERE id_superadmin = $1", [
      req.usuario.id_superadmin,
    ]);
    if (!rows[0] || !(await bcrypt.compare(actual, rows[0].password))) {
      return res.status(400).json({ mensaje: "La contraseña actual no es correcta" });
    }
    await pool.query("UPDATE superadmins SET password = $1 WHERE id_superadmin = $2", [
      await bcrypt.hash(nueva, 10),
      req.usuario.id_superadmin,
    ]);
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (error) {
    responderError(res, "cambiarMiPassword", error);
  }
};
