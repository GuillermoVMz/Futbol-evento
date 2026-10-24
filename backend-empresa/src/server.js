import "dotenv/config";
import os from "os";
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
// La imagen de un torneo viaja en base64 dentro del JSON: ese endpoint admite hasta 4 MB.
// Tiene que ir ANTES del parser general, que deja el límite normal (100 KB) para todo lo demás.
app.use("/api/eventos/:id/imagen", express.json({ limit: "4mb" }));
app.use(express.json());

// Con varias réplicas detrás del balanceador, cada respuesta indica qué nodo la atendió
// (el hostname del contenedor: backend1, backend2, backend3).
const NODO = os.hostname();
app.use((req, res, next) => {
  res.setHeader("X-Nodo", NODO);
  next();
});

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
    res.json({ ok: true, db: "conectada", nodo: NODO });
  } catch (error) {
    res.status(500).json({ ok: false, db: "sin conexión", detalle: error.message });
  }
});

app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada" }));

// Errores del parser de JSON: se responden en JSON en lugar del HTML por defecto de Express
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ mensaje: "El pedido es demasiado grande" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ mensaje: "JSON inválido" });
  next(err);
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}/api`);
  pool
    .query("SELECT 1")
    .then(() => console.log("Conexión a Supabase OK"))
    .catch((err) => console.error("No se pudo conectar a Supabase:", err.message));
});
