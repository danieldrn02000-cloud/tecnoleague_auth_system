import { f as renderHead, p as addAttribute, s as renderSlot, u as renderTemplate, x as createAstro } from "./server_Cc2Qx1PB.mjs";
import { t as createComponent } from "./compiler_D0VRZEIP.mjs";
//#region src/layouts/Layout.astro
createAstro("https://astro.build");
var $$Layout = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Layout;
	const { title, description = "Hardware para quienes compiten por más." } = Astro.props;
	return renderTemplate`<html lang="es-MX"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description"${addAttribute(description, "content")}><meta name="color-scheme" content="dark"><title>${title} | TecnoLeague</title>${renderHead($$result)}</head><body>${renderSlot($$result, $$slots["default"])}</body></html>`;
}, "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/layouts/Layout.astro", void 0);
//#endregion
export { $$Layout as t };
