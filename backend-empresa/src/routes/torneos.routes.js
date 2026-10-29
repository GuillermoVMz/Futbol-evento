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
  sortear,
  generarLlaves,
  reiniciarTorneo,
  cargarResultado,
} from "../controllers/torneos.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

// Público
router.get("/", obtenerTorneos);
router.get("/mios", ...soloEmpresa, obtenerMisTorneos); // antes de "/:id"
router.get("/:id", obtenerTorneo);

// Organizadores
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
