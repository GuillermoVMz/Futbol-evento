import api from "./api";

// ----- Canchas (público) -----
export const obtenerEmpresas = async () => {
  const { data } = await api.get("/canchas");
  return data;
};

export const obtenerEmpresaPorId = async (id) => {
  const { data } = await api.get(`/canchas/${id}`);
  return data;
};

export const obtenerDisponibilidad = async (id, fecha) => {
  const { data } = await api.get(`/canchas/${id}/disponibilidad`, { params: { fecha } });
  return data;
};

// Fechas "YYYY-MM-DD" (próximos 60 días) con al menos un turno libre
export const obtenerDiasDisponibles = async (id) => {
  const { data } = await api.get(`/canchas/${id}/dias-disponibles`);
  return data;
};

// ----- Canchas y horarios (panel del dueño) -----
export const obtenerMisCanchas = async () => {
  const { data } = await api.get("/canchas/mias");
  return data;
};

export const crearEmpresa = async (cancha) => {
  const { data } = await api.post("/canchas", cancha);
  return data;
};

export const actualizarEmpresa = async (id, cancha) => {
  const { data } = await api.put(`/canchas/${id}`, cancha);
  return data;
};

export const obtenerHorarios = async (id) => {
  const { data } = await api.get(`/canchas/${id}/horarios`);
  return data;
};

export const agregarHorario = async (id, horario) => {
  const { data } = await api.post(`/canchas/${id}/horarios`, horario);
  return data;
};

export const eliminarHorario = async (id, idHorario) => {
  const { data } = await api.delete(`/canchas/${id}/horarios/${idHorario}`);
  return data;
};
