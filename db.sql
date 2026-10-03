-- TecnoLeague P2-6. Ejecutar UNA VEZ en una base vacía.
-- No contiene DROP TABLE ni modifica tus otras bases.
BEGIN;
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

INSERT INTO "categorias" ("id","nombre") VALUES (1,'Laptops');
INSERT INTO "categorias" ("id","nombre") VALUES (2,'Componentes');
INSERT INTO "categorias" ("id","nombre") VALUES (3,'Periféricos');
INSERT INTO "categorias" ("id","nombre") VALUES (4,'Gaming');
INSERT INTO "usuarios" ("id","nombre","email","rol") VALUES (1,'Cliente de demostración','demo@tecnoleague.test','CLIENTE');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (1,'Laptop Pulse 15','TECNOLEAGUE','Potencia para jugar, programar y crear. Una laptop versátil para llevar tu setup a cualquier lugar. Producto de demostración; imagen ilustrativa.',18999,8,'/images/laptop.jpg',1,'Pantalla Full HD de 15.6 pulgadas;Procesador de 8 núcleos;16 GB RAM DDR5;SSD NVMe de 512 GB;Gráficos dedicados de 6 GB');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (2,'GeForce RTX 4060 8 GB','NVIDIA','Dale un impulso a tu PC con gráficos dedicados y ray tracing. Artículo de ejemplo para el catálogo académico; imagen ilustrativa.',6299,12,'/images/gpu.png',2,'8 GB de memoria GDDR6;Arquitectura Ada Lovelace;DLSS 3;Interfaz PCI Express;Verificar compatibilidad de gabinete y fuente');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (3,'Teclado mecánico Spectrum','TECNOLEAGUE','Cada tecla cuenta. Iluminación RGB y formato compacto para ganar espacio en tu escritorio. Producto e imagen de demostración.',1299,24,'/images/keyboard.jpg',3,'Switches mecánicos;Iluminación RGB;Conexión USB;Formato compacto;Distribución de imagen ilustrativa');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (4,'Audífonos Studio Black','TECNOLEAGUE','Concéntrate en cada detalle con un diseño cerrado y almohadillas acolchadas. Producto de demostración; imagen ilustrativa.',1599,16,'/images/headphones.jpg',3,'Diseño over-ear;Conexión de 3.5 mm;Almohadillas acolchadas;Diadema ajustable;Audio estéreo');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (5,'Kingston FURY Beast 32 GB','KINGSTON','Más espacio para tus proyectos y tus partidas. Memoria de ejemplo para un equipo de alto rendimiento; verifica compatibilidad antes de comprar.',2299,20,'/images/ram.jpg',2,'32 GB de memoria DDR5;6000 MT/s;Formato DIMM;Disipador negro;Requiere placa compatible con DDR5');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (6,'Control Xbox Carbon Black','XBOX','Un control para tus próximas partidas. Diseño ergonómico y agarre cómodo. Catálogo académico con fotografía ilustrativa.',1399,15,'/images/controller.jpg',4,'Diseño ergonómico;Cruceta direccional;Dos sticks analógicos;Verificar compatibilidad con tu plataforma;Imagen ilustrativa');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (7,'Laptop Pulse 15 Pro','TECNOLEAGUE','Más memoria y almacenamiento para tareas exigentes, desarrollo y juegos. Modelo ficticio de demostración.',23999,4,'/images/laptop.jpg',1,'Pantalla Full HD de 15.6 pulgadas;Procesador de 8 núcleos;32 GB RAM DDR5;SSD NVMe de 1 TB;Gráficos dedicados de 8 GB');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (8,'Control Xbox Robot White','XBOX','Un acabado claro para completar tu setup. Producto de ejemplo para practicar el flujo de compra.',1499,0,'/images/controller-white.jpg',4,'Acabado blanco;Diseño ergonómico;Dos sticks analógicos;Cruceta direccional;Actualmente sin existencias');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (9,'Teclado Spectrum Pro','TECNOLEAGUE','Un teclado compacto para un escritorio más cómodo. Modelo ficticio; comparte imagen ilustrativa con la línea Spectrum.',1799,9,'/images/keyboard.jpg',3,'Switches mecánicos;RGB configurable;Cable USB desmontable;Formato compacto;Estructura reforzada');
INSERT INTO "productos" ("id","nombre","marca","descripcion","precio","stock","imagen","categoria_id","especificaciones") VALUES (10,'Audífonos Studio Pro','TECNOLEAGUE','Comodidad para sesiones largas de música y juego. Producto ficticio; imagen ilustrativa.',2199,7,'/images/headphones.jpg',3,'Audio estéreo;Diseño cerrado;Almohadillas acolchadas;Diadema reforzada;Conexión de 3.5 mm');
SELECT setval(pg_get_serial_sequence('categorias','id'), (SELECT MAX(id) FROM categorias), true);
SELECT setval(pg_get_serial_sequence('usuarios','id'), (SELECT MAX(id) FROM usuarios), true);
SELECT setval(pg_get_serial_sequence('productos','id'), (SELECT MAX(id) FROM productos), true);
COMMIT;
