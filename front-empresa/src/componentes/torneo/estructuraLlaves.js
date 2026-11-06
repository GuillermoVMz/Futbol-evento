// Reparte las rondas en dos mitades (izquierda y derecha) con la final en el centro,
// como un cuadro de campeonato: las primeras rondas quedan en los bordes y todo converge a la final.
export const armarEstructura = (rondas) => {
  if (!rondas || rondas.length === 0) return null;

  const final = rondas[rondas.length - 1];
  const previas = rondas.slice(0, -1);

  const mitad = (r, izquierda) => {
    const medio = r.partidos.length / 2;
    return {
      ronda: r.ronda,
      nombre: r.nombre,
      partidos: izquierda ? r.partidos.slice(0, medio) : r.partidos.slice(medio),
    };
  };

  return {
    izquierda: previas.map((r) => mitad(r, true)), // de afuera hacia el centro
    derecha: previas.map((r) => mitad(r, false)).reverse(), // del centro hacia afuera
    final: { nombre: final.nombre, partido: final.partidos[0] },
  };
};
