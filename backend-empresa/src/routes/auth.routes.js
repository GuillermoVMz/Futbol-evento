import { Router } from "express";
import {
  loginEmpresa,
  registerEmpresa,
  loginUsuario,
  loginSuperadmin,
  registerUsuario,
  obtenerPerfil,
} from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { limitarLogin } from "../utils/limitarIntentos.js";

const router = Router();

// Dueños de complejos / organizadores
router.post("/empresa/login", limitarLogin, loginEmpresa);
router.post("/empresa/register", registerEmpresa);

// Jugadores
router.post("/usuario/login", limitarLogin, loginUsuario);

// Super admins (el equipo): no hay registro público, se crean desde el panel o con SUPERADMIN_EMAIL/PASSWORD
router.post("/superadmin/login", limitarLogin, loginSuperadmin);
router.post("/usuario/register", registerUsuario);

router.get("/perfil", verificarToken, obtenerPerfil);

export default router;
