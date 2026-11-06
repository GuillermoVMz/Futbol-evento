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
- `database/migracion_v3.sql` (aprobación de cuentas) y `database/migracion_v4.sql` (torneos: grupos, llaves y resultados) `database/migracion_v5.sql` (imágenes de eventos y torneos) `database/migracion_v6.sql` (cupo e inscripción de equipos) `database/migracion_v7.sql` (color de cada equipo) `database/migracion_v8.sql` (super admins) y `database/migracion_v9.sql` (precio y fecha de los torneos). Ejecutarlos una vez cada uno, en orden.
- Las dos empresas de prueba no tienen contraseña: se la pone un super admin desde el panel (ver más abajo).

Cuentas:
- Jugadores: `/registro` y `/login`. Pueden reservar y ver "Mis Reservas".
- Dueños de complejos / organizadores: `/admin/registro` y `/admin/login`. Acceden al panel (reservas, canchas y horarios, eventos, gastos).
  Las cuentas nuevas quedan **pendientes** hasta que un super admin las aprueba desde el panel (ver más abajo).
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

## Inscripción de equipos a torneos

- El organizador define el **cupo máximo** al crear el torneo (y puede cambiarlo mientras no se sortee).
- Los jugadores (cuenta de jugador) inscriben su equipo desde la página del torneo. Un equipo por jugador por torneo.
- Al llegar al cupo, las inscripciones se **cierran solas** (figura "Cupos llenos"); si alguien se da de baja o el organizador quita un equipo o amplía el cupo, se reabren.
- El organizador ve en *Gestionar* quién inscribió cada equipo, con su teléfono y email, y hace el sorteo cuando quiera.

## Probar en el celular

La app es responsive (en pantallas chicas el menú pasa a un botón con panel lateral y las canchas se muestran como tarjetas).

- **Rápido, desde la PC:** en Chrome, `F12` y luego `Ctrl+Shift+M` (vista de dispositivo móvil).
- **Con un celular real** (PC y celular en la misma red Wi-Fi):
  1. En `front-empresa`: `npm run dev:celular`.
  2. Buscá la IP de la PC (`ipconfig` en Windows, por ejemplo `192.168.1.20`) y abrí `http://192.168.1.20:5173` en el celular.
  3. El frontend usa solo esa misma IP para hablar con el backend (puerto 3000). Si Windows pregunta por el firewall, permití el acceso a Node.js en redes privadas.

## Llaves y clasificados

- El cuadro de llaves es simétrico (primeras rondas en los costados, la final en el centro). Cada equipo se pinta con su color y se muestra solo el resultado final del cruce (con los penales entre paréntesis si los hubo).
- El color lo elige quien inscribe el equipo; si no elige, se asigna uno fijo según el nombre.
- Con fase de grupos, arriba del cuadro hay una tabla de **clasificados por grupo** (provisoria hasta que terminan los partidos del grupo).

## Con Docker

La infraestructura (`docker-compose.yml`) levanta: un balanceador Nginx (puerto 80), 2 réplicas del frontend,
3 réplicas del backend y un PostgreSQL propio. Se entra por **http://localhost**.

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f balanceador     # muestra qué nodo atendió cada pedido
```

- **Base de datos:** la primera vez que se crea el volumen, PostgreSQL ejecuta solos todos los `.sql` de
  `backend-empresa/database/` en orden (`database.sql` y después `migracion_v2` ... `v7`).
- **Si el volumen ya existía** (la base se creó antes de que existieran las migraciones nuevas), hay que correrlas a mano.
  Ejemplo para la v6 y la v7:
  ```bash
  docker compose exec -T db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migracion_v6.sql
  docker compose exec -T db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migracion_v7.sql
  ```
  O empezar de cero (borra los datos): `docker compose down -v` y luego `docker compose up -d --build`.
- **Super admin:** definir `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` en el `.env` de la raíz y reiniciar los backends;
  con eso se entra a http://localhost/super/login. Si el volumen ya existía, correr antes la migración v8 (igual que la v6 y v7).
- **Variables:** copiar `.env.example` como `.env` en la raíz para cambiar contraseñas y activar la subida de imágenes.

## Super admins (el equipo)

Panel para aprobar y gestionar los complejos sin usar comandos. No tiene link público: se entra por `/super/login`.

1. Ejecutar `database/migracion_v8.sql`.
2. Definir `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` (8 caracteres o más) en el `.env` del backend (o de la raíz con Docker) y
   reiniciar. El primer super admin se crea solo si no existe y nunca se pisa su contraseña.
3. Entrar a `/super/login`. Desde ahí:
   - **Complejos:** ver las solicitudes pendientes y **aprobarlas**, **suspender** una cuenta (deja de poder ingresar al instante y
     sus canchas, torneos y eventos dejan de verse), **ponerle o cambiarle la contraseña**, **dar de alta** un complejo ya aprobado y
     **eliminar** una cuenta pendiente que no tenga nada cargado.
   - **Super admins:** sumar a otras personas del equipo, eliminarlas y cambiar la propia contraseña.
- Los inicios de sesión se bloquean 15 minutos tras 8 intentos fallidos desde la misma IP con el mismo email.
- Los comandos `npm run aprobar` y `npm run set-password` siguen existiendo, pero ya no hacen falta.

## Precio, fecha y cobro de la inscripción a torneos

- Al crear un torneo, el organizador define el **precio por equipo** y la **fecha del torneo** (también el cupo). Se pueden cambiar en
  *Gestionar* mientras el torneo no se haya sorteado.
- El jugador **no elige el precio**: siempre paga el que fijó el organizador (el servidor lo toma del torneo, se mande lo que se mande).
- La fecha de inscripción es automática. Las inscripciones se cierran solas al **llenarse el cupo** o al **pasar el día del torneo**.
- Cada inscripción queda **pendiente de pago**. Solo el organizador puede marcarla como **pagada** (en *Gestionar*, con el resumen de lo
  cobrado). Un equipo ya pago no puede darse de baja solo: lo coordina el organizador.
- Los **eventos** (pestaña Eventos del panel) son solo avisos, sin inscripción. Para un torneo con inscripción se usa la pestaña **Torneos**.

