import { Router } from "express";
import {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerMisEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerImagenEvento,
  subirImagenEvento,
  eliminarImagenEvento,
} from "../controllers/eventos.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", obtenerEventos);
router.get("/mios", ...soloEmpresa, obtenerMisEventos); // antes de "/:id"
router.get("/:id", obtenerEventoPorId);
router.get("/:id/imagen", obtenerImagenEvento);
router.post("/", ...soloEmpresa, crearEvento);
router.put("/:id", ...soloEmpresa, actualizarEvento);
router.delete("/:id", ...soloEmpresa, eliminarEvento);
router.put("/:id/imagen", ...soloEmpresa, subirImagenEvento);
router.delete("/:id/imagen", ...soloEmpresa, eliminarImagenEvento);

export default router;
