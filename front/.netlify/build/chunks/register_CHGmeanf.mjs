import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { t as authenticate } from "./graphql_BMS1v4EZ.mjs";
//#region src/pages/api/auth/register.ts
var register_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var query = `mutation Registrar($datos:RegistroInput!){registrarUsuario(datos:$datos){token usuario{id nombre email rol}}}`;
var POST = async ({ request, cookies }) => {
	let datos;
	try {
		const body = await request.json();
		if (!body || typeof body.nombre !== "string" || typeof body.email !== "string" || typeof body.password !== "string") return Response.json({ error: "Completa nombre, correo y contraseña." }, { status: 400 });
		datos = {
			nombre: body.nombre,
			email: body.email,
			password: body.password
		};
	} catch {
		return Response.json({ error: "Solicitud inválida." }, { status: 400 });
	}
	return authenticate(request, cookies, query, datos, "registrarUsuario");
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth/register@_@ts
var page = () => register_exports;
//#endregion
export { page };
