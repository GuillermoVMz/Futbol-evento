import { Router } from "express";
import { obtenerResumen, obtenerDatosPago, guardarDatosPago } from "../controllers/admin.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/resumen", ...soloEmpresa, obtenerResumen);
router.get("/pago", ...soloEmpresa, obtenerDatosPago);
router.put("/pago", ...soloEmpresa, guardarDatosPago);

export default router;
