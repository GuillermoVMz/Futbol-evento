import { pool } from "../data/db.js";
import { esId, esFechaHora, esUrlImagen, sinImagen } from "../utils/validar.js";

const MODALIDADES = ["F5", "F7", "F11"];
const ESTADOS = ["Inscripciones Abiertas", "Cupos Llenos", "Finalizado"];

// ------- Público -------
export const obtenerEventos = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM eventos ORDER BY fecha");
    res.json(rows);
  } catch (error) {
    console.error("obtenerEventos:", error);
    res.status(500).json({ mensaje: "Error al obtener los eventos" });
  }
};

export const obtenerEventoPorId = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query("SELECT * FROM eventos WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("obtenerEventoPorId:", error);
    res.status(500).json({ mensaje: "Error al obtener el evento" });
  }
};

// ------- Organizadores (cuenta de empresa) -------
export const obtenerMisEventos = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM eventos WHERE id_empresa = $1 ORDER BY fecha DESC", [
      req.usuario.id_empresa,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("obtenerMisEventos:", error);
    res.status(500).json({ mensaje: "Error al obtener tus eventos" });
  }
};

const validarEvento = ({ titulo, lugar, fecha, modalidad, estado, imagen_url }) => {
  if (!titulo || !lugar) return "Título y lugar son obligatorios";
  if (!sinImagen(imagen_url) && !esUrlImagen(imagen_url)) return "La imagen debe ser un link http(s) válido";
  if (!esFechaHora(fecha)) return "La fecha debe tener formato YYYY-MM-DDTHH:mm";
  if (!MODALIDADES.includes(modalidad)) return `modalidad debe ser: ${MODALIDADES.join(", ")}`;
  if (estado !== undefined && !ESTADOS.includes(estado)) return `estado debe ser: ${ESTADOS.join(", ")}`;
  return null;
};

export const crearEvento = async (req, res) => {
  try {
    const problema = validarEvento(req.body);
    if (problema) return res.status(400).json({ mensaje: problema });

    const { titulo, lugar, fecha, modalidad, estado, imagen_url } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO eventos (titulo, lugar, fecha, modalidad, estado, id_empresa, imagen_url)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Inscripciones Abiertas'), $6, $7) RETURNING *`,
      [titulo, lugar, fecha, modalidad, estado, req.usuario.id_empresa, sinImagen(imagen_url) ? null : imagen_url],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("crearEvento:", error);
    res.status(500).json({ mensaje: "Error al crear el evento" });
  }
};

export const actualizarEvento = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const problema = validarEvento(req.body);
    if (problema) return res.status(400).json({ mensaje: problema });

    const { titulo, lugar, fecha, modalidad, estado, imagen_url } = req.body;
    // imagen_url ausente = no tocar la imagen; null o "" = quitarla; link = reemplazarla
    const cambiaImagen = imagen_url !== undefined;
    const { rows } = await pool.query(
      `UPDATE eventos SET titulo = $1, lugar = $2, fecha = $3, modalidad = $4,
              estado = COALESCE($5, estado),
              imagen_url = CASE WHEN $8::boolean THEN $9::text ELSE imagen_url END
       WHERE id = $6 AND id_empresa = $7 RETURNING *`,
      [
        titulo, lugar, fecha, modalidad, estado, req.params.id, req.usuario.id_empresa,
        cambiaImagen, sinImagen(imagen_url) ? null : imagen_url,
      ],
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error("actualizarEvento:", error);
    res.status(500).json({ mensaje: "Error al actualizar el evento" });
  }
};

export const eliminarEvento = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rowCount } = await pool.query("DELETE FROM eventos WHERE id = $1 AND id_empresa = $2", [
      req.params.id,
      req.usuario.id_empresa,
    ]);
    if (rowCount === 0) return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json({ mensaje: "Evento eliminado" });
  } catch (error) {
    console.error("eliminarEvento:", error);
    res.status(500).json({ mensaje: "Error al eliminar el evento" });
  }
};
