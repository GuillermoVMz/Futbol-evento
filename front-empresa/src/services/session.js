import { useSyncExternalStore } from "react";

// Sesión guardada en el navegador. rol: "usuario" (jugador) | "empresa" (dueño / organizador)
const listeners = new Set();
const avisar = () => listeners.forEach((l) => l());

export const guardarSesion = ({ token, usuario }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
  avisar();
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  avisar();
};

export const obtenerSesion = () => {
  const token = localStorage.getItem("token");
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuario"));
  } catch {
    /* sesión corrupta */
  }
  return { token, usuario, rol: token ? (usuario?.rol ?? null) : null };
};

// Hook: el componente se vuelve a dibujar cuando alguien inicia o cierra sesión
const suscribirse = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const instantanea = () => `${localStorage.getItem("token")}|${localStorage.getItem("usuario")}`;

export const useSesion = () => {
  useSyncExternalStore(suscribirse, instantanea);
  return obtenerSesion();
};
