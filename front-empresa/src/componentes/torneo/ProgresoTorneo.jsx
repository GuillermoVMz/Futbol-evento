import React from "react";
import { Steps } from "antd";

// Línea de tiempo del torneo: deja claro en qué etapa está
export default function ProgresoTorneo({ torneo, hayLlaves }) {
  const conGrupos = torneo.formato === "grupos";
  const pasos = conGrupos
    ? ["Inscripción", "Fase de grupos", "Llaves", "Campeón"]
    : ["Inscripción", "Llaves", "Campeón"];

  let actual;
  if (torneo.estado === "finalizado") actual = pasos.length; // todas las etapas completas
  else if (torneo.estado === "inscripcion") actual = 0;
  else actual = conGrupos ? (hayLlaves ? 2 : 1) : 1;

  return <Steps size="small" current={actual} items={pasos.map((title) => ({ title }))} style={{ marginBottom: 24 }} />;
}
