import api from "./api";

// Complejos / organizadores
export const getEmpresas = async () => (await api.get("/superadmin/empresas")).data;
export const crearEmpresa = async (datos) => (await api.post("/superadmin/empresas", datos)).data;
export const cambiarAprobacion = async (id, aprobada) =>
  (await api.patch(`/superadmin/empresas/${id}/aprobacion`, { aprobada })).data;
export const establecerPasswordEmpresa = async (id, password) =>
  (await api.post(`/superadmin/empresas/${id}/password`, { password })).data;
export const eliminarEmpresa = async (id) => (await api.delete(`/superadmin/empresas/${id}`)).data;

// Super admins
export const getSuperadmins = async () => (await api.get("/superadmin/superadmins")).data;
export const crearSuperadmin = async (datos) => (await api.post("/superadmin/superadmins", datos)).data;
export const eliminarSuperadmin = async (id) => (await api.delete(`/superadmin/superadmins/${id}`)).data;
export const cambiarMiPassword = async (actual, nueva) =>
  (await api.post("/superadmin/superadmins/mi-password", { actual, nueva })).data;
