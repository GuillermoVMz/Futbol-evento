import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./data/db.js";
import { verificarEsquema } from "./data/verificarEsquema.js";
import authRoutes from "./routes/auth.routes.js";
import canchasRoutes from "./routes/canchas.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import gastosRoutes from "./routes/gastos.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import torneosRoutes from "./routes/torneos.routes.js";
import imagenesRoutes from "./routes/imagenes.routes.js";

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
app.use("/api/torneos", torneosRoutes);
app.use("/api/imagenes", imagenesRoutes);

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

// Errores de lectura del cuerpo (imagen muy pesada, JSON mal armado): siempre responden en JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ mensaje: "El archivo es demasiado pesado (máximo 5 MB)" });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ mensaje: "Solicitud inválida" });
  }
  console.error(err);
  res.status(500).json({ mensaje: "Error en el servidor" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}/api`);
  pool
    .query("SELECT 1")
    .then(() => {
      console.log("Conexión a Supabase OK");
      return verificarEsquema();
    })
    .catch((err) => console.error("No se pudo conectar a Supabase:", err.message));
});
