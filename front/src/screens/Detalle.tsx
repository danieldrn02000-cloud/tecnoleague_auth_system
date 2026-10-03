import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { dinero, PRODUCTO, useQuery } from "../api";
import { Cantidad, Cargando, ErrorCarga, Imagen } from "../components/ui";
import { useCarrito } from "../store";
import type { Navegar, Producto } from "../types";
const CONSULTA = `query Detalle($id:Int!){producto(id:$id){${PRODUCTO}}}`;
export function Detalle({
  id,
  navegar,
  avisar,
}: {
  id: number;
  navegar: Navegar;
  avisar: (s: string) => void;
}) {
  const { data, error, loading, retry } = useQuery<{ producto: Producto }>(
    CONSULTA,
    { id },
  );
  const [cantidad, setCantidad] = useState(1);
  const { agregar, lineas } = useCarrito();
  if (error) return <ErrorCarga mensaje={error} reintentar={retry} />;
  if (loading || !data) return <Cargando />;
  const p = data.producto;
  const enCarrito = lineas.find((l) => l.producto.id === id)?.cantidad || 0;
  const disponible = Math.min(99, p.stock) - enCarrito;
  
  return (
    <>
      <button
        className="back-link"
        onClick={() =>
          navegar({ tipo: "catalogo", categoriaId: p.categoria.id })
        }
      >
        <ArrowLeft size={16} /> Volver a {p.categoria.nombre}
      </button>
      <div className="detalle-grid">
        <div className="detalle-imagen panel">
          <Imagen producto={p} />
        </div>
        <section className="detalle-info">
          <span className="eyebrow">
            {p.marca} / {p.categoria.nombre}
          </span>
          <h1>{p.nombre}</h1>
          <span className={`stock-text ${p.stock ? "" : "danger"}`}>
            {p.stock ? (
              <>
                <Check size={16} /> {p.stock} disponibles
              </>
            ) : (
              "Temporalmente agotado"
            )}
          </span>
          <p className="detalle-descripcion">{p.descripcion}</p>
          <div className="detalle-precio">
            {dinero(p.precio)} <small>MXN</small>
          </div>
          <p className="muted">Envío de demostración sin costo adicional.</p>
          <div className="detalle-compra">
            <Cantidad
              valor={Math.min(cantidad, disponible) || 1}
              max={disponible}
              onChange={setCantidad}
            />
            <button
              className="btn"
              disabled={disponible < 1}
              onClick={() => {
                agregar(p, Math.min(cantidad, disponible));
                avisar(`${p.nombre} agregado al carrito`);
                navegar({ tipo: "carrito" });
              }}
            >
              <ShoppingBag size={18} />
              {p.stock
                ? disponible
                  ? "Agregar al carrito"
                  : "Ya agregaste el stock disponible"
                : "Sin existencias"}
            </button>
          </div>
          <button
            className="text-btn"
            onClick={() => navegar({ tipo: "carrito" })}
          >
            Ver mi carrito <ArrowRight size={16} />
          </button>
          <div className="especificaciones">
            <h2>Lo que necesitas saber</h2>
            {p.especificaciones.split(";").map((s, i) => (
              <div key={i}>
                <Check size={15} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
