import "dotenv/config";
import pg from "pg";

const { Pool, types } = pg;

// pg devuelve BIGINT/NUMERIC como string y DATE/TIMESTAMP como objetos Date (con corrimiento de
// zona horaria según la PC). Se normalizan para que el frontend reciba siempre lo mismo.
types.setTypeParser(20, (v) => Number(v)); // BIGINT / BIGSERIAL -> número
types.setTypeParser(1700, (v) => parseFloat(v)); // NUMERIC -> número
types.setTypeParser(1082, (v) => v); // DATE -> "2026-10-10"
types.setTypeParser(1114, (v) => v.replace(" ", "T")); // TIMESTAMP -> "2026-10-15T20:00:00"

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta DATABASE_URL. Copiá .env.example como .env y completalo con tu cadena de conexión de Supabase.",
  );
}

// Supabase exige SSL; el PostgreSQL de Docker no lo soporta. Por defecto queda activado
// (como siempre) y docker-compose.yml lo apaga con DB_SSL=false.
const usarSSL = process.env.DB_SSL !== "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: usarSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err.message);
});

export default pool;
