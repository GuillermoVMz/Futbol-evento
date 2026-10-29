import { pool } from "../src/data/db.js";

// Sin argumentos: lista las solicitudes pendientes.
// Con un email:   npm run aprobar -- correo@complejo.com   -> la aprueba.
// Con --rechazar: npm run aprobar -- correo@complejo.com --rechazar -> la elimina (solo si no está aprobada).
const [email, opcion] = process.argv.slice(2);

try {
  if (!email) {
    const { rows } = await pool.query(
      "SELECT id_empresa, nombre_complejo, socios, email, direccion FROM empresas WHERE aprobada = FALSE ORDER BY id_empresa",
    );
    if (rows.length === 0) console.log("No hay solicitudes pendientes.");
    else {
      console.log("Solicitudes pendientes:");
      console.table(rows);
      console.log("Para aprobar:  npm run aprobar -- <email>");
    }
  } else if (opcion === "--rechazar") {
    const { rowCount } = await pool.query("DELETE FROM empresas WHERE email = $1 AND aprobada = FALSE", [
      email.toLowerCase(),
    ]);
    console.log(rowCount ? `Solicitud de ${email} eliminada.` : "No hay una solicitud pendiente con ese email.");
  } else {
    const { rowCount } = await pool.query("UPDATE empresas SET aprobada = TRUE WHERE lower(email) = $1", [
      email.toLowerCase(),
    ]);
    console.log(rowCount ? `Cuenta aprobada: ${email}` : `No existe una empresa con email ${email}`);
  }
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
