-- =============================================================================
-- MIGRACIÓN V5 — imagen de portada para eventos y torneos.
-- Ejecutar UNA vez en Supabase -> SQL Editor. No borra datos. Es seguro re-ejecutarlo.
-- La imagen se guarda como link (subida a Supabase Storage o pegada por el organizador).
-- =============================================================================
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE torneos ADD COLUMN IF NOT EXISTS imagen_url TEXT;
