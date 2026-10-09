import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { GraphQLError } from "graphql";
import { createHash } from "node:crypto";
import { PrismaService } from "./prisma.service";
import { Prisma } from "@prisma/client";

type OrdenMP = {
  id?: string;
  checkout_url?: string;
  status?: string;
  currency?: string;
  total_amount?: string;
  external_reference?: string;
  status_detail?: string;
  total_paid_amount?: string;
  last_updated_date?: string;
};

@Injectable()
export class PagosService {
  constructor(private readonly db: PrismaService) {}

  async iniciarPago(pedidoId: number, usuarioId: number) {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      throw new GraphQLError("Configura MP_ACCESS_TOKEN en el backend.");
    }
    if (!Number.isInteger(pedidoId) || pedidoId < 1) {
      throw new GraphQLError("Pedido inválido.");
    }
    const pedido = await this.db.pedido.findFirst({
      where: { id: pedidoId, usuarioId },
      include: { detalles: true },
    });
    if (!pedido) throw new GraphQLError("Pedido no encontrado.");
    if (pedido.status !== "PENDIENTE") {
      throw new GraphQLError("Este pedido no está pendiente de pago.");
    }
    if (!pedido.total.gt(0) || !pedido.detalles.length) {
      throw new GraphQLError("El pedido no tiene un importe válido.");
    }
    const suma = pedido.detalles.reduce(
      (total, detalle) =>
        total.add(detalle.precioUnitario.mul(detalle.cantidad)),
      pedido.total.mul(0),
    );
    if (!suma.equals(pedido.total))
      throw new GraphQLError("El total no coincide con los detalles.");

