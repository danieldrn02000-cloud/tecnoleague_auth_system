# Frontend TecnoLeague

Astro SSR + React + Tailwind. Astro sirve la tienda React y funciona como BFF entre el navegador y GraphQL.

Desde la **raíz del repositorio**, ejecuta `npm install` y `npm run setup`. En `front/.env`, `BACKEND_GRAPHQL_URL` debe apuntar al backend y `AUTH_BRIDGE_SECRET` debe coincidir con `back/.env`.

- Frontend Astro SSR: `npm run dev -w front` → http://localhost:5173
- Ambas partes: `npm run dev`.
- Compilar frontend: `npm run build -w front`.

Las páginas `/registro` y `/iniciar-sesion` reciben la sesión mediante Astro. El token se conserva en una cookie `HttpOnly`; las peticiones React a `/api/graphql` pasan por el servidor Astro, que agrega el encabezado Bearer sin exponer el token al navegador.

La ruta SSR `/` monta la tienda React existente. La navegación del catálogo sigue en `src/App.tsx`; las pantallas React viven en `src/screens/`, el carrito compartido en `src/store.tsx`, el cliente GraphQL en `src/api.ts` y los estilos en `src/styles.css`. Checkout e historial requieren una cuenta. Las fotografías son locales.