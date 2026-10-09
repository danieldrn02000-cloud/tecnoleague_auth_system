CREATE TABLE "tokens_recuperacion" (
  "id" SERIAL NOT NULL,
  "token_hash" TEXT NOT NULL,
  "usuario_id" INTEGER NOT NULL,
  "expira_en" TIMESTAMP(3) NOT NULL,
  "usado_en" TIMESTAMP(3),
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tokens_recuperacion_token_hash_key" ON "tokens_recuperacion"("token_hash");
CREATE INDEX "tokens_recuperacion_usuario_id_idx" ON "tokens_recuperacion"("usuario_id");
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
