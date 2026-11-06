-- =============================================================================
-- MIGRACIÓN V8 — super administradores (el equipo que aprueba y gestiona los complejos).
-- Ejecutar UNA vez (Supabase: SQL Editor; Docker: ver README). No borra datos. Es seguro re-ejecutarlo.
-- El primer super admin se crea solo al iniciar el backend, con SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD del .env.
-- =============================================================================
CREATE TABLE IF NOT EXISTS superadmins (
    id_superadmin BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,          -- hash bcrypt
    fecha_creacion TIMESTAMP DEFAULT NOW()
);
