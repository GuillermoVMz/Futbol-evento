-- =============================================================================
-- MIGRACIÓN V4 — torneos: fase de grupos, llaves y resultados.
-- Ejecutar UNA vez en Supabase -> SQL Editor (después de v2 y v3). No borra datos.
-- =============================================================================

-- Torneos: formato y estado
ALTER TABLE torneos
  ADD COLUMN IF NOT EXISTS formato VARCHAR(30) NOT NULL DEFAULT 'eliminacion',  -- 'eliminacion' | 'grupos'
  ADD COLUMN IF NOT EXISTS cantidad_grupos INT,
  ADD COLUMN IF NOT EXISTS clasifican_por_grupo INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'inscripcion';   -- 'inscripcion' | 'en_curso' | 'finalizado'

-- A qué grupo (A, B, C...) quedó cada equipo
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS grupo VARCHAR(5);

-- Un partido de llaves puede existir antes de saber quiénes lo juegan, y sin fecha/hora todavía
ALTER TABLE partidos ALTER COLUMN id_equipo_local DROP NOT NULL;
ALTER TABLE partidos ALTER COLUMN id_equipo_visitante DROP NOT NULL;
ALTER TABLE partidos ALTER COLUMN fecha DROP NOT NULL;
ALTER TABLE partidos ALTER COLUMN horario DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partidos' AND column_name = 'jugado'
  ) THEN
    ALTER TABLE partidos
      ADD COLUMN fase VARCHAR(20) NOT NULL DEFAULT 'eliminatoria',  -- 'grupos' | 'eliminatoria'
      ADD COLUMN grupo VARCHAR(5),
      ADD COLUMN ronda INT NOT NULL DEFAULT 1,                      -- jornada (grupos) o ronda de llaves
      ADD COLUMN orden INT NOT NULL DEFAULT 0,                      -- posición dentro de la ronda
      ADD COLUMN penales_local INT,
      ADD COLUMN penales_visitante INT,
      ADD COLUMN jugado BOOLEAN NOT NULL DEFAULT FALSE;

    -- Los partidos que ya existían tienen el resultado cargado
    UPDATE partidos SET jugado = TRUE;
    UPDATE torneos SET estado = 'en_curso' WHERE id_torneo IN (SELECT id_torneo FROM partidos);
  END IF;
END $$;
