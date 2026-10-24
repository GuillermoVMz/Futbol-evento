-- =============================================================================
-- DATA WAREHOUSE · Fútbol Evento — PASOS 6 Y 8: CARGA (ETL) Y MANTENIMIENTO
--
--   EXTRAER     SELECT sobre las tablas de public (la base operativa)
--   TRANSFORMAR en el mismo SELECT: ids → claves sustitutas, NULL → 0, estado → 1/0 …
--   CARGAR      INSERT en las tablas de dw
--
-- Orden obligatorio: primero las dimensiones, después los hechos.
-- ON CONFLICT permite ejecutarlo todas las veces que haga falta sin duplicar filas:
-- inserta lo nuevo y actualiza lo que cambió (por ejemplo, una reserva que pasó de
-- "confirmada" a "pagada").
--
-- Para refrescar el Data Warehouse en cualquier momento:   CALL dw.cargar();
-- =============================================================================

CREATE OR REPLACE PROCEDURE dw.cargar()
LANGUAGE plpgsql
AS $$
DECLARE
    total BIGINT;
BEGIN
    -- ---------------------------------------------------------------------
    -- 1) DIMENSIONES GENERADAS (no salen de ninguna tabla)
    -- ---------------------------------------------------------------------

    -- Un día por fila. El rango mínimo es 2025-2028 y se amplía solo si hay reservas
    -- fuera de él (si faltara un día, la carga de hechos fallaría por la clave foránea).
    INSERT INTO dw.dim_fecha
        (sk_fecha, fecha, anio, trimestre, mes, nombre_mes, dia, dia_semana, nombre_dia, es_fin_de_semana)
    SELECT
        TO_CHAR(d, 'YYYYMMDD')::INT,
        d::DATE,
        EXTRACT(YEAR FROM d)::INT,
        EXTRACT(QUARTER FROM d)::INT,
        EXTRACT(MONTH FROM d)::INT,
        (ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
               'Agosto','Septiembre','Octubre','Noviembre','Diciembre']
        )[EXTRACT(MONTH FROM d)::INT],
        EXTRACT(DAY FROM d)::INT,
        EXTRACT(ISODOW FROM d)::INT,
        (ARRAY['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
        )[EXTRACT(ISODOW FROM d)::INT],
        EXTRACT(ISODOW FROM d) IN (6, 7)
    FROM generate_series(
        LEAST('2025-01-01'::DATE, (SELECT MIN(fecha) FROM public.reservas))::TIMESTAMP,
        GREATEST('2028-12-31'::DATE, (SELECT MAX(fecha) FROM public.reservas))::TIMESTAMP,
        INTERVAL '1 day'
    ) AS d
    ON CONFLICT (sk_fecha) DO NOTHING;

    -- Una hora por fila, con su franja
    INSERT INTO dw.dim_horario (sk_horario, hora, franja)
    SELECT h,
           LPAD(h::TEXT, 2, '0') || ':00',
           CASE WHEN h < 6  THEN 'Madrugada'
                WHEN h < 12 THEN 'Mañana'
                WHEN h < 18 THEN 'Tarde'
                ELSE 'Noche' END
    FROM generate_series(0, 23) AS h
    ON CONFLICT (sk_horario) DO NOTHING;

    -- ---------------------------------------------------------------------
    -- 2) DIMENSIONES COPIADAS DE LA BASE OPERATIVA
    -- ---------------------------------------------------------------------

    INSERT INTO dw.dim_empresa (id_empresa, complejo, direccion)
    SELECT id_empresa, COALESCE(nombre_complejo, socios), direccion
    FROM public.empresas
    ON CONFLICT (id_empresa) DO UPDATE
    SET complejo  = EXCLUDED.complejo,
        direccion = EXCLUDED.direccion;

    INSERT INTO dw.dim_cancha (id_cancha, nombre, tipo, cubierta, activa)
    SELECT id_cancha,
           nombre,
           tipo,
           CASE WHEN techada THEN 'Techada' ELSE 'Descubierta' END,
           COALESCE(activo, TRUE)
    FROM public.canchas
    ON CONFLICT (id_cancha) DO UPDATE
    SET nombre   = EXCLUDED.nombre,
        tipo     = EXCLUDED.tipo,
        cubierta = EXCLUDED.cubierta,
        activa   = EXCLUDED.activa;

    INSERT INTO dw.dim_usuario (id_usuario, nombre)
    SELECT id_usuario, nombre
    FROM public.usuarios
    ON CONFLICT (id_usuario) DO UPDATE
    SET nombre = EXCLUDED.nombre;

    -- ---------------------------------------------------------------------
    -- 3) HECHOS (al final: necesitan que las dimensiones ya existan)
    --    Cada JOIN cambia el id de la base operativa por la clave sustituta del DW.
    -- ---------------------------------------------------------------------
    INSERT INTO dw.hecho_reservas
        (id_reserva, sk_fecha, sk_horario, sk_empresa, sk_cancha, sk_usuario,
         estado, cantidad, horas, importe, importe_cobrado, cancelada)
    SELECT
        r.id_reserva,
        TO_CHAR(r.fecha, 'YYYYMMDD')::INT,                          -- fecha → clave numérica
        EXTRACT(HOUR FROM r.horario_in)::INT,                       -- 19:00 → 19
        de.sk_empresa,
        dc.sk_cancha,
        COALESCE(du.sk_usuario, 0),                                 -- sin usuario → miembro 0
        r.estado,
        1,
        ROUND((EXTRACT(EPOCH FROM (r.horario_fin - r.horario_in)) / 3600.0)::NUMERIC, 2),
        r.precio,
        CASE WHEN r.estado = 'pagada'    THEN r.precio ELSE 0 END,  -- solo lo efectivamente cobrado
        CASE WHEN r.estado = 'cancelada' THEN 1 ELSE 0 END          -- booleano → número sumable
    FROM public.reservas r
    INNER JOIN dw.dim_empresa de ON de.id_empresa = r.id_empresa
    INNER JOIN dw.dim_cancha  dc ON dc.id_cancha  = r.id_cancha
    LEFT  JOIN dw.dim_usuario du ON du.id_usuario = r.id_usuario    -- LEFT: id_usuario puede ser NULL
    ON CONFLICT (id_reserva) DO UPDATE
    SET estado          = EXCLUDED.estado,
        importe         = EXCLUDED.importe,
        importe_cobrado = EXCLUDED.importe_cobrado,
        cancelada       = EXCLUDED.cancelada;

    SELECT COUNT(*) INTO total FROM dw.hecho_reservas;
    RAISE NOTICE 'Carga del data warehouse finalizada: % reservas en dw.hecho_reservas', total;
END;
$$;

CALL dw.cargar();
