// Lógica pura de torneos (sin base de datos): sorteo, fixture, tabla de posiciones y llaves.

export const mezclar = (lista) => {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const letraGrupo = (i) => String.fromCharCode(65 + i); // 0 -> A, 1 -> B ...

// Reparte los ids en N grupos, de a uno por vez
export const repartirEnGrupos = (ids, cantidad) => {
  const grupos = Array.from({ length: cantidad }, () => []);
  ids.forEach((id, i) => grupos[i % cantidad].push(id));
  return grupos;
};

// Todos contra todos, una vuelta (método del círculo). Devuelve jornadas: [[[local, visitante], ...], ...]
export const todosContraTodos = (ids) => {
  const lista = ids.length % 2 ? [...ids, null] : [...ids]; // null = descansa
  const n = lista.length;
  const jornadas = [];
  for (let r = 0; r < n - 1; r++) {
    const cruces = [];
    for (let i = 0; i < n / 2; i++) {
      const a = lista[i];
      const b = lista[n - 1 - i];
      if (a !== null && b !== null) cruces.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    jornadas.push(cruces);
    lista.splice(1, 0, lista.pop()); // rota todos menos el primero
  }
  return jornadas;
};

// Posiciones de siembra para que los mejores se crucen lo más tarde posible (1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6)
export const ordenSemillas = (size) => {
  let s = [1];
  while (s.length < size) {
    const total = s.length * 2;
    s = s.flatMap((x) => [x, total + 1 - x]);
  }
  return s;
};

// Arma TODAS las rondas de las llaves. ids va ordenado de mejor a peor semilla.
// Si no entra justo en 4/8/16, los mejores sembrados pasan directo la primera ronda.
export const armarLlaves = (ids) => {
  const n = ids.length;
  let size = 2;
  while (size < n) size *= 2;
  const rondas = Math.log2(size);
  const semillas = ordenSemillas(size);

  const m = {}; // m[ronda][orden]
  for (let r = 1; r <= rondas; r++) {
    m[r] = [];
    for (let o = 0; o < size / 2 ** r; o++) {
      m[r][o] = { ronda: r, orden: o, local: null, visitante: null, jugado: false };
    }
  }

  for (let o = 0; o < size / 2; o++) {
    m[1][o].local = ids[semillas[2 * o] - 1] ?? null;
    m[1][o].visitante = ids[semillas[2 * o + 1] - 1] ?? null;
  }

  // Pasan directo: el partido queda "jugado" y el equipo ya aparece en la ronda siguiente
  for (const p of m[1]) {
    if ((p.local === null) !== (p.visitante === null)) {
      p.jugado = true;
      if (rondas > 1) {
        const siguiente = m[2][Math.floor(p.orden / 2)];
        siguiente[p.orden % 2 === 0 ? "local" : "visitante"] = p.local ?? p.visitante;
      }
    }
  }

  const partidos = [];
  for (let r = 1; r <= rondas; r++) partidos.push(...m[r]);
  return { rondas, partidos };
};

export const nombreRonda = (ronda, totalRondas) => {
  const faltan = totalRondas - ronda;
  if (faltan === 0) return "Final";
  if (faltan === 1) return "Semifinales";
  if (faltan === 2) return "Cuartos de final";
  if (faltan === 3) return "Octavos de final";
  return `Ronda ${ronda}`;
};

// Gana por goles; si empatan, por penales. null si todavía no hay ganador.
export const ganadorId = (p) => {
  if (!p.jugado) return null;
  if (p.id_equipo_local == null) return p.id_equipo_visitante; // pasa directo
  if (p.id_equipo_visitante == null) return p.id_equipo_local;
  if (p.goles_local > p.goles_visitante) return p.id_equipo_local;
  if (p.goles_local < p.goles_visitante) return p.id_equipo_visitante;
  if (p.penales_local == null || p.penales_visitante == null) return null;
  return p.penales_local > p.penales_visitante ? p.id_equipo_local : p.id_equipo_visitante;
};

// Orden: puntos, diferencia de gol, goles a favor
export const compararFilas = (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;

export const calcularTabla = (equipos, partidos) => {
  const filas = new Map(
    equipos.map((e) => [
      e.id_equipo,
      { id_equipo: e.id_equipo, nombre: e.nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 },
    ]),
  );

  for (const p of partidos) {
    if (!p.jugado) continue;
    const l = filas.get(p.id_equipo_local);
    const v = filas.get(p.id_equipo_visitante);
    if (!l || !v) continue;

    l.pj++;
    v.pj++;
    l.gf += p.goles_local;
    l.gc += p.goles_visitante;
    v.gf += p.goles_visitante;
    v.gc += p.goles_local;

    if (p.goles_local > p.goles_visitante) {
      l.pg++;
      l.pts += 3;
      v.pp++;
    } else if (p.goles_local < p.goles_visitante) {
      v.pg++;
      v.pts += 3;
      l.pp++;
    } else {
      l.pe++;
      v.pe++;
      l.pts++;
      v.pts++;
    }
  }

  const lista = [...filas.values()];
  lista.forEach((f) => (f.dg = f.gf - f.gc));
  return lista.sort((a, b) => compararFilas(a, b) || a.nombre.localeCompare(b.nombre));
};
