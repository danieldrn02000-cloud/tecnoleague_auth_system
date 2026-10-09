# TecnoLeague — PP1 + autenticación en Astro

Ecommerce académico de productos gamer con catálogo, búsqueda y filtros, detalle de producto, carrito persistente, checkout, historial de pedidos por usuario y panel de administración. Las compras son de demostración, con pago al recibir y sin cobros reales.

## Tecnologías y alcance de la práctica

- **Frontend:** Astro SSR, React y Tailwind CSS. Las pantallas de la tienda cambian mediante estado React; registro y login utilizan páginas Astro.
- **Backend:** NestJS, GraphQL, Prisma y PostgreSQL.
- **Autenticación:** registro y login con contraseñas scrypt; JWT HS256 de siete días mediante `@nestjs/jwt`.
- **Sesión:** Astro guarda el JWT en una cookie `HttpOnly` y lo envía al backend como `Authorization: Bearer`. El navegador no almacena el token en `localStorage`.
- **Permisos:** `AuthGuard` protege compras e historial; `RolesGuard` limita el CRUD de productos a `ADMIN`. El registro público crea cuentas `CLIENTE`.
- **Flujo:** manejo de sesión inválida y recuperación de checkout/pedidos después del login.

El backend calcula los totales, valida stock, realiza la compra en una transacción y evita pedidos duplicados mediante una clave de idempotencia. Desactivar un producto conserva sus relaciones y los precios históricos de pedidos.

## Ejecución local

Requisitos: Node.js **22.12 o superior**, npm y PostgreSQL en ejecución. Los comandos se ejecutan en la raíz, donde están `front/`, `back/` y el `package.json` general.

```powershell
npm install
Copy-Item back/.env.example back/.env
Copy-Item front/.env.example front/.env
```

La copia de `.env` es solo para la primera configuración; si los archivos ya existen, editarlos conservando sus valores. 
Crear una base vacía en PostgreSQL:

```sql
CREATE DATABASE tecnoleague_pp1;
```

Configurar `back/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/tecnoleague_pp1?schema=public"
PORT=4000
HOST=127.0.0.1
FRONTEND_ORIGIN=http://127.0.0.1:5173
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO
AUTH_BRIDGE_SECRET=REEMPLAZAR_POR_OTRO_SECRETO_ALEATORIO
PUBLIC_SITE_URL=http://127.0.0.1:5173
RESEND_API_KEY=re_REEMPLAZAR_CON_LA_API_KEY
PASSWORD_RESET_FROM="TecnoLeague <no-reply@tudominio.com>"

# Opcional: crear administrador con db:seed.
ADMIN_EMAIL=admin@tecnoleague.test
ADMIN_PASSWORD=ELEGIR_UNA_CONTRASENA_DE_8_A_128_CARACTERES
ADMIN_NAME=Administrador TecnoLeague
```

La recuperación de contraseña envía el enlace mediante [Resend](https://resend.com/). Configura `RESEND_API_KEY` con una API key válida y `PASSWORD_RESET_FROM` con un remitente de un dominio verificado en Resend. En producción, `PUBLIC_SITE_URL` debe ser la URL pública del frontend (preferentemente HTTPS). Estas variables van en `back/.env`; nunca compartas ni publiques la API key.

Generar un secreto con este comando; ejecutarlo dos veces para obtener los dos valores:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Configurar `front/.env`:

```dotenv
BACKEND_GRAPHQL_URL=http://127.0.0.1:4000/graphql
AUTH_BRIDGE_SECRET=EL_MISMO_VALOR_DE_BACK_ENV
```

`AUTH_BRIDGE_SECRET` debe coincidir exactamente en ambos archivos. El JWT requiere un secreto de al menos 32 bytes. No versionar `.env`.

Preparar las tablas, cargar el catálogo y arrancar:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir **http://127.0.0.1:5173/**. GraphQL: **http://127.0.0.1:4000/graphql**. Detener con `Ctrl + C`; reiniciar después de cambiar `.env`.

Las migraciones anteriores se aplican sobre una base vacía; no cargar también `db.sql`. Si se reutiliza una base anterior, debe coincidir con `schema.prisma`.

## Cuenta administradora y comprobaciones

`db:seed` crea el administrador con los valores `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME`. Iniciar sesión desde la tienda con esas credenciales para acceder al inventario. El seed no modifica contraseñas ni roles de cuentas existentes; si el correo pertenece a un cliente, usar otro. Las variables de preparación pueden retirarse después de crear la cuenta.

## Administración disponible

El panel reutiliza la sesión JWT y el rol `ADMIN` existente. Incluye dashboard con periodo seleccionable, administración de productos y categorías, consulta y flujo permitido de pedidos, clientes, pagos de solo lectura e inventario con movimientos auditados. Las migraciones agregan el nivel mínimo de stock, el historial de estados y los movimientos; las compras nuevas descuentan existencias en la misma transacción que crea el pedido. Cancelar un pedido elegible devuelve las unidades una sola vez. Los cambios manuales de stock requieren tipo, cantidad y motivo.

El dashboard y el gasto confirmado de clientes solo suman pedidos con un pago `APROBADO` registrado por el proveedor, excluyen cancelaciones y no presentan pedidos pendientes como ingresos. Los pagos no se pueden marcar manualmente como aprobados; la confirmación sigue dependiendo de la verificación existente con Mercado Pago. Los pedidos pagados no se cancelan desde este panel porque todavía no existe un flujo de reembolso.

Esta fase no añade promociones, seguimiento de paquetería, exportación CSV, configuración comercial persistente ni administración de cuentas/roles: el proyecto aún no tiene modelos o flujos para esas operaciones. No se muestran como funcionalidades activas.

Con el servidor activo, abrir otra terminal en la raíz:

```powershell
npm run test:api
npm run build
```

Las pruebas utilizan `ADMIN_EMAIL` y `ADMIN_PASSWORD`; también admiten `TEST_ADMIN_EMAIL` y `TEST_ADMIN_PASSWORD`. Cubren autenticación, permisos, aislamiento de pedidos, CRUD, stock, rollback, idempotencia, dashboard, historial de inventario y cancelación. Crean cuentas y pedidos de prueba, y dejan un producto temporal dado de baja para conservar las relaciones. `npm run build` comprueba la compilación de backend y frontend.
