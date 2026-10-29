import { pool } from "./db.js";

// Una columna "testigo" por cada migración: si falta, ese archivo SQL todavía no se ejecutó en Supabase.
const REQUERIDAS = [
  { archivo: "migracion_v2.sql", tabla: "reservas", columna: "id_usuario" },
  { archivo: "migracion_v3.sql", tabla: "empresas", columna: "aprobada" },
  { archivo: "migracion_v4.sql", tabla: "partidos", columna: "jugado" },
  { archivo: "migracion_v5.sql", tabla: "eventos", columna: "imagen_url" },
];

export const verificarEsquema = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [[...new Set(REQUERIDAS.map((r) => r.tabla))]],
    );
    const existentes = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
    const faltan = REQUERIDAS.filter((r) => !existentes.has(`${r.tabla}.${r.columna}`));

    if (faltan.length > 0) {
      console.warn("\n⚠️  La base de datos no está actualizada. Ejecutá en Supabase (SQL Editor), en este orden:");
      faltan.forEach((f) => console.warn(`   - backend-empresa/database/${f.archivo}`));
      console.warn("   Hasta entonces, parte de la app va a dar error.\n");
    }
  } catch (error) {
    console.warn("No se pudo verificar el esquema de la base de datos:", error.message);
  }
};
