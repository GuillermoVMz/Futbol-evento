import axios from "axios";

// Instancia centralizada de Axios (única fuente de la URL del backend).
// Por defecto usa el mismo equipo desde el que se abrió la app: en la PC es http://localhost:3000/api y,
// si se entra desde un celular por la IP de la PC (ej. http://192.168.1.20:5173), apunta a esa misma IP.
// En producción se define VITE_API_URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`,
});

// Interceptor de petición: adjunta el token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante un 401 (token vencido o inválido) cierra la sesión y manda al login que corresponda.
// Se excluye /login para que "credenciales incorrectas" se muestre en el formulario.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = error.config?.url?.includes("/login");
    if (error.response?.status === 401 && !esLogin) {
      let rol = null;
      try {
        rol = JSON.parse(localStorage.getItem("usuario"))?.rol;
      } catch {
        /* sesión corrupta: se ignora */
      }
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = rol === "empresa" ? "/admin/login" : rol === "superadmin" ? "/super/login" : "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
