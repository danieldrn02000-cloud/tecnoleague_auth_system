import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate, x as createAstro } from "./server_Cc2Qx1PB.mjs";
import { t as createComponent } from "./compiler_D0VRZEIP.mjs";
import { a as safeNext, n as getSessionUser } from "./graphql_BMS1v4EZ.mjs";
import { t as $$Layout } from "./Layout_BpzOXitZ.mjs";
import { t as AuthForm } from "./AuthForm_B8L5Q3Nd.mjs";
//#region src/pages/iniciar-sesion.astro
var iniciar_sesion_exports = /* @__PURE__ */ __exportAll({
	default: () => $$IniciarSesion,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$IniciarSesion = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$IniciarSesion;
	const { user, invalid } = await getSessionUser(Astro.cookies.get("tl_session")?.value);
	if (invalid) Astro.cookies.delete("tl_session", { path: "/" });
	const next = safeNext(Astro.url.searchParams.get("next"));
	const reason = Astro.url.searchParams.get("reason");
	const notice = reason === "checkout" ? "Inicia sesión para completar tu compra." : reason === "pedidos" ? "Inicia sesión para consultar tus pedidos." : reason === "sesion" ? "Tu sesión ya no es válida. Inicia sesión de nuevo." : "";
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Iniciar sesión" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "AuthForm", AuthForm, {
		"client:load": true,
		"mode": "login",
		"next": next,
		"notice": notice,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/components/AuthForm.tsx",
		"client:component-export": "AuthForm"
	})}` })}`;
}, "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/iniciar-sesion.astro", void 0);
var $$file = "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/iniciar-sesion.astro";
var $$url = "/iniciar-sesion";
//#endregion
//#region \0virtual:astro:page:src/pages/iniciar-sesion@_@astro
var page = () => iniciar_sesion_exports;
//#endregion
export { page };
