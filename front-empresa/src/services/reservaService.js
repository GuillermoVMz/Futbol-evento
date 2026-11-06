import api from "./api";

// Jugador
export const crearReserva = async (reserva) => {
  const { data } = await api.post("/reservas", reserva);
  return data;
};

export const obtenerMisReservas = async () => {
  const { data } = await api.get("/reservas/mias");
  return data;
};

export const cancelarMiReserva = async (id) => {
  const { data } = await api.patch(`/reservas/${id}/cancelar`);
  return data;
};

// Dueño
export const obtenerReservasEmpresa = async () => {
  const { data } = await api.get("/reservas");
  return data;
};

export const cambiarEstadoReserva = async (id, estado) => {
  const { data } = await api.patch(`/reservas/${id}/estado`, { estado });
  return data;
};
