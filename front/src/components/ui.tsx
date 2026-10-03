import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Box,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import { dinero } from "../api";
import type { Navegar, Producto } from "../types";
export function Imagen({
  producto,
  className = "",
}: {
  producto: Pick<Producto, "nombre" | "imagen">;
  className?: string;
}) {
  const [error, setError] = useState(false);
  return error ? (
    <div className={`imagen-fallback ${className}`}>
      <Box size={44} />
      <span>{producto.nombre}</span>
    </div>
  ) : (
    <img
      className={className}
      src={producto.imagen}
      alt={producto.nombre}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
export function ErrorCarga({
  mensaje,
  reintentar,
}: {
  mensaje: string;
  reintentar: () => void;
}) {
  return (
    <div className="estado panel" role="alert">
      <RefreshCw size={30} />
      <h2>No pudimos cargar la información</h2>
      <p>{mensaje}</p>
      <button className="btn" onClick={reintentar}>
        <RefreshCw size={17} /> Reintentar
      </button>
    </div>
  );
}
export function Cargando({ tarjetas = false }: { tarjetas?: boolean }) {
  return (
    <div
      aria-label="Cargando información"
      aria-busy="true"
      className={tarjetas ? "productos-grid" : "carga-bloque"}
    >
      {Array.from({ length: tarjetas ? 6 : 3 }, (_, i) => (
        <div className="skeleton" key={i}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function Vacio({
  titulo,
  texto,
  accion,
  onClick,
}: {
  titulo: string;
  texto: string;
  accion: string;
  onClick: () => void;
}) {
  return (
    <div className="estado panel">
      <ShoppingBag size={40} />
      <h2>{titulo}</h2>
      <p>{texto}</p>
      <button className="btn" onClick={onClick}>
        {accion}
        <ArrowRight size={17} />
      </button>
    </div>
  );
}
export function Cantidad({
  valor,
  max,
  onChange,
}: {
  valor: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="cantidad">
      <button
        aria-label="Disminuir cantidad"
        disabled={valor <= 1}
        onClick={() => onChange(valor - 1)}
      >
        <Minus size={15} />
      </button>
      <span aria-live="polite">{valor}</span>
      <button
        aria-label="Aumentar cantidad"
        disabled={valor >= Math.min(max, 99)}
        onClick={() => onChange(valor + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
export function TarjetaProducto({
  producto: p,
  navegar,
  agregar,
}: {
  producto: Producto;
  navegar: Navegar;
  agregar: (p: Producto) => void;
}) {
  return (
    <article className="producto-card group">
      <button
        className="producto-imagen"
        onClick={() => navegar({ tipo: "producto", id: p.id })}
        aria-label={`Ver ${p.nombre}`}
      >
        <Imagen producto={p} />
        <span className={`stock-badge ${p.stock ? "" : "agotado"}`}>
          {p.stock ? "Disponible" : "Agotado"}
        </span>
      </button>
      <div className="producto-info">
        <span className="eyebrow muted">{p.marca}</span>
        <button
          className="producto-nombre"
          onClick={() => navegar({ tipo: "producto", id: p.id })}
        >
          {p.nombre}
        </button>
        <p>{p.categoria.nombre}</p>
        <div className="producto-bottom">
          <strong>
            {dinero(p.precio)} <small>MXN</small>
          </strong>
          <button
            className="add-btn"
            disabled={!p.stock}
            aria-label={`Agregar ${p.nombre} al carrito`}
            onClick={() => agregar(p)}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return createPortal(
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <div className="modal-head">
        <h2>{titulo}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
