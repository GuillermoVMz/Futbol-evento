/**
 * MOTOR DE CLASIFICACIÓN Y DESEMPATES PARA TORNEOS
 * Fútbol Evento
 */

// 1. ORDENAMIENTO POR PUNTOS Y GOLES A FAVOR
export function ordenarTabla(equipos) {
  return [...equipos].sort((a, b) => {
    // Criterio 1: Mayor cantidad de puntos
    if (b.puntos !== a.puntos) {
      return b.puntos - a.puntos;
    }
    // Criterio 2: Mayor cantidad de goles a favor (si empatan en puntos)
    if (b.golesAFavor !== a.golesAFavor) {
      return b.golesAFavor - a.golesAFavor;
    }
    // Criterio 3: Empate absoluto (retorna 0 para indicar igualdad total)
    return 0;
  });
}

// 2. DETECTOR DE EMPATES CRÍTICOS EN ZONA DE CORTE
export function detectarEmpatesCriticos(tablaOrdenada, cuposClasificatorios) {
  const empatesCriticos = [];

  if (
    cuposClasificatorios <= 0 ||
    cuposClasificatorios >= tablaOrdenada.length
  ) {
    return empatesCriticos;
  }

  const ultimoClasificado = tablaOrdenada[cuposClasificatorios - 1];
  const primerEliminado = tablaOrdenada[cuposClasificatorios];

  // Si el último que entra empata en puntos Y goles a favor con el primero que queda afuera
  if (
    ultimoClasificado.puntos === primerEliminado.puntos &&
    ultimoClasificado.golesAFavor === primerEliminado.golesAFavor
  ) {
    const involucrados = tablaOrdenada.filter(
      (eq) =>
        eq.puntos === ultimoClasificado.puntos &&
        eq.golesAFavor === ultimoClasificado.golesAFavor,
    );

    empatesCriticos.push({
      motivo:
        "Igualdad absoluta en Puntos y Goles a Favor en el límite de clasificación",
      puntos: ultimoClasificado.puntos,
      golesAFavor: ultimoClasificado.golesAFavor,
      equiposInvolucrados: involucrados.map((eq) => ({
        id_equipo: eq.id_equipo,
        nombre: eq.nombre,
        grupoOrigen: eq.grupoOrigen || "N/A",
      })),
    });
  }

  return empatesCriticos;
}

// 3. ESTRUCTURADOR MATEMÁTICO DE LLAVES Y CUPOS AUTOMÁTICOS
export function calcularEstructuraTorneo(totalEquipos, numGrupos) {
  const potenciasValidas = [8, 16, 32, 64, 128];

  if (!numGrupos || numGrupos <= 1) {
    const tamanoLlave = potenciasValidas.find((p) => p >= totalEquipos) || 128;
    const byes = tamanoLlave - totalEquipos;
    return {
      modalidad: "ELIMINACION_DIRECTA",
      tamanoLlave,
      equiposInscriptos: totalEquipos,
      byesPrimerRonda: byes,
      partidosPrimeraRonda: (totalEquipos - byes) / 2,
    };
  }

  const cuposSiPasanSegundos = numGrupos * 2;
  const tamanoLlaveIdeal = potenciasValidas.find((p) => p >= numGrupos) || 128;

  // CASO A: Hay más grupos que lugares en la llave -> Pasan los MEJORES 1°
  if (numGrupos > tamanoLlaveIdeal) {
    return {
      modalidad: "FASE_DE_GRUPOS_MAS_LLAVE",
      tamanoLlave: tamanoLlaveIdeal,
      regla: "MEJORES_PRIMEROS",
      cuposPrimeros: tamanoLlaveIdeal,
      cuposSegundos: 0,
      mejoresTerceros: 0,
    };
  }

  // CASO B: Los 1° entran todos exactos
  if (numGrupos === tamanoLlaveIdeal) {
    return {
      modalidad: "FASE_DE_GRUPOS_MAS_LLAVE",
      tamanoLlave: tamanoLlaveIdeal,
      regla: "SOLO_PRIMEROS",
      cuposPrimeros: numGrupos,
      cuposSegundos: 0,
      mejoresTerceros: 0,
    };
  }

  // CASO C: Entran 1° y 2° + mejores 3° si hacen falta para completar la potencia de 2
  const tamanoLlaveConSegundos =
    potenciasValidas.find((p) => p >= cuposSiPasanSegundos) || 128;
  const cuposRestantesTerceros = tamanoLlaveConSegundos - cuposSiPasanSegundos;

  return {
    modalidad: "FASE_DE_GRUPOS_MAS_LLAVE",
    tamanoLlave: tamanoLlaveConSegundos,
    regla: "PRIMEROS_SEGUNDOS_Y_TERCEROS",
    cuposPrimeros: numGrupos,
    cuposSegundos: numGrupos,
    mejoresTerceros: cuposRestantesTerceros,
  };
}

