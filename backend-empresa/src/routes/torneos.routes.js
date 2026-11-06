import { Router } from "express";
import {
  obtenerTorneos,
  obtenerTorneo,
  obtenerMisTorneos,
  crearTorneo,
  actualizarTorneo,
  eliminarTorneo,
  agregarEquipo,
  quitarEquipo,
  obtenerMiInscripcion,
  inscribirMiEquipo,
  cancelarMiInscripcion,
  obtenerInscriptos,
  cambiarPago,
  sortear,
  generarLlaves,
  reiniciarTorneo,
  cargarResultado,
  crearPreferenciaPago,
  webhookMercadoPago,
} from "../controllers/torneos.controller.js";
import { soloEmpresa, soloUsuario } from "../middlewares/auth.middleware.js";

const router = Router();

// Público / Webhook
router.get("/", obtenerTorneos);
router.get("/mios", ...soloEmpresa, obtenerMisTorneos); // antes de "/:id"
router.post("/webhook-mercadopago", webhookMercadoPago); // Notificación de MP
router.get("/:id", obtenerTorneo);

// Jugadores
router.get("/:id/mi-inscripcion", ...soloUsuario, obtenerMiInscripcion);
router.post("/:id/inscripcion", ...soloUsuario, inscribirMiEquipo);
router.delete("/:id/inscripcion", ...soloUsuario, cancelarMiInscripcion);
router.post(
  "/:id/crear-preferencia-pago",
  ...soloUsuario,
  crearPreferenciaPago,
);

// Organizadores
router.get("/:id/inscriptos", ...soloEmpresa, obtenerInscriptos);
router.patch("/:id/inscriptos/:id_equipo/pago", ...soloEmpresa, cambiarPago);
router.post("/", ...soloEmpresa, crearTorneo);
router.put("/:id", ...soloEmpresa, actualizarTorneo);
router.delete("/:id", ...soloEmpresa, eliminarTorneo);
router.post("/:id/equipos", ...soloEmpresa, agregarEquipo);
router.delete("/:id/equipos/:id_equipo", ...soloEmpresa, quitarEquipo);
router.post("/:id/sorteo", ...soloEmpresa, sortear);
router.post("/:id/llaves", ...soloEmpresa, generarLlaves);
router.post("/:id/reiniciar", ...soloEmpresa, reiniciarTorneo);
router.put("/partidos/:id_partido", ...soloEmpresa, cargarResultado);

export default router;
