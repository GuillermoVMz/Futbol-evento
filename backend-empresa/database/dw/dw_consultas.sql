-- =============================================================================
-- DATA WAREHOUSE · Fútbol Evento — PASO 7: VERIFICAR Y CONSULTAR
--
-- Todas las consultas tienen la misma forma: la tabla de hechos + un JOIN con la
-- dimensión por la que se agrupa + una suma sobre una medida.
--   La MEDIDA es lo que se suma o se cuenta.
--   Las DIMENSIONES son las palabras que vienen después de "por".
--
-- Se ejecuta con:
--   docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/dw_consultas.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CONTROL DE LA CARGA: los totales del DW tienen que coincidir con la base operativa.
-- Si no coinciden, hay un error en la carga y hay que encontrarlo antes de hacer reportes.
-- ---------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM public.reservas)        AS reservas_en_origen,
    (SELECT COUNT(*) FROM dw.hecho_reservas)      AS reservas_en_warehouse;

SELECT
    (SELECT COALESCE(SUM(precio), 0) FROM public.reservas WHERE estado = 'pagada') AS cobrado_en_origen,
    (SELECT COALESCE(SUM(importe_cobrado), 0) FROM dw.hecho_reservas)              AS cobrado_en_warehouse;


-- ---------------------------------------------------------------------------
-- 1) ¿Cuántas reservas e ingresos tuvo cada complejo por mes?
--    medidas: cantidad, cancelada, importe_cobrado, importe   |   por: empresa, mes
-- ---------------------------------------------------------------------------
SELECT e.complejo,
       f.anio,
       f.nombre_mes                                   AS mes,
       SUM(h.cantidad - h.cancelada)                  AS reservas,
       SUM(h.cancelada)                               AS canceladas,
       SUM(h.importe_cobrado)                         AS ingresos_cobrados,
       SUM(h.importe - h.importe_cobrado)
           FILTER (WHERE h.cancelada = 0)             AS por_cobrar
FROM dw.hecho_reservas h
INNER JOIN dw.dim_empresa e ON e.sk_empresa = h.sk_empresa
INNER JOIN dw.dim_fecha   f ON f.sk_fecha   = h.sk_fecha
GROUP BY e.complejo, f.anio, f.mes, f.nombre_mes
ORDER BY e.complejo, f.anio, f.mes;


-- ---------------------------------------------------------------------------
-- 2) ¿Qué tipo de cancha recauda más?
--    medidas: importe_cobrado, horas   |   por: tipo de cancha
-- ---------------------------------------------------------------------------
SELECT c.tipo,
       SUM(h.cantidad - h.cancelada)                  AS reservas,
       SUM(h.horas) FILTER (WHERE h.cancelada = 0)    AS horas_reservadas,
       SUM(h.importe_cobrado)                         AS ingresos_cobrados
FROM dw.hecho_reservas h
INNER JOIN dw.dim_cancha c ON c.sk_cancha = h.sk_cancha
GROUP BY c.tipo
ORDER BY ingresos_cobrados DESC;


-- ---------------------------------------------------------------------------
-- 3) ¿Qué porcentaje de las reservas se cancela en cada complejo?
--    medida: cancelada (1/0)   |   por: empresa
-- ---------------------------------------------------------------------------
SELECT e.complejo,
       COUNT(*)                                       AS reservas_totales,
       SUM(h.cancelada)                               AS canceladas,
       ROUND(100.0 * SUM(h.cancelada) / COUNT(*), 1)  AS porcentaje_cancelacion
FROM dw.hecho_reservas h
INNER JOIN dw.dim_empresa e ON e.sk_empresa = h.sk_empresa
GROUP BY e.complejo
ORDER BY porcentaje_cancelacion DESC;


-- ---------------------------------------------------------------------------
-- 4) ¿En qué franja horaria hay más demanda?
--    medida: cantidad   |   por: franja
-- ---------------------------------------------------------------------------
SELECT hr.franja,
       SUM(h.cantidad - h.cancelada)                  AS reservas
FROM dw.hecho_reservas h
INNER JOIN dw.dim_horario hr ON hr.sk_horario = h.sk_horario
GROUP BY hr.franja
ORDER BY MIN(hr.sk_horario);


-- ---------------------------------------------------------------------------
-- 5) ¿Qué día de la semana se reserva más? ¿Y en qué franja?
--    medida: cantidad   |   por: día de la semana, franja
-- ---------------------------------------------------------------------------
SELECT f.nombre_dia                                   AS dia,
       hr.franja,
       SUM(h.cantidad - h.cancelada)                  AS reservas
FROM dw.hecho_reservas h
INNER JOIN dw.dim_fecha   f  ON f.sk_fecha    = h.sk_fecha
INNER JOIN dw.dim_horario hr ON hr.sk_horario = h.sk_horario
GROUP BY f.dia_semana, f.nombre_dia, hr.franja
ORDER BY f.dia_semana, MIN(hr.sk_horario);


-- ---------------------------------------------------------------------------
-- 6) ¿Se prefieren las canchas techadas o las descubiertas?
--    medidas: cantidad, importe_cobrado   |   por: cubierta
-- ---------------------------------------------------------------------------
SELECT c.cubierta,
       SUM(h.cantidad - h.cancelada)                  AS reservas,
       SUM(h.importe_cobrado)                         AS ingresos_cobrados
FROM dw.hecho_reservas h
INNER JOIN dw.dim_cancha c ON c.sk_cancha = h.sk_cancha
GROUP BY c.cubierta
ORDER BY reservas DESC;


-- ---------------------------------------------------------------------------
-- 7) ¿Qué usuarios reservan más?  (el miembro 0 son reservas sin usuario asociado)
--    medidas: cantidad, importe_cobrado   |   por: usuario
-- ---------------------------------------------------------------------------
SELECT u.nombre,
       SUM(h.cantidad - h.cancelada)                  AS reservas,
       SUM(h.importe_cobrado)                         AS gastado
FROM dw.hecho_reservas h
INNER JOIN dw.dim_usuario u ON u.sk_usuario = h.sk_usuario
WHERE u.sk_usuario <> 0
GROUP BY u.nombre
ORDER BY reservas DESC, gastado DESC
LIMIT 5;
