import { pool } from "../data/db.js";
import { esId, esFecha } from "../utils/validar.js";

export const obtenerGastos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM gastos WHERE id_empresa = $1 ORDER BY fecha DESC, id_gasto DESC",
      [req.usuario.id_empresa],
    );
    res.json(rows);
  } catch (error) {
    console.error("obtenerGastos:", error);
    res.status(500).json({ mensaje: "Error al obtener los gastos" });
  }
};

export const crearGasto = async (req, res) => {
  try {
    const { concepto, monto, fecha } = req.body;
    if (!concepto || !(Number(monto) >= 0) || monto === "" || monto === null) {
      return res.status(400).json({ mensaje: "Concepto y monto son obligatorios" });
    }
    if (fecha !== undefined && fecha !== null && !esFecha(fecha)) {
      return res.status(400).json({ mensaje: "La fecha debe tener formato YYYY-MM-DD" });
    }
    const { rows } = await pool.query(
      `INSERT INTO gastos (id_empresa, concepto, monto, fecha)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE)) RETURNING *`,
      [req.usuario.id_empresa, concepto, Math.round(Number(monto)), fecha ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("crearGasto:", error);
    res.status(500).json({ mensaje: "Error al guardar el gasto" });
  }
};

export const eliminarGasto = async (req, res) => {
  try {
    if (!esId(req.params.id)) return res.status(400).json({ mensaje: "Id inválido" });
    const { rowCount } = await pool.query("DELETE FROM gastos WHERE id_gasto = $1 AND id_empresa = $2", [
      req.params.id,
      req.usuario.id_empresa,
    ]);
    if (rowCount === 0) return res.status(404).json({ mensaje: "Gasto no encontrado" });
    res.json({ mensaje: "Gasto eliminado" });
  } catch (error) {
    console.error("eliminarGasto:", error);
    res.status(500).json({ mensaje: "Error al eliminar el gasto" });
  }
};
