import bcrypt from "bcryptjs";
import { pool } from "./db.js";

// Crea el primer super admin con SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD (del .env) si todavía no existe.
// Nunca pisa una cuenta existente: para cambiar la contraseña se usa el panel.
export const crearSuperadminInicial = async () => {
  const email = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || "";
  if (!email || !password) return;

  try {
    const existe = await pool.query("SELECT 1 FROM superadmins WHERE lower(email) = $1", [email]);
    if (existe.rowCount > 0) return;

    if (password.length < 8) {
      console.warn("SUPERADMIN_PASSWORD debe tener al menos 8 caracteres: no se creó el super admin");
      return;
    }
    // Con varias réplicas arrancando a la vez, ON CONFLICT evita que dos lo creen
    const { rowCount } = await pool.query(
      "INSERT INTO superadmins (nombre, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      ["Super admin", email, await bcrypt.hash(password, 10)],
    );
    if (rowCount > 0) console.log(`Super admin creado: ${email}`);
  } catch (error) {
    if (error.code === "42P01") console.warn("Falta ejecutar migracion_v8.sql: todavía no se puede crear el super admin");
    else console.warn("No se pudo crear el super admin:", error.message);
  }
};
