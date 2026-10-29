import { pool } from "../data/db.js";
import { esId, esFecha, esHora, hhmm, SQL_AHORA } from "../utils/validar.js";

export const obtenerHorarios = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query(
      "SELECT * FROM horarios_cancha WHERE id_cancha = $1 ORDER BY hora_inicio",
      [req.params.id],
    );
    res.json(rows);
  } catch (error) {
    console.error("obtenerHorarios:", error);
    res.status(500).json({ mensaje: "Error al obtener los horarios" });
  }
};

// Turnos de una cancha para una fecha, marcando cuáles ya están reservados o ya pasaron
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!esId(req.params.id) || !esFecha(fecha)) {
      return res.status(400).json({ mensaje: "Indicá una cancha válida y fecha=YYYY-MM-DD" });
    }
    const { rows } = await pool.query(
      `SELECT h.id_horario, h.hora_inicio, h.hora_fin,
              (
                NOT EXISTS (
                  SELECT 1 FROM reservas r
                  WHERE r.id_cancha = h.id_cancha AND r.fecha = $2::date AND r.estado <> 'cancelada'
                    AND r.horario_in < h.hora_fin AND r.horario_fin > h.hora_inicio
                )
                AND ($2::date + h.hora_inicio) > ${SQL_AHORA}
              ) AS disponible
       FROM horarios_cancha h
       WHERE h.id_cancha = $1
       ORDER BY h.hora_inicio`,
      [req.params.id, fecha],
    );
    res.json(rows);
  } catch (error) {
    console.error("obtenerDisponibilidad:", error);
    res.status(500).json({ mensaje: "Error al obtener la disponibilidad" });
  }
};

// Días (hoy en adelante) en los que la cancha todavía tiene al menos un turno libre.
// Un día sin horarios cargados, totalmente reservado o ya pasado no aparece.
export const obtenerDiasDisponibles = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const dias = Math.min(Math.max(parseInt(req.query.dias, 10) || 60, 1), 90);

    const { rows } = await pool.query(
      `SELECT to_char(d.dia, 'YYYY-MM-DD') AS fecha
       FROM (SELECT ${SQL_AHORA}::date + n AS dia FROM generate_series(0, $2::int) AS n) d
       WHERE EXISTS (SELECT 1 FROM canchas WHERE id_cancha = $1 AND activo = TRUE)
         AND EXISTS (
           SELECT 1 FROM horarios_cancha h
           WHERE h.id_cancha = $1
             AND (d.dia + h.hora_inicio) > ${SQL_AHORA}
             AND NOT EXISTS (
               SELECT 1 FROM reservas r
               WHERE r.id_cancha = h.id_cancha AND r.fecha = d.dia AND r.estado <> 'cancelada'
                 AND r.horario_in < h.hora_fin AND r.horario_fin > h.hora_inicio
             )
         )
       ORDER BY d.dia`,
      [req.params.id, dias - 1],
    );
    res.json(rows.map((r) => r.fecha));
  } catch (error) {
    console.error("obtenerDiasDisponibles:", error);
    res.status(500).json({ mensaje: "Error al obtener los días disponibles" });
  }
};

export const agregarHorario = async (req, res) => {
  try {
    const { hora_inicio, hora_fin } = req.body;
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (!esHora(hora_inicio) || !esHora(hora_fin) || hhmm(hora_fin) <= hhmm(hora_inicio)) {
      return res.status(400).json({ mensaje: "Horario inválido: la hora de fin debe ser posterior a la de inicio (HH:MM)" });
    }

    // La cancha tiene que ser de la empresa del token
    const propia = await pool.query("SELECT 1 FROM canchas WHERE id_cancha = $1 AND id_empresa = $2", [
      req.params.id,
      req.usuario.id_empresa,
    ]);
    if (propia.rowCount === 0) return res.status(404).json({ mensaje: "Cancha no encontrada" });

    const solapa = await pool.query(
      `SELECT 1 FROM horarios_cancha
       WHERE id_cancha = $1 AND hora_inicio < $3::time AND hora_fin > $2::time`,
      [req.params.id, hhmm(hora_inicio), hhmm(hora_fin)],
    );
    if (solapa.rowCount > 0) {
      return res.status(409).json({ mensaje: "Ese horario se superpone con otro ya cargado" });
    }

    const { rows } = await pool.query(
      "INSERT INTO horarios_cancha (id_cancha, hora_inicio, hora_fin) VALUES ($1, $2, $3) RETURNING *",
      [req.params.id, hhmm(hora_inicio), hhmm(hora_fin)],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("agregarHorario:", error);
    res.status(500).json({ mensaje: "Error al agregar el horario" });
  }
};

export const eliminarHorario = async (req, res) => {
  try {
    const { id, id_horario } = req.params;
    if (!esId(id) || !esId(id_horario)) return res.status(400).json({ mensaje: "Id inválido" });

    const { rowCount } = await pool.query(
      `DELETE FROM horarios_cancha h USING canchas c
       WHERE h.id_horario = $1 AND h.id_cancha = $2
         AND c.id_cancha = h.id_cancha AND c.id_empresa = $3`,
      [id_horario, id, req.usuario.id_empresa],
    );
    if (rowCount === 0) return res.status(404).json({ mensaje: "Horario no encontrado" });
    res.json({ mensaje: "Horario eliminado" });
  } catch (error) {
    console.error("eliminarHorario:", error);
    res.status(500).json({ mensaje: "Error al eliminar el horario" });
  }
};
