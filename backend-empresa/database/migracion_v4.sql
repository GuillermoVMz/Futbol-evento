-- =============================================================================
-- MIGRACIÓN V4 — Medios de pago e imágenes de los torneos
-- No borra datos y se puede ejecutar más de una vez.
--
--  · Base nueva (Docker): se ejecuta sola al crear el volumen, después de
--    database.sql, migracion_v2.sql y migracion_v3.sql.
--  · Base que ya existe (Docker):
--      docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migracion_v4.sql
--  · Supabase: pegarla en el SQL Editor.
-- =============================================================================

-- 1) Datos para cobrar por transferencia: los carga cada complejo / organizador desde su panel
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS alias_pago   VARCHAR(30);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS titular_pago VARCHAR(100);

-- 2) Cómo paga cada reserva (las que ya existían quedan como efectivo)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS medio_pago VARCHAR(20) NOT NULL DEFAULT 'efectivo'
    CHECK (medio_pago IN ('efectivo', 'transferencia'));

-- 3) Imagen ilustrativa de cada torneo.
--    Se guarda en la base (y no en el disco del contenedor) para que la vean las 3 réplicas
--    del backend. Va en tabla aparte para que los listados de eventos no arrastren la imagen.
CREATE TABLE IF NOT EXISTS evento_imagenes (
    id_evento INT PRIMARY KEY REFERENCES eventos(id) ON DELETE CASCADE,
    tipo      VARCHAR(30) NOT NULL,           -- image/jpeg, image/png o image/webp
    datos     BYTEA NOT NULL,
    version   INT NOT NULL DEFAULT 1          -- sube con cada cambio: sirve para refrescar la caché
);
