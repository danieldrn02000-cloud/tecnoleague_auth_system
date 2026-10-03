//valida el Bearer y guarda el usuario autenticado en el contexto de GraphQL
//si el token falta, está alterado o expiró, lanza un error de autenticación
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import type { RequestContext } from "./types";

export type ContextoAutenticado = RequestContext & {
  usuario?: Awaited<ReturnType<AuthService["usuarioActual"]>>;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext<ContextoAutenticado>();

    ctx.usuario = await this.auth.usuarioActual(ctx);

    return true;
  }
}