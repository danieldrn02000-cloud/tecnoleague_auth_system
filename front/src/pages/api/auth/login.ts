import type { APIRoute } from "astro";
import { authenticate } from "../../../lib/server/graphql";

export const prerender = false;

const query = `mutation IniciarSesion($datos:CredencialesInput!){iniciarSesion(datos:$datos){token usuario{id nombre email rol}}}`;

export const POST: APIRoute = async ({ request, cookies }) => {
  let datos: Record<string, string>;
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return Response.json(
        { error: "Escribe tu correo y contraseña." },
        { status: 400 },
      );
    }
    datos = { email: body.email, password: body.password };
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  return authenticate(request, cookies, query, datos, "iniciarSesion");
};