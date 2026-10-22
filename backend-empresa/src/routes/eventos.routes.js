import { Router } from "express";
import {
  obtenerEventos,
  obtenerEventoPorId,
  obtenerMisEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
} from "../controllers/eventos.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", obtenerEventos);
router.get("/mios", ...soloEmpresa, obtenerMisEventos); // antes de "/:id"
router.get("/:id", obtenerEventoPorId);
router.post("/", ...soloEmpresa, crearEvento);
router.put("/:id", ...soloEmpresa, actualizarEvento);
router.delete("/:id", ...soloEmpresa, eliminarEvento);

export default router;
