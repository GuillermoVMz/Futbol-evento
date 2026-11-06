-- =============================================================================
-- MIGRACIÓN V3 — aprobación de cuentas de dueños/organizadores.
-- Ejecutar UNA vez en Supabase -> SQL Editor (después de migracion_v2.sql).
-- Las empresas que YA existen quedan aprobadas; las nuevas arrancan pendientes.
-- Es seguro re-ejecutarlo: no vuelve a aprobar nada.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'aprobada'
  ) THEN
    ALTER TABLE empresas ADD COLUMN aprobada BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE empresas SET aprobada = TRUE;
  END IF;
END $$;
