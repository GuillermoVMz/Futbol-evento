-- =============================================================================
-- MIGRACIÓN V7 — color de cada equipo (se usa en las llaves y las tablas del torneo).
-- Ejecutar UNA vez en Supabase -> SQL Editor. No borra datos. Es seguro re-ejecutarlo.
-- Los equipos sin color (NULL) reciben automáticamente un color según su nombre.
-- =============================================================================
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS color VARCHAR(7);   -- formato #RRGGBB
