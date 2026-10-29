export const FORMATOS = {
  eliminacion: "Eliminación directa",
  grupos: "Fase de grupos + llaves",
};

export const ESTADOS = {
  inscripcion: { texto: "Inscripción abierta", color: "green" },
  en_curso: { texto: "En juego", color: "blue" },
  finalizado: { texto: "Finalizado", color: "gold" },
};

export const formatearFecha = (f) => String(f).split("-").reverse().join("/");
export const hhmm = (t) => String(t).slice(0, 5);

// Qué lado ganó un partido: "local" | "visitante" | null (sin jugar o sin definir)
export const ganadorLado = (p) => {
  if (!p.jugado) return null;
  if (p.id_equipo_local == null) return "visitante"; // pasa directo
  if (p.id_equipo_visitante == null) return "local";
  if (p.goles_local > p.goles_visitante) return "local";
  if (p.goles_local < p.goles_visitante) return "visitante";
  if (p.penales_local == null || p.penales_visitante == null) return null;
  return p.penales_local > p.penales_visitante ? "local" : "visitante";
};

export const fechaHoraPartido = (p) =>
  p.fecha ? `${formatearFecha(p.fecha)}${p.horario ? ` ${hhmm(p.horario)} hs` : ""}` : null;
