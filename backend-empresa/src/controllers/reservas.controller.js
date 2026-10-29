import { pool } from "../data/db.js";
import { esId, esFecha, esHora, hhmm, SQL_AHORA } from "../utils/validar.js";

const ESTADOS = ["confirmada", "pagada", "cancelada"];

const SELECT_RESERVAS = `
  SELECT r.*, c.nombre AS cancha, c.tipo, e.nombre_complejo AS complejo
  FROM reservas r
  JOIN canchas c ON c.id_cancha = r.id_cancha
  JOIN empresas e ON e.id_empresa = r.id_empresa`;

// Jugador logueado reserva un turno
export const crearReserva = async (req, res) => {
  try {
    const { id_cancha, fecha, horario_in, horario_fin, nombre_cliente, telefono } = req.body;
    if (!esId(id_cancha) || !esFecha(fecha) || !esHora(horario_in) || !esHora(horario_fin)) {
      return res.status(400).json({ mensaje: "Cancha, fecha y horario son obligatorios" });
    }
    if (!nombre_cliente || !telefono) {
      return res.status(400).json({ mensaje: "Nombre y teléfono son obligatorios" });
    }

    const cancha = await pool.query(
      "SELECT id_empresa, precio_hora FROM canchas WHERE id_cancha = $1 AND activo = TRUE",
      [id_cancha],
    );
    if (cancha.rowCount === 0) return res.status(404).json({ mensaje: "Cancha no disponible" });

    // El turno tiene que ser uno de los que el dueño habilitó
    const turno = await pool.query(
      "SELECT 1 FROM horarios_cancha WHERE id_cancha = $1 AND hora_inicio = $2::time AND hora_fin = $3::time",
      [id_cancha, hhmm(horario_in), hhmm(horario_fin)],
    );
    if (turno.rowCount === 0) {
      return res.status(400).json({ mensaje: "Ese horario no está habilitado para esta cancha" });
    }

    const pasado = await pool.query(`SELECT ($1::date + $2::time) <= ${SQL_AHORA} AS pasado`, [
      fecha,
      hhmm(horario_in),
    ]);
    if (pasado.rows[0].pasado) {
      return res.status(400).json({ mensaje: "No se puede reservar un turno que ya pasó" });
    }

    // El precio sale de la cancha, no del cliente
    const precio = Math.round(cancha.rows[0].precio_hora);
    const { rows } = await pool.query(
      `INSERT INTO reservas
         (id_empresa, id_cancha, id_usuario, fecha, horario_in, horario_fin, nombre_cliente, telefono, estado, precio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmada', $9) RETURNING *`,
      [
        cancha.rows[0].id_empresa,
        id_cancha,
        req.usuario.id_usuario,
        fecha,
        hhmm(horario_in),
        hhmm(horario_fin),
        nombre_cliente,
        telefono,
        precio,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ mensaje: "Ese turno ya fue reservado, elegí otro" });
    }
    console.error("crearReserva:", error);
    res.status(500).json({ mensaje: "Error al crear la reserva" });
  }
};

export const obtenerMisReservas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_RESERVAS} WHERE r.id_usuario = $1 ORDER BY r.fecha DESC, r.horario_in DESC`,
      [req.usuario.id_usuario],
    );
    res.json(rows);
  } catch (error) {
    console.error("obtenerMisReservas:", error);
    res.status(500).json({ mensaje: "Error al obtener tus reservas" });
  }
};

// El jugador solo puede cancelar sus reservas que todavía no se cobraron
export const cancelarMiReserva = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id_reserva = $1 AND id_usuario = $2 AND estado = 'confirmada' RETURNING *`,
      [req.params.id, req.usuario.id_usuario],
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró una reserva que se pueda cancelar" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("cancelarMiReserva:", error);
    res.status(500).json({ mensaje: "Error al cancelar la reserva" });
  }
};

// Panel del dueño: reservas de SU complejo
export const obtenerReservasEmpresa = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${SELECT_RESERVAS} WHERE r.id_empresa = $1 ORDER BY r.fecha DESC, r.horario_in DESC`,
      [req.usuario.id_empresa],
    );
    res.json(rows);
  } catch (error) {
    console.error("obtenerReservasEmpresa:", error);
    res.status(500).json({ mensaje: "Error al obtener las reservas" });
  }
};

export const actualizarEstadoReserva = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ mensaje: `estado debe ser: ${ESTADOS.join(", ")}` });
    }
    const { rows } = await pool.query(
      "UPDATE reservas SET estado = $1 WHERE id_reserva = $2 AND id_empresa = $3 RETURNING *",
      [estado, req.params.id, req.usuario.id_empresa],
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Reserva no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ mensaje: "Ese turno ya fue tomado por otra reserva" });
    }
    console.error("actualizarEstadoReserva:", error);
    res.status(500).json({ mensaje: "Error al actualizar la reserva" });
  }
};