// 4. EJECUTOR GENERAL DE CLASIFICACIÓN Y VALIDACIÓN DE DESEMPATES
export function procesARClasificacionYCruces(gruposData, numGrupos) {
  let primeros = [];
  let segundos = [];
  let terceros = [];
  let empatesPorResolver = [];

  // Paso 1: Ordenar internamente cada grupo
  gruposData.forEach((grupo, idx) => {
    const ordenados = ordenarTabla(grupo.equipos);

    if (ordenados[0])
      primeros.push({
        ...ordenados[0],
        grupoOrigen: grupo.nombre || `Grupo ${idx + 1}`,
      });
    if (ordenados[1])
      segundos.push({
        ...ordenados[1],
        grupoOrigen: grupo.nombre || `Grupo ${idx + 1}`,
      });
    if (ordenados[2])
      terceros.push({
        ...ordenados[2],
        grupoOrigen: grupo.nombre || `Grupo ${idx + 1}`,
      });
  });

  // Paso 2: Ordenar tablas generales de 1°s, 2°s y 3°s
  primeros = ordenarTabla(primeros);
  segundos = ordenarTabla(segundos);
  terceros = ordenarTabla(terceros);

  const totalEquipos = primeros.length + segundos.length + terceros.length;
  const estructura = calcularEstructuraTorneo(totalEquipos, numGrupos);

  let clasificadosFinales = [];

  // Paso 3: Aplicar reglas y evaluar empates según la modalidad calculada
  if (estructura.regla === "MEJORES_PRIMEROS") {
    // Evalúa si hay empate en la zona de corte de los mejores 1°
    const empatesPrimeros = detectarEmpatesCriticos(
      primeros,
      estructura.cuposPrimeros,
    );
    if (empatesPrimeros.length > 0) {
      return {
        estado: "DESEMPATES_PENDIENTES",
        requierePartidosDesempate: true,
        detalles: empatesPrimeros,
      };
    }
    clasificadosFinales = primeros.slice(0, estructura.cuposPrimeros);
  } else if (estructura.regla === "SOLO_PRIMEROS") {
    clasificadosFinales = [...primeros];
  } else if (estructura.regla === "PRIMEROS_SEGUNDOS_Y_TERCEROS") {
    clasificadosFinales = [...primeros, ...segundos];

    if (estructura.mejoresTerceros > 0) {
      // Evalúa si hay empate en la zona de corte de los mejores 3°
      const empatesTerceros = detectarEmpatesCriticos(
        terceros,
        estructura.mejoresTerceros,
      );
      if (empatesTerceros.length > 0) {
        return {
          estado: "DESEMPATES_PENDIENTES",
          requierePartidosDesempate: true,
          detalles: empatesTerceros,
        };
      }
      clasificadosFinales.push(
        ...terceros.slice(0, estructura.mejoresTerceros),
      );
    }
  }

  return {
    estado: "LISTO_PARA_CRUCES",
    requierePartidosDesempate: false,
    estructura,
    clasificados: clasificadosFinales,
  };
}
