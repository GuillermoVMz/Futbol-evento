import { pool } from "../data/db.js";
import { esId, esFechaHora } from "../utils/validar.js";

const MODALIDADES = ["F5", "F7", "F11"];
const ESTADOS = ["Inscripciones Abiertas", "Cupos Llenos", "Finalizado"];

// Evento + si tiene imagen. La imagen en sí NO se trae acá (pesa): se pide aparte en GET /:id/imagen.
// "imagen_version" cambia con cada subida y sirve para que el navegador refresque su caché.
const SELECT_EVENTO = `
  SELECT e.*, (i.id_evento IS NOT NULL) AS tiene_imagen, COALESCE(i.version, 0) AS imagen_version
  FROM eventos e
  LEFT JOIN evento_imagenes i ON i.id_evento = e.id`;

// ------- Público -------
export const obtenerEventos = async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT_EVENTO} ORDER BY e.fecha`);
    res.json(rows);
  } catch (error) {
    console.error("obtenerEventos:", error);
    res.status(500).json({ mensaje: "Error al obtener los eventos" });
  }
};

export const obtenerEventoPorId = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    // Además del evento: quién lo organiza y cómo transferirle (alias y titular), para la inscripción
    const { rows } = await pool.query(
      `SELECT e.*, (i.id_evento IS NOT NULL) AS tiene_imagen, COALESCE(i.version, 0) AS imagen_version,
              o.nombre_complejo AS organizador, o.alias_pago, o.titular_pago
       FROM eventos e
       LEFT JOIN evento_imagenes i ON i.id_evento = e.id
       LEFT JOIN empresas o ON o.id_empresa = e.id_empresa
       WHERE e.id = $1`,
      [req.params.id],
    );
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
    const { rows } = await pool.query(`${SELECT_EVENTO} WHERE e.id_empresa = $1 ORDER BY e.fecha DESC`, [
      req.usuario.id_empresa,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("obtenerMisEventos:", error);
    res.status(500).json({ mensaje: "Error al obtener tus eventos" });
  }
};

const validarEvento = ({ titulo, lugar, fecha, modalidad, estado }) => {
  if (!titulo || !lugar) return "Título y lugar son obligatorios";
  if (!esFechaHora(fecha)) return "La fecha debe tener formato YYYY-MM-DDTHH:mm";
  if (!MODALIDADES.includes(modalidad)) return `modalidad debe ser: ${MODALIDADES.join(", ")}`;
  if (estado !== undefined && !ESTADOS.includes(estado)) return `estado debe ser: ${ESTADOS.join(", ")}`;
  return null;
};

export const crearEvento = async (req, res) => {
  try {
    const problema = validarEvento(req.body);
    if (problema) return res.status(400).json({ mensaje: problema });

    const { titulo, lugar, fecha, modalidad, estado } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO eventos (titulo, lugar, fecha, modalidad, estado, id_empresa)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Inscripciones Abiertas'), $6) RETURNING *`,
      [titulo, lugar, fecha, modalidad, estado, req.usuario.id_empresa],
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

    const { titulo, lugar, fecha, modalidad, estado } = req.body;
    const { rows } = await pool.query(
      `UPDATE eventos SET titulo = $1, lugar = $2, fecha = $3, modalidad = $4,
              estado = COALESCE($5, estado)
       WHERE id = $6 AND id_empresa = $7 RETURNING *`,
      [titulo, lugar, fecha, modalidad, estado, req.params.id, req.usuario.id_empresa],
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

// ------- Imagen del torneo -------
const MAX_IMAGEN = 2 * 1024 * 1024; // 2 MB, ya decodificada (el front la comprime mucho antes)

// El formato se reconoce por los primeros bytes del archivo, no por lo que diga el cliente.
// SVG queda afuera a propósito: puede traer scripts.
const tipoDeImagen = (b) => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
};

// Público: devuelve la imagen para usarla en <img src="...">
export const obtenerImagenEvento = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query("SELECT tipo, datos FROM evento_imagenes WHERE id_evento = $1", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "El evento no tiene imagen" });
    res.set({
      "Content-Type": rows[0].tipo,
      "Cache-Control": "public, max-age=86400", // el front agrega ?v=<version>, así que no queda desactualizada
      "X-Content-Type-Options": "nosniff",
    });
    res.send(rows[0].datos);
  } catch (error) {
    console.error("obtenerImagenEvento:", error);
    res.status(500).json({ mensaje: "Error al obtener la imagen" });
  }
};

// Organizador: sube o reemplaza la imagen de SU evento. Llega como data URL en base64.
export const subirImagenEvento = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });

    const imagen = req.body?.imagen;
    const m = typeof imagen === "string" && /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imagen);
    if (!m) return res.status(400).json({ mensaje: "La imagen debe ser PNG, JPG o WEBP" });

    const datos = Buffer.from(m[1], "base64");
    if (datos.length > MAX_IMAGEN) return res.status(413).json({ mensaje: "La imagen supera los 2 MB" });
    const tipo = tipoDeImagen(datos);
    if (!tipo) return res.status(400).json({ mensaje: "El archivo no es una imagen válida" });

    // Solo el organizador dueño del evento puede cambiarle la imagen
    const evento = await pool.query("SELECT 1 FROM eventos WHERE id = $1 AND id_empresa = $2", [
      req.params.id,
      req.usuario.id_empresa,
    ]);
    if (evento.rowCount === 0) return res.status(404).json({ mensaje: "Evento no encontrado" });

    const { rows } = await pool.query(
      `INSERT INTO evento_imagenes (id_evento, tipo, datos) VALUES ($1, $2, $3)
       ON CONFLICT (id_evento) DO UPDATE
       SET tipo = EXCLUDED.tipo, datos = EXCLUDED.datos, version = evento_imagenes.version + 1
       RETURNING version`,
      [req.params.id, tipo, datos],
    );
    res.json({ mensaje: "Imagen guardada", imagen_version: rows[0].version });
  } catch (error) {
    console.error("subirImagenEvento:", error);
    res.status(500).json({ mensaje: "Error al guardar la imagen" });
  }
};

export const eliminarImagenEvento = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    await pool.query(
      `DELETE FROM evento_imagenes
       WHERE id_evento = $1 AND id_evento IN (SELECT id FROM eventos WHERE id_empresa = $2)`,
      [req.params.id, req.usuario.id_empresa],
    );
    res.json({ mensaje: "Imagen eliminada" });
  } catch (error) {
    console.error("eliminarImagenEvento:", error);
    res.status(500).json({ mensaje: "Error al eliminar la imagen" });
  }
};
