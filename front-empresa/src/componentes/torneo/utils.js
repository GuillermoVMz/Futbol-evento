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

// Estado que se muestra al público. Si el torneo está en inscripción pero ya completó el cupo,
// figura como "Cupos llenos" (las inscripciones se cierran solas al llenarse y se reabren si se libera un lugar).
export const estadoVisible = (torneo, cantidadEquipos) => {
  if (torneo.estado === "inscripcion") {
    if (torneo.cupo_maximo != null && cantidadEquipos >= torneo.cupo_maximo) return { texto: "Cupos llenos", color: "red" };
    if (torneo.fecha_vencida) return { texto: "Inscripción cerrada", color: "red" };
  }
  return ESTADOS[torneo.estado] ?? { texto: torneo.estado, color: "default" };
};

// Abierta = sin sortear, con cupo disponible y sin haber pasado el día del torneo
export const inscripcionAbierta = (torneo, cantidadEquipos) =>
  torneo.estado === "inscripcion" &&
  !torneo.fecha_vencida &&
  (torneo.cupo_maximo == null || cantidadEquipos < torneo.cupo_maximo);

export const formatearPlata = (n) => (Number(n) > 0 ? `$${Number(n).toLocaleString("es-AR")}` : "Gratis");

export const textoCupo = (cantidadEquipos, cupo) => (cupo != null ? `${cantidadEquipos}/${cupo}` : `${cantidadEquipos}`);
