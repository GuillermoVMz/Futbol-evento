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
