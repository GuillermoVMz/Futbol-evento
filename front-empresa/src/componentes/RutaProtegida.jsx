import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../services/session";

// rol: "usuario" (jugador), "empresa" (dueño / organizador) o "superadmin" (el equipo).
// Es solo comodidad de navegación: la seguridad real la aplica el backend en cada endpoint.
export default function RutaProtegida({ rol, children }) {
  const sesion = useSesion();
  const location = useLocation();

  if (!sesion.token) {
    const destino = rol === "empresa" ? "/admin/login" : rol === "superadmin" ? "/super/login" : "/login";
    return <Navigate to={destino} state={{ from: location.pathname }} replace />;
  }

  if (rol && sesion.rol !== rol) {
    return <Navigate to="/" replace />;
  }

  return children;
}
