import { pool } from "../data/db.js";
import {
  esId,
  esFecha,
  esHora,
  hhmm,
  esUrlImagen,
  sinImagen,
  esColor,
  hoyArgentina,
  SQL_AHORA,
} from "../utils/validar.js";
import {
  mezclar,
  letraGrupo,
  repartirEnGrupos,
  todosContraTodos,
  armarLlaves,
  calcularTabla,
  compararFilas,
  nombreRonda,
  ganadorId,
} from "../utils/torneos.js";
import { Preference, Payment } from "mercadopago";
import client from "../utils/mercadopago.js";

const FORMATOS = ["eliminacion", "grupos"];
const MAX_EQUIPOS = 32;
const PRECIO_MAX = 10_000_000;
const PAGOS = ["pendiente", "pagado"];
const IMAGEN_DEFAULT_TORNEO =
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop";

const esPrecio = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  Number.isInteger(Number(v)) &&
  Number(v) >= 0 &&
  Number(v) <= PRECIO_MAX;
const esFechaFutura = (v) => esFecha(v) && v >= hoyArgentina(); // hoy o después
const formatearFecha = (f) => String(f).split("-").reverse().join("/");

class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const responderError = (res, nombre, error) => {
  if (error instanceof ErrorHttp)
    return res.status(error.status).json({ mensaje: error.message });
  if (error.code === "42703" || error.code === "42P01") {
    console.error(
      `${nombre}: la base de datos no está actualizada ->`,
      error.message,
    );
    return res.status(500).json({
      mensaje:
        "La base de datos no está actualizada: ejecutá las migraciones de backend-empresa/database/ en Supabase",
    });
  }
  if (error.code === "23505")
    return res
      .status(409)
      .json({ mensaje: "Ese equipo o jugador ya está inscripto" });
  console.error(`${nombre}:`, error);
  res.status(500).json({ mensaje: "Error en el servidor" });
};

const conTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const leerColor = (v) =>
  v === undefined || v === null || v === "" ? [true, null] : [esColor(v), v];
const entero = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  Number.isInteger(Number(v)) &&
  Number(v) >= 0;

const torneoPropio = async (db, id, idEmpresa, bloquear = false) => {
  const { rows } = await db.query(
    `SELECT * FROM torneos WHERE id_torneo = $1 AND id_empresa = $2${bloquear ? " FOR UPDATE" : ""}`,
    [id, idEmpresa],
  );
  if (rows.length === 0) throw new ErrorHttp(404, "Torneo no encontrado");
  return rows[0];
};

const cargarTorneo = async (db, id) => {
  const t = await db.query(
    `SELECT t.*, e.nombre_complejo AS complejo,
            (t.fecha_evento IS NOT NULL AND t.fecha_evento < ${SQL_AHORA}::date) AS fecha_vencida
     FROM torneos t JOIN empresas e ON e.id_empresa = t.id_empresa
     WHERE t.id_torneo = $1`,
    [id],
  );
  if (t.rows.length === 0) return null;

  const equipos = await db.query(
    `SELECT e.id_equipo, e.nombre, e.color, i.grupo
     FROM inscripciones i JOIN equipos e ON e.id_equipo = i.id_equipo
     WHERE i.id_torneo = $1 ORDER BY i.fecha_insc, e.id_equipo`,
    [id],
  );
  const partidos = await db.query(
    `SELECT p.*, l.nombre AS equipo_local, v.nombre AS equipo_visitante,
            l.color AS color_local, v.color AS color_visitante
     FROM partidos p
     LEFT JOIN equipos l ON l.id_equipo = p.id_equipo_local
     LEFT JOIN equipos v ON v.id_equipo = p.id_equipo_visitante
     WHERE p.id_torneo = $1
     ORDER BY p.fase, p.ronda, p.orden, p.id_partido`,
    [id],
  );
  return { torneo: t.rows[0], equipos: equipos.rows, partidos: partidos.rows };
};

const armarRespuesta = ({ torneo, equipos, partidos }) => {
  const letras = [
    ...new Set(equipos.map((e) => e.grupo).filter(Boolean)),
  ].sort();
  const grupos = letras.map((letra) => {
    const delGrupo = equipos.filter((e) => e.grupo === letra);
    const partidosGrupo = partidos.filter(
      (p) => p.fase === "grupos" && p.grupo === letra,
    );
    const tabla = calcularTabla(delGrupo, partidosGrupo).map((fila, i) => ({
      ...fila,
      clasifica: i < torneo.clasifican_por_grupo,
    }));
    return { grupo: letra, tabla, partidos: partidosGrupo };
  });

  const eliminatorias = partidos.filter((p) => p.fase === "eliminatoria");
  const totalRondas = eliminatorias.reduce((m, p) => Math.max(m, p.ronda), 0);
  const llaves = Array.from({ length: totalRondas }, (_, i) => i + 1).map(
    (ronda) => ({
      ronda,
      nombre: nombreRonda(ronda, totalRondas),
      partidos: eliminatorias
        .filter((p) => p.ronda === ronda)
        .sort((a, b) => a.orden - b.orden),
    }),
  );

  const final = eliminatorias.find((p) => p.ronda === totalRondas);
  const idCampeon = final ? ganadorId(final) : null;
  const campeon = idCampeon
    ? (equipos.find((e) => e.id_equipo === idCampeon) ?? null)
    : null;

  return { torneo, equipos, grupos, llaves, campeon };
};

