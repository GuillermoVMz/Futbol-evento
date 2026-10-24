-- Crea el Data Warehouse y hace la primera carga. Se ejecuta desde la raíz del proyecto con:
--
--   docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/instalar_dw.sql
--
-- (La carpeta database/ ya está montada dentro del contenedor, por eso esa ruta.)
-- Requisito: la base operativa ya tiene que existir (database.sql, migracion_v2 y v3).
\set ON_ERROR_STOP on

\echo '>> Creando esquema dw y sus tablas...'
\ir dw_schema.sql

\echo '>> Cargando dimensiones y hechos...'
\ir dw_carga.sql

\echo '>> Listo. Probá las consultas de dw_consultas.sql'
