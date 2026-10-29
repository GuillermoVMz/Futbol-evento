import api from "./api";

// Público
export const getTorneos = async () => (await api.get("/torneos")).data;
export const getTorneo = async (id) => (await api.get(`/torneos/${id}`)).data;

// Organizadores (panel)
export const getMisTorneos = async () => (await api.get("/torneos/mios")).data;
export const crearTorneo = async (torneo) => (await api.post("/torneos", torneo)).data;
export const actualizarTorneo = async (id, datos) => (await api.put(`/torneos/${id}`, datos)).data;
export const eliminarTorneo = async (id) => (await api.delete(`/torneos/${id}`)).data;
export const inscribirEquipo = async (id, nombre) => (await api.post(`/torneos/${id}/equipos`, { nombre })).data;
export const quitarEquipo = async (id, idEquipo) => (await api.delete(`/torneos/${id}/equipos/${idEquipo}`)).data;
export const sortearTorneo = async (id) => (await api.post(`/torneos/${id}/sorteo`)).data;
export const generarLlaves = async (id) => (await api.post(`/torneos/${id}/llaves`)).data;
export const reiniciarTorneo = async (id) => (await api.post(`/torneos/${id}/reiniciar`)).data;
export const guardarResultado = async (idPartido, datos) =>
  (await api.put(`/torneos/partidos/${idPartido}`, datos)).data;
