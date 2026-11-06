import { useMemo, useSyncExternalStore } from "react";

// Sesión guardada en el navegador. rol: "usuario" (jugador) | "empresa" (dueño / organizador)
//
// IMPORTANTE: este proyecto usa React Compiler, que guarda en memoria el resultado de cualquier función
// que no reciba datos del componente. Por eso useSesion() NO llama a una función "suelta": deriva la
// sesión del snapshot que entrega useSyncExternalStore, que es lo que realmente cambia.
const EVENTO = "sesion-cambiada";
const avisar = () => window.dispatchEvent(new Event(EVENTO));

// Foto actual de lo guardado (texto). Si cambia, los componentes se vuelven a dibujar.
const leerGuardado = () => JSON.stringify([localStorage.getItem("token"), localStorage.getItem("usuario")]);

const interpretar = (guardado) => {
  const [token, usuarioTexto] = JSON.parse(guardado);
  let usuario = null;
  try {
    usuario = JSON.parse(usuarioTexto);
  } catch {
    /* sesión corrupta */
  }
  return { token, usuario, rol: token ? (usuario?.rol ?? null) : null };
};

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

// Para código que no es un componente (lectura puntual)
export const obtenerSesion = () => interpretar(leerGuardado());

// El aviso viaja por eventos de window: así el encabezado se actualiza al instante
// y también cuando se inicia/cierra sesión en otra pestaña.
const suscribirse = (cb) => {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
};

// Hook para componentes: se actualiza cuando alguien inicia o cierra sesión
export const useSesion = () => {
  const guardado = useSyncExternalStore(suscribirse, leerGuardado);
  return useMemo(() => interpretar(guardado), [guardado]);
};
