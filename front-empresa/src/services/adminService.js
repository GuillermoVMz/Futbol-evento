import api from "./api";

export const obtenerResumen = async () => {
  const { data } = await api.get("/admin/resumen");
  return data;
};

export const obtenerGastos = async () => {
  const { data } = await api.get("/gastos");
  return data;
};

export const crearGasto = async (gasto) => {
  const { data } = await api.post("/gastos", gasto);
  return data;
};

export const eliminarGasto = async (id) => {
  const { data } = await api.delete(`/gastos/${id}`);
  return data;
};

// ----- Datos para cobrar por transferencia -----
export const obtenerDatosPago = async () => {
  const { data } = await api.get("/admin/pago");
  return data;
};

export const guardarDatosPago = async (datos) => {
  const { data } = await api.put("/admin/pago", datos);
  return data;
};
