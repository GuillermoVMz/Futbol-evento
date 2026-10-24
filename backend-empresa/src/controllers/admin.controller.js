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

// ------- Datos para cobrar por transferencia (los ve el jugador al elegir ese medio de pago) -------
// Alias bancario/billetera argentino: 6 a 20 caracteres con letras, números, puntos o guiones
const ALIAS_VALIDO = /^[A-Za-z0-9.-]{6,20}$/;

export const obtenerDatosPago = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT alias_pago, titular_pago FROM empresas WHERE id_empresa = $1",
      [req.usuario.id_empresa],
    );
    res.json(rows[0] ?? { alias_pago: null, titular_pago: null });
  } catch (error) {
    console.error("obtenerDatosPago:", error);
    res.status(500).json({ mensaje: "Error al obtener los datos de pago" });
  }
};

export const guardarDatosPago = async (req, res) => {
  try {
    const alias = String(req.body.alias_pago ?? "").trim();
    const titular = String(req.body.titular_pago ?? "").trim();

    // Los dos vacíos = el complejo deja de aceptar transferencias (solo efectivo)
    if (alias || titular) {
      if (!ALIAS_VALIDO.test(alias)) {
        return res.status(400).json({
          mensaje: "El alias debe tener entre 6 y 20 caracteres: letras, números, puntos o guiones",
        });
      }
      if (titular.length < 3 || titular.length > 100) {
        return res.status(400).json({ mensaje: "Ingresá el nombre del titular (3 a 100 caracteres)" });
      }
    }

    const { rows } = await pool.query(
      `UPDATE empresas SET alias_pago = $1, titular_pago = $2
       WHERE id_empresa = $3 RETURNING alias_pago, titular_pago`,
      [alias || null, titular || null, req.usuario.id_empresa],
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("guardarDatosPago:", error);
    res.status(500).json({ mensaje: "Error al guardar los datos de pago" });
  }
};
