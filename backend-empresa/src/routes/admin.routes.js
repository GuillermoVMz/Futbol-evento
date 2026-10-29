import { Router } from "express";
import { obtenerResumen } from "../controllers/admin.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/resumen", ...soloEmpresa, obtenerResumen);

export default router;
