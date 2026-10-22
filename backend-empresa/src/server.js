import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./data/db.js";
import authRoutes from "./routes/auth.routes.js";
import canchasRoutes from "./routes/canchas.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import gastosRoutes from "./routes/gastos.routes.js";
import adminRoutes from "./routes/admin.routes.js";

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Todas las rutas bajo /api
app.use("/api/auth", authRoutes);
app.use("/api/canchas", canchasRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/admin", adminRoutes);

// Verificación rápida de la conexión con Supabase
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "conectada" });
  } catch (error) {
    res.status(500).json({ ok: false, db: "sin conexión", detalle: error.message });
  }
});

app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}/api`);
  pool
    .query("SELECT 1")
    .then(() => console.log("Conexión a Supabase OK"))
    .catch((err) => console.error("No se pudo conectar a Supabase:", err.message));
});
