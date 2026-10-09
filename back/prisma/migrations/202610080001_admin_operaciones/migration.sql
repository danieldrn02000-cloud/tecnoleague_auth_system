ALTER TABLE "productos"
  ADD COLUMN "stock_minimo" INTEGER NOT NULL DEFAULT 5;

CREATE TYPE "TipoMovimientoInventario" AS ENUM (
  'INICIAL',
  'ENTRADA',
  'SALIDA',
  'AJUSTE',
  'PEDIDO',
  'CANCELACION'
);

CREATE TABLE "eventos_estado_pedido" (
  "id" SERIAL NOT NULL,
  "pedido_id" INTEGER NOT NULL,
  "desde" "EstadoPedido",
  "hacia" "EstadoPedido" NOT NULL,
  "actor_id" INTEGER NOT NULL,
  "motivo" TEXT,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eventos_estado_pedido_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimientos_inventario" (
  "id" SERIAL NOT NULL,
  "producto_id" INTEGER NOT NULL,
  "usuario_id" INTEGER,
  "pedido_id" INTEGER,
  "tipo" "TipoMovimientoInventario" NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "motivo" TEXT NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "eventos_estado_pedido_pedido_id_creado_en_idx"
  ON "eventos_estado_pedido"("pedido_id", "creado_en");
CREATE INDEX "movimientos_inventario_producto_id_creado_en_idx"
  ON "movimientos_inventario"("producto_id", "creado_en");
CREATE INDEX "movimientos_inventario_pedido_id_idx"
  ON "movimientos_inventario"("pedido_id");

ALTER TABLE "eventos_estado_pedido"
  ADD CONSTRAINT "eventos_estado_pedido_pedido_id_fkey"
  FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "eventos_estado_pedido_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_inventario"
  ADD CONSTRAINT "movimientos_inventario_producto_id_fkey"
  FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "movimientos_inventario_pedido_id_fkey"
  FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
