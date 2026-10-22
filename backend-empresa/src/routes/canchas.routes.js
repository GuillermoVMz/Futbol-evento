import { Router } from "express";
import {
  obtenerCanchas,
  obtenerMisCanchas,
  obtenerCanchaPorId,
  crearCancha,
  actualizarCancha,
} from "../controllers/canchas.controller.js";
import {
  obtenerHorarios,
  obtenerDisponibilidad,
  agregarHorario,
  eliminarHorario,
} from "../controllers/horarios.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", obtenerCanchas);
router.get("/mias", ...soloEmpresa, obtenerMisCanchas); // antes de "/:id"
router.get("/:id", obtenerCanchaPorId);
router.post("/", ...soloEmpresa, crearCancha);
router.put("/:id", ...soloEmpresa, actualizarCancha);

router.get("/:id/horarios", obtenerHorarios);
router.get("/:id/disponibilidad", obtenerDisponibilidad);
router.post("/:id/horarios", ...soloEmpresa, agregarHorario);
router.delete("/:id/horarios/:id_horario", ...soloEmpresa, eliminarHorario);

export default router;
