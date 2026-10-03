import type { APIRoute } from "astro";
import { mismoOrigen, requestBackend } from "../../lib/server/graphql";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!mismoOrigen(request)) {
    return Response.json(
      { errors: [{ message: "Solicitud no permitida." }] },
      { status: 403 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { errors: [{ message: "El cuerpo de la consulta no es JSON válido." }] },
      { status: 400 },
    );
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { query?: unknown }).query !== "string" ||
    (body as { query: string }).query.length > 100_000
  ) {
    return Response.json(
      { errors: [{ message: "La consulta GraphQL no es válida." }] },
      { status: 400 },
    );
  }

  try {
    const { status, body: result } = await requestBackend(body, {
      token: cookies.get("tl_session")?.value,
    });

    const sesionInvalida = result.errors?.some(
      (error) => error.extensions?.code === "UNAUTHENTICATED",
    );

    if (sesionInvalida) {
      cookies.delete("tl_session", { path: "/" });
    }

    return Response.json(result, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        errors: [
          {
            message:
              "No hay conexión con GraphQL. Revisa back/.env y que NestJS esté activo en el puerto 4000.",
          },
        ],
      },
      { status: 502 },
    );
  }
};
