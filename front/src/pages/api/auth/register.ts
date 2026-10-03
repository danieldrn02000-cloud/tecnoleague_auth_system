import type { APIRoute } from "astro";
import { authenticate } from "../../../lib/server/graphql";

export const prerender = false;

const query = `mutation Registrar($datos:RegistroInput!){registrarUsuario(datos:$datos){token usuario{id nombre email rol}}}`;

export const POST: APIRoute = async ({ request, cookies }) => {
  let datos: Record<string, string>;
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body.nombre !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return Response.json(
        { error: "Completa nombre, correo y contraseña." },
        { status: 400 },
      );
    }
    datos = {
      nombre: body.nombre,
      email: body.email,
      password: body.password,
    };
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  return authenticate(request, cookies, query, datos, "registrarUsuario");
};