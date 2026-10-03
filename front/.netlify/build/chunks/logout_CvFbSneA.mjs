import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { r as mismoOrigen } from "./graphql_BMS1v4EZ.mjs";
//#region src/pages/api/auth/logout.ts
var logout_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request, cookies }) => {
	if (!mismoOrigen(request)) return new Response("Solicitud no permitida.", { status: 403 });
	cookies.delete("tl_session", { path: "/" });
	return Response.redirect(new URL("/", request.url), 303);
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/logout@_@ts
var page = () => logout_exports;
//#endregion
export { page };
