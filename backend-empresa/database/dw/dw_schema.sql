-- =============================================================================
-- DATA WAREHOUSE · Fútbol Evento — PASOS 1 A 5: DISEÑO Y CREACIÓN DE LAS TABLAS
--
-- PASO 1 · PROCESO       Las RESERVAS de canchas (lo que genera la plata del negocio).
--          Preguntas:    ¿Cuántas reservas e ingresos tuvo cada complejo por mes?
--                        ¿Qué tipo de cancha recauda más?
--                        ¿Qué porcentaje de reservas se cancela?
--                        ¿En qué días y franjas horarias hay más demanda?
--
-- PASO 2 · GRANO         Una fila = una reserva de una cancha en un turno.
--
-- PASO 3 · DIMENSIONES   dim_fecha    ¿cuándo se juega?       (día del turno)
--                        dim_horario  ¿a qué hora?            (hora de inicio y franja)
--                        dim_empresa  ¿en qué complejo?
--                        dim_cancha   ¿en qué cancha?
--                        dim_usuario  ¿quién reservó?
--
-- PASO 4 · MEDIDAS       cantidad, horas, importe, importe_cobrado, cancelada
--
-- El Data Warehouse vive en el esquema "dw" de la MISMA base (única base de datos);
-- la base operativa queda en el esquema "public".
--
-- Es seguro ejecutarlo más de una vez (IF NOT EXISTS). Para empezar de cero:
--   DROP SCHEMA dw CASCADE;
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS dw;

-- Dimensión fecha: una fila por día (se genera, no sale de ninguna tabla)
CREATE TABLE IF NOT EXISTS dw.dim_fecha (
    sk_fecha         INT PRIMARY KEY,          -- 20261015
    fecha            DATE NOT NULL UNIQUE,
    anio             INT NOT NULL,
    trimestre        INT NOT NULL,
    mes              INT NOT NULL,
    nombre_mes       VARCHAR(15) NOT NULL,
    dia              INT NOT NULL,
    dia_semana       INT NOT NULL,             -- 1 = lunes … 7 = domingo (sirve para ordenar)
    nombre_dia       VARCHAR(15) NOT NULL,
    es_fin_de_semana BOOLEAN NOT NULL
);

-- Dimensión horario: una fila por hora del día (también se genera)
CREATE TABLE IF NOT EXISTS dw.dim_horario (
    sk_horario INT PRIMARY KEY,                -- hora de inicio del turno: 0 a 23
    hora       VARCHAR(5) NOT NULL,            -- '19:00'
    franja     VARCHAR(10) NOT NULL            -- Madrugada / Mañana / Tarde / Noche
);

CREATE TABLE IF NOT EXISTS dw.dim_empresa (
    sk_empresa SERIAL PRIMARY KEY,             -- clave sustituta (la genera el DW)
    id_empresa BIGINT NOT NULL UNIQUE,         -- id original en la base operativa
    complejo   VARCHAR(150) NOT NULL,
    direccion  VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS dw.dim_cancha (
    sk_cancha SERIAL PRIMARY KEY,
    id_cancha BIGINT NOT NULL UNIQUE,
    nombre    VARCHAR(100) NOT NULL,
    tipo      VARCHAR(30) NOT NULL,            -- Fútbol 5 / Fútbol 7 / Fútbol 11
    cubierta  VARCHAR(12) NOT NULL,            -- 'Techada' / 'Descubierta' (texto, no booleano)
    activa    BOOLEAN NOT NULL
);

-- Solo el nombre: NO se copian email, teléfono ni contraseña a un almacén de análisis.
CREATE TABLE IF NOT EXISTS dw.dim_usuario (
    sk_usuario SERIAL PRIMARY KEY,
    id_usuario BIGINT UNIQUE,                  -- NULL en el miembro "sin usuario"
    nombre     VARCHAR(150) NOT NULL
);

-- Miembro "desconocido": hay reservas sin usuario asociado (id_usuario NULL en la base
-- operativa, por ejemplo las cargadas a mano). Apuntan a esta fila en lugar de perderse.
INSERT INTO dw.dim_usuario (sk_usuario, id_usuario, nombre)
VALUES (0, NULL, 'Sin usuario registrado')
ON CONFLICT (sk_usuario) DO NOTHING;

-- Tabla de hechos: una fila por reserva
CREATE TABLE IF NOT EXISTS dw.hecho_reservas (
    id_reserva      BIGINT PRIMARY KEY,        -- id en la base operativa (evita duplicados)
    sk_fecha        INT NOT NULL REFERENCES dw.dim_fecha(sk_fecha),
    sk_horario      INT NOT NULL REFERENCES dw.dim_horario(sk_horario),
    sk_empresa      INT NOT NULL REFERENCES dw.dim_empresa(sk_empresa),
    sk_cancha       INT NOT NULL REFERENCES dw.dim_cancha(sk_cancha),
    sk_usuario      INT NOT NULL REFERENCES dw.dim_usuario(sk_usuario),
    estado          VARCHAR(50) NOT NULL,      -- confirmada / pagada / cancelada (dimensión degenerada)
    cantidad        INT NOT NULL DEFAULT 1,
    horas           NUMERIC(5,2) NOT NULL,     -- duración del turno
    importe         NUMERIC(12,2) NOT NULL DEFAULT 0,   -- precio de la reserva
    importe_cobrado NUMERIC(12,2) NOT NULL DEFAULT 0,   -- = importe si está pagada, 0 si no
    cancelada       INT NOT NULL DEFAULT 0     -- 1 si se canceló, 0 si no (para poder sumarla)
);
