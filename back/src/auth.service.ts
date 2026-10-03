import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Usuario } from "@prisma/client";
import { GraphQLError } from "graphql";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { PrismaService } from "./prisma.service";
import { CredencialesInput, RegistroInput, RequestContext } from "./types";

const HASH_DE_RELLENO = `scrypt$16384$8$1$${Buffer.alloc(16).toString("base64url")}$${Buffer.alloc(64).toString("base64url")}`;
const derivarClave = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key as Buffer)),
    );
  });

type UsuarioPublico = Pick<Usuario, "id" | "nombre" | "email" | "rol">;

function fallo(message: string, code: string): never {
  throw new GraphQLError(message, { extensions: { code } });
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroInput) {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    if (nombre.length < 2 || nombre.length > 120) {
      fallo("Escribe un nombre de 2 a 120 caracteres.", "BAD_USER_INPUT");
    }
    if (
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      fallo("Escribe un correo electrónico válido.", "BAD_USER_INPUT");
    }
    if (datos.password.length < 8 || datos.password.length > 128) {
      fallo("La contraseña debe tener entre 8 y 128 caracteres.", "BAD_USER_INPUT");
    }

    const passwordHash = await this.hashPassword(datos.password);
    try {
      const usuario = await this.db.usuario.create({
        data: { nombre, email, passwordHash, rol: "CLIENTE" },
        select: { id: true, nombre: true, email: true, rol: true },
      });
      return { token: this.crearToken(usuario.id), usuario };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        fallo("Ya existe una cuenta con ese correo.", "CONFLICT");
      }
      throw error;
    }
  }

  async iniciarSesion(datos: CredencialesInput) {
    const email = datos.email.trim().toLowerCase();
    if (!email || datos.password.length > 128) {
      fallo("Correo o contraseña incorrectos.", "UNAUTHENTICATED");
    }
    const usuario = await this.db.usuario.findUnique({ where: { email } });
    const passwordValida = await this.compararPassword(
      datos.password,
      usuario?.passwordHash ?? HASH_DE_RELLENO,
    );
    if (!usuario || !passwordValida) {
      fallo("Correo o contraseña incorrectos.", "UNAUTHENTICATED");
    }
    return {
      token: this.crearToken(usuario.id),
      usuario: this.publico(usuario),
    };
  }

  async usuarioActual(ctx: RequestContext): Promise<UsuarioPublico> {
    const valor = ctx.req.headers.authorization;
    const header = Array.isArray(valor) ? valor[0] : valor;
    const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) fallo("Inicia sesión para continuar.", "UNAUTHENTICATED");

    const id = this.verificarToken(token);
    const usuario = await this.db.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, rol: true },
    });
    if (!usuario) fallo("La sesión ya no es válida.", "UNAUTHENTICATED");
    return usuario;
  }

  private publico(usuario: Usuario): UsuarioPublico {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const hash = await derivarClave(password, salt);
    return `scrypt$16384$8$1$${salt}$${hash.toString("base64url")}`;
  }

  private async compararPassword(password: string, encoded: string) {
    const [, algoritmo, n, r, p, salt, hash] = encoded.match(
      /^(scrypt)\$(\d+)\$(\d+)\$(\d+)\$([^$]+)\$([^$]+)$/,
    ) ?? [];
    if (!algoritmo || n !== "16384" || r !== "8" || p !== "1") return false;
    const esperado = Buffer.from(hash, "base64url");
    const recibido = await derivarClave(password, salt);
    return (
      esperado.length === recibido.length && timingSafeEqual(esperado, recibido)
    );
  }

  private crearToken(usuarioId: number) {
    return this.jwt.sign({ sub: usuarioId });
  }

  private verificarToken(token: string): number {
    try {
      const claims = this.jwt.verify<{ sub: number; exp: number }>(token);
      if (
        !Number.isInteger(claims.sub) || claims.sub < 1 ||
        !Number.isInteger(claims.exp) ||
        claims.exp <= Math.floor(Date.now() / 1000)
      ) {
        fallo("La sesión ya no es válida.", "UNAUTHENTICATED");
      }
      return claims.sub;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.name === "TokenExpiredError") {
        fallo("La sesión expiró. Inicia sesión de nuevo.", "UNAUTHENTICATED");
      }
      fallo("La sesión ya no es válida.", "UNAUTHENTICATED");
    }
  }
}
