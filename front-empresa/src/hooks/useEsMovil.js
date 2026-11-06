import { useSyncExternalStore } from "react";

// Pantallas de hasta 991px (celulares y tablets chicas): el menú pasa a ser un botón con panel lateral
const CONSULTA = "(max-width: 991px)";

const suscribirse = (cb) => {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

const leer = () => window.matchMedia(CONSULTA).matches;

// Devuelve el valor correcto desde el primer dibujo (sin parpadeo) y se actualiza al girar el celular
export const useEsMovil = () => useSyncExternalStore(suscribirse, leer);
