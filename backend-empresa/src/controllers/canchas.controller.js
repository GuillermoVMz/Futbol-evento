import { pool } from "../data/db.js";
import { esId } from "../utils/validar.js";

const TIPOS = ["Fútbol 5", "Fútbol 7", "Fútbol 11"];

// "complejo" y "direccion" salen de la tabla empresas (ya no están fijos en el frontend)
const BASE = `SELECT c.*, e.nombre_complejo AS complejo, e.direccion
              FROM canchas c JOIN empresas e ON e.id_empresa = c.id_empresa`;

// Público: solo canchas activas
export const obtenerCanchas = async (req, res) => {
  try {
    const { rows } = await pool.query(`${BASE} WHERE c.activo = TRUE ORDER BY c.id_cancha`);
    res.json(rows);
  } catch (error) {
    console.error("obtenerCanchas:", error);
    res.status(500).json({ mensaje: "Error al obtener las canchas" });
  }
};

// Panel del dueño: todas SUS canchas (activas e inactivas)
export const obtenerMisCanchas = async (req, res) => {
  try {
    const { rows } = await pool.query(`${BASE} WHERE c.id_empresa = $1 ORDER BY c.id_cancha`, [
      req.usuario.id_empresa,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("obtenerMisCanchas:", error);
    res.status(500).json({ mensaje: "Error al obtener tus canchas" });
  }
};

export const obtenerCanchaPorId = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query(`${BASE} WHERE c.id_cancha = $1 AND c.activo = TRUE`, [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cancha no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    console.error("obtenerCanchaPorId:", error);
    res.status(500).json({ mensaje: "Error al obtener la cancha" });
  }
};

export const crearCancha = async (req, res) => {
  try {
    const { nombre, tipo, techada, precio_hora } = req.body;
    if (!nombre || !TIPOS.includes(tipo) || precio_hora == null || precio_hora === "" || !(Number(precio_hora) >= 0)) {
      return res
        .status(400)
        .json({ mensaje: `nombre, precio_hora y tipo (${TIPOS.join(", ")}) son obligatorios` });
    }

    // La empresa sale del token: un dueño nunca puede crear canchas en otro complejo
    const { rows } = await pool.query(
      `INSERT INTO canchas (id_empresa, nombre, tipo, techada, precio_hora)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.usuario.id_empresa, nombre, tipo, techada ?? false, precio_hora],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("crearCancha:", error);
    res.status(500).json({ mensaje: "Error al crear la cancha" });
  }
};

export const actualizarCancha = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { nombre, tipo, techada, precio_hora, activo } = req.body;
    if (tipo !== undefined && !TIPOS.includes(tipo)) {
      return res.status(400).json({ mensaje: `tipo debe ser: ${TIPOS.join(", ")}` });
    }

    const { rows } = await pool.query(
      `UPDATE canchas SET
         nombre      = COALESCE($1, nombre),
         tipo        = COALESCE($2, tipo),
         techada     = COALESCE($3, techada),
         precio_hora = COALESCE($4, precio_hora),
         activo      = COALESCE($5, activo)
       WHERE id_cancha = $6 AND id_empresa = $7 RETURNING *`,
      [nombre, tipo, techada, precio_hora, activo, req.params.id, req.usuario.id_empresa],
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cancha no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    console.error("actualizarCancha:", error);
    res.status(500).json({ mensaje: "Error al actualizar la cancha" });
  }
};
