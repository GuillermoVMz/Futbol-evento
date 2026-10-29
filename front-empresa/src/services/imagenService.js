import api from "./api";

// Sube la imagen al servidor (que la guarda en Supabase Storage) y devuelve su link público
export const subirImagen = async (archivo) => {
  const { data } = await api.post("/imagenes", archivo, { headers: { "Content-Type": archivo.type } });
  return data.url;
};
