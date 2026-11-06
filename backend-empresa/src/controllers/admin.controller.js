import { pool } from "../data/db.js";
import { SQL_AHORA } from "../utils/validar.js";

// Números del panel del dueño: ingresos, gastos, balance y ocupación (todo del mes en curso)
export const obtenerResumen = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(precio), 0) FROM reservas
           WHERE id_empresa = $1 AND estado = 'pagada'
             AND to_char(fecha, 'YYYY-MM') = to_char(${SQL_AHORA}, 'YYYY-MM')) AS ingresos_cobrados,
         (SELECT COALESCE(SUM(precio), 0) FROM reservas
           WHERE id_empresa = $1 AND estado = 'confirmada'
             AND to_char(fecha, 'YYYY-MM') = to_char(${SQL_AHORA}, 'YYYY-MM')) AS por_cobrar,
         (SELECT COALESCE(SUM(monto), 0) FROM gastos
           WHERE id_empresa = $1
             AND to_char(fecha, 'YYYY-MM') = to_char(${SQL_AHORA}, 'YYYY-MM')) AS gastos_mes,
         (SELECT COUNT(*) FROM reservas
           WHERE id_empresa = $1 AND estado <> 'cancelada' AND fecha >= ${SQL_AHORA}::date) AS reservas_activas,
         (SELECT COUNT(*) FROM reservas
           WHERE id_empresa = $1 AND estado <> 'cancelada' AND fecha = ${SQL_AHORA}::date) AS reservas_hoy,
         (SELECT COUNT(*) FROM canchas WHERE id_empresa = $1 AND activo = TRUE) AS canchas_activas`,
      [req.usuario.id_empresa],
    );
    const r = rows[0];
    res.json({ ...r, balance: r.ingresos_cobrados - r.gastos_mes });
  } catch (error) {
    console.error("obtenerResumen:", error);
    res.status(500).json({ mensaje: "Error al obtener el resumen" });
  }
};
