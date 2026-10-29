export const esId = (v) => /^\d+$/.test(String(v));
export const esFecha = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
export const esHora = (v) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(v));
export const esFechaHora = (v) => /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(String(v));
export const hhmm = (v) => String(v).slice(0, 5);

// Zona horaria del negocio: evita que "hoy" cambie de día a las 21:00 (el servidor de Supabase usa UTC)
export const SQL_AHORA = "(NOW() AT TIME ZONE 'America/Argentina/Cordoba')";

// Link de imagen pegado por el organizador: solo http(s), máximo 500 caracteres
export const esUrlImagen = (v) => {
  if (typeof v !== "string" || v.length > 500) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const sinImagen = (v) => v === undefined || v === null || v === "";
