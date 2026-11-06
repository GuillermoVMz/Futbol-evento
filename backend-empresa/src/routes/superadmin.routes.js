import { Router } from "express";
import {
  listarEmpresas,
  crearEmpresa,
  cambiarAprobacion,
  establecerPassword,
  eliminarEmpresa,
  listarSuperadmins,
  crearSuperadmin,
  eliminarSuperadmin,
  cambiarMiPassword,
} from "../controllers/superadmin.controller.js";
import { soloSuperadmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Todo lo de acá es solo para super admins
router.use(...soloSuperadmin);

router.get("/empresas", listarEmpresas);
router.post("/empresas", crearEmpresa);
router.patch("/empresas/:id/aprobacion", cambiarAprobacion);
router.post("/empresas/:id/password", establecerPassword);
router.delete("/empresas/:id", eliminarEmpresa);

router.get("/superadmins", listarSuperadmins);
router.post("/superadmins", crearSuperadmin);
router.post("/superadmins/mi-password", cambiarMiPassword); // antes de "/superadmins/:id"
router.delete("/superadmins/:id", eliminarSuperadmin);

export default router;
