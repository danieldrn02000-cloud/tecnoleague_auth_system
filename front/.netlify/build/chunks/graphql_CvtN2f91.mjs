import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as requestBackend, r as mismoOrigen } from "./graphql_BMS1v4EZ.mjs";
//#region src/pages/api/graphql.ts
var graphql_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request, cookies }) => {
	if (!mismoOrigen(request)) return Response.json({ errors: [{ message: "Solicitud no permitida." }] }, { status: 403 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ errors: [{ message: "El cuerpo de la consulta no es JSON válido." }] }, { status: 400 });
	}
	if (!body || typeof body !== "object" || typeof body.query !== "string" || body.query.length > 1e5) return Response.json({ errors: [{ message: "La consulta GraphQL no es válida." }] }, { status: 400 });
	try {
		const { status, body: result } = await requestBackend(body, { token: cookies.get("tl_session")?.value });
		if (result.errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED")) cookies.delete("tl_session", { path: "/" });
		return Response.json(result, {
			status,
			headers: { "Cache-Control": "no-store" }
		});
	} catch {
		return Response.json({ errors: [{ message: "No hay conexión con GraphQL. Revisa back/.env y que NestJS esté activo en el puerto 4000." }] }, { status: 502 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/graphql@_@ts
var page = () => graphql_exports;
//#endregion
export { page };
