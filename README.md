# intermateria

Proyecto con dos apps independientes:

- `backend-empresa/` → API Node.js + Express + PostgreSQL (Supabase), puerto **3000**
- `front-empresa/` → React + Vite + Ant Design, puerto **5173**

## Con Docker (arquitectura con balanceador de carga)

Un solo comando levanta todo: balanceador Nginx, 2 réplicas del frontend, 3 réplicas del backend y **una única** base PostgreSQL.

```
                         ┌──► frontend1 ┐
                         └──► frontend2 ┘  React (estáticos)
Navegador ──► :80 ──► BALANCEADOR (Nginx)
                         ┌──► backend1 ┐
                         ├──► backend2 ├─  API Node/Express ──► db (PostgreSQL, única)
                         └──► backend3 ┘
```

| Archivo | Qué hace |
|---|---|
| `docker-compose.yml` | Define los 7 contenedores, las 2 redes (`red_web`, `red_datos`) y el volumen de la base |
| `balanceador/nginx.conf` | Nginx balanceador: reparte `/api/*` entre los backends y `/` entre los frontends (round robin) |
| `front-empresa/nginx.conf` | Configuración de cada nodo de frontend (solo sirve estáticos) |

```bash
docker compose up -d --build      # primera vez: tarda unos minutos
docker compose ps                 # los 7 servicios deben figurar "healthy"
```
Abrir **http://localhost**. La primera vez que se crea el volumen, Postgres ejecuta solo `database.sql`, `migracion_v2.sql` y `migracion_v3.sql` (no hay que correr nada a mano).

Las dos empresas de prueba no tienen contraseña; para ingresar al panel:
```bash
docker compose exec backend1 npm run set-password -- contacto@golazo.com MiClave123
docker compose exec backend1 npm run aprobar                          # lista cuentas pendientes
docker compose exec backend1 npm run aprobar -- correo@complejo.com   # aprueba una
```

### Demostrar el balanceo
```bash
# Cada respuesta indica qué nodo la atendió (backend1 → backend2 → backend3 → …)
for i in 1 2 3 4 5 6; do curl -s http://localhost/api/health; echo; done
#   PowerShell:  1..6 | ForEach-Object { curl.exe -s http://localhost/api/health }

curl -I http://localhost/                  # cabecera X-Nodo: frontend1 / frontend2
docker compose logs -f balanceador         # el log de Nginx muestra nodo=... por cada pedido

# Tolerancia a fallas: se cae un nodo y la app sigue respondiendo con los otros dos
docker stop futbol_backend2
for i in 1 2 3 4 5 6; do curl -s http://localhost/api/health; echo; done
docker start futbol_backend2               # si no vuelve a aparecer: docker compose restart balanceador
```

Otros comandos útiles: `docker compose logs -f backend1` · `docker compose down` (apaga) · `docker compose down -v` (apaga **y borra los datos**; la próxima vez la base se recrea desde los `.sql`).
La base queda accesible solo desde esta PC en `localhost:5432` (usuario `postgres`, base `postgres`) para DBeaver / pgAdmin.

## Medios de pago e imágenes de torneos

- **Medio de pago:** al reservar una cancha o inscribirse a un torneo el jugador elige *Efectivo* o *Transferencia*. Si elige transferencia, ve el **alias** y el **titular** del complejo. Cada complejo los carga en **Panel → Datos de pago** (si los deja vacíos, solo se acepta efectivo). En las reservas el medio queda guardado y lo ven el jugador (*Mis reservas*) y el dueño (*Reservas*); el dueño sigue marcando la reserva como *pagada* cuando recibe el pago. La inscripción a torneos sigue siendo una simulación: todavía no se guarda en la base.
- **Imagen del torneo:** en **Panel → Eventos** el organizador sube una imagen al crear o editar un torneo (se achica sola antes de subirse) y aparece en la tarjeta de la pantalla principal. Se guarda en la base de datos, no en el disco del contenedor, para que la vean las 3 réplicas del backend.

> **Importante:** esto necesita `backend-empresa/database/migracion_v4.sql`. Con una base nueva de Docker se ejecuta sola. Si la base **ya existía**, hay que aplicarla una vez (no borra datos):
> ```bash
> docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migracion_v4.sql
> docker compose up -d --build        # reconstruir backend y frontend con el código nuevo
> ```
> Si siguen usando Supabase: pegar el contenido de `migracion_v4.sql` en el SQL Editor.

## Data Warehouse

El Data Warehouse vive en el esquema `dw` de la misma base (la operativa está en `public`). Proceso modelado: **reservas de canchas**. Estrella: `dw.hecho_reservas` + `dim_fecha`, `dim_horario`, `dim_empresa`, `dim_cancha`, `dim_usuario`. Los scripts están en `backend-empresa/database/dw/`:

```bash
# 1) Crear el DW y hacer la primera carga
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/instalar_dw.sql
# 2) (Opcional) datos de demostración, porque la base de ejemplo tiene solo 2 reservas; después refrescar
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/dw_datos_demo.sql
docker compose exec db psql -U postgres -d postgres -c "CALL dw.cargar();"
# 3) Consultas de análisis y control de la carga
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/dw/dw_consultas.sql
```
`CALL dw.cargar();` se puede ejecutar cuantas veces haga falta: inserta lo nuevo y actualiza lo que cambió, sin duplicar.

---

## Sin Docker (desarrollo local, una app por terminal)

### Puesta en marcha (cada integrante, en su PC)

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
