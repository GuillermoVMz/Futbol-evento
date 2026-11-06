import express, { Router } from "express";
import { subirImagen } from "../controllers/imagenes.controller.js";
import { soloEmpresa } from "../middlewares/auth.middleware.js";
import { MAX_BYTES, TIPOS_IMAGEN } from "../utils/imagenes.js";

const router = Router();

// Primero se valida el token y recién después se recibe el archivo
router.post("/", ...soloEmpresa, express.raw({ type: TIPOS_IMAGEN, limit: MAX_BYTES }), subirImagen);

export default router;
