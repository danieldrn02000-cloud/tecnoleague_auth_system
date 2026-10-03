import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "node:path";
import { PrismaService } from "./prisma.service";
import { AuthService } from "./auth.service";
import { TiendaService } from "./tienda.service";
import type { RequestContext } from "./types";
import {
  AuthResolver,
  TiendaResolver,
  ProductoResolver,
  CategoriaResolver,
  PedidoResolver,
  DetalleResolver,
  UsuarioResolver,
} from "./tienda.resolver";
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || Buffer.byteLength(secret) < 32) {
          throw new Error("Define JWT_SECRET con al menos 32 bytes en back/.env.");
        }
        return {
          secret,
          // Siete días, igual que la cookie de Astro.
          signOptions: { algorithm: "HS256" as const, expiresIn: 604800 },
          verifyOptions: { algorithms: ["HS256" as const] },
        };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [join(__dirname, "schema.graphql")],
      path: "/graphql",
      graphiql: true,
      introspection: true,
      context: ({ req }: { req: RequestContext["req"] }) => ({ req }),
    }),
  ],
  providers: [
    AuthGuard,
    RolesGuard,
    PrismaService,
    AuthService,
    TiendaService,
    AuthResolver,
    TiendaResolver,
    ProductoResolver,
    CategoriaResolver,
    PedidoResolver,
    DetalleResolver,
    UsuarioResolver,
  ],
})
export class AppModule {}
