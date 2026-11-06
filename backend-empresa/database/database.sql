-- =============================================================================
-- 1. DROP TABLES (orden inverso a las dependencias de clave foránea)
-- =============================================================================
DROP TABLE IF EXISTS partidos CASCADE;
DROP TABLE IF EXISTS inscripciones CASCADE;
DROP TABLE IF EXISTS jugadores CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS torneos CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS canchas CASCADE;
DROP TABLE IF EXISTS dias CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

-- =============================================================================
-- 2. CREATE TABLES
-- =============================================================================

CREATE TABLE empresas (
    id_empresa BIGSERIAL PRIMARY KEY,
    socios VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE dias (
    id_dias BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    precios INT NOT NULL CHECK (precios >= 0),
    horarios TIME NOT NULL,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

CREATE TABLE canchas (
    id_cancha BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    precio_hora NUMERIC(10,2) NOT NULL,
    techada BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

CREATE TABLE reservas (
    id_reserva BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    id_cancha BIGINT NOT NULL,
    fecha DATE NOT NULL,
    horario_in TIME NOT NULL,
    horario_fin TIME NOT NULL,
    nombre_cliente VARCHAR(150) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'confirmada',
    precio INT NOT NULL CHECK (precio >= 0),
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
    FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha) ON DELETE CASCADE,
    CONSTRAINT check_horarios CHECK (horario_fin > horario_in)
);

CREATE TABLE torneos (
    id_torneo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

CREATE TABLE equipos (
    id_equipo BIGSERIAL PRIMARY KEY,
    id_empresa BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE CASCADE
);

CREATE TABLE jugadores (
    id_jugador BIGSERIAL PRIMARY KEY,
    id_equipo BIGINT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    numero INT CHECK (numero > 0),
    posicion VARCHAR(50),
    FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo) ON DELETE CASCADE
);

CREATE TABLE inscripciones (
    id_insc BIGSERIAL PRIMARY KEY,
    id_torneo BIGINT NOT NULL,
    id_equipo BIGINT NOT NULL,
    precio INT NOT NULL CHECK (precio >= 0),
    fecha_insc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_pago VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo) ON DELETE CASCADE,
    CONSTRAINT unique_equipo_torneo UNIQUE (id_torneo, id_equipo)
);

CREATE TABLE partidos (
    id_partido BIGSERIAL PRIMARY KEY,
    id_torneo BIGINT NOT NULL,
    id_equipo_local BIGINT NOT NULL,
    id_equipo_visitante BIGINT NOT NULL,
    fecha DATE NOT NULL,
    horario TIME NOT NULL,
    goles_local INT DEFAULT 0 CHECK (goles_local >= 0),
    goles_visitante INT DEFAULT 0 CHECK (goles_visitante >= 0),
    FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo_local) REFERENCES equipos(id_equipo) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo_visitante) REFERENCES equipos(id_equipo) ON DELETE CASCADE,
    CONSTRAINT check_distintos_equipos CHECK (id_equipo_local <> id_equipo_visitante)
);

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    lugar VARCHAR(100) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    modalidad VARCHAR(10) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Inscripciones Abiertas'
);

-- =============================================================================
-- 3. INSERT DATOS DE PRUEBA
-- =============================================================================

INSERT INTO empresas (socios, email) VALUES
('Juan Pérez, Carlos Gómez', 'contacto@golazo.com'),
('María Rodríguez', 'administracion@area51futbol.com');

INSERT INTO dias (id_empresa, precios, horarios) VALUES
(1, 15000, '18:00:00'),
(2, 18000, '20:00:00');

INSERT INTO canchas (id_empresa, nombre, tipo, precio_hora, techada) VALUES
(1, 'Cancha 1', 'Fútbol 5', 15000, TRUE),
(1, 'Cancha 2', 'Fútbol 7', 22000, FALSE),
(2, 'Cancha 3', 'Fútbol 11', 40000, FALSE);

INSERT INTO reservas (id_empresa, id_cancha, fecha, horario_in, horario_fin, nombre_cliente, telefono, estado, precio) VALUES
(1, 1, '2026-10-10', '19:00:00', '20:00:00', 'Lucas Martínez', '3534112233', 'confirmada', 15000),
(2, 3, '2026-10-11', '21:00:00', '22:00:00', 'Gonzalo Fernández', '3534998877', 'confirmada', 40000);

INSERT INTO torneos (id_empresa, nombre) VALUES
(1, 'Torneo Clausura F5'),
(2, 'Supercopa Nocturna F11');

INSERT INTO equipos (id_empresa, nombre) VALUES
(1, 'Los Mismos de Siempre'),
(1, 'La Scaloneta F5'),
(2, 'Deportivo Área 51'),
(2, 'Galácticos FC');

INSERT INTO jugadores (id_equipo, nombre, numero, posicion) VALUES
(1, 'Mateo Castiglioni', 10, 'Delantero'),
(1, 'Guillermo Zarate', 1, 'Arquero'),
(3, 'Thiago Joaquin Arias', 5, 'Mediocampista');

INSERT INTO inscripciones (id_torneo, id_equipo, precio, estado_pago) VALUES
(1, 1, 50000, 'pagado'),
(1, 2, 50000, 'pendiente'),
(2, 3, 75000, 'pagado');

INSERT INTO partidos (id_torneo, id_equipo_local, id_equipo_visitante, fecha, horario, goles_local, goles_visitante) VALUES
(1, 1, 2, '2026-10-15', '21:00:00', 3, 2);

INSERT INTO eventos (titulo, lugar, fecha, modalidad, estado) VALUES
('Torneo Relámpago', 'Complejo Norte, Villa María', '2026-10-15 20:00:00', 'F5', 'Inscripciones Abiertas'),
('Amistoso Libre', 'Canchas del Centro', '2026-10-18 21:00:00', 'F7', 'Cupos Llenos');