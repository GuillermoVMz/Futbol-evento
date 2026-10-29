-- =============================================================================
-- MIGRACIÓN V2 — ejecutar UNA vez en Supabase -> SQL Editor.
-- No borra datos. Reemplaza a empresas_password.sql (incluye esa columna).
-- =============================================================================

-- 1) empresas: contraseña de acceso + datos del complejo (antes estaban fijos en el frontend)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS nombre_complejo VARCHAR(150);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);

UPDATE empresas SET nombre_complejo = 'Complejo Golazo', direccion = 'Bulevar España, Villa María, Córdoba'
 WHERE email = 'contacto@golazo.com' AND nombre_complejo IS NULL;
UPDATE empresas SET nombre_complejo = 'Área 51', direccion = 'Avenida Universidad, Villa María, Córdoba'
 WHERE email = 'administracion@area51futbol.com' AND nombre_complejo IS NULL;

-- 2) usuarios: la gente que reserva canchas (cuenta distinta a la del dueño del complejo)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- 3) horarios que cada dueño habilita para cada cancha (se repiten todos los días)
CREATE TABLE IF NOT EXISTS horarios_cancha (
    id_horario BIGSERIAL PRIMARY KEY,
    id_cancha BIGINT NOT NULL REFERENCES canchas(id_cancha) ON DELETE CASCADE,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT check_horario_cancha CHECK (hora_fin > hora_inicio),
    CONSTRAINT unique_horario_cancha UNIQUE (id_cancha, hora_inicio)
);

-- 4) eventos: quién lo creó (para que cada organizador gestione solo los suyos)
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS id_empresa BIGINT REFERENCES empresas(id_empresa) ON DELETE SET NULL;

-- 5) reservas: quién reservó (para "Mis Reservas") y evitar doble reserva del mismo turno
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS id_usuario BIGINT REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_reserva_turno
    ON reservas (id_cancha, fecha, horario_in) WHERE estado <> 'cancelada';

-- 6) gastos del complejo (para el balance del panel)
CREATE TABLE IF NOT EXISTS gastos (
    id_gasto BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL REFERENCES empresas(id_empresa) ON DELETE CASCADE,
    concepto VARCHAR(200) NOT NULL,
    monto INT NOT NULL CHECK (monto >= 0),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 7) horarios iniciales (16:00 a 23:00, turnos de 1 h) para las canchas que todavía no tienen ninguno.
--    Después cada dueño los edita desde el panel.
INSERT INTO horarios_cancha (id_cancha, hora_inicio, hora_fin)
SELECT c.id_cancha, make_time(h, 0, 0), make_time(h + 1, 0, 0)
FROM canchas c, generate_series(16, 22) AS h
WHERE NOT EXISTS (SELECT 1 FROM horarios_cancha hc WHERE hc.id_cancha = c.id_cancha);
