import bcrypt from "bcryptjs";
import { pool } from "../src/data/db.js";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Uso: npm run set-password -- <email> <contraseña>");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  const { rowCount } = await pool.query("UPDATE empresas SET password = $1 WHERE email = $2", [
    hash,
    email,
  ]);
  console.log(rowCount ? `Contraseña actualizada para ${email}` : `No existe una empresa con email ${email}`);
} catch (error) {
  console.error("Error:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