    // Una única orden inicial por pedido, también ante solicitudes concurrentes.
    // No genera otro intento si el resultado de una solicitud anterior es incierto.
    const hash = createHash("sha256")
      .update(`tecnoleague:mp:${pedido.claveSolicitud}`)
      .digest("hex");
    const clave = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    const pago = await this.db.pago.upsert({
      where: { claveIdempotencia: clave },
      update: {},
      create: {
        pedidoId,
        proveedor: "MERCADO_PAGO",
        monto: pedido.total,
        moneda: "MXN",
        claveIdempotencia: clave,
      },
    });
    if (pago.estado !== "PENDIENTE")
      throw new GraphQLError("Este intento de pago ya terminó.");
    const referencia = `TL-PAGO-${pago.id}`;
    //url de retorno
    const baseRetorno = process.env.MP_RETURN_BASE_URL?.replace(/\/+$/, "");
    if (!baseRetorno) {
      throw new GraphQLError("COnfigura MP_RETURN_BASE_URL en el backend");
    }
    const retorno = `${baseRetorno}/pago/retorno`;
    const orden = pago.idOrdenExterna
      ? await this.solicitar(
          `/v1/orders/${encodeURIComponent(pago.idOrdenExterna)}`,
          token,
        )
      : await this.solicitar("/v1/orders", token, clave, {
          type: "online",
          processing_mode: "manual",
          total_amount: pedido.total.toFixed(2),
          external_reference: referencia,
          items: pedido.detalles.map((d) => ({
            title: d.nombreProducto,
            quantity: d.cantidad,
            unit_price: d.precioUnitario.toFixed(2),
          })),
          config: {
            online: {
              success_url: retorno,
              failure_url: retorno,
              pending_url: retorno,
              auto_return: "all",
            },
          },
        });
    if (
      !orden.id ||
      !orden.checkout_url ||
      orden.currency !== "MXN" ||
      orden.total_amount !== pedido.total.toFixed(2) ||
      orden.external_reference !== referencia
    ) {
      throw new GraphQLError(
        "Mercado Pago devolvió una orden inesperada. Revisa la cuenta de prueba de México.",
      );
    }
    const url = new URL(orden.checkout_url);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.mercadopago.com.mx"
    ) {
      throw new GraphQLError("La URL del checkout no es válida para México.");
    }
    await this.db.$transaction([
      this.db.pago.update({
        where: { id: pago.id },
        data: {
          idOrdenExterna: orden.id,
          estadoProveedor: orden.status ?? "created",
        },
      }),
      this.db.pedido.update({
        where: { id: pedidoId },
        data: { metodoPago: "MERCADO_PAGO" },
      }),
    ]);
    return { pagoId: pago.id, checkoutUrl: url.href };
  }

  //modulo de webhook
  async procesarWebhook(ordenId: string) {
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException("Falta MP_ACCESS_TOKEN.");
    }

    // Puede llegar una notificación antes de guardar el ID externo.
    // Respondemos con error para que Mercado Pago vuelva a intentar.
    const pago = await this.db.pago.findUnique({
      where: { idOrdenExterna: ordenId },
      include: { pedido: true },
    });

    if (!pago || pago.proveedor !== "MERCADO_PAGO") {
      throw new ServiceUnavailableException(
        "La orden todavía no está vinculada a un pago local.",
      );
    }

    let orden: OrdenMP;

    try {
      // El estado se obtiene de Mercado Pago, no del cuerpo del webhook.
      orden = await this.solicitar(
        `/v1/orders/${encodeURIComponent(ordenId)}`,
        token,
      );
    } catch {
      throw new ServiceUnavailableException(
        "No se pudo verificar la orden con Mercado Pago.",
      );
    }

    const importeValido = (valor: unknown, esperado: Prisma.Decimal) => {
      if (typeof valor !== "string" || !/^\d+(\.\d{1,2})?$/.test(valor)) {
        return false;
      }

      return new Prisma.Decimal(valor).equals(esperado);
    };

    if (
      orden.id !== ordenId ||
      orden.external_reference !== `TL-PAGO-${pago.id}` ||
      orden.currency !== pago.moneda ||
      !importeValido(orden.total_amount, pago.monto) ||
      !pago.monto.equals(pago.pedido.total)
    ) {
      throw new ServiceUnavailableException(
        "La orden no coincide con el pedido, moneda o importe.",
      );
    }

    const acreditado =
      orden.status === "processed" && orden.status_detail === "accredited";

    if (acreditado && !importeValido(orden.total_paid_amount, pago.monto)) {
      throw new ServiceUnavailableException(
        "El importe acreditado no coincide con el total.",
      );
    }

    const estadoReportado = `${orden.status ?? "unknown"}:${orden.status_detail ?? "unknown"}`;

    const claveEvento = createHash("sha256")
      .update(
        JSON.stringify([
          ordenId,
          orden.status,
          orden.status_detail,
          orden.total_paid_amount,
          orden.last_updated_date,
        ]),
      )
      .digest("hex");

    await this.db.$transaction(async (tx) => {
      // Serializa las notificaciones concurrentes de este pago.
      await tx.$queryRaw`
      SELECT id FROM pagos WHERE id = ${pago.id} FOR UPDATE
    `;

      const actual = await tx.pago.findUniqueOrThrow({
        where: { id: pago.id },
      });

      await tx.eventoPago.upsert({
        where: { claveEvento },
        update: {},
        create: {
          pagoId: pago.id,
          claveEvento,
          tipo: "ORDEN_VERIFICADA",
          estadoReportado,
        },
      });

      if (!acreditado) {
        // Esta etapa registra otros resultados sin confirmar el pedido.
        if (actual.estado === "PENDIENTE") {
          await tx.pago.update({
            where: { id: pago.id },
            data: { estadoProveedor: estadoReportado },
          });
        }

        return;
      }

      // No reactiva pagos reembolsados ni otros estados finalizados.
      if (actual.estado !== "PENDIENTE" && actual.estado !== "APROBADO") {
        return;
      }

      await tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: "APROBADO",
          estadoProveedor: estadoReportado,
          aprobadoEn: actual.aprobadoEn ?? new Date(),
        },
      });

      // No modifica pedidos enviados, entregados o cancelados.
      await tx.pedido.updateMany({
        where: {
          id: pago.pedidoId,
          status: "PENDIENTE",
        },
        data: { status: "PAGADO" },
      });
    });
  }

  //Aqui se solicita conexión a Mercado Pago
  private async solicitar(
    ruta: string,
    token: string,
    clave?: string,
    datos?: unknown,
  ): Promise<OrdenMP> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`https://api.mercadopago.com${ruta}`, {
        method: datos ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(clave ? { "X-Idempotency-Key": clave } : {}),
        },
        ...(datos ? { body: JSON.stringify(datos) } : {}),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new GraphQLError(
        "No hubo respuesta de Mercado Pago. Reintenta con el mismo pedido.",
      );
    }
    if (!respuesta.ok) {
      const detalle = await respuesta.text();

      // Diagnóstico en la consola del backend.
      console.error("Mercado Pago rechazó la solicitud:", {
        http: respuesta.status,
        ruta,
        detalle,
      });

      throw new GraphQLError(
        `Mercado Pago no pudo iniciar el checkout (HTTP ${respuesta.status}).`,
      );
    }
    try {
      return (await respuesta.json()) as OrdenMP;
    } catch {
      throw new GraphQLError(
        "La respuesta de Mercado Pago no es válida. Reintenta con el mismo pedido.",
      );
    }
  }
}
