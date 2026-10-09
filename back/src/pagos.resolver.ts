import { Args, Context, Mutation, Resolver } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { PagosService } from "./pagos.service";
import type { RequestContext } from "./types";

@Resolver()
export class PagosResolver {
  constructor(private readonly pagos: PagosService, private readonly auth: AuthService) {}

  @Mutation("iniciarPago")
  async iniciarPago(@Args("pedidoId") pedidoId: number, @Context() ctx: RequestContext) {
    const usuario = await this.auth.usuarioActual(ctx);
    return this.pagos.iniciarPago(pedidoId, usuario.id);
  }
}
