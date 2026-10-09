import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
console.log("Directorio del backend:", process.cwd());
console.log("Archivo .env indicado:", process.env.DOTENV_CONFIG_PATH ?? "No indicado");
async function iniciar() {
  const rutaEnv = resolve(process.cwd(), ".env");
const variablesArchivo = parse(readFileSync(rutaEnv));

console.log("Comprobación de configuración:", {
  rutaEnv,
  claveExisteEnArchivo: Boolean(variablesArchivo.MP_WEBHOOK_SECRET),
  claveCargadaCoincideConArchivo:
    process.env.MP_WEBHOOK_SECRET === variablesArchivo.MP_WEBHOOK_SECRET,
});
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
  });
  app.enableShutdownHooks();
  const port = Number(process.env.PORT || 4000);
  await app.listen(port, process.env.HOST || "127.0.0.1");
  console.log(`TecnoLeague GraphQL: http://localhost:${port}/graphql`);
}
iniciar().catch((error) => {
  console.error(
    "No se pudo iniciar el backend. Revisa back/.env, PostgreSQL y las migraciones.",
    error,
  );
  process.exit(1);
});
