# intermateria

Proyecto con dos apps independientes:

- `backend-empresa/` → API Node.js + Express + PostgreSQL (Supabase), puerto **3000**
- `front-empresa/` → React + Vite + Ant Design, puerto **5173**

## Puesta en marcha (cada integrante, en su PC)

Requisitos: Node.js 20 o superior.

### Terminal 1 – Backend
```bash
cd backend-empresa
npm install
cp .env.example .env      # Windows (cmd): copy .env.example .env
# Editar .env y completar DATABASE_URL y JWT_SECRET
npm run dev
```
Base de datos (una sola vez para todo el equipo; la base de Supabase es compartida):
- `database/database.sql` crea las tablas originales. **Contiene DROP TABLE: no volver a ejecutarlo** o se borran los datos.
- `database/migracion_v2.sql` agrega usuarios, horarios, gastos y las columnas nuevas. Ejecutarlo una vez en el SQL Editor de Supabase.
- `database/migracion_v3.sql` (aprobación de cuentas) y `database/migracion_v4.sql` (torneos: grupos, llaves y resultados) y `database/migracion_v5.sql` (imágenes de eventos y torneos). Ejecutarlos una vez cada uno, en orden.
- Las dos empresas de prueba no tienen contraseña. Para ingresar al panel:
  `npm run set-password -- contacto@golazo.com MiClave123`
  (o registrar un complejo nuevo en http://localhost:5173/admin/registro).

Cuentas:
- Jugadores: `/registro` y `/login`. Pueden reservar y ver "Mis Reservas".
- Dueños de complejos / organizadores: `/admin/registro` y `/admin/login`. Acceden al panel (reservas, canchas y horarios, eventos, gastos).
  Las cuentas nuevas quedan **pendientes**: ejecutar `database/migracion_v3.sql` una vez, y para habilitarlas
  `npm run aprobar` (lista pendientes) y `npm run aprobar -- correo@complejo.com` (aprueba).
  Opcional: definir `CODIGO_REGISTRO_EMPRESA` en el `.env` para exigir un código de invitación.

Verificar: http://localhost:3000/api/health → `{"ok":true,"db":"conectada"}`

### Terminal 2 – Frontend
```bash
cd front-empresa
npm install
npm run dev
```
Abrir: http://localhost:5173

## Torneos

- Público: `/torneos` (lista) y `/torneos/:id` (tablas de grupos y cuadro de llaves que avanza solo).
- Organizadores: pestaña **Torneos** del panel → crear torneo, inscribir equipos, sortear, cargar resultados y generar las llaves.
- Formatos: *Eliminación directa* o *Fase de grupos + llaves*. Si la cantidad de equipos no es 4/8/16, los mejores sembrados pasan directo la primera ronda.

## Imágenes de eventos y torneos

El organizador puede poner una imagen de portada (tarjeta del evento/torneo y fondo al abrir el torneo) de dos formas:
- **Pegando el link** de una imagen: no necesita configuración.
- **Subiéndola desde la computadora**: requiere en el `.env` del backend `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`
  (Supabase -> Project Settings -> API). La clave es secreta: nunca va en el frontend ni en Git.
  El bucket público `imagenes` se crea solo la primera vez que se sube una foto.
