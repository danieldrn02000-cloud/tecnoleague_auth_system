import { useState } from "react";
import { ArrowRight, KeyRound, Mail, UserRound } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/AuthForm.tsx
function AuthForm({ mode, next, notice = "" }) {
	const registro = mode === "registro";
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	async function enviar(event) {
		event.preventDefault();
		if (busy) return;
		setBusy(true);
		setError("");
		const form = new FormData(event.currentTarget);
		const datos = {
			email: String(form.get("email") ?? "").trim(),
			password: String(form.get("password") ?? "")
		};
		if (registro) datos.nombre = String(form.get("nombre") ?? "").trim();
		try {
			const response = await fetch(registro ? "/api/auth/register" : "/api/auth/login", {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(datos)
			});
			const result = await response.json().catch(() => null);
			if (!response.ok) {
				setError(result?.error ?? "No se pudo validar la cuenta.");
				return;
			}
			window.location.replace(next);
		} catch {
			setError("No se pudo conectar con el servidor. Intenta de nuevo.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsxs("main", {
		className: "auth-page",
		children: [/* @__PURE__ */ jsxs("section", {
			className: "auth-intro",
			children: [
				/* @__PURE__ */ jsxs("a", {
					className: "auth-back",
					href: "/",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						children: "←"
					}), " Volver a la tienda"]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "TECNOLEAGUE / CUENTA"
				}),
				/* @__PURE__ */ jsx("h1", { children: registro ? "Crea tu cuenta." : "Qué bueno verte." }),
				/* @__PURE__ */ jsx("p", { children: registro ? "Guarda tus datos y consulta aquí el historial de tus compras." : "Entra para continuar con tu compra y consultar tus pedidos." })
			]
		}), /* @__PURE__ */ jsxs("section", {
			className: "auth-panel panel",
			"aria-labelledby": "auth-title",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "auth-heading",
					children: [/* @__PURE__ */ jsx("span", {
						className: "auth-symbol",
						"aria-hidden": "true",
						children: registro ? /* @__PURE__ */ jsx(UserRound, { size: 20 }) : /* @__PURE__ */ jsx(KeyRound, { size: 20 })
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "ACCESO SEGURO"
					}), /* @__PURE__ */ jsx("h2", {
						id: "auth-title",
						children: registro ? "Registro" : "Iniciar sesión"
					})] })]
				}),
				notice && /* @__PURE__ */ jsx("p", {
					className: "auth-notice",
					children: notice
				}),
				/* @__PURE__ */ jsxs("form", {
					className: "auth-form",
					onSubmit: enviar,
					children: [
						registro && /* @__PURE__ */ jsxs("label", { children: ["Nombre completo", /* @__PURE__ */ jsx("input", {
							name: "nombre",
							autoComplete: "name",
							required: true,
							minLength: 2,
							maxLength: 120,
							placeholder: "Tu nombre"
						})] }),
						/* @__PURE__ */ jsxs("label", { children: ["Correo electrónico", /* @__PURE__ */ jsxs("span", {
							className: "auth-input-wrap",
							children: [/* @__PURE__ */ jsx(Mail, {
								size: 17,
								"aria-hidden": "true"
							}), /* @__PURE__ */ jsx("input", {
								name: "email",
								type: "email",
								autoComplete: "email",
								required: true,
								maxLength: 150,
								placeholder: "tu@correo.com"
							})]
						})] }),
						/* @__PURE__ */ jsxs("label", { children: ["Contraseña", /* @__PURE__ */ jsxs("span", {
							className: "auth-input-wrap",
							children: [/* @__PURE__ */ jsx(KeyRound, {
								size: 17,
								"aria-hidden": "true"
							}), /* @__PURE__ */ jsx("input", {
								name: "password",
								type: "password",
								autoComplete: registro ? "new-password" : "current-password",
								required: true,
								minLength: registro ? 8 : void 0,
								maxLength: 128,
								placeholder: registro ? "Mínimo 8 caracteres" : "Tu contraseña"
							})]
						})] }),
						error && /* @__PURE__ */ jsx("p", {
							className: "auth-error",
							role: "alert",
							children: error
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "btn full",
							type: "submit",
							disabled: busy,
							children: [busy ? registro ? "Creando cuenta…" : "Verificando…" : registro ? "Crear cuenta" : "Iniciar sesión", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "auth-switch",
					children: [
						registro ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes cuenta?",
						" ",
						/* @__PURE__ */ jsx("a", {
							href: `${registro ? "/iniciar-sesion" : "/registro"}?next=${encodeURIComponent(next)}`,
							children: registro ? "Inicia sesión" : "Regístrate"
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { AuthForm as t };
