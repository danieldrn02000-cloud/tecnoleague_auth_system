import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { PRODUCTO, useQuery } from "../api";
import type { Navegar, PaginaProductos, Producto } from "../types";
import { Cargando, ErrorCarga, TarjetaProducto, Vacio } from "../components/ui";
const CONSULTA = `query Catalogo($buscar:String,$categoriaId:Int,$limite:Int,$desde:Int,$orden:OrdenProducto){productos(buscar:$buscar,categoriaId:$categoriaId,limite:$limite,desde:$desde,orden:$orden){total items{${PRODUCTO}}}}`;
export function Catalogo({
  inicio,
  categoriaId,
  categoriaNombre,
  buscar,
  navegar,
  agregar,
}: {
  inicio: boolean;
  categoriaId?: number;
  categoriaNombre?: string;
  buscar: string;
  navegar: Navegar;
  agregar: (p: Producto) => void;
}) {
  const [pagina, setPagina] = useState(0);
  const [orden, setOrden] = useState("RECIENTES");
  const { data, loading, error, retry } = useQuery<{
    productos: PaginaProductos;
  }>(CONSULTA, {
    buscar,
    categoriaId,
    limite: inicio ? 6 : 8,
    desde: pagina * (inicio ? 6 : 8),
    orden,
  });
  const total = data?.productos.total || 0;
  return (
    <>
      {inicio && (
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">TU PRÓXIMA PARTIDA EMPIEZA AQUÍ</span>
            <h1>
              Tu setup.
              <br />
              Tu siguiente <em>nivel.</em>
            </h1>
            <p>
              Hardware y accesorios para jugar,
              <br className="desktop-br" /> crear y competir a tu manera.
            </p>
            <button
              className="btn"
              onClick={() => navegar({ tipo: "catalogo" })}
            >
              Explorar catálogo <ArrowRight size={18} />
            </button>
            <div className="hero-meta">
              <span>01 — HARDWARE</span>
              <span>02 — GAMING</span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/images/laptop.jpg"
              alt="Laptop y accesorios en un escritorio gaming"
            />
            <div className="hero-image-label">
              <span>EL SIGUIENTE NIVEL ES TUYO</span>
              <strong>PLAY. CREATE. REPEAT.</strong>
            </div>
          </div>
        </section>
      )}
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {inicio
              ? "SELECCIÓN TECNOLEAGUE"
              : categoriaNombre
                ? "EXPLORA LA CATEGORÍA"
                : "ENCUENTRA TU PRÓXIMO UPGRADE"}
          </span>
          <h1 className={inicio ? "small-title" : ""}>
            {inicio
              ? "Equipa tu próxima victoria"
              : categoriaNombre || "Catálogo"}
          </h1>
          <p>
            {buscar
              ? `Resultados para “${buscar}”`
              : inicio
                ? "Elige lo que le falta a tu escritorio."
                : `${total} productos · Precios en MXN`}
          </p>
        </div>
        {inicio ? (
          <button
            className="text-btn"
            onClick={() => navegar({ tipo: "catalogo" })}
          >
            Ver todo <ArrowRight size={17} />
          </button>
        ) : (
          <label className="orden">
            <SlidersHorizontal size={16} />
            <span className="sr-only">Ordenar productos</span>
            <select
              value={orden}
              onChange={(e) => {
                setOrden(e.target.value);
                setPagina(0);
              }}
            >
              <option value="RECIENTES">Destacados</option>
              <option value="PRECIO_ASC">Menor precio</option>
              <option value="PRECIO_DESC">Mayor precio</option>
            </select>
          </label>
        )}
      </div>
      {error ? (
        <ErrorCarga mensaje={error} reintentar={retry} />
      ) : loading ? (
        <Cargando tarjetas />
      ) : !total ? (
        <Vacio
          titulo="No encontramos productos"
          texto="Prueba otra búsqueda o consulta todas las categorías."
          accion="Ver catálogo completo"
          onClick={() => navegar({ tipo: "catalogo" })}
        />
      ) : (
        <>
          <div className="productos-grid">
            {data?.productos.items.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                navegar={navegar}
                agregar={agregar}
              />
            ))}
          </div>
          {!inicio && total > 8 && (
            <div className="paginacion">
              <button
                className="btn btn-secondary"
                disabled={!pagina}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft size={17} /> Anterior
              </button>
              <span>
                Página {pagina + 1} de {Math.ceil(total / 8)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={(pagina + 1) * 8 >= total}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente <ChevronRight size={17} />
              </button>
            </div>
          )}
        </>
      )}
      {inicio && (
        <aside className="contexto">
          <div>
            <span className="eyebrow">TODO EN UN SOLO LUGAR</span>
            <h2>Haz espacio para lo que viene.</h2>
            <p>Encuentra el complemento ideal para tu equipo.</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navegar({ tipo: "catalogo", categoriaId: 3 })}
          >
            Ver periféricos <ArrowRight size={17} />
          </button>
        </aside>
      )}
    </>
  );
}
