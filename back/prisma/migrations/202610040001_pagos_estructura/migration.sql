-- Los pedidos anteriores eran de demostración y no tenían un pago en línea.
-- CONFIRMADO y PREPARANDO pasan a PENDIENTE; ENTREGADO conserva su estado.
ALTER TYPE "EstadoPedido" RENAME TO "EstadoPedido_anterior";
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO');

ALTER TABLE "pedidos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pedidos" ALTER COLUMN "status" TYPE "EstadoPedido"
  USING (CASE WHEN "status"::text = 'ENTREGADO' THEN 'ENTREGADO' ELSE 'PENDIENTE' END)::"EstadoPedido";
ALTER TABLE "pedidos" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';
DROP TYPE "EstadoPedido_anterior";

CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'REEMBOLSADO');
CREATE TYPE "ProveedorPago" AS ENUM ('MERCADO_PAGO', 'PAYPAL');

CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "proveedor" "ProveedorPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "id_orden_externa" TEXT,
    "id_pago_externo" TEXT,
    "estado_proveedor" TEXT,
    "clave_idempotencia" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "aprobado_en" TIMESTAMP(3),
    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eventos_pago" (
    "id" SERIAL NOT NULL,
    "pago_id" INTEGER NOT NULL,
    "clave_evento" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado_reportado" TEXT,
    "recibido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "eventos_pago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pagos_id_orden_externa_key" ON "pagos"("id_orden_externa");
CREATE UNIQUE INDEX "pagos_id_pago_externo_key" ON "pagos"("id_pago_externo");
CREATE UNIQUE INDEX "pagos_clave_idempotencia_key" ON "pagos"("clave_idempotencia");
CREATE INDEX "pagos_pedido_id_idx" ON "pagos"("pedido_id");
CREATE UNIQUE INDEX "eventos_pago_clave_evento_key" ON "eventos_pago"("clave_evento");
CREATE INDEX "eventos_pago_pago_id_idx" ON "eventos_pago"("pago_id");

ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedido_id_fkey"
  FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "eventos_pago" ADD CONSTRAINT "eventos_pago_pago_id_fkey"
  FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
