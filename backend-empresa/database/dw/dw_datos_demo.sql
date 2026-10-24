-- =============================================================================
-- DATOS DE DEMOSTRACIÓN (OPCIONAL) — solo para probar el Data Warehouse
--
-- La base de ejemplo tiene apenas 2 reservas, y con eso los reportes no dicen nada.
-- Este script agrega 8 usuarios ficticios (@demo.local, sin acceso: no pueden iniciar
-- sesión) y reservas repartidas entre hoy-120 días y hoy+14 días:
--   · fines de semana con más demanda que entre semana
--   · ~15 % canceladas; las pasadas quedan pagadas; las futuras, confirmadas
-- No toca las reservas existentes. Es repetible: el índice único de turnos evita
-- reservas duplicadas (ON CONFLICT DO NOTHING).
--
-- Se ejecuta con:
--   docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/dw_datos_demo.sql
-- y después se refresca el DW:
--   docker compose exec db psql -U postgres -d postgres -c "CALL dw.cargar();"
--
-- NO ejecutar contra una base con datos reales.
-- =============================================================================
\set ON_ERROR_STOP on

SELECT setseed(0.42);   -- mismos números "aleatorios" en cada ejecución

INSERT INTO usuarios (nombre, email, telefono, password)
SELECT n, lower(replace(n, ' ', '.')) || '@demo.local', '3534000000', 'sin-acceso'
FROM unnest(ARRAY['Lucas Martínez', 'Sofía Romero', 'Mateo Gómez', 'Valentina Díaz',
                  'Thiago Pérez', 'Camila Torres', 'Joaquín Ruiz', 'Martina Sosa']) AS n
ON CONFLICT (email) DO NOTHING;

-- Todos los turnos posibles (cancha × horario habilitado × día), cada uno con sus
-- números al azar, que se calculan UNA vez por fila al crear la tabla temporal.
CREATE TEMP TABLE _turnos_demo AS
SELECT c.id_empresa,
       c.id_cancha,
       ROUND(c.precio_hora)::INT AS precio,
       hc.hora_inicio,
       hc.hora_fin,
       d::DATE                   AS fecha,
       random()                  AS r_ocupado,
       random()                  AS r_estado,
       random()                  AS r_usuario
FROM canchas c
INNER JOIN horarios_cancha hc ON hc.id_cancha = c.id_cancha
CROSS JOIN generate_series((CURRENT_DATE - 120)::TIMESTAMP,
                           (CURRENT_DATE + 14)::TIMESTAMP,
                           INTERVAL '1 day') AS d
WHERE COALESCE(c.activo, TRUE);

WITH u AS (
    SELECT array_agg(id_usuario ORDER BY id_usuario) AS ids,
           array_agg(nombre     ORDER BY id_usuario) AS nombres
    FROM usuarios
    WHERE email LIKE '%@demo.local'
)
INSERT INTO reservas
    (id_empresa, id_cancha, id_usuario, fecha, horario_in, horario_fin,
     nombre_cliente, telefono, estado, precio)
SELECT t.id_empresa,
       t.id_cancha,
       u.ids[x.i],
       t.fecha,
       t.hora_inicio,
       t.hora_fin,
       u.nombres[x.i],
       '3534000000',
       CASE WHEN t.r_estado < 0.15                          THEN 'cancelada'
            WHEN t.fecha < CURRENT_DATE AND t.r_estado < 0.92 THEN 'pagada'
            ELSE 'confirmada' END,
       t.precio
FROM _turnos_demo t
CROSS JOIN u
CROSS JOIN LATERAL (SELECT 1 + floor(t.r_usuario * cardinality(u.ids))::INT AS i) x
WHERE t.r_ocupado < CASE WHEN EXTRACT(ISODOW FROM t.fecha) IN (5, 6, 7) THEN 0.60 ELSE 0.30 END
ON CONFLICT DO NOTHING;

SELECT COUNT(*) AS reservas_totales_en_la_base FROM reservas;

-- ---------------------------------------------------------------------------
-- Para borrar los datos de demostración de la base operativa:
--   DELETE FROM reservas WHERE id_usuario IN (SELECT id_usuario FROM usuarios WHERE email LIKE '%@demo.local');
--   DELETE FROM usuarios WHERE email LIKE '%@demo.local';
-- Y como el DW no se edita a mano, se rearma entero:
--   DROP SCHEMA dw CASCADE;   y volver a ejecutar instalar_dw.sql
-- ---------------------------------------------------------------------------
