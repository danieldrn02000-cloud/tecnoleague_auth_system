//#region src/lib/server/graphql.ts
async function requestBackend(body, options = {}) {
	const headers = new Headers({ "Content-Type": "application/json" });
	if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
	if (options.authBridge && "tecnoleague-local-astro-bridge-change-before-deploy") headers.set("x-auth-bridge-secret", "tecnoleague-local-astro-bridge-change-before-deploy");
	const response = await fetch("http://127.0.0.1:4000/graphql", {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		cache: "no-store",
		signal: AbortSignal.timeout(15e3)
	});
	const payload = await response.json().catch(() => null);
	return {
		status: response.status,
		body: payload ?? { errors: [{ message: "El backend devolvió una respuesta inválida." }] }
	};
}
function mismoOrigen(request) {
	const origin = request.headers.get("origin");
	if (request.headers.get("sec-fetch-site") === "cross-site") return false;
	if (!origin) return true;
	try {
		return new URL(origin).origin === new URL(request.url).origin;
	} catch {
		return false;
	}
}
async function getSessionUser(token) {
	if (!token) return {
		user: null,
		invalid: false
	};
	try {
		const { body } = await requestBackend({ query: "query SesionActual { usuarioActual { id nombre email rol } }" }, { token });
		if (body.data?.usuarioActual) return {
			user: body.data.usuarioActual,
			invalid: false
		};
		return {
			user: null,
			invalid: body.errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED") ?? false
		};
	} catch {
		return {
			user: null,
			invalid: false
		};
	}
}
async function authenticate(request, cookies, query, datos, operation) {
	if (!mismoOrigen(request)) return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
	try {
		const { status, body } = await requestBackend({
			query,
			variables: { datos }
		}, { authBridge: true });
		const sesion = body.data?.[operation];
		if (!sesion?.token || !sesion.usuario) {
			const error = body.errors?.[0];
			return Response.json({ error: error?.message ?? "No se pudo iniciar la sesión." }, { status: errorStatus(error, status) });
		}
		cookies.set("tl_session", sesion.token, {
			httpOnly: true,
			secure: new URL(request.url).protocol === "https:",
			sameSite: "lax",
			path: "/",
			maxAge: 604800
		});
		return Response.json({ usuario: sesion.usuario }, { headers: { "Cache-Control": "no-store" } });
	} catch {
		return Response.json({ error: "No se pudo contactar al backend GraphQL. Revisa back/.env, PostgreSQL y que NestJS esté activo en el puerto 4000." }, { status: 502 });
	}
}
function errorStatus(error, status) {
	if (error?.extensions?.code === "UNAUTHENTICATED") return 401;
	if (error?.extensions?.code === "CONFLICT") return 409;
	if (error?.extensions?.code === "BAD_USER_INPUT") return 400;
	if (error?.extensions?.code === "FORBIDDEN") return 403;
	return status >= 400 ? status : 502;
}
function safeNext(value) {
	if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
	return value;
}
//#endregion
export { safeNext as a, requestBackend as i, getSessionUser as n, mismoOrigen as r, authenticate as t };
