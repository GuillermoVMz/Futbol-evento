import { Router } from "express";
import { obtenerGastos, crearGasto, eliminarGasto } from "../controllers/gastos.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(...soloEmpresa);
router.get("/", obtenerGastos);
router.post("/", crearGasto);
router.delete("/:id", eliminarGasto);

export default router;
