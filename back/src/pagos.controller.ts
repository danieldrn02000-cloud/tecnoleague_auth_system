import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { WebhookSignatureValidator } from "mercadopago";
import { PagosService } from "./pagos.service";

//valida el endpoint mediante la firma de mercado pago
@Controller("pagos")
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Headers("x-signature") firma: string | undefined,
    @Headers("x-request-id") requestId: string | undefined,
    @Query("data.id") ordenId: string | undefined,
    @Body() body: unknown,
  ) {
    const secreto = process.env.MP_WEBHOOK_SECRET;

    if (!secreto) {
      throw new Error("Falta MP_WEBHOOK_SECRET en el backend.");
    }

    if (
      typeof firma !== "string" ||
      typeof requestId !== "string" ||
      typeof ordenId !== "string" ||
      !/^[a-zA-Z0-9_-]+$/.test(ordenId)
    ) {
      throw new UnauthorizedException("Notificación sin firma válida.");
    }

try {
  WebhookSignatureValidator.validate({
    xSignature: firma,
    xRequestId: requestId,
    dataId: ordenId.toLowerCase(),
    secret: secreto,
  });

  console.log("Webhook: firma aceptada por el SDK oficial.");
} catch (error) {
  console.error(
    "Webhook: firma rechazada por el SDK oficial:",
    error instanceof Error
      ? { nombre: error.name, mensaje: error.message }
      : { mensaje: "Error de validación" },
  );

  throw new UnauthorizedException("Firma inválida.");
}


    const notificacion = body as {
      type?: string;
      data?: { id?: string };
    } | null;

    if (notificacion?.type !== "order" || notificacion.data?.id !== ordenId) {
      throw new BadRequestException("Notificación de orden inválida.");
    }

    await this.pagos.procesarWebhook(ordenId);

    return { recibido: true };
  }
}
