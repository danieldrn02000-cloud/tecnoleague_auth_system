import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { i as renderComponent, u as renderTemplate, x as createAstro } from "./server_Cc2Qx1PB.mjs";
import { t as createComponent } from "./compiler_D0VRZEIP.mjs";
import { n as getSessionUser } from "./graphql_BMS1v4EZ.mjs";
import { t as $$Layout } from "./Layout_BpzOXitZ.mjs";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Box, Check, ChevronDown, ChevronLeft, ChevronRight, Cpu, Gamepad2, Grid2X2, Headphones, Laptop, LogOut, Menu, Minus, Package, Pencil, Plus, RefreshCw, Search, Settings2, ShieldCheck, ShoppingBag, SlidersHorizontal, Trash2, Truck, X, Zap } from "lucide-react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
//#region src/api.ts
var GraphQLError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = "GraphQLError";
	}
};
var redirigiendoAlLogin = false;
var PRODUCTO = "id nombre descripcion precio imagen stock marca especificaciones categoria { id nombre }";
var PEDIDO = `id folio fecha total status nombre email direccion metodoPago detalles { id cantidad nombreProducto precioUnitario subtotal producto { ${PRODUCTO} } }`;
async function graphql(query, variables = {}) {
	let response;
	try {
		response = await fetch("/api/graphql", {
			method: "POST",
			credentials: "same-origin",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query,
				variables
			}),
			signal: AbortSignal.timeout(15e3)
		});
	} catch {
		throw new Error("No hay conexión con la tienda. Comprueba que el servidor esté iniciado y vuelve a intentar.");
	}
	const body = await response.json().catch(() => null);
	if (body?.errors?.length) {
		const fallo = body.errors.find((error) => error.extensions?.code === "UNAUTHENTICATED") ?? body.errors[0];
		const code = fallo.extensions?.code;
		if (code === "UNAUTHENTICATED" && typeof window !== "undefined" && !redirigiendoAlLogin) {
			redirigiendoAlLogin = true;
			const next = window.location.pathname + window.location.search;
			window.dispatchEvent(new Event("tl-sesion-invalida"));
			window.location.replace(`/iniciar-sesion?reason=sesion&next=${encodeURIComponent(next)}`);
			window.location.replace(`/iniciar-sesion?reason=sesion&next=${encodeURIComponent(next)}`);
		}
		throw new GraphQLError(fallo.message, code);
	}
	if (!response.ok || !body?.data) throw new Error("El servidor no pudo responder. Intenta de nuevo en unos segundos.");
	return body.data;
}
function useQuery(query, variables = {}) {
	const key = JSON.stringify(variables);
	const [data, setData] = useState();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [revision, setRevision] = useState(0);
	const retry = useCallback(() => setRevision((n) => n + 1), []);
	useEffect(() => {
		let vigente = true;
		setLoading(true);
		setError("");
		graphql(query, JSON.parse(key)).then((d) => {
			if (vigente) setData(d);
		}).catch((e) => {
			if (vigente) setError(e.message);
		}).finally(() => {
			if (vigente) setLoading(false);
		});
		return () => {
			vigente = false;
		};
	}, [
		query,
		key,
		revision
	]);
	return {
		data,
		loading,
		error,
		retry
	};
}
var dinero = (valor) => new Intl.NumberFormat("es-MX", {
	style: "currency",
	currency: "MXN",
	maximumFractionDigits: 2
}).format(valor);
//#endregion
//#region src/store.tsx
var Contexto = createContext(null);
function recuperar() {
	try {
		const valor = JSON.parse(window.localStorage.getItem("tl-carrito-v1") || "[]");
		return Array.isArray(valor) ? valor.filter((l) => Number.isInteger(l?.producto?.id) && typeof l.producto.nombre === "string" && Number.isFinite(l.producto.precio) && l.producto.categoria && Number.isInteger(l.cantidad) && l.cantidad > 0 && l.cantidad <= 99) : [];
	} catch {
		return [];
	}
}
function CarritoProvider({ children }) {
	const [lineas, setLineas] = useState([]);
	const [listo, setListo] = useState(false);
	useEffect(() => {
		setLineas(recuperar());
		setListo(true);
	}, []);
	useEffect(() => {
		if (!listo) return;
		try {
			window.localStorage.setItem("tl-carrito-v1", JSON.stringify(lineas));
		} catch {}
	}, [lineas, listo]);
	function agregar(producto, cantidad = 1) {
		if (producto.stock < 1) return;
		setLineas((prev) => {
			const existe = prev.find((l) => l.producto.id === producto.id);
			const n = Math.min(99, producto.stock, (existe?.cantidad || 0) + cantidad);
			return existe ? prev.map((l) => l.producto.id === producto.id ? {
				producto,
				cantidad: n
			} : l) : [...prev, {
				producto,
				cantidad: n
			}];
		});
	}
	function cambiar(id, n) {
		setLineas((prev) => prev.map((l) => l.producto.id === id ? {
			...l,
			cantidad: Math.max(1, Math.min(99, l.producto.stock || 1, n))
		} : l));
	}
	function sincronizar(productos) {
		setLineas((prev) => prev.map((l) => ({
			...l,
			producto: productos.find((p) => p.id === l.producto.id) ?? {
				...l.producto,
				stock: 0
			}
		})));
	}
	return /* @__PURE__ */ jsx(Contexto.Provider, {
		value: {
			lineas,
			agregar,
			cambiar,
			quitar: (id) => setLineas((p) => p.filter((l) => l.producto.id !== id)),
			vaciar: () => setLineas([]),
			sincronizar,
			total: lineas.reduce((s, l) => s + Math.round(l.producto.precio * 100) * l.cantidad, 0) / 100,
			unidades: lineas.reduce((s, l) => s + l.cantidad, 0)
		},
		children
	});
}
function useCarrito() {
	const c = useContext(Contexto);
	if (!c) throw new Error("Falta CarritoProvider");
	return c;
}
//#endregion
//#region src/components/ui.tsx
function Imagen({ producto, className = "" }) {
	const [error, setError] = useState(false);
	return error ? /* @__PURE__ */ jsxs("div", {
		className: `imagen-fallback ${className}`,
		children: [/* @__PURE__ */ jsx(Box, { size: 44 }), /* @__PURE__ */ jsx("span", { children: producto.nombre })]
	}) : /* @__PURE__ */ jsx("img", {
		className,
		src: producto.imagen,
		alt: producto.nombre,
		loading: "lazy",
		onError: () => setError(true)
	});
}
function ErrorCarga({ mensaje, reintentar }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "estado panel",
		role: "alert",
		children: [
			/* @__PURE__ */ jsx(RefreshCw, { size: 30 }),
			/* @__PURE__ */ jsx("h2", { children: "No pudimos cargar la información" }),
			/* @__PURE__ */ jsx("p", { children: mensaje }),
			/* @__PURE__ */ jsxs("button", {
				className: "btn",
				onClick: reintentar,
				children: [/* @__PURE__ */ jsx(RefreshCw, { size: 17 }), " Reintentar"]
			})
		]
	});
}
function Cargando({ tarjetas = false }) {
	return /* @__PURE__ */ jsx("div", {
		"aria-label": "Cargando información",
		"aria-busy": "true",
		className: tarjetas ? "productos-grid" : "carga-bloque",
		children: Array.from({ length: tarjetas ? 6 : 3 }, (_, i) => /* @__PURE__ */ jsxs("div", {
			className: "skeleton",
			children: [
				/* @__PURE__ */ jsx("div", {}),
				/* @__PURE__ */ jsx("span", {}),
				/* @__PURE__ */ jsx("span", {})
			]
		}, i))
	});
}
function Vacio({ titulo, texto, accion, onClick }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "estado panel",
		children: [
			/* @__PURE__ */ jsx(ShoppingBag, { size: 40 }),
			/* @__PURE__ */ jsx("h2", { children: titulo }),
			/* @__PURE__ */ jsx("p", { children: texto }),
			/* @__PURE__ */ jsxs("button", {
				className: "btn",
				onClick,
				children: [accion, /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
			})
		]
	});
}
function Cantidad({ valor, max, onChange }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "cantidad",
		children: [
			/* @__PURE__ */ jsx("button", {
				"aria-label": "Disminuir cantidad",
				disabled: valor <= 1,
				onClick: () => onChange(valor - 1),
				children: /* @__PURE__ */ jsx(Minus, { size: 15 })
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-live": "polite",
				children: valor
			}),
			/* @__PURE__ */ jsx("button", {
				"aria-label": "Aumentar cantidad",
				disabled: valor >= Math.min(max, 99),
				onClick: () => onChange(valor + 1),
				children: /* @__PURE__ */ jsx(Plus, { size: 15 })
			})
		]
	});
}
function TarjetaProducto({ producto: p, navegar, agregar }) {
	return /* @__PURE__ */ jsxs("article", {
		className: "producto-card group",
		children: [/* @__PURE__ */ jsxs("button", {
			className: "producto-imagen",
			onClick: () => navegar({
				tipo: "producto",
				id: p.id
			}),
			"aria-label": `Ver ${p.nombre}`,
			children: [/* @__PURE__ */ jsx(Imagen, { producto: p }), /* @__PURE__ */ jsx("span", {
				className: `stock-badge ${p.stock ? "" : "agotado"}`,
				children: p.stock ? "Disponible" : "Agotado"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "producto-info",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow muted",
					children: p.marca
				}),
				/* @__PURE__ */ jsx("button", {
					className: "producto-nombre",
					onClick: () => navegar({
						tipo: "producto",
						id: p.id
					}),
					children: p.nombre
				}),
				/* @__PURE__ */ jsx("p", { children: p.categoria.nombre }),
				/* @__PURE__ */ jsxs("div", {
					className: "producto-bottom",
					children: [/* @__PURE__ */ jsxs("strong", { children: [
						dinero(p.precio),
						" ",
						/* @__PURE__ */ jsx("small", { children: "MXN" })
					] }), /* @__PURE__ */ jsx("button", {
						className: "add-btn",
						disabled: !p.stock,
						"aria-label": `Agregar ${p.nombre} al carrito`,
						onClick: () => agregar(p),
						children: /* @__PURE__ */ jsx(Plus, { size: 20 })
					})]
				})
			]
		})]
	});
}
function Modal({ titulo, onClose, children }) {
	const ref = useRef(null);
	useEffect(() => {
		ref.current?.showModal();
		const old = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = old;
		};
	}, []);
	return createPortal(/* @__PURE__ */ jsxs("dialog", {
		ref,
		className: "modal",
		onCancel: onClose,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "modal-head",
			children: [/* @__PURE__ */ jsx("h2", { children: titulo }), /* @__PURE__ */ jsx("button", {
				className: "icon-btn",
				onClick: onClose,
				"aria-label": "Cerrar",
				children: /* @__PURE__ */ jsx(X, {})
			})]
		}), children]
	}), document.body);
}
//#endregion
//#region src/screens/Catalogo.tsx
var CONSULTA$2 = `query Catalogo($buscar:String,$categoriaId:Int,$limite:Int,$desde:Int,$orden:OrdenProducto){productos(buscar:$buscar,categoriaId:$categoriaId,limite:$limite,desde:$desde,orden:$orden){total items{${PRODUCTO}}}}`;
function Catalogo({ inicio, categoriaId, categoriaNombre, buscar, navegar, agregar }) {
	const [pagina, setPagina] = useState(0);
	const [orden, setOrden] = useState("RECIENTES");
	const { data, loading, error, retry } = useQuery(CONSULTA$2, {
		buscar,
		categoriaId,
		limite: inicio ? 6 : 8,
		desde: pagina * (inicio ? 6 : 8),
		orden
	});
	const total = data?.productos.total || 0;
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		inicio && /* @__PURE__ */ jsxs("section", {
			className: "hero",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "hero-copy",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "eyebrow",
						children: "TU PRÓXIMA PARTIDA EMPIEZA AQUÍ"
					}),
					/* @__PURE__ */ jsxs("h1", { children: [
						"Tu setup.",
						/* @__PURE__ */ jsx("br", {}),
						"Tu siguiente ",
						/* @__PURE__ */ jsx("em", { children: "nivel." })
					] }),
					/* @__PURE__ */ jsxs("p", { children: [
						"Hardware y accesorios para jugar,",
						/* @__PURE__ */ jsx("br", { className: "desktop-br" }),
						" crear y competir a tu manera."
					] }),
					/* @__PURE__ */ jsxs("button", {
						className: "btn",
						onClick: () => navegar({ tipo: "catalogo" }),
						children: ["Explorar catálogo ", /* @__PURE__ */ jsx(ArrowRight, { size: 18 })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "hero-meta",
						children: [/* @__PURE__ */ jsx("span", { children: "01 — HARDWARE" }), /* @__PURE__ */ jsx("span", { children: "02 — GAMING" })]
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "hero-image",
				children: [/* @__PURE__ */ jsx("img", {
					src: "/images/laptop.jpg",
					alt: "Laptop y accesorios en un escritorio gaming"
				}), /* @__PURE__ */ jsxs("div", {
					className: "hero-image-label",
					children: [/* @__PURE__ */ jsx("span", { children: "EL SIGUIENTE NIVEL ES TUYO" }), /* @__PURE__ */ jsx("strong", { children: "PLAY. CREATE. REPEAT." })]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: inicio ? "SELECCIÓN TECNOLEAGUE" : categoriaNombre ? "EXPLORA LA CATEGORÍA" : "ENCUENTRA TU PRÓXIMO UPGRADE"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: inicio ? "small-title" : "",
					children: inicio ? "Equipa tu próxima victoria" : categoriaNombre || "Catálogo"
				}),
				/* @__PURE__ */ jsx("p", { children: buscar ? `Resultados para “${buscar}”` : inicio ? "Elige lo que le falta a tu escritorio." : `${total} productos · Precios en MXN` })
			] }), inicio ? /* @__PURE__ */ jsxs("button", {
				className: "text-btn",
				onClick: () => navegar({ tipo: "catalogo" }),
				children: ["Ver todo ", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
			}) : /* @__PURE__ */ jsxs("label", {
				className: "orden",
				children: [
					/* @__PURE__ */ jsx(SlidersHorizontal, { size: 16 }),
					/* @__PURE__ */ jsx("span", {
						className: "sr-only",
						children: "Ordenar productos"
					}),
					/* @__PURE__ */ jsxs("select", {
						value: orden,
						onChange: (e) => {
							setOrden(e.target.value);
							setPagina(0);
						},
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "RECIENTES",
								children: "Destacados"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "PRECIO_ASC",
								children: "Menor precio"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "PRECIO_DESC",
								children: "Mayor precio"
							})
						]
					})
				]
			})]
		}),
		error ? /* @__PURE__ */ jsx(ErrorCarga, {
			mensaje: error,
			reintentar: retry
		}) : loading ? /* @__PURE__ */ jsx(Cargando, { tarjetas: true }) : !total ? /* @__PURE__ */ jsx(Vacio, {
			titulo: "No encontramos productos",
			texto: "Prueba otra búsqueda o consulta todas las categorías.",
			accion: "Ver catálogo completo",
			onClick: () => navegar({ tipo: "catalogo" })
		}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
			className: "productos-grid",
			children: data?.productos.items.map((p) => /* @__PURE__ */ jsx(TarjetaProducto, {
				producto: p,
				navegar,
				agregar
			}, p.id))
		}), !inicio && total > 8 && /* @__PURE__ */ jsxs("div", {
			className: "paginacion",
			children: [
				/* @__PURE__ */ jsxs("button", {
					className: "btn btn-secondary",
					disabled: !pagina,
					onClick: () => setPagina((p) => p - 1),
					children: [/* @__PURE__ */ jsx(ChevronLeft, { size: 17 }), " Anterior"]
				}),
				/* @__PURE__ */ jsxs("span", { children: [
					"Página ",
					pagina + 1,
					" de ",
					Math.ceil(total / 8)
				] }),
				/* @__PURE__ */ jsxs("button", {
					className: "btn btn-secondary",
					disabled: (pagina + 1) * 8 >= total,
					onClick: () => setPagina((p) => p + 1),
					children: ["Siguiente ", /* @__PURE__ */ jsx(ChevronRight, { size: 17 })]
				})
			]
		})] }),
		inicio && /* @__PURE__ */ jsxs("aside", {
			className: "contexto",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "TODO EN UN SOLO LUGAR"
				}),
				/* @__PURE__ */ jsx("h2", { children: "Haz espacio para lo que viene." }),
				/* @__PURE__ */ jsx("p", { children: "Encuentra el complemento ideal para tu equipo." })
			] }), /* @__PURE__ */ jsxs("button", {
				className: "btn btn-secondary",
				onClick: () => navegar({
					tipo: "catalogo",
					categoriaId: 3
				}),
				children: ["Ver periféricos ", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
			})]
		})
	] });
}
//#endregion
//#region src/screens/Detalle.tsx
var CONSULTA$1 = `query Detalle($id:Int!){producto(id:$id){${PRODUCTO}}}`;
function Detalle({ id, navegar, avisar }) {
	const { data, error, loading, retry } = useQuery(CONSULTA$1, { id });
	const [cantidad, setCantidad] = useState(1);
	const { agregar, lineas } = useCarrito();
	if (error) return /* @__PURE__ */ jsx(ErrorCarga, {
		mensaje: error,
		reintentar: retry
	});
	if (loading || !data) return /* @__PURE__ */ jsx(Cargando, {});
	const p = data.producto;
	const enCarrito = lineas.find((l) => l.producto.id === id)?.cantidad || 0;
	const disponible = Math.min(99, p.stock) - enCarrito;
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("button", {
		className: "back-link",
		onClick: () => navegar({
			tipo: "catalogo",
			categoriaId: p.categoria.id
		}),
		children: [
			/* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
			" Volver a ",
			p.categoria.nombre
		]
	}), /* @__PURE__ */ jsxs("div", {
		className: "detalle-grid",
		children: [/* @__PURE__ */ jsx("div", {
			className: "detalle-imagen panel",
			children: /* @__PURE__ */ jsx(Imagen, { producto: p })
		}), /* @__PURE__ */ jsxs("section", {
			className: "detalle-info",
			children: [
				/* @__PURE__ */ jsxs("span", {
					className: "eyebrow",
					children: [
						p.marca,
						" / ",
						p.categoria.nombre
					]
				}),
				/* @__PURE__ */ jsx("h1", { children: p.nombre }),
				/* @__PURE__ */ jsx("span", {
					className: `stock-text ${p.stock ? "" : "danger"}`,
					children: p.stock ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
						/* @__PURE__ */ jsx(Check, { size: 16 }),
						" ",
						p.stock,
						" disponibles"
					] }) : "Temporalmente agotado"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "detalle-descripcion",
					children: p.descripcion
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "detalle-precio",
					children: [
						dinero(p.precio),
						" ",
						/* @__PURE__ */ jsx("small", { children: "MXN" })
					]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "muted",
					children: "Envío de demostración sin costo adicional."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "detalle-compra",
					children: [/* @__PURE__ */ jsx(Cantidad, {
						valor: Math.min(cantidad, disponible) || 1,
						max: disponible,
						onChange: setCantidad
					}), /* @__PURE__ */ jsxs("button", {
						className: "btn",
						disabled: disponible < 1,
						onClick: () => {
							agregar(p, Math.min(cantidad, disponible));
							avisar(`${p.nombre} agregado al carrito`);
							navegar({ tipo: "carrito" });
						},
						children: [/* @__PURE__ */ jsx(ShoppingBag, { size: 18 }), p.stock ? disponible ? "Agregar al carrito" : "Ya agregaste el stock disponible" : "Sin existencias"]
					})]
				}),
				/* @__PURE__ */ jsxs("button", {
					className: "text-btn",
					onClick: () => navegar({ tipo: "carrito" }),
					children: ["Ver mi carrito ", /* @__PURE__ */ jsx(ArrowRight, { size: 16 })]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "especificaciones",
					children: [/* @__PURE__ */ jsx("h2", { children: "Lo que necesitas saber" }), p.especificaciones.split(";").map((s, i) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Check, { size: 15 }), /* @__PURE__ */ jsx("span", { children: s })] }, i))]
				})
			]
		})]
	})] });
}
//#endregion
//#region src/screens/Carrito.tsx
function Resumen({ children }) {
	const { total, unidades } = useCarrito();
	return /* @__PURE__ */ jsxs("aside", {
		className: "resumen panel",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "TU SELECCIÓN"
			}),
			/* @__PURE__ */ jsx("h2", { children: "Resumen del pedido" }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", { children: [
				"Subtotal (",
				unidades,
				" artículos)"
			] }), /* @__PURE__ */ jsx("strong", { children: dinero(total) })] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", { children: "Envío de demostración" }), /* @__PURE__ */ jsx("strong", {
				className: "accent",
				children: "Sin costo"
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: "resumen-total",
				children: [/* @__PURE__ */ jsx("span", { children: "Total" }), /* @__PURE__ */ jsxs("strong", { children: [
					dinero(total),
					" ",
					/* @__PURE__ */ jsx("small", { children: "MXN" })
				] })]
			}),
			children,
			/* @__PURE__ */ jsxs("p", {
				className: "resumen-nota",
				children: [/* @__PURE__ */ jsx(ShieldCheck, { size: 18 }), " Compra de demostración. No se realizan cargos reales."]
			})
		]
	});
}
function Carrito({ navegar }) {
	const { lineas, cambiar, quitar, sincronizar } = useCarrito();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [revision, setRevision] = useState(0);
	const initial = useRef({
		lineas,
		sincronizar
	});
	useEffect(() => {
		let alive = true;
		setLoading(true);
		setError("");
		const { lineas, sincronizar } = initial.current;
		Promise.all(lineas.map(async (l) => {
			try {
				return (await graphql(`query($id:Int!){producto(id:$id){${PRODUCTO}}}`, { id: l.producto.id })).producto;
			} catch (e) {
				if (e instanceof Error && e.message.includes("ya no está disponible")) return {
					...l.producto,
					stock: 0
				};
				throw e;
			}
		})).then((p) => {
			if (alive) sincronizar(p);
		}).catch((e) => {
			if (alive) setError(e.message);
		}).finally(() => {
			if (alive) setLoading(false);
		});
		return () => {
			alive = false;
		};
	}, [revision]);
	if (!lineas.length) return /* @__PURE__ */ jsx(Vacio, {
		titulo: "Tu carrito está esperando",
		texto: "Explora el catálogo y encuentra tu próximo upgrade.",
		accion: "Explorar catálogo",
		onClick: () => navegar({ tipo: "catalogo" })
	});
	const invalido = lineas.some((l) => l.cantidad > l.producto.stock);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "CASI ES TUYO"
				}),
				/* @__PURE__ */ jsx("h1", { children: "Tu carrito" }),
				/* @__PURE__ */ jsxs("p", { children: [lineas.length, " productos elegidos para tu setup."] })
			] }), /* @__PURE__ */ jsxs("button", {
				className: "text-btn",
				onClick: () => navegar({ tipo: "catalogo" }),
				children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 16 }), " Seguir comprando"]
			})]
		}),
		error && /* @__PURE__ */ jsx(ErrorCarga, {
			mensaje: error,
			reintentar: () => setRevision((n) => n + 1)
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "compra-grid",
			children: [/* @__PURE__ */ jsx("div", {
				className: "carrito-lista panel",
				children: lineas.map(({ producto: p, cantidad }) => /* @__PURE__ */ jsxs("article", {
					className: "carrito-linea",
					children: [
						/* @__PURE__ */ jsx("button", {
							className: "mini-imagen",
							onClick: () => navegar({
								tipo: "producto",
								id: p.id
							}),
							children: /* @__PURE__ */ jsx(Imagen, { producto: p })
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "linea-info",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "eyebrow muted",
									children: p.marca
								}),
								/* @__PURE__ */ jsx("button", {
									className: "producto-nombre",
									onClick: () => navegar({
										tipo: "producto",
										id: p.id
									}),
									children: p.nombre
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "muted",
									children: [dinero(p.precio), " por unidad"]
								}),
								cantidad > p.stock && /* @__PURE__ */ jsx("span", {
									className: "danger",
									children: p.stock ? `Solo quedan ${p.stock}. Ajusta la cantidad.` : "Agotado. Retira este producto."
								})
							]
						}),
						/* @__PURE__ */ jsx(Cantidad, {
							valor: cantidad,
							max: p.stock,
							onChange: (n) => cambiar(p.id, n)
						}),
						/* @__PURE__ */ jsx("strong", { children: dinero(p.precio * cantidad) }),
						/* @__PURE__ */ jsx("button", {
							className: "icon-btn",
							"aria-label": `Quitar ${p.nombre}`,
							onClick: () => quitar(p.id),
							children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
						})
					]
				}, p.id))
			}), /* @__PURE__ */ jsxs(Resumen, { children: [/* @__PURE__ */ jsxs("button", {
				className: "btn full",
				disabled: loading || !!error || invalido,
				onClick: () => navegar({ tipo: "checkout" }),
				children: [loading ? "Actualizando precios…" : "Continuar al checkout", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
			}), invalido && /* @__PURE__ */ jsx("p", {
				className: "danger",
				children: "Revisa la disponibilidad antes de continuar."
			})] })]
		})
	] });
}
//#endregion
//#region src/screens/Checkout.tsx
function Checkout({ currentUser, navegar, completado }) {
	const { lineas, vaciar } = useCarrito();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const bloqueado = useRef(false);
	const solicitud = useRef({
		contenido: "",
		clave: ""
	});
	if (!lineas.length) return /* @__PURE__ */ jsx(Vacio, {
		titulo: "No hay productos en el carrito",
		texto: "Agrega un producto para continuar.",
		accion: "Ver catálogo",
		onClick: () => navegar({ tipo: "catalogo" })
	});
	async function enviar(e) {
		e.preventDefault();
		if (bloqueado.current) return;
		bloqueado.current = true;
		setBusy(true);
		setError("");
		const form = new FormData(e.currentTarget);
		const payload = {
			nombre: String(form.get("nombre")).trim(),
			email: String(form.get("email")).trim(),
			direccion: String(form.get("direccion")).trim(),
			renglones: lineas.map((l) => ({
				productoId: l.producto.id,
				cantidad: l.cantidad
			}))
		};
		const contenido = JSON.stringify(payload);
		if (solicitud.current.contenido !== contenido) solicitud.current = {
			contenido,
			clave: crypto.randomUUID()
		};
		try {
			const { crearPedido } = await graphql(`mutation Comprar($datos:PedidoInput!){crearPedido(datos:$datos){${PEDIDO}}}`, { datos: {
				...payload,
				claveSolicitud: solicitud.current.clave
			} });
			vaciar();
			completado(crearPedido);
		} catch (e) {
			setError(e instanceof Error ? e.message : "No se pudo registrar el pedido.");
		} finally {
			bloqueado.current = false;
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("button", {
			className: "back-link",
			disabled: busy,
			onClick: () => navegar({ tipo: "carrito" }),
			children: [/* @__PURE__ */ jsx(ArrowLeft, { size: 16 }), " Volver al carrito"]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "EL ÚLTIMO PASO"
				}),
				/* @__PURE__ */ jsx("h1", { children: "Finaliza tu pedido" }),
				/* @__PURE__ */ jsx("p", { children: "Usa datos ficticios para presentar esta compra de demostración." })
			] }), /* @__PURE__ */ jsxs("div", {
				className: "checkout-steps",
				children: [/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx(Check, { size: 14 }), " Carrito"] }), /* @__PURE__ */ jsx("span", {
					className: "accent",
					children: "02 — Confirmación"
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("form", {
			className: "compra-grid",
			onSubmit: enviar,
			children: [/* @__PURE__ */ jsxs("div", {
				className: "checkout-form panel",
				children: [
					/* @__PURE__ */ jsxs("h2", { children: [/* @__PURE__ */ jsx(Truck, { size: 22 }), " Datos de entrega"] }),
					/* @__PURE__ */ jsxs("fieldset", {
						disabled: busy,
						children: [
							/* @__PURE__ */ jsxs("label", { children: ["Nombre completo", /* @__PURE__ */ jsx("input", {
								name: "nombre",
								autoComplete: "name",
								required: true,
								minLength: 2,
								maxLength: 120,
								defaultValue: currentUser.nombre,
								placeholder: "Ej. Daniel Durán"
							})] }),
							/* @__PURE__ */ jsxs("label", { children: ["Correo electrónico", /* @__PURE__ */ jsx("input", {
								name: "email",
								type: "email",
								autoComplete: "email",
								required: true,
								maxLength: 150,
								defaultValue: currentUser.email,
								placeholder: "daniel@ejemplo.test"
							})] }),
							/* @__PURE__ */ jsxs("label", { children: ["Dirección de entrega", /* @__PURE__ */ jsx("textarea", {
								name: "direccion",
								autoComplete: "street-address",
								required: true,
								minLength: 10,
								maxLength: 500,
								rows: 3,
								placeholder: "Calle, número, colonia, ciudad y código postal"
							})] })
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "pago",
						children: [
							/* @__PURE__ */ jsx(Package, { size: 23 }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("strong", { children: "Pago al recibir" }), /* @__PURE__ */ jsx("p", { children: "Pedido académico. Sin tarjetas, cobros ni envíos reales." })] }),
							/* @__PURE__ */ jsx(Check, { size: 18 })
						]
					}),
					error && /* @__PURE__ */ jsxs("div", {
						className: "form-error",
						role: "alert",
						children: [error, /* @__PURE__ */ jsx("button", {
							type: "button",
							className: "text-btn",
							onClick: () => navegar({ tipo: "carrito" }),
							children: "Revisar carrito"
						})]
					})
				]
			}), /* @__PURE__ */ jsxs(Resumen, { children: [/* @__PURE__ */ jsxs("button", {
				type: "submit",
				className: "btn full",
				disabled: busy,
				children: [busy ? "Registrando pedido…" : "Confirmar pedido", /* @__PURE__ */ jsx(Check, { size: 18 })]
			}), /* @__PURE__ */ jsx("p", {
				className: "muted text-sm",
				children: "El servidor valida existencias y calcula el total al confirmar."
			})] })]
		})
	] });
}
//#endregion
//#region src/screens/Pedidos.tsx
function Pedidos({ navegar }) {
	const { data, loading, error, retry } = useQuery(`query Historial{pedidos{${PEDIDO}}}`);
	const [abierto, setAbierto] = useState(null);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
		className: "section-heading",
		children: [/* @__PURE__ */ jsxs("div", { children: [
			/* @__PURE__ */ jsx("span", {
				className: "eyebrow",
				children: "HISTORIAL"
			}),
			/* @__PURE__ */ jsx("h1", { children: "Mis pedidos" }),
			/* @__PURE__ */ jsx("p", { children: "Consulta los detalles de tus compras de demostración." })
		] }), /* @__PURE__ */ jsxs("button", {
			className: "text-btn",
			onClick: () => navegar({ tipo: "catalogo" }),
			children: ["Seguir comprando ", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
		})]
	}), error ? /* @__PURE__ */ jsx(ErrorCarga, {
		mensaje: error,
		reintentar: retry
	}) : loading ? /* @__PURE__ */ jsx(Cargando, {}) : !data?.pedidos.length ? /* @__PURE__ */ jsx(Vacio, {
		titulo: "Todavía no tienes pedidos",
		texto: "Tu primera compra aparecerá aquí cuando la confirmes.",
		accion: "Explorar catálogo",
		onClick: () => navegar({ tipo: "catalogo" })
	}) : /* @__PURE__ */ jsx("div", {
		className: "pedidos-lista",
		children: data.pedidos.map((p) => /* @__PURE__ */ jsxs("article", {
			className: "pedido panel",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "pedido-head",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("h2", { children: ["Pedido ", p.folio] }), /* @__PURE__ */ jsx("time", {
						dateTime: p.fecha,
						children: new Date(p.fecha).toLocaleDateString("es-MX", {
							day: "numeric",
							month: "long",
							year: "numeric"
						})
					})] }), /* @__PURE__ */ jsxs("span", {
						className: "stock-text",
						children: [/* @__PURE__ */ jsx(Check, { size: 16 }), {
							CONFIRMADO: "Confirmado",
							PREPARANDO: "Preparando",
							ENTREGADO: "Entregado"
						}[p.status]]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "pedido-resumen",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "pedido-icon",
							children: /* @__PURE__ */ jsx(Package, { size: 24 })
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("strong", { children: [p.detalles.reduce((s, d) => s + d.cantidad, 0), " artículos"] }), /* @__PURE__ */ jsx("p", { children: "Pago al recibir · Sin cobro real" })] }),
						/* @__PURE__ */ jsxs("strong", {
							className: "pedido-total",
							children: [
								dinero(p.total),
								" ",
								/* @__PURE__ */ jsx("small", { children: "MXN" })
							]
						}),
						/* @__PURE__ */ jsxs("button", {
							className: "text-btn",
							"aria-expanded": abierto === p.id,
							onClick: () => setAbierto(abierto === p.id ? null : p.id),
							children: [abierto === p.id ? "Ocultar" : "Ver detalles", /* @__PURE__ */ jsx(ChevronDown, { size: 17 })]
						})
					]
				}),
				abierto === p.id && /* @__PURE__ */ jsxs("div", {
					className: "pedido-detalles",
					children: [p.detalles.map((d) => /* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx(Imagen, { producto: d.producto }),
						/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", { children: d.nombreProducto }), /* @__PURE__ */ jsxs("small", { children: [
							d.cantidad,
							" × ",
							dinero(d.precioUnitario)
						] })] }),
						/* @__PURE__ */ jsx("strong", { children: dinero(d.subtotal) })
					] }, d.id)), /* @__PURE__ */ jsxs("p", { children: [
						"Entrega para ",
						/* @__PURE__ */ jsx("strong", { children: p.nombre }),
						" · ",
						p.direccion
					] })]
				})
			]
		}, p.id))
	})] });
}
//#endregion
//#region src/screens/Admin.tsx
var CONSULTA = `query Inventario{productos(limite:100){total items{${PRODUCTO}}} categorias{id nombre}}`;
function Admin({ avisar }) {
	const { data, loading, error, retry } = useQuery("query AccesoAdmin { verificarAdmin }");
	if (loading) return /* @__PURE__ */ jsx(Cargando, {});
	if (error) return /* @__PURE__ */ jsxs("div", {
		className: "admin-login panel",
		children: [
			/* @__PURE__ */ jsx("h1", { children: "Acceso a administración" }),
			/* @__PURE__ */ jsx(ErrorCarga, {
				mensaje: error,
				reintentar: retry
			}),
			/* @__PURE__ */ jsx("p", { children: "Para administrar productos necesitas una cuenta con rol ADMIN." }),
			/* @__PURE__ */ jsx("a", {
				className: "btn btn-secondary",
				href: "/iniciar-sesion",
				children: "Iniciar sesión"
			})
		]
	});
	if (!data?.verificarAdmin) return /* @__PURE__ */ jsx("p", {
		role: "alert",
		children: "No tienes permiso para acceder al inventario."
	});
	return /* @__PURE__ */ jsx(Inventario, { avisar });
}
function Inventario({ avisar }) {
	const { data, loading, error, retry } = useQuery(CONSULTA);
	const [editor, setEditor] = useState(null);
	const [mutationError, setMutationError] = useState("");
	const [borrando, setBorrando] = useState(null);
	const [pagina, setPagina] = useState(0);
	const [filtrar, setFiltrar] = useState("");
	async function eliminar(p) {
		if (!confirm(`¿Dar de baja ${p.nombre}? Se conservará en los pedidos anteriores.`)) return;
		setBorrando(p.id);
		setMutationError("");
		try {
			await graphql("mutation($id:Int!){eliminarProducto(id:$id)}", { id: p.id });
			avisar("Producto dado de baja");
			retry();
		} catch (e) {
			setMutationError(e.message);
		} finally {
			setBorrando(null);
		}
	}
	const productos = (data?.productos.items || []).filter((p) => p.nombre.toLowerCase().includes(filtrar.toLowerCase()));
	useEffect(() => {
		if (pagina > 0 && pagina * 8 >= productos.length) setPagina(0);
	}, [productos.length, pagina]);
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("span", {
					className: "eyebrow",
					children: "PANEL DE CONTROL"
				}),
				/* @__PURE__ */ jsx("h1", { children: "Inventario" }),
				/* @__PURE__ */ jsx("p", { children: "Administra los productos que aparecen en el catálogo." })
			] }), /* @__PURE__ */ jsxs("div", {
				className: "flex gap-3",
				children: [/* @__PURE__ */ jsx("form", {
					action: "/api/auth/logout",
					method: "post",
					children: /* @__PURE__ */ jsxs("button", {
						className: "btn btn-secondary",
						type: "submit",
						children: [/* @__PURE__ */ jsx(LogOut, { size: 16 }), " Cerrar sesión"]
					})
				}), /* @__PURE__ */ jsxs("button", {
					className: "btn",
					onClick: () => setEditor("nuevo"),
					children: [/* @__PURE__ */ jsx(Plus, { size: 18 }), " Nuevo producto"]
				})]
			})]
		}),
		mutationError && /* @__PURE__ */ jsx("p", {
			role: "alert",
			className: "form-error",
			children: mutationError
		}),
		error ? /* @__PURE__ */ jsx(ErrorCarga, {
			mensaje: error,
			reintentar: retry
		}) : loading ? /* @__PURE__ */ jsx(Cargando, {}) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs("div", {
				className: "admin-stats",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "panel",
						children: [/* @__PURE__ */ jsx("span", { children: "Productos activos" }), /* @__PURE__ */ jsx("strong", { children: data?.productos.total })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "panel",
						children: [/* @__PURE__ */ jsx("span", { children: "Unidades en inventario" }), /* @__PURE__ */ jsx("strong", { children: data?.productos.items.reduce((s, p) => s + p.stock, 0) })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "panel",
						children: [/* @__PURE__ */ jsx("span", { children: "Sin existencias" }), /* @__PURE__ */ jsx("strong", { children: data?.productos.items.filter((p) => p.stock === 0).length })]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "admin-tools",
				children: [/* @__PURE__ */ jsxs("label", { children: [/* @__PURE__ */ jsx("span", {
					className: "sr-only",
					children: "Buscar en inventario"
				}), /* @__PURE__ */ jsx("input", {
					placeholder: "Buscar producto…",
					value: filtrar,
					onChange: (e) => {
						setFiltrar(e.target.value);
						setPagina(0);
					}
				})] }), /* @__PURE__ */ jsxs("span", {
					className: "muted",
					children: [productos.length, " productos en esta vista"]
				})]
			}),
			(data?.productos.total || 0) > 100 && /* @__PURE__ */ jsx("p", {
				className: "muted",
				children: "Esta vista muestra los primeros 100 productos activos."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "table-wrap panel",
				children: [/* @__PURE__ */ jsxs("table", { children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
					/* @__PURE__ */ jsx("th", { children: "Producto" }),
					/* @__PURE__ */ jsx("th", { children: "Categoría" }),
					/* @__PURE__ */ jsx("th", { children: "Precio" }),
					/* @__PURE__ */ jsx("th", { children: "Stock" }),
					/* @__PURE__ */ jsx("th", { children: "Acciones" })
				] }) }), /* @__PURE__ */ jsx("tbody", { children: productos.slice(pagina * 8, pagina * 8 + 8).map((p) => /* @__PURE__ */ jsxs("tr", { children: [
					/* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", {
						className: "tabla-producto",
						children: [/* @__PURE__ */ jsx(Imagen, { producto: p }), /* @__PURE__ */ jsxs("span", { children: [p.nombre, /* @__PURE__ */ jsx("small", { children: p.marca })] })]
					}) }),
					/* @__PURE__ */ jsx("td", { children: p.categoria.nombre }),
					/* @__PURE__ */ jsx("td", { children: dinero(p.precio) }),
					/* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", {
						className: p.stock ? "" : "danger",
						children: [p.stock, " unidades"]
					}) }),
					/* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ jsx("button", {
							className: "icon-btn",
							onClick: () => setEditor(p),
							"aria-label": `Editar ${p.nombre}`,
							children: /* @__PURE__ */ jsx(Pencil, { size: 17 })
						}), /* @__PURE__ */ jsx("button", {
							className: "icon-btn danger",
							disabled: borrando !== null,
							onClick: () => eliminar(p),
							"aria-label": `Eliminar ${p.nombre}`,
							children: /* @__PURE__ */ jsx(Trash2, { size: 17 })
						})]
					}) })
				] }, p.id)) })] }), !productos.length && /* @__PURE__ */ jsx("p", {
					className: "p-8 muted",
					children: "No hay productos con ese nombre."
				})]
			}),
			productos.length > 8 && /* @__PURE__ */ jsxs("div", {
				className: "paginacion",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn btn-secondary",
						disabled: !pagina,
						onClick: () => setPagina((p) => p - 1),
						children: "Anterior"
					}),
					/* @__PURE__ */ jsxs("span", { children: [
						pagina + 1,
						" / ",
						Math.ceil(productos.length / 8)
					] }),
					/* @__PURE__ */ jsx("button", {
						className: "btn btn-secondary",
						disabled: (pagina + 1) * 8 >= productos.length,
						onClick: () => setPagina((p) => p + 1),
						children: "Siguiente"
					})
				]
			})
		] }),
		editor && data && /* @__PURE__ */ jsx(Editor, {
			producto: editor === "nuevo" ? void 0 : editor,
			categorias: data.categorias,
			cerrar: () => setEditor(null),
			guardado: () => {
				setEditor(null);
				retry();
				avisar("Producto guardado correctamente");
			}
		}, typeof editor === "string" ? editor : editor.id)
	] });
}
function Editor({ producto: p, categorias, cerrar, guardado }) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	async function guardar(e) {
		e.preventDefault();
		if (busy) return;
		setBusy(true);
		setError("");
		const f = new FormData(e.currentTarget);
		const datos = {
			nombre: String(f.get("nombre")),
			marca: String(f.get("marca")),
			descripcion: String(f.get("descripcion")),
			precio: Number(f.get("precio")),
			stock: Number(f.get("stock")),
			categoriaId: Number(f.get("categoriaId")),
			imagen: String(f.get("imagen")),
			especificaciones: String(f.get("especificaciones"))
		};
		try {
			await graphql(p ? "mutation($id:Int!,$datos:ProductoInput!){actualizarProducto(id:$id,datos:$datos){id}}" : "mutation($datos:ProductoInput!){crearProducto(datos:$datos){id}}", {
				datos,
				...p ? { id: p.id } : {}
			});
			guardado();
		} catch (e) {
			setError(e.message);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsx(Modal, {
		titulo: p ? "Editar producto" : "Nuevo producto",
		onClose: () => {
			if (!busy) cerrar();
		},
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: guardar,
			children: [
				/* @__PURE__ */ jsxs("fieldset", {
					disabled: busy,
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ jsxs("label", { children: ["Nombre", /* @__PURE__ */ jsx("input", {
									name: "nombre",
									required: true,
									maxLength: 120,
									defaultValue: p?.nombre
								})] }),
								/* @__PURE__ */ jsxs("label", { children: ["Marca", /* @__PURE__ */ jsx("input", {
									name: "marca",
									required: true,
									maxLength: 80,
									defaultValue: p?.marca
								})] }),
								/* @__PURE__ */ jsxs("label", { children: ["Precio (MXN)", /* @__PURE__ */ jsx("input", {
									name: "precio",
									type: "number",
									min: "0.01",
									max: "999999.99",
									step: "0.01",
									required: true,
									defaultValue: p?.precio
								})] }),
								/* @__PURE__ */ jsxs("label", { children: ["Stock", /* @__PURE__ */ jsx("input", {
									name: "stock",
									type: "number",
									min: "0",
									max: "100000",
									step: "1",
									required: true,
									defaultValue: p?.stock ?? 1
								})] }),
								/* @__PURE__ */ jsxs("label", { children: ["Categoría", /* @__PURE__ */ jsx("select", {
									name: "categoriaId",
									defaultValue: p?.categoria.id || categorias[0]?.id,
									children: categorias.map((c) => /* @__PURE__ */ jsx("option", {
										value: c.id,
										children: c.nombre
									}, c.id))
								})] }),
								/* @__PURE__ */ jsxs("label", { children: [
									"Imagen",
									/* @__PURE__ */ jsx("input", {
										name: "imagen",
										required: true,
										list: "imagenes",
										defaultValue: p?.imagen || "/images/keyboard.jpg"
									}),
									/* @__PURE__ */ jsx("datalist", {
										id: "imagenes",
										children: [
											"laptop.jpg",
											"gpu.png",
											"ram.jpg",
											"keyboard.jpg",
											"headphones.jpg",
											"controller.jpg",
											"controller-white.jpg"
										].map((s) => /* @__PURE__ */ jsx("option", { value: `/images/${s}` }, s))
									})
								] })
							]
						}),
						/* @__PURE__ */ jsxs("label", { children: ["Descripción", /* @__PURE__ */ jsx("textarea", {
							name: "descripcion",
							rows: 3,
							required: true,
							maxLength: 2e3,
							defaultValue: p?.descripcion
						})] }),
						/* @__PURE__ */ jsxs("label", { children: ["Especificaciones (separadas por ;)", /* @__PURE__ */ jsx("textarea", {
							name: "especificaciones",
							rows: 2,
							maxLength: 2e3,
							defaultValue: p?.especificaciones
						})] })
					]
				}),
				error && /* @__PURE__ */ jsx("p", {
					className: "form-error",
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "modal-actions",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "btn btn-secondary",
						disabled: busy,
						onClick: cerrar,
						children: "Cancelar"
					}), /* @__PURE__ */ jsx("button", {
						className: "btn",
						disabled: busy,
						children: busy ? "Guardando…" : "Guardar producto"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/App.tsx
var iconos = [
	Laptop,
	Cpu,
	Headphones,
	Gamepad2
];
function App({ currentUser = null }) {
	const [pantalla, setPantalla] = useState({ tipo: "inicio" });
	const [search, setSearch] = useState("");
	const [buscar, setBuscar] = useState("");
	const [menu, setMenu] = useState(false);
	const [toast, setToast] = useState("");
	const [compra, setCompra] = useState(null);
	const [pending, startTransition] = useTransition();
	const { lineas, agregar: agregarCarrito, unidades, total } = useCarrito();
	const { data, error, retry } = useQuery("{categorias{id nombre}}");
	const main = useRef(null);
	const timer = useRef(null);
	useEffect(() => () => {
		if (timer.current) clearTimeout(timer.current);
	}, []);
	useEffect(() => {
		if (!currentUser) return;
		try {
			const pendiente = window.sessionStorage.getItem("tl-pantalla-pendiente");
			window.sessionStorage.removeItem("tl-pantalla-pendiente");
			if (pendiente === "checkout" || pendiente === "pedidos") setPantalla({ tipo: pendiente });
		} catch {}
	}, [currentUser]);
	useEffect(() => {
		const guardarPantalla = () => {
			try {
				if (pantalla.tipo === "checkout" || pantalla.tipo === "pedidos") window.sessionStorage.setItem("tl-pantalla-pendiente", pantalla.tipo);
			} catch {}
		};
		window.addEventListener("tl-sesion-invalida", guardarPantalla);
		return () => {
			window.removeEventListener("tl-sesion-invalida", guardarPantalla);
		};
	}, [pantalla.tipo]);
	function avisar(s) {
		setToast(s);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setToast(""), 4500);
	}
	const esAdmin = currentUser?.rol === "ADMIN";
	function navegar(p) {
		if (p.tipo === "admin" && !esAdmin) {
			avisar("Necesitas una cuenta administradora para acceder al panel.");
			setMenu(false);
			return;
		}
		if (!currentUser && (p.tipo === "checkout" || p.tipo === "pedidos")) {
			try {
				window.sessionStorage.setItem("tl-pantalla-pendiente", p.tipo);
			} catch {}
			window.location.assign(`/iniciar-sesion?reason=${p.tipo}&next=${encodeURIComponent("/")}`);
			return;
		}
		if (p.tipo === "catalogo" || p.tipo === "inicio") {
			setSearch("");
			setBuscar("");
		}
		startTransition(() => setPantalla(p));
		setMenu(false);
		window.scrollTo({
			top: 0,
			behavior: "instant"
		});
		requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
	}
	function agregar(p) {
		if ((lineas.find((l) => l.producto.id === p.id)?.cantidad || 0) >= Math.min(p.stock, 99)) {
			avisar("Ya agregaste la cantidad disponible de este producto.");
			return;
		}
		agregarCarrito(p);
		avisar(`${p.nombre} agregado al carrito`);
	}
	const catalogo = pantalla.tipo === "inicio" || pantalla.tipo === "catalogo";
	const categoriaId = pantalla.tipo === "catalogo" ? pantalla.categoriaId : void 0;
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx("a", {
			className: "skip-link",
			href: "#contenido",
			children: "Saltar al contenido"
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "announcement",
			children: [/* @__PURE__ */ jsx("span", { children: "HARDWARE PARA QUIENES COMPITEN POR MÁS" }), /* @__PURE__ */ jsx("span", { children: "TecnoLeague / Tienda de demostración" })]
		}),
		/* @__PURE__ */ jsx("header", {
			className: "topbar",
			children: /* @__PURE__ */ jsxs("div", {
				className: "topbar-inner",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "brand",
						onClick: () => navegar({ tipo: "inicio" }),
						"aria-label": "TecnoLeague, inicio",
						children: /* @__PURE__ */ jsx("span", {
							className: "logo",
							children: /* @__PURE__ */ jsx("img", {
								src: "/images/logo.png",
								alt: "TecnoLeague"
							})
						})
					}),
					/* @__PURE__ */ jsxs("nav", {
						"aria-label": "Navegación principal",
						children: [
							/* @__PURE__ */ jsx("button", {
								className: pantalla.tipo === "inicio" ? "active" : "",
								onClick: () => navegar({ tipo: "inicio" }),
								children: "Inicio"
							}),
							/* @__PURE__ */ jsx("button", {
								className: pantalla.tipo === "catalogo" || pantalla.tipo === "producto" ? "active" : "",
								onClick: () => navegar({ tipo: "catalogo" }),
								children: "Catálogo"
							}),
							/* @__PURE__ */ jsx("button", {
								className: pantalla.tipo === "pedidos" ? "active" : "",
								onClick: () => navegar({ tipo: "pedidos" }),
								children: "Pedidos"
							})
						]
					}),
					/* @__PURE__ */ jsxs("form", {
						className: "search",
						onSubmit: (e) => {
							e.preventDefault();
							setBuscar(search.trim());
							startTransition(() => setPantalla({ tipo: "catalogo" }));
							setMenu(false);
						},
						children: [
							/* @__PURE__ */ jsx(Search, { size: 18 }),
							/* @__PURE__ */ jsx("input", {
								"aria-label": "Buscar productos",
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "Buscar productos"
							}),
							/* @__PURE__ */ jsx("button", {
								"aria-label": "Realizar búsqueda",
								type: "submit",
								children: /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "account-nav",
						children: currentUser ? /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", {
							title: currentUser.email,
							children: currentUser.nombre.split(" ")[0]
						}), /* @__PURE__ */ jsx("form", {
							action: "/api/auth/logout",
							method: "post",
							children: /* @__PURE__ */ jsx("button", {
								className: "text-btn",
								type: "submit",
								children: "Cerrar sesión"
							})
						})] }) : /* @__PURE__ */ jsx("a", {
							className: "text-btn",
							href: "/iniciar-sesion",
							children: "Iniciar sesión"
						})
					}),
					esAdmin && /* @__PURE__ */ jsx("button", {
						className: "icon-btn admin-nav",
						onClick: () => navegar({ tipo: "admin" }),
						"aria-label": "Administración",
						children: /* @__PURE__ */ jsx(Settings2, { size: 21 })
					}),
					/* @__PURE__ */ jsxs("button", {
						className: "cart-nav",
						onClick: () => navegar({ tipo: "carrito" }),
						"aria-label": `Carrito: ${unidades} artículos`,
						children: [/* @__PURE__ */ jsx(ShoppingBag, { size: 22 }), /* @__PURE__ */ jsx("span", { children: unidades })]
					}),
					catalogo && /* @__PURE__ */ jsx("button", {
						className: "icon-btn mobile-menu",
						"aria-label": "Mostrar categorías",
						"aria-expanded": menu,
						onClick: () => setMenu(!menu),
						children: menu ? /* @__PURE__ */ jsx(X, {}) : /* @__PURE__ */ jsx(Menu, {})
					})
				]
			})
		}),
		/* @__PURE__ */ jsxs("div", {
			className: `shell ${catalogo ? "con-sidebar" : ""}`,
			children: [catalogo && /* @__PURE__ */ jsxs("aside", {
				className: `sidebar ${menu ? "abierto" : ""}`,
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "sidebar-label",
						children: [/* @__PURE__ */ jsx(SlidersHorizontal, { size: 15 }), " EXPLORAR"]
					}),
					/* @__PURE__ */ jsx("h2", { children: "Encuentra tu equipo" }),
					/* @__PURE__ */ jsxs("button", {
						className: !categoriaId && pantalla.tipo === "catalogo" ? "category active" : "category",
						onClick: () => navegar({ tipo: "catalogo" }),
						children: [
							/* @__PURE__ */ jsx(Grid2X2, { size: 19 }),
							" Todo el catálogo ",
							/* @__PURE__ */ jsx(ChevronRight, { size: 14 })
						]
					}),
					data?.categorias.map((c, i) => {
						const Icon = iconos[i] || Package;
						return /* @__PURE__ */ jsxs("button", {
							className: `category ${categoriaId === c.id ? "active" : ""}`,
							onClick: () => navegar({
								tipo: "catalogo",
								categoriaId: c.id
							}),
							children: [
								/* @__PURE__ */ jsx(Icon, { size: 19 }),
								c.nombre,
								/* @__PURE__ */ jsx(ChevronRight, { size: 14 })
							]
						}, c.id);
					}),
					error && /* @__PURE__ */ jsx("button", {
						className: "text-btn",
						onClick: retry,
						children: "Reintentar categorías"
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "sidebar-cart",
						children: [
							/* @__PURE__ */ jsx(ShoppingBag, { size: 23 }),
							/* @__PURE__ */ jsx("strong", { children: "Tu siguiente upgrade" }),
							/* @__PURE__ */ jsx("p", { children: unidades ? `${unidades} artículos en tu carrito` : "Tu setup empieza con una elección." }),
							unidades > 0 && /* @__PURE__ */ jsx("strong", {
								className: "accent",
								children: dinero(total)
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "text-btn",
								onClick: () => navegar({ tipo: "carrito" }),
								children: ["Ver carrito ", /* @__PURE__ */ jsx(ArrowRight, { size: 15 })]
							})
						]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "sidebar-foot",
						children: [
							"DISEÑADO PARA",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("strong", { children: "EL SIGUIENTE NIVEL." })
						]
					})
				]
			}), /* @__PURE__ */ jsxs("main", {
				id: "contenido",
				tabIndex: -1,
				ref: main,
				className: pending ? "page pending" : "page",
				children: [
					compra && pantalla.tipo === "inicio" && /* @__PURE__ */ jsxs("section", {
						className: "confirmacion",
						role: "status",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "success-icon",
								children: /* @__PURE__ */ jsx(Check, { size: 24 })
							}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: "¡Tu pedido está confirmado!" }), /* @__PURE__ */ jsxs("p", { children: [
								compra.folio,
								" · ",
								dinero(compra.total),
								" MXN · Pago al recibir."
							] })] }),
							/* @__PURE__ */ jsxs("button", {
								className: "text-btn",
								onClick: () => {
									setCompra(null);
									navegar({ tipo: "pedidos" });
								},
								children: ["Ver pedido ", /* @__PURE__ */ jsx(ArrowRight, { size: 17 })]
							}),
							/* @__PURE__ */ jsx("button", {
								className: "icon-btn",
								onClick: () => setCompra(null),
								"aria-label": "Cerrar confirmación",
								children: /* @__PURE__ */ jsx(X, { size: 18 })
							})
						]
					}),
					catalogo && /* @__PURE__ */ jsx(Catalogo, {
						inicio: pantalla.tipo === "inicio",
						categoriaId,
						categoriaNombre: data?.categorias.find((c) => c.id === categoriaId)?.nombre,
						buscar,
						navegar,
						agregar
					}, `${pantalla.tipo}-${categoriaId || 0}-${buscar}`),
					pantalla.tipo === "producto" && /* @__PURE__ */ jsx(Detalle, {
						id: pantalla.id,
						navegar,
						avisar
					}, pantalla.id),
					pantalla.tipo === "carrito" && /* @__PURE__ */ jsx(Carrito, { navegar }),
					pantalla.tipo === "checkout" && /* @__PURE__ */ jsx(Checkout, {
						currentUser,
						navegar,
						completado: (p) => {
							setCompra(p);
							navegar({ tipo: "inicio" });
						}
					}),
					pantalla.tipo === "pedidos" && /* @__PURE__ */ jsx(Pedidos, { navegar }),
					pantalla.tipo === "admin" && esAdmin && /* @__PURE__ */ jsx(Admin, { avisar })
				]
			})]
		}),
		/* @__PURE__ */ jsxs("footer", {
			className: "footer",
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("button", {
					className: "brand",
					onClick: () => navegar({ tipo: "inicio" }),
					children: [/* @__PURE__ */ jsx(Zap, {
						className: "accent",
						size: 23
					}), /* @__PURE__ */ jsxs("span", { children: ["TECNO", /* @__PURE__ */ jsx("span", {
						className: "accent",
						children: "LEAGUE"
					})] })]
				}), /* @__PURE__ */ jsx("p", { children: "Hardware para quienes compiten por más." })] }),
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h3", { children: "Explora" }),
					/* @__PURE__ */ jsx("button", {
						onClick: () => navegar({ tipo: "catalogo" }),
						children: "Catálogo"
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: () => navegar({ tipo: "pedidos" }),
						children: "Mis pedidos"
					})
				] }),
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("h3", { children: "Tu compra" }),
					/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx(Truck, { size: 15 }), " Pago al recibir"] }),
					/* @__PURE__ */ jsx("button", {
						onClick: () => navegar({ tipo: "carrito" }),
						children: "Mi carrito"
					})
				] }),
				/* @__PURE__ */ jsxs("div", {
					className: "footer-bottom",
					children: [/* @__PURE__ */ jsxs("span", { children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" TecnoLeague"
					] }), /* @__PURE__ */ jsx("span", { children: "Proyecto académico · MXN · Sin cobros reales" })]
				})
			]
		}),
		toast && /* @__PURE__ */ jsxs("div", {
			className: "toast",
			role: "status",
			children: [
				/* @__PURE__ */ jsx(Check, { size: 19 }),
				/* @__PURE__ */ jsx("span", { children: toast }),
				/* @__PURE__ */ jsx("button", {
					className: "icon-btn",
					onClick: () => setToast(""),
					"aria-label": "Cerrar aviso",
					children: /* @__PURE__ */ jsx(X, { size: 16 })
				})
			]
		})
	] });
}
//#endregion
//#region src/components/Storefront.tsx
function Storefront({ currentUser }) {
	return /* @__PURE__ */ jsx(CarritoProvider, { children: /* @__PURE__ */ jsx(App, { currentUser }) });
}
//#endregion
//#region src/pages/index.astro
var pages_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	url: () => ""
});
createAstro("https://astro.build");
var $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const { user, invalid } = await getSessionUser(Astro.cookies.get("tl_session")?.value);
	if (invalid) Astro.cookies.delete("tl_session", { path: "/" });
	return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Tienda gamer" }, { "default": ($$result) => renderTemplate`${renderComponent($$result, "Storefront", Storefront, {
		"client:load": true,
		"currentUser": user,
		"client:component-hydration": "load",
		"client:component-path": "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/components/Storefront.tsx",
		"client:component-export": "Storefront"
	})}` })}`;
}, "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/index.astro", void 0);
var $$file = "C:/Users/owner/Documents/CETI/WEB 2/Tecnoleague-frontend-paul/Tecnoleague/front/src/pages/index.astro";
//#endregion
//#region \0virtual:astro:page:src/pages/index@_@astro
var page = () => pages_exports;
//#endregion
export { page };
