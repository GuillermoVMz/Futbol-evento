export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Se mira el contenido real del archivo (no solo lo que dice el navegador)
export const detectarImagen = (b) => {
  if (!Buffer.isBuffer(b) || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", ext: "png" };
  }
  if (b.subarray(0, 4).toString("latin1") === "GIF8") return { mime: "image/gif", ext: "gif" };
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
};
