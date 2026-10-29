import { Router } from "express";
import {
  crearReserva,
  obtenerMisReservas,
  cancelarMiReserva,
  obtenerReservasEmpresa,
  actualizarEstadoReserva,
} from "../controllers/reservas.controller.js";
import { soloEmpresa, soloUsuario } from "../middlewares/auth.middleware.js";

const router = Router();

// Jugadores
router.post("/", ...soloUsuario, crearReserva);
router.get("/mias", ...soloUsuario, obtenerMisReservas);
router.patch("/:id/cancelar", ...soloUsuario, cancelarMiReserva);

// Dueños
router.get("/", ...soloEmpresa, obtenerReservasEmpresa);
router.patch("/:id/estado", ...soloEmpresa, actualizarEstadoReserva);

export default router;
