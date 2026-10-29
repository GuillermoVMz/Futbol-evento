import api from "./api";

// Jugadores
export const loginUsuario = (email, password) => api.post("/auth/usuario/login", { email, password });
export const registrarUsuario = (datos) => api.post("/auth/usuario/register", datos);

// Dueños de complejos / organizadores de eventos
export const loginEmpresa = (email, password) => api.post("/auth/empresa/login", { email, password });
export const registrarEmpresa = (datos) => api.post("/auth/empresa/register", datos);

export const obtenerPerfil = () => api.get("/auth/perfil");
