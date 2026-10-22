import { Router } from "express";
import {
  loginEmpresa,
  registerEmpresa,
  loginUsuario,
  registerUsuario,
  obtenerPerfil,
} from "../controllers/auth.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Dueños de complejos / organizadores
router.post("/empresa/login", loginEmpresa);
router.post("/empresa/register", registerEmpresa);

// Jugadores
router.post("/usuario/login", loginUsuario);
router.post("/usuario/register", registerUsuario);

router.get("/perfil", verificarToken, obtenerPerfil);

export default router;
