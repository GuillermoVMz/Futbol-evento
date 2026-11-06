import { randomUUID } from "node:crypto";
import { detectarImagen, MAX_BYTES, TIPOS_IMAGEN } from "../utils/imagenes.js";

const BUCKET = process.env.SUPABASE_BUCKET || "imagenes";
let bucketListo = false;

const config = () => {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  return url && key ? { url, key } : null;
};

// Las claves nuevas de Supabase (sb_secret_...) van solo en "apikey"; las viejas (JWT) también en Authorization
const cabeceras = (key, extra = {}) => ({
  apikey: key,
  ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
  ...extra,
});

// Crea el bucket público la primera vez, así no hace falta configurarlo a mano
const asegurarBucket = async ({ url, key }) => {
  if (bucketListo) return;
  const r = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: cabeceras(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: TIPOS_IMAGEN,
    }),
  });
  if (r.ok || r.status === 409) {
    bucketListo = true;
    return;
  }
  const texto = await r.text();
  if (/already exists|duplicate/i.test(texto)) bucketListo = true;
  else console.warn("No se pudo crear el bucket de imágenes:", r.status, texto);
};

// POST /api/imagenes  (el cuerpo es la imagen cruda; Content-Type = tipo de imagen)
export const subirImagen = async (req, res) => {
  try {
    const cfg = config();
    if (!cfg) {
      return res.status(503).json({
        mensaje:
          "La subida de imágenes no está configurada en el servidor (faltan SUPABASE_URL y SUPABASE_SERVICE_KEY). Mientras tanto podés pegar el link de una imagen.",
      });
    }

    const tipo = detectarImagen(req.body);
    if (!tipo) {
      return res.status(400).json({ mensaje: "Enviá una imagen JPG, PNG, WEBP o GIF (máximo 5 MB)" });
    }

    await asegurarBucket(cfg);

    const ruta = `empresa-${req.usuario.id_empresa}/${randomUUID()}.${tipo.ext}`;
    const r = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${ruta}`, {
      method: "POST",
      headers: cabeceras(cfg.key, { "Content-Type": tipo.mime, "x-upsert": "false" }),
      body: req.body,
    });

    if (!r.ok) {
      const detalle = await r.text();
      console.error("subirImagen: Supabase respondió", r.status, detalle);
      const claveMala = r.status === 401 || r.status === 403;
      return res.status(502).json({
        mensaje: claveMala
          ? "Supabase rechazó la clave: revisá SUPABASE_SERVICE_KEY en el .env del backend"
          : "No se pudo guardar la imagen en el almacenamiento",
      });
    }

    res.status(201).json({ url: `${cfg.url}/storage/v1/object/public/${BUCKET}/${ruta}` });
  } catch (error) {
    console.error("subirImagen:", error);
    res.status(500).json({ mensaje: "Error al subir la imagen" });
  }
};
