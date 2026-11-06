-- =============================================================================
-- MIGRACIÓN V9 — precio de inscripción y fecha de cada torneo (los define el organizador).
-- Ejecutar UNA vez (Supabase: SQL Editor; Docker: ver README). No borra datos. Es seguro re-ejecutarlo.
-- Los torneos ya creados quedan con inscripción gratuita y sin fecha límite hasta que el organizador los complete.
-- =============================================================================

-- Lo que paga CADA equipo al inscribirse (en pesos enteros). Se copia a inscripciones.precio al inscribirse.
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS precio_inscripcion INT NOT NULL DEFAULT 0 CHECK (precio_inscripcion >= 0);

-- Día del torneo: las inscripciones se cierran solas después de esa fecha
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS fecha_evento DATE;
