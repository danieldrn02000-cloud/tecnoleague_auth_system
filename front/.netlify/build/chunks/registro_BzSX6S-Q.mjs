import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate, x as createAstro } from "./server_Cc2Qx1PB.mjs";
import { t as createComponent } from "./compiler_D0VRZEIP.mjs";
import { a as safeNext, n as getSessionUser } from "./graphql_BMS1v4EZ.mjs";
import { t as $$Layout } from "./Layout_BpzOXitZ.mjs";
import { t as AuthForm } from "./AuthForm_B8L5Q3Nd.mjs";
//#region src/pages/registro.astro
var registro_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Registro,
	file: () => $$file,
	url: () => $$url
});
createAstro("https://astro.build");
var $$Registro = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Registro;
	const { user, invalid } = await getSessionUser(Astro.cookies.get("tl_session")?.value);
	if (invalid) Astro.cookies.delete("tl_session", { path: "/" });
	const next = safeNext(Astro.url.searchParams.get("next"));
	if (user) return Astro.redirect(next);
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Crear cuenta" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "AuthForm", AuthForm, {
		"client:load": true,
		"mode": "registro",
		"next": next,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/components/AuthForm.tsx",
		"client:component-export": "AuthForm"
	})}` })}`;
}, "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/registro.astro", void 0);
var $$file = "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/registro.astro";
var $$url = "/registro";
//#endregion
//#region \0virtual:astro:page:src/pages/registro@_@astro
var page = () => registro_exports;
//#endregion
export { page };