const insertarPartido = (db, p) =>
  db.query(
    `INSERT INTO partidos
       (id_torneo, id_equipo_local, id_equipo_visitante, fase, grupo, ronda, orden, jugado, goles_local, goles_visitante)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL)`,
    [
      p.id_torneo,
      p.local,
      p.visitante,
      p.fase,
      p.grupo ?? null,
      p.ronda,
      p.orden,
      p.jugado ?? false,
    ],
  );

const insertarLlaves = async (db, idTorneo, ids) => {
  const { partidos } = armarLlaves(ids);
  for (const p of partidos) {
    await insertarPartido(db, {
      id_torneo: idTorneo,
      local: p.local,
      visitante: p.visitante,
      fase: "eliminatoria",
      ronda: p.ronda,
      orden: p.orden,
      jugado: p.jugado,
    });
  }
};

// ------------------------- Público -------------------------

const LISTA = `
  SELECT t.id_torneo, t.nombre, t.formato, t.estado, t.cantidad_grupos, t.clasifican_por_grupo, t.imagen_url, t.cupo_maximo, t.precio_inscripcion, t.fecha_evento,
         (t.fecha_evento IS NOT NULL AND t.fecha_evento < ${SQL_AHORA}::date) AS fecha_vencida,
         e.nombre_complejo AS complejo,
         (SELECT COUNT(*) FROM inscripciones i WHERE i.id_torneo = t.id_torneo) AS equipos
  FROM torneos t JOIN empresas e ON e.id_empresa = t.id_empresa`;

export const obtenerTorneos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${LISTA} WHERE e.aprobada = TRUE ORDER BY t.id_torneo DESC`,
    );
    res.json(rows);
  } catch (error) {
    responderError(res, "obtenerTorneos", error);
  }
};

export const obtenerTorneo = async (req, res) => {
  try {
    if (!esId(req.params.id))
      return res.status(400).json({ mensaje: "Id inválido" });
    const datos = await cargarTorneo(pool, req.params.id);
    if (!datos)
      return res.status(404).json({ mensaje: "Torneo no encontrado" });
    res.json(armarRespuesta(datos));
  } catch (error) {
    responderError(res, "obtenerTorneo", error);
  }
};

// ------------------------- Organizadores -------------------------

export const obtenerMisTorneos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${LISTA} WHERE t.id_empresa = $1 ORDER BY t.id_torneo DESC`,
      [req.usuario.id_empresa],
    );
    res.json(rows);
  } catch (error) {
    responderError(res, "obtenerMisTorneos", error);
  }
};

