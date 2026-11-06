import "dotenv/config";
import os from "node:os";
import express from "express";
import cors from "cors";
import { pool } from "./data/db.js";
import { verificarEsquema } from "./data/verificarEsquema.js";
import { crearSuperadminInicial } from "./data/bootstrap.js";
import authRoutes from "./routes/auth.routes.js";
import canchasRoutes from "./routes/canchas.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import gastosRoutes from "./routes/gastos.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import torneosRoutes from "./routes/torneos.routes.js";
import imagenesRoutes from "./routes/imagenes.routes.js";
import superadminRoutes from "./routes/superadmin.routes.js";

if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el archivo .env");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Detrás del balanceador Nginx (1 salto): así req.ip es la IP real del cliente y el límite de intentos de login funciona
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Identifica qué réplica respondió (backend1, backend2...). El balanceador la muestra en su log.
app.use((req, res, next) => {
  res.setHeader("X-Nodo", os.hostname());
  next();
});

// Todas las rutas bajo /api
app.use("/api/auth", authRoutes);
app.use("/api/canchas", canchasRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/torneos", torneosRoutes);
app.use("/api/imagenes", imagenesRoutes);
app.use("/api/superadmin", superadminRoutes);

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
      console.log("Conexión a la base de datos OK");
      return verificarEsquema().then(crearSuperadminInicial);
    })
    .catch((err) => console.error("No se pudo conectar a la base de datos:", err.message));
});
