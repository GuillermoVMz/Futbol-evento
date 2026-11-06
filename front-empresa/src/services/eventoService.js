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
