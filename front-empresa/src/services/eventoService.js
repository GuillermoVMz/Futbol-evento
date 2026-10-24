import api from "./api";

export const getEventos = async () => {
  const { data } = await api.get("/eventos");
  return data;
};

export const getEventoPorId = async (id) => {
  const { data } = await api.get(`/eventos/${id}`);
  return data;
};

// ----- Organizadores (panel) -----
export const getMisEventos = async () => {
  const { data } = await api.get("/eventos/mios");
  return data;
};

export const crearEvento = async (evento) => {
  const { data } = await api.post("/eventos", evento);
  return data;
};

export const actualizarEvento = async (id, evento) => {
  const { data } = await api.put(`/eventos/${id}`, evento);
  return data;
};

export const eliminarEvento = async (id) => {
  const { data } = await api.delete(`/eventos/${id}`);
  return data;
};

// ----- Imagen del torneo -----
// URL para usar en <img src>. El "?v=" cambia con cada subida, así el navegador no muestra una imagen vieja.
export const urlImagenEvento = (evento) =>
  evento?.tiene_imagen
    ? `${api.defaults.baseURL}/eventos/${evento.id}/imagen?v=${evento.imagen_version}`
    : null;

export const subirImagenEvento = async (id, imagen) => {
  const { data } = await api.put(`/eventos/${id}/imagen`, { imagen });
  return data;
};

export const eliminarImagenEvento = async (id) => {
  const { data } = await api.delete(`/eventos/${id}/imagen`);
  return data;
};
