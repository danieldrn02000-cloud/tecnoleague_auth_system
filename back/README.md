# Backend TecnoLeague

Node.js + TypeScript + NestJS + Apollo Server + GraphQL + Prisma + PostgreSQL.

Desde la **raíz** del proyecto:

```bash
npm install
npm run setup
```

Crea la base vacía `tecnoleague_entrega` en pgAdmin y edita `back/.env` con tu `DATABASE_URL`. Mantén `PORT=4000`, `HOST=127.0.0.1`, `FRONTEND_ORIGIN=http://localhost:5173` y la clave local `ADMIN_KEY`.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev -w back
```

Endpoint y explorador: http://localhost:4000/graphql. `npm run dev` desde la raíz inicia ambas partes. No instales paquetes globales ni vuelvas a crear el proyecto Nest.

`src/schema.graphql` define el contrato; `tienda.resolver.ts` resuelve operaciones y relaciones; `tienda.service.ts` valida datos y ejecuta la transacción del pedido; `prisma.service.ts` gestiona la conexión.

`db.sql` en la raíz es una alternativa para una base vacía, no se debe aplicar además de la migración. Revisa el README principal antes de elegir esa ruta.

Esta versión usa el cliente de demostración 1 y pago al recibir sin cobros. Las mutaciones de productos exigen el encabezado `x-admin-key`, validado contra `ADMIN_KEY` en el servidor.
