import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as authenticate } from "./graphql_BMS1v4EZ.mjs";
//#region src/pages/api/auth/login.ts
var login_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var query = `mutation IniciarSesion($datos:CredencialesInput!){iniciarSesion(datos:$datos){token usuario{id nombre email rol}}}`;
var POST = async ({ request, cookies }) => {
	let datos;
	try {
		const body = await request.json();
		if (!body || typeof body.email !== "string" || typeof body.password !== "string") return Response.json({ error: "Escribe tu correo y contraseña." }, { status: 400 });
		datos = {
			email: body.email,
			password: body.password
		};
	} catch {
		return Response.json({ error: "Solicitud inválida." }, { status: 400 });
	}
	return authenticate(request, cookies, query, datos, "iniciarSesion");
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/login@_@ts
var page = () => login_exports;
//#endregion
export { page };
