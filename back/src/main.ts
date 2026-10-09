import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function iniciar() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT || 4000);

  // Render necesita que el servidor escuche en todas las interfaces.
  await app.listen(port, "0.0.0.0");

  console.log(`TecnoLeague GraphQL escuchando en el puerto ${port}`);
}

iniciar().catch((error) => {
  console.error("No se pudo iniciar el backend.", error);
  process.exit(1);
});