export const crearTorneo = async (req, res) => {
  try {
    const nombre = String(req.body.nombre ?? "").trim();
    const formato = req.body.formato ?? "eliminacion";
    if (!nombre || nombre.length > 150) {
      return res
        .status(400)
        .json({
          mensaje: "Ingresá el nombre del torneo (máximo 150 caracteres)",
        });
    }
    if (!FORMATOS.includes(formato)) {
      return res
        .status(400)
        .json({ mensaje: `formato debe ser: ${FORMATOS.join(", ")}` });
    }

    let grupos = null;
    let clasifican = 2;
    if (formato === "grupos") {
      grupos = Number(req.body.cantidad_grupos);
      clasifican = Number(req.body.clasifican_por_grupo ?? 2);
      if (!Number.isInteger(grupos) || grupos < 1 || grupos > 8) {
        return res
          .status(400)
          .json({ mensaje: "La cantidad de grupos debe estar entre 1 y 8" });
      }
      if (!Number.isInteger(clasifican) || clasifican < 1 || clasifican > 4) {
        return res
          .status(400)
          .json({ mensaje: "Clasifican por grupo debe estar entre 1 y 4" });
      }
      if (grupos * clasifican < 2) {
        return res
          .status(400)
          .json({
            mensaje: "Tienen que clasificar al menos 2 equipos en total",
          });
      }
    }

    const imagen = req.body.imagen_url;
    if (!sinImagen(imagen) && !esUrlImagen(imagen)) {
      return res
        .status(400)
        .json({ mensaje: "La imagen debe ser un link http(s) válido" });
    }

    // Imagen predeterminada si el usuario no especificó una propia
    const imagenFinal = sinImagen(imagen) ? IMAGEN_DEFAULT_TORNEO : imagen;

    const cupo = Number(req.body.cupo_maximo);
    if (!Number.isInteger(cupo) || cupo < 2 || cupo > MAX_EQUIPOS) {
      return res
        .status(400)
        .json({
          mensaje: `El cupo máximo debe estar entre 2 y ${MAX_EQUIPOS} equipos`,
        });
    }
    if (formato === "grupos" && cupo < grupos * 2) {
      return res
        .status(400)
        .json({
          mensaje: `Con ${grupos} grupo(s) el cupo mínimo es ${grupos * 2} equipos (2 por grupo)`,
        });
    }

    if (!esPrecio(req.body.precio_inscripcion)) {
      return res
        .status(400)
        .json({
          mensaje:
            "Indicá el precio de inscripción por equipo (en pesos, 0 si es gratis)",
        });
    }
    if (!esFechaFutura(req.body.fecha_evento)) {
      return res
        .status(400)
        .json({
          mensaje: "Indicá la fecha del torneo (hoy o una fecha futura)",
        });
    }

    const { rows } = await pool.query(
      `INSERT INTO torneos (id_empresa, nombre, formato, cantidad_grupos, clasifican_por_grupo, imagen_url, cupo_maximo,
                            precio_inscripcion, fecha_evento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.usuario.id_empresa,
        nombre,
        formato,
        grupos,
        clasifican,
        imagenFinal,
        cupo,
        Number(req.body.precio_inscripcion),
        req.body.fecha_evento,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    responderError(res, "crearTorneo", error);
  }
};

export const actualizarTorneo = async (req, res) => {
  try {
    if (!esId(req.params.id))
      return res.status(400).json({ mensaje: "Id inválido" });
    const {
      nombre,
      imagen_url,
      cupo_maximo,
      precio_inscripcion,
      fecha_evento,
    } = req.body;

    if (
      nombre !== undefined &&
      (!String(nombre).trim() || String(nombre).length > 150)
    ) {
      return res
        .status(400)
        .json({ mensaje: "El nombre es obligatorio (máximo 150 caracteres)" });
    }
    if (!sinImagen(imagen_url) && !esUrlImagen(imagen_url)) {
      return res
        .status(400)
        .json({ mensaje: "La imagen debe ser un link http(s) válido" });
    }
    const cambiaCupo = cupo_maximo !== undefined;
    const cupo = Number(cupo_maximo);
    if (
      cambiaCupo &&
      (!Number.isInteger(cupo) || cupo < 2 || cupo > MAX_EQUIPOS)
    ) {
      return res
        .status(400)
        .json({
          mensaje: `El cupo máximo debe estar entre 2 y ${MAX_EQUIPOS} equipos`,
        });
    }

    const cambiaPrecio = precio_inscripcion !== undefined;
    if (cambiaPrecio && !esPrecio(precio_inscripcion)) {
      return res
        .status(400)
        .json({
          mensaje:
            "El precio de inscripción debe ser un número entero de pesos (0 si es gratis)",
        });
    }
    const cambiaFecha = fecha_evento !== undefined;
    if (cambiaFecha && !esFechaFutura(fecha_evento)) {
      return res
        .status(400)
        .json({
          mensaje: "La fecha del torneo debe ser hoy o una fecha futura",
        });
    }

    const torneo = await conTransaccion(async (db) => {
      const t = await torneoPropio(
        db,
        req.params.id,
        req.usuario.id_empresa,
        true,
      );

      if (
        (cambiaCupo || cambiaPrecio || cambiaFecha) &&
        t.estado !== "inscripcion"
      ) {
        throw new ErrorHttp(
          409,
          "El torneo ya empezó: no se pueden cambiar el cupo, el precio ni la fecha",
        );
      }
      if (cambiaCupo) {
        const { rows } = await db.query(
          "SELECT COUNT(*) AS n FROM inscripciones WHERE id_torneo = $1",
          [t.id_torneo],
        );
        if (cupo < rows[0].n) {
          throw new ErrorHttp(
            409,
            `Ya hay ${rows[0].n} equipos inscriptos: el cupo no puede ser menor`,
          );
        }
        if (t.formato === "grupos" && cupo < t.cantidad_grupos * 2) {
          throw new ErrorHttp(
            400,
            `Con ${t.cantidad_grupos} grupo(s) el cupo mínimo es ${t.cantidad_grupos * 2} equipos`,
          );
        }
      }

      const { rows } = await db.query(
        `UPDATE torneos SET
           nombre = COALESCE($1, nombre),
           imagen_url = CASE WHEN $2::boolean THEN $3::text ELSE imagen_url END,
           cupo_maximo = CASE WHEN $4::boolean THEN $5::int ELSE cupo_maximo END,
           precio_inscripcion = CASE WHEN $6::boolean THEN $7::int ELSE precio_inscripcion END,
           fecha_evento = CASE WHEN $8::boolean THEN $9::date ELSE fecha_evento END
         WHERE id_torneo = $10 RETURNING *`,
        [
          nombre === undefined ? null : String(nombre).trim(),
          imagen_url !== undefined,
          sinImagen(imagen_url) ? null : imagen_url,
          cambiaCupo,
          cambiaCupo ? cupo : null,
          cambiaPrecio,
          cambiaPrecio ? Number(precio_inscripcion) : null,
          cambiaFecha,
          cambiaFecha ? fecha_evento : null,
          t.id_torneo,
        ],
      );
      return rows[0];
    });
    res.json(torneo);
  } catch (error) {
    responderError(res, "actualizarTorneo", error);
  }
};

export const eliminarTorneo = async (req, res) => {
  try {
    if (!esId(req.params.id))
      return res.status(400).json({ mensaje: "Id inválido" });
    const { rowCount } = await pool.query(
      "DELETE FROM torneos WHERE id_torneo = $1 AND id_empresa = $2",
      [req.params.id, req.usuario.id_empresa],
    );
    if (rowCount === 0)
      return res.status(404).json({ mensaje: "Torneo no encontrado" });
    res.json({ mensaje: "Torneo eliminado" });
  } catch (error) {
    responderError(res, "eliminarTorneo", error);
  }
};

export const agregarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const nombre = String(req.body.nombre ?? "").trim();
    const [colorOk, color] = leerColor(req.body.color);
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (!nombre || nombre.length > 100) {
      return res
        .status(400)
        .json({
          mensaje: "Ingresá el nombre del equipo (máximo 100 caracteres)",
        });
    }
    if (!colorOk)
      return res
        .status(400)
        .json({ mensaje: "El color debe tener formato #RRGGBB" });

    const equipo = await conTransaccion(async (db) => {
      const t = await torneoPropio(db, id, req.usuario.id_empresa, true);
      if (t.estado !== "inscripcion") {
        throw new ErrorHttp(
          409,
          "El torneo ya empezó: no se pueden agregar equipos",
        );
      }
      const cantidad = await db.query(
        "SELECT COUNT(*) AS n FROM inscripciones WHERE id_torneo = $1",
        [id],
      );
      const limite = t.cupo_maximo ?? MAX_EQUIPOS;
      if (cantidad.rows[0].n >= limite) {
        throw new ErrorHttp(
          409,
          `Cupos llenos: el torneo ya tiene ${cantidad.rows[0].n} de ${limite} equipos`,
        );
      }

      let eq = await db.query(
        "SELECT id_equipo, nombre FROM equipos WHERE id_empresa = $1 AND lower(nombre) = lower($2)",
        [req.usuario.id_empresa, nombre],
      );
      if (eq.rowCount === 0) {
        eq = await db.query(
          "INSERT INTO equipos (id_empresa, nombre, color) VALUES ($1, $2, $3) RETURNING id_equipo, nombre",
          [req.usuario.id_empresa, nombre, color],
        );
      } else if (color) {
        await db.query("UPDATE equipos SET color = $1 WHERE id_equipo = $2", [
          color,
          eq.rows[0].id_equipo,
        ]);
      }

      const ya = await db.query(
        "SELECT 1 FROM inscripciones WHERE id_torneo = $1 AND id_equipo = $2",
        [id, eq.rows[0].id_equipo],
      );
      if (ya.rowCount > 0)
        throw new ErrorHttp(409, "Ese equipo ya está inscripto en el torneo");

      await db.query(
        "INSERT INTO inscripciones (id_torneo, id_equipo, precio) VALUES ($1, $2, $3)",
        [id, eq.rows[0].id_equipo, t.precio_inscripcion ?? 0],
      );
      return eq.rows[0];
    });
    res.status(201).json(equipo);
  } catch (error) {
    responderError(res, "agregarEquipo", error);
  }
};

// ------------------------- Jugadores -------------------------

export const obtenerMiInscripcion = async (req, res) => {
  try {
    if (!esId(req.params.id))
      return res.status(400).json({ mensaje: "Id inválido" });
    const { rows } = await pool.query(
      `SELECT e.id_equipo, e.nombre, e.color, i.precio, i.estado_pago
       FROM inscripciones i JOIN equipos e ON e.id_equipo = i.id_equipo
       WHERE i.id_torneo = $1 AND i.id_usuario = $2`,
      [req.params.id, req.usuario.id_usuario],
    );
    res.json({ equipo: rows[0] ?? null });
  } catch (error) {
    responderError(res, "obtenerMiInscripcion", error);
  }
};

export const inscribirMiEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const nombre = String(req.body.nombre ?? "").trim();
    const [colorOk, color] = leerColor(req.body.color);
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });
    if (!nombre || nombre.length > 100) {
      return res
        .status(400)
        .json({
          mensaje: "Ingresá el nombre de tu equipo (máximo 100 caracteres)",
        });
    }
    if (!colorOk)
      return res
        .status(400)
        .json({ mensaje: "El color debe tener formato #RRGGBB" });

    const equipo = await conTransaccion(async (db) => {
      const { rows } = await db.query(
        "SELECT * FROM torneos WHERE id_torneo = $1 FOR UPDATE",
        [id],
      );
      const t = rows[0];
      if (!t) throw new ErrorHttp(404, "Torneo no encontrado");
      if (t.estado !== "inscripcion") {
        throw new ErrorHttp(
          409,
          "Las inscripciones de este torneo están cerradas",
        );
      }
      if (t.fecha_evento && hoyArgentina() > t.fecha_evento) {
        throw new ErrorHttp(
          409,
          `Las inscripciones cerraron: el torneo era el ${formatearFecha(t.fecha_evento)}`,
        );
      }

      const propia = await db.query(
        "SELECT 1 FROM inscripciones WHERE id_torneo = $1 AND id_usuario = $2",
        [id, req.usuario.id_usuario],
      );
      if (propia.rowCount > 0)
        throw new ErrorHttp(409, "Ya inscribiste un equipo en este torneo");

      const limite = t.cupo_maximo ?? MAX_EQUIPOS;
      const { rows: cuenta } = await db.query(
        "SELECT COUNT(*) AS n FROM inscripciones WHERE id_torneo = $1",
        [id],
      );
      if (cuenta[0].n >= limite) {
        throw new ErrorHttp(
          409,
          `Cupos llenos: el torneo ya completó los ${limite} equipos`,
        );
      }

      const mismoNombre = await db.query(
        `SELECT 1 FROM inscripciones i JOIN equipos e ON e.id_equipo = i.id_equipo
         WHERE i.id_torneo = $1 AND lower(e.nombre) = lower($2)`,
        [id, nombre],
      );
      if (mismoNombre.rowCount > 0)
        throw new ErrorHttp(
          409,
          "Ya hay un equipo con ese nombre en el torneo",
        );

      const eq = await db.query(
        "INSERT INTO equipos (id_empresa, nombre, color) VALUES ($1, $2, $3) RETURNING id_equipo, nombre",
        [t.id_empresa, nombre, color],
      );
      const precio = t.precio_inscripcion ?? 0;
      await db.query(
        "INSERT INTO inscripciones (id_torneo, id_equipo, precio, id_usuario) VALUES ($1, $2, $3, $4)",
        [id, eq.rows[0].id_equipo, precio, req.usuario.id_usuario],
      );
      return {
        ...eq.rows[0],
        cupos_restantes: limite - cuenta[0].n - 1,
        precio,
        estado_pago: "pendiente",
      };
    });
    res.status(201).json(equipo);
  } catch (error) {
    responderError(res, "inscribirMiEquipo", error);
  }
};

export const cancelarMiInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });

    await conTransaccion(async (db) => {
      const { rows } = await db.query(
        "SELECT * FROM torneos WHERE id_torneo = $1 FOR UPDATE",
        [id],
      );
      if (!rows[0]) throw new ErrorHttp(404, "Torneo no encontrado");
      if (rows[0].estado !== "inscripcion") {
        throw new ErrorHttp(
          409,
          "El torneo ya empezó: pedile al organizador que te dé de baja",
        );
      }

      const baja = await db.query(
        "DELETE FROM inscripciones WHERE id_torneo = $1 AND id_usuario = $2 AND estado_pago <> 'pagado' RETURNING id_equipo",
        [id, req.usuario.id_usuario],
      );
      if (baja.rowCount === 0) {
        const existe = await db.query(
          "SELECT 1 FROM inscripciones WHERE id_torneo = $1 AND id_usuario = $2",
          [id, req.usuario.id_usuario],
        );
        if (existe.rowCount > 0) {
          throw new ErrorHttp(
            409,
            "Tu inscripción ya está paga: pedile al organizador que te dé de baja y coordine la devolución",
          );
        }
        throw new ErrorHttp(404, "No tenés un equipo inscripto en este torneo");
      }

      await db.query(
        `DELETE FROM equipos e WHERE e.id_equipo = $1
           AND NOT EXISTS (SELECT 1 FROM inscripciones i WHERE i.id_equipo = e.id_equipo)`,
        [baja.rows[0].id_equipo],
      );
    });
    res.json({ mensaje: "Inscripción cancelada" });
  } catch (error) {
    responderError(res, "cancelarMiInscripcion", error);
  }
};

export const obtenerInscriptos = async (req, res) => {
  try {
    if (!esId(req.params.id))
      return res.status(400).json({ mensaje: "Id inválido" });
    await torneoPropio(pool, req.params.id, req.usuario.id_empresa);

    const { rows } = await pool.query(
      `SELECT e.id_equipo, e.nombre, e.color, i.grupo, i.fecha_insc, i.precio, i.estado_pago,
              u.nombre AS contacto, u.telefono, u.email
       FROM inscripciones i
       JOIN equipos e ON e.id_equipo = i.id_equipo
       LEFT JOIN usuarios u ON u.id_usuario = i.id_usuario
       WHERE i.id_torneo = $1
       ORDER BY i.fecha_insc, e.id_equipo`,
      [req.params.id],
    );
    res.json(rows);
  } catch (error) {
    responderError(res, "obtenerInscriptos", error);
  }
};

export const cambiarPago = async (req, res) => {
  try {
    const { id, id_equipo } = req.params;
    const { estado_pago } = req.body;
    if (!esId(id) || !esId(id_equipo))
      return res.status(400).json({ mensaje: "Id inválido" });
    if (!PAGOS.includes(estado_pago)) {
      return res
        .status(400)
        .json({ mensaje: `estado_pago debe ser: ${PAGOS.join(", ")}` });
    }
    await torneoPropio(pool, id, req.usuario.id_empresa);

    const { rowCount } = await pool.query(
      "UPDATE inscripciones SET estado_pago = $1 WHERE id_torneo = $2 AND id_equipo = $3",
      [estado_pago, id, id_equipo],
    );
    if (rowCount === 0)
      return res.status(404).json({ mensaje: "Ese equipo no está inscripto" });
    res.json({ mensaje: "Pago actualizado" });
  } catch (error) {
    responderError(res, "cambiarPago", error);
  }
};

export const quitarEquipo = async (req, res) => {
  try {
    const { id, id_equipo } = req.params;
    if (!esId(id) || !esId(id_equipo))
      return res.status(400).json({ mensaje: "Id inválido" });

    const t = await torneoPropio(pool, id, req.usuario.id_empresa);
    if (t.estado !== "inscripcion") {
      throw new ErrorHttp(
        409,
        "El torneo ya empezó: no se pueden quitar equipos",
      );
    }
    const { rowCount } = await pool.query(
      "DELETE FROM inscripciones WHERE id_torneo = $1 AND id_equipo = $2",
      [id, id_equipo],
    );
    if (rowCount === 0)
      return res.status(404).json({ mensaje: "Ese equipo no está inscripto" });
    res.json({ mensaje: "Equipo quitado" });
  } catch (error) {
    responderError(res, "quitarEquipo", error);
  }
};

export const sortear = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });

    await conTransaccion(async (db) => {
      const t = await torneoPropio(db, id, req.usuario.id_empresa, true);
      if (t.estado !== "inscripcion")
        throw new ErrorHttp(409, "Este torneo ya fue sorteado");

      const { rows } = await db.query(
        "SELECT id_equipo FROM inscripciones WHERE id_torneo = $1",
        [id],
      );
      const ids = rows.map((r) => r.id_equipo);

      if (t.formato === "eliminacion") {
        if (ids.length < 2)
          throw new ErrorHttp(400, "Necesitás al menos 2 equipos inscriptos");
        await insertarLlaves(db, id, mezclar(ids));
      } else {
        const G = t.cantidad_grupos;
        const K = t.clasifican_por_grupo;
        if (ids.length < G * 2) {
          throw new ErrorHttp(
            400,
            `Necesitás al menos ${G * 2} equipos para ${G} grupo(s) (2 por grupo)`,
          );
        }
        const minimo = Math.floor(ids.length / G);
        if (K > minimo) {
          throw new ErrorHttp(
            400,
            `Con ${ids.length} equipos en ${G} grupo(s) pueden clasificar como máximo ${minimo} por grupo`,
          );
        }

        const repartidos = repartirEnGrupos(mezclar(ids), G);
        for (let g = 0; g < G; g++) {
          const letra = letraGrupo(g);
          await db.query(
            "UPDATE inscripciones SET grupo = $1 WHERE id_torneo = $2 AND id_equipo = ANY($3::bigint[])",
            [letra, id, repartidos[g]],
          );
          const jornadas = todosContraTodos(repartidos[g]);
          for (let j = 0; j < jornadas.length; j++) {
            for (let o = 0; o < jornadas[j].length; o++) {
              await insertarPartido(db, {
                id_torneo: id,
                local: jornadas[j][o][0],
                visitante: jornadas[j][o][1],
                fase: "grupos",
                grupo: letra,
                ronda: j + 1,
                orden: o,
              });
            }
          }
        }
      }
      await db.query(
        "UPDATE torneos SET estado = 'en_curso' WHERE id_torneo = $1",
        [id],
      );
    });
    res.json({ mensaje: "Sorteo realizado" });
  } catch (error) {
    responderError(res, "sortear", error);
  }
};

export const generarLlaves = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });

    await conTransaccion(async (db) => {
      const t = await torneoPropio(db, id, req.usuario.id_empresa, true);
      if (t.formato !== "grupos")
        throw new ErrorHttp(409, "Este torneo no tiene fase de grupos");
      if (t.estado !== "en_curso")
        throw new ErrorHttp(409, "Primero hay que sortear el torneo");

      const datos = await cargarTorneo(db, id);
      if (datos.partidos.some((p) => p.fase === "eliminatoria")) {
        throw new ErrorHttp(409, "Las llaves ya fueron generadas");
      }
      const pendientes = datos.partidos.filter(
        (p) => p.fase === "grupos" && !p.jugado,
      ).length;
      if (pendientes > 0) {
        throw new ErrorHttp(
          409,
          `Faltan cargar ${pendientes} resultado(s) de la fase de grupos`,
        );
      }

      const { grupos } = armarRespuesta(datos);
      const semillas = [];
      for (let pos = 0; pos < t.clasifican_por_grupo; pos++) {
        const nivel = grupos
          .map((g) => g.tabla[pos])
          .filter(Boolean)
          .sort(compararFilas);
        semillas.push(...nivel.map((f) => f.id_equipo));
      }
      if (semillas.length < 2)
        throw new ErrorHttp(
          409,
          "No hay suficientes clasificados para armar las llaves",
        );

      await insertarLlaves(db, id, semillas);
    });
    res.json({ mensaje: "Llaves generadas" });
  } catch (error) {
    responderError(res, "generarLlaves", error);
  }
};

export const reiniciarTorneo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });

    await conTransaccion(async (db) => {
      await torneoPropio(db, id, req.usuario.id_empresa, true);
      await db.query("DELETE FROM partidos WHERE id_torneo = $1", [id]);
      await db.query(
        "UPDATE inscripciones SET grupo = NULL WHERE id_torneo = $1",
        [id],
      );
      await db.query(
        "UPDATE torneos SET estado = 'inscripcion' WHERE id_torneo = $1",
        [id],
      );
    });
    res.json({ mensaje: "Torneo reiniciado" });
  } catch (error) {
    responderError(res, "reiniciarTorneo", error);
  }
};

export const cargarResultado = async (req, res) => {
  try {
    const { id_partido } = req.params;
    const b = req.body;
    if (!esId(id_partido))
      return res.status(400).json({ mensaje: "Id inválido" });

    const vacio = (v) => v === undefined || v === null || v === "";
    const hayGoles = !vacio(b.goles_local) || !vacio(b.goles_visitante);
    if (hayGoles && !(entero(b.goles_local) && entero(b.goles_visitante))) {
      return res
        .status(400)
        .json({
          mensaje:
            "Los goles de ambos equipos deben ser números enteros desde 0",
        });
    }
    if (!vacio(b.fecha) && !esFecha(b.fecha)) {
      return res
        .status(400)
        .json({ mensaje: "La fecha debe tener formato YYYY-MM-DD" });
    }
    if (!vacio(b.horario) && !esHora(b.horario)) {
      return res
        .status(400)
        .json({ mensaje: "El horario debe tener formato HH:MM" });
    }
    if (!hayGoles && vacio(b.fecha) && vacio(b.horario)) {
      return res
        .status(400)
        .json({ mensaje: "Indicá el resultado o la fecha/hora del partido" });
    }
    const fecha = vacio(b.fecha) ? null : b.fecha;
    const horario = vacio(b.horario) ? null : hhmm(b.horario);

    await conTransaccion(async (db) => {
      const { rows } = await db.query(
        `SELECT p.* FROM partidos p JOIN torneos t ON t.id_torneo = p.id_torneo
         WHERE p.id_partido = $1 AND t.id_empresa = $2 FOR UPDATE OF p`,
        [id_partido, req.usuario.id_empresa],
      );
      const p = rows[0];
      if (!p) throw new ErrorHttp(404, "Partido no encontrado");

      if (!hayGoles) {
        await db.query(
          "UPDATE partidos SET fecha = COALESCE($1::date, fecha), horario = COALESCE($2::time, horario) WHERE id_partido = $3",
          [fecha, horario, id_partido],
        );
        return;
      }

      if (p.id_equipo_local == null || p.id_equipo_visitante == null) {
        throw new ErrorHttp(
          409,
          "Todavía no están definidos los dos equipos de este partido",
        );
      }

      const gl = Number(b.goles_local);
      const gv = Number(b.goles_visitante);
      let pl = null;
      let pv = null;
      if (p.fase === "eliminatoria" && gl === gv) {
        const validos =
          entero(b.penales_local) &&
          entero(b.penales_visitante) &&
          Number(b.penales_local) !== Number(b.penales_visitante);
        if (!validos) {
          throw new ErrorHttp(
            400,
            "En las llaves no puede haber empate: cargá los penales (tiene que haber un ganador)",
          );
        }
        pl = Number(b.penales_local);
        pv = Number(b.penales_visitante);
      }
      const nuevo = {
        ...p,
        goles_local: gl,
        goles_visitante: gv,
        penales_local: pl,
        penales_visitante: pv,
        jugado: true,
      };

      if (p.fase === "grupos") {
        const llaves = await db.query(
          "SELECT 1 FROM partidos WHERE id_torneo = $1 AND fase = 'eliminatoria' LIMIT 1",
          [p.id_torneo],
        );
        if (llaves.rowCount > 0) {
          throw new ErrorHttp(
            409,
            "Las llaves ya fueron generadas: no se pueden modificar resultados de la fase de grupos",
          );
        }
      }

      let siguiente = null;
      if (p.fase === "eliminatoria") {
        const s = await db.query(
          `SELECT * FROM partidos
           WHERE id_torneo = $1 AND fase = 'eliminatoria' AND ronda = $2 AND orden = $3 FOR UPDATE`,
          [p.id_torneo, p.ronda + 1, Math.floor(p.orden / 2)],
        );
        siguiente = s.rows[0] ?? null;
        if (siguiente?.jugado && ganadorId(p) !== ganadorId(nuevo)) {
          throw new ErrorHttp(
            409,
            "No se puede cambiar el ganador: ya se jugó el partido siguiente",
          );
        }
      }

      await db.query(
        `UPDATE partidos SET goles_local = $1, goles_visitante = $2, penales_local = $3, penales_visitante = $4,
            jugado = TRUE, fecha = COALESCE($5::date, fecha), horario = COALESCE($6::time, horario)
         WHERE id_partido = $7`,
        [gl, gv, pl, pv, fecha, horario, id_partido],
      );

      if (p.fase === "eliminatoria") {
        if (siguiente) {
          const columna =
            p.orden % 2 === 0 ? "id_equipo_local" : "id_equipo_visitante";
          await db.query(
            `UPDATE partidos SET ${columna} = $1 WHERE id_partido = $2`,
            [ganadorId(nuevo), siguiente.id_partido],
          );
        } else {
          await db.query(
            "UPDATE torneos SET estado = 'finalizado' WHERE id_torneo = $1",
            [p.id_torneo],
          );
        }
      }
    });
    res.json({ mensaje: "Guardado" });
  } catch (error) {
    responderError(res, "cargarResultado", error);
  }
};

// ------------------------- Mercado Pago -------------------------

export const crearPreferenciaPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, color } = req.body;

    if (!esId(id)) return res.status(400).json({ mensaje: "Id inválido" });
    const nombreEquipo = String(nombre ?? "").trim();
    if (!nombreEquipo || nombreEquipo.length > 100) {
      return res
        .status(400)
        .json({
          mensaje: "Ingresá el nombre de tu equipo (máximo 100 caracteres)",
        });
    }

    const preferenciaData = await conTransaccion(async (db) => {
      const { rows } = await db.query(
        "SELECT * FROM torneos WHERE id_torneo = $1 FOR UPDATE",
        [id],
      );
      const t = rows[0];
      if (!t) throw new ErrorHttp(404, "Torneo no encontrado");
      if (t.estado !== "inscripcion") {
        throw new ErrorHttp(
          409,
          "Las inscripciones de este torneo están cerradas",
        );
      }
      if (t.fecha_evento && hoyArgentina() > t.fecha_evento) {
        throw new ErrorHttp(
          409,
          `Las inscripciones cerraron: el torneo era el ${formatearFecha(t.fecha_evento)}`,
        );
      }

      const propia = await db.query(
        "SELECT 1 FROM inscripciones WHERE id_torneo = $1 AND id_usuario = $2",
        [id, req.usuario.id_usuario],
      );
      if (propia.rowCount > 0)
        throw new ErrorHttp(409, "Ya inscribiste un equipo en este torneo");

      const limite = t.cupo_maximo ?? MAX_EQUIPOS;
      const { rows: cuenta } = await db.query(
        "SELECT COUNT(*) AS n FROM inscripciones WHERE id_torneo = $1",
        [id],
      );
      if (cuenta[0].n >= limite) {
        throw new ErrorHttp(
          409,
          `Cupos llenos: el torneo ya completó los ${limite} equipos`,
        );
      }

      const mismoNombre = await db.query(
        `SELECT 1 FROM inscripciones i JOIN equipos e ON e.id_equipo = i.id_equipo
         WHERE i.id_torneo = $1 AND lower(e.nombre) = lower($2)`,
        [id, nombreEquipo],
      );
      if (mismoNombre.rowCount > 0)
        throw new ErrorHttp(
          409,
          "Ya hay un equipo con ese nombre en el torneo",
        );

      const [colorOk, valColor] = leerColor(color);
      if (!colorOk)
        throw new ErrorHttp(400, "El color debe tener formato #RRGGBB");

      const eq = await db.query(
        "INSERT INTO equipos (id_empresa, nombre, color) VALUES ($1, $2, $3) RETURNING id_equipo, nombre",
        [t.id_empresa, nombreEquipo, valColor],
      );

      const precio = Number(t.precio_inscripcion ?? 0);
      await db.query(
        "INSERT INTO inscripciones (id_torneo, id_equipo, precio, id_usuario, estado_pago) VALUES ($1, $2, $3, $4, 'pendiente')",
        [id, eq.rows[0].id_equipo, precio, req.usuario.id_usuario],
      );

      if (precio === 0) {
        return { esGratis: true, id_equipo: eq.rows[0].id_equipo };
      }

      const preference = new Preference(client);
      const response = await preference.create({
        body: {
          items: [
            {
              id: `TORNEO-${t.id_torneo}`,
              title: `Inscripción: ${t.nombre} - Equipo ${nombreEquipo}`,
              quantity: 1,
              unit_price: precio,
              currency_id: "ARS",
            },
          ],
          external_reference: `${id}_${eq.rows[0].id_equipo}`,
          back_urls: {
            success: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mis-reservas?status=success`,
            failure: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mis-reservas?status=failure`,
            pending: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mis-reservas?status=pending`,
          },
          auto_return: "approved",
        },
      });

      return {
        init_point: response.init_point,
        preferenceId: response.id,
        esGratis: false,
      };
    });

    res.json(preferenciaData);
  } catch (error) {
    responderError(res, "crearPreferenciaPago", error);
  }
};

export const webhookMercadoPago = async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "payment" && data && data.id) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });

      if (paymentData.status === "approved" && paymentData.external_reference) {
        const [idTorneo, idEquipo] = paymentData.external_reference.split("_");
        if (idTorneo && idEquipo) {
          await pool.query(
            "UPDATE inscripciones SET estado_pago = 'pagado' WHERE id_torneo = $1 AND id_equipo = $2",
            [idTorneo, idEquipo],
          );
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en Webhook Mercado Pago:", error);
    res.sendStatus(500);
  }
};
