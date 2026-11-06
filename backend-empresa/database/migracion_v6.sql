-- =============================================================================
-- MIGRACIÓN V6 — cupo máximo de equipos e inscripción de equipos por parte de los jugadores.
-- Ejecutar UNA vez en Supabase -> SQL Editor (después de v2..v5). No borra datos. Es seguro re-ejecutarlo.
-- =============================================================================

-- Cupo máximo de equipos que define el organizador (NULL = sin límite: los torneos ya creados quedan así)
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS cupo_maximo INT;

-- Qué jugador inscribió cada equipo (para mostrar el contacto al organizador y evitar inscripciones duplicadas)
ALTER TABLE inscripciones
  ADD COLUMN IF NOT EXISTS id_usuario BIGINT REFERENCES usuarios(id_usuario) ON DELETE SET NULL;

-- Cada jugador puede inscribir un solo equipo por torneo
CREATE UNIQUE INDEX IF NOT EXISTS ux_inscripcion_usuario
    ON inscripciones (id_torneo, id_usuario) WHERE id_usuario IS NOT NULL;
