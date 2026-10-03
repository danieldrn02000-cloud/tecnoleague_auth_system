//comprueba que el usuario validado por AuthGuard tenga uno de los roles permitidos
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Rol } from "@prisma/client";
import { GraphQLError } from "graphql";
import { ROLES_KEY } from "./roles.decorator";
import type { ContextoAutenticado } from "./auth.guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesPermitidos?.length) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext<ContextoAutenticado>();

    if (!ctx.usuario) {
      throw new GraphQLError("Inicia sesión para continuar.", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (!rolesPermitidos.includes(ctx.usuario.rol)) {
      throw new GraphQLError(
        "No tienes permiso para realizar esta operación.",
        {
          extensions: { code: "FORBIDDEN" },
        },
      );
    }

    return true;
  }
}