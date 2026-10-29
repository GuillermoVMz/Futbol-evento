import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../data/db.js";

const firmarToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });

// Lo que ve el frontend (nunca incluye el hash). "nombre" es lo que muestra el header.
const datosEmpresa = (e) => ({
  rol: "empresa",
  id_empresa: e.id_empresa,
  nombre: e.nombre_complejo || e.socios,
  socios: e.socios,
  nombre_complejo: e.nombre_complejo,
  direccion: e.direccion,
  email: e.email,
});

const datosUsuario = (u) => ({
  rol: "usuario",
  id_usuario: u.id_usuario,
  nombre: u.nombre,
  telefono: u.telefono,
  email: u.email,
});

const tokenEmpresa = (e) => firmarToken({ rol: "empresa", id_empresa: e.id_empresa, email: e.email });
const tokenUsuario = (u) => firmarToken({ rol: "usuario", id_usuario: u.id_usuario, email: u.email });

const limpiarEmail = (v) => String(v ?? "").trim().toLowerCase();
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const error500 = (res, nombre, error) => {
  if (error.code === "23505") {
    return res.status(409).json({ mensaje: "Ya existe una cuenta con ese email" });
  }
  console.error(`${nombre}:`, error);
  res.status(500).json({ mensaje: "Error en el servidor" });
};

// ------------------------- EMPRESAS (dueños / organizadores) -------------------------

export const loginEmpresa = async (req, res) => {
  try {
    const email = limpiarEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Email y contraseña son obligatorios" });
    }

    const { rows } = await pool.query("SELECT * FROM empresas WHERE lower(email) = $1", [email]);
    const empresa = rows[0];

    // Si la empresa todavía no tiene contraseña cargada, tampoco puede ingresar
    const valido = empresa?.password && (await bcrypt.compare(password, empresa.password));
    if (!valido) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }
    // Se avisa recién después de validar la contraseña, para no revelar qué emails existen
    if (!empresa.aprobada) {
      return res.status(403).json({
        mensaje: "Tu cuenta todavía está pendiente de aprobación. Te avisaremos cuando esté habilitada.",
      });
    }

    res.json({ token: tokenEmpresa(empresa), usuario: datosEmpresa(empresa) });
  } catch (error) {
    error500(res, "loginEmpresa", error);
  }
};

export const registerEmpresa = async (req, res) => {
  try {
    const email = limpiarEmail(req.body.email);
    const { password, nombre_complejo, direccion, codigo } = req.body;
    const socios = req.body.socios ?? req.body.nombre;

    // Si CODIGO_REGISTRO_EMPRESA está definido en el .env, es obligatorio conocerlo
    const codigoRequerido = process.env.CODIGO_REGISTRO_EMPRESA;
    if (codigoRequerido && String(codigo ?? "").trim() !== codigoRequerido) {
      return res.status(403).json({ mensaje: "Código de invitación incorrecto" });
    }

    if (!socios || !nombre_complejo || !direccion || !email || !password) {
      return res
        .status(400)
        .json({ mensaje: "Responsable, nombre del complejo, dirección, email y contraseña son obligatorios" });
    }
    if (!emailValido(email)) return res.status(400).json({ mensaje: "El email no es válido" });
    if (String(password).length < 6) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO empresas (socios, nombre_complejo, direccion, email, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [socios, nombre_complejo, direccion, email, hash],
    );

    // Queda pendiente (aprobada = FALSE): no se entrega token hasta que el equipo la apruebe
    res.status(201).json({
      pendiente: true,
      mensaje: "Recibimos tu solicitud. Te avisaremos cuando tu cuenta esté aprobada.",
    });
  } catch (error) {
    error500(res, "registerEmpresa", error);
  }
};

// ------------------------- USUARIOS (jugadores) -------------------------

export const loginUsuario = async (req, res) => {
  try {
    const email = limpiarEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: "Email y contraseña son obligatorios" });
    }

    const { rows } = await pool.query("SELECT * FROM usuarios WHERE lower(email) = $1", [email]);
    const usuario = rows[0];

    const valido = usuario && (await bcrypt.compare(password, usuario.password));
    if (!valido) {
      return res.status(401).json({ mensaje: "Credenciales incorrectas" });
    }

    res.json({ token: tokenUsuario(usuario), usuario: datosUsuario(usuario) });
  } catch (error) {
    error500(res, "loginUsuario", error);
  }
};

export const registerUsuario = async (req, res) => {
  try {
    const email = limpiarEmail(req.body.email);
    const { nombre, telefono, password } = req.body;

    if (!nombre || !telefono || !email || !password) {
      return res.status(400).json({ mensaje: "Nombre, teléfono, email y contraseña son obligatorios" });
    }
    if (!emailValido(email)) return res.status(400).json({ mensaje: "El email no es válido" });
    if (String(password).length < 6) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, telefono, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre, telefono, email, hash],
    );

    res.status(201).json({ token: tokenUsuario(rows[0]), usuario: datosUsuario(rows[0]) });
  } catch (error) {
    error500(res, "registerUsuario", error);
  }
};

// ------------------------- PERFIL (según el rol del token) -------------------------

export const obtenerPerfil = async (req, res) => {
  try {
    const { rol, id_empresa, id_usuario } = req.usuario;
    const consulta =
      rol === "empresa"
        ? ["SELECT * FROM empresas WHERE id_empresa = $1", id_empresa, datosEmpresa]
        : ["SELECT * FROM usuarios WHERE id_usuario = $1", id_usuario, datosUsuario];

    const { rows } = await pool.query(consulta[0], [consulta[1]]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cuenta no encontrada" });
    res.json(consulta[2](rows[0]));
  } catch (error) {
    error500(res, "obtenerPerfil", error);
  }
};
