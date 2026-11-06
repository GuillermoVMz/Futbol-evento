import api from "./api";

// Público
export const getTorneos = async () => (await api.get("/torneos")).data;
export const getTorneo = async (id) => (await api.get(`/torneos/${id}`)).data;

// Jugadores
export const getMiInscripcion = async (id) => (await api.get(`/torneos/${id}/mi-inscripcion`)).data;
export const inscribirMiEquipo = async (id, nombre, color) =>
  (await api.post(`/torneos/${id}/inscripcion`, { nombre, color: color ?? null })).data;
export const cancelarMiInscripcion = async (id) => (await api.delete(`/torneos/${id}/inscripcion`)).data;

// Organizadores (panel)
export const getInscriptos = async (id) => (await api.get(`/torneos/${id}/inscriptos`)).data;
export const getMisTorneos = async () => (await api.get("/torneos/mios")).data;
export const crearTorneo = async (torneo) => (await api.post("/torneos", torneo)).data;
export const actualizarTorneo = async (id, datos) => (await api.put(`/torneos/${id}`, datos)).data;
export const eliminarTorneo = async (id) => (await api.delete(`/torneos/${id}`)).data;
export const inscribirEquipo = async (id, nombre, color) =>
  (await api.post(`/torneos/${id}/equipos`, { nombre, color: color ?? null })).data;
export const quitarEquipo = async (id, idEquipo) => (await api.delete(`/torneos/${id}/equipos/${idEquipo}`)).data;
export const sortearTorneo = async (id) => (await api.post(`/torneos/${id}/sorteo`)).data;
export const generarLlaves = async (id) => (await api.post(`/torneos/${id}/llaves`)).data;
export const reiniciarTorneo = async (id) => (await api.post(`/torneos/${id}/reiniciar`)).data;
export const guardarResultado = async (idPartido, datos) =>
  (await api.put(`/torneos/partidos/${idPartido}`, datos)).data;

// El organizador confirma (o revierte) que un equipo pagó la inscripción
export const cambiarPago = async (id, idEquipo, estadoPago) =>
  (await api.patch(`/torneos/${id}/inscriptos/${idEquipo}/pago`, { estado_pago: estadoPago })).data;
