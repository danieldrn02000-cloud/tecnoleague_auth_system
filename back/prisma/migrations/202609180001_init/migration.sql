-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('CONFIRMADO', 'PREPARANDO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "imagen" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "marca" TEXT NOT NULL,
    "especificaciones" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "EstadoPedido" NOT NULL DEFAULT 'CONFIRMADO',
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'PAGO_AL_RECIBIR',
    "clave_solicitud" TEXT NOT NULL,
    "huella_solicitud" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_pedido" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,

    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "productos_categoria_id_activo_idx" ON "productos"("categoria_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_clave_solicitud_key" ON "pedidos"("clave_solicitud");

-- CreateIndex
CREATE INDEX "pedidos_usuario_id_fecha_idx" ON "pedidos"("usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "detalle_pedido_pedido_id_idx" ON "detalle_pedido"("pedido_id");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restricciones de integridad además de la validación de GraphQL.
ALTER TABLE "productos" ADD CONSTRAINT "productos_stock_no_negativo" CHECK ("stock" >= 0);
ALTER TABLE "productos" ADD CONSTRAINT "productos_precio_positivo" CHECK ("precio" > 0);
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_cantidad_positiva" CHECK ("cantidad" > 0);
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_precio_positivo" CHECK ("precio_unitario" > 0);
