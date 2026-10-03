import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { dinero, graphql, PRODUCTO, useQuery } from "../api";
import { Cargando, ErrorCarga, Imagen, Modal } from "../components/ui";
import type { Categoria, PaginaProductos, Producto } from "../types";
const CONSULTA = `query Inventario{productos(limite:100){total items{${PRODUCTO}}} categorias{id nombre}}`;
export function Admin({ avisar }: { avisar: (s: string) => void }) {
  const { data, loading, error, retry } = useQuery<{
    verificarAdmin: boolean;
  }>("query AccesoAdmin { verificarAdmin }");

  if (loading) return <Cargando />;

  if (error) {
    return (
      <div className="admin-login panel">
        <h1>Acceso a administración</h1>
        <ErrorCarga mensaje={error} reintentar={retry} />
        <p>Para administrar productos necesitas una cuenta con rol ADMIN.</p>
        <a className="btn btn-secondary" href="/iniciar-sesion">
          Iniciar sesión
        </a>
      </div>
    );
  }

  if (!data?.verificarAdmin) {
    return <p role="alert">No tienes permiso para acceder al inventario.</p>;
  }

  return <Inventario avisar={avisar} />;
}

function Inventario({
  avisar,
}: {
  avisar: (s: string) => void;
}) {
  const { data, loading, error, retry } = useQuery<{
    productos: PaginaProductos;
    categorias: Categoria[];
  }>(CONSULTA);
  const [editor, setEditor] = useState<Producto | "nuevo" | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [borrando, setBorrando] = useState<number | null>(null);
  const [pagina, setPagina] = useState(0);
  const [filtrar, setFiltrar] = useState("");
  async function eliminar(p: Producto) {
    if (
      !confirm(
        `¿Dar de baja ${p.nombre}? Se conservará en los pedidos anteriores.`,
      )
    )
      return;
    setBorrando(p.id);
    setMutationError("");
    try {
      await graphql(
        "mutation($id:Int!){eliminarProducto(id:$id)}",
        { id: p.id },
            );
      avisar("Producto dado de baja");
      retry();
    } catch (e) {
      setMutationError((e as Error).message);
    } finally {
      setBorrando(null);
    }
  }
  const productos = (data?.productos.items || []).filter((p) =>
    p.nombre.toLowerCase().includes(filtrar.toLowerCase()),
  );
  useEffect(() => {
    if (pagina > 0 && pagina * 8 >= productos.length) setPagina(0);
  }, [productos.length, pagina]);
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PANEL DE CONTROL</span>
          <h1>Inventario</h1>
          <p>Administra los productos que aparecen en el catálogo.</p>
        </div>
        <div className="flex gap-3">
          <form action="/api/auth/logout" method="post">
            <button className="btn btn-secondary" type="submit">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </form>
          <button className="btn" onClick={() => setEditor("nuevo")}>
            <Plus size={18} /> Nuevo producto
          </button>
        </div>
      </div>
      {mutationError && (
        <p role="alert" className="form-error">
          {mutationError}
        </p>
      )}
      {error ? (
        <ErrorCarga mensaje={error} reintentar={retry} />
      ) : loading ? (
        <Cargando />
      ) : (
        <>
          <div className="admin-stats">
            <div className="panel">
              <span>Productos activos</span>
              <strong>{data?.productos.total}</strong>
            </div>
            <div className="panel">
              <span>Unidades en inventario</span>
              <strong>
                {data?.productos.items.reduce((s, p) => s + p.stock, 0)}
              </strong>
            </div>
            <div className="panel">
              <span>Sin existencias</span>
              <strong>
                {data?.productos.items.filter((p) => p.stock === 0).length}
              </strong>
            </div>
          </div>
          <div className="admin-tools">
            <label>
              <span className="sr-only">Buscar en inventario</span>
              <input
                placeholder="Buscar producto…"
                value={filtrar}
                onChange={(e) => {
                  setFiltrar(e.target.value);
                  setPagina(0);
                }}
              />
            </label>
            <span className="muted">
              {productos.length} productos en esta vista
            </span>
          </div>
          {(data?.productos.total || 0) > 100 && (
            <p className="muted">
              Esta vista muestra los primeros 100 productos activos.
            </p>
          )}
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.slice(pagina * 8, pagina * 8 + 8).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="tabla-producto">
                        <Imagen producto={p} />
                        <span>
                          {p.nombre}
                          <small>{p.marca}</small>
                        </span>
                      </div>
                    </td>
                    <td>{p.categoria.nombre}</td>
                    <td>{dinero(p.precio)}</td>
                    <td>
                      <span className={p.stock ? "" : "danger"}>
                        {p.stock} unidades
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="icon-btn"
                          onClick={() => setEditor(p)}
                          aria-label={`Editar ${p.nombre}`}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-btn danger"
                          disabled={borrando !== null}
                          onClick={() => eliminar(p)}
                          aria-label={`Eliminar ${p.nombre}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!productos.length && (
              <p className="p-8 muted">No hay productos con ese nombre.</p>
            )}
          </div>
          {productos.length > 8 && (
            <div className="paginacion">
              <button
                className="btn btn-secondary"
                disabled={!pagina}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span>
                {pagina + 1} / {Math.ceil(productos.length / 8)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={(pagina + 1) * 8 >= productos.length}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
      {editor && data && (
        <Editor
          key={typeof editor === "string" ? editor : editor.id}
          producto={editor === "nuevo" ? undefined : editor}
          categorias={data.categorias}
          cerrar={() => setEditor(null)}
          guardado={() => {
            setEditor(null);
            retry();
            avisar("Producto guardado correctamente");
          }}
        />
      )}
    </>
  );
}
function Editor({
  producto: p,
  categorias,
  cerrar,
  guardado,
}: {
  producto?: Producto;
  categorias: Categoria[];
  cerrar: () => void;
  guardado: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function guardar(e: FormEvent<HTMLFormElement>) {
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
      especificaciones: String(f.get("especificaciones")),
    };
    try {
      await graphql(
        p
          ? "mutation($id:Int!,$datos:ProductoInput!){actualizarProducto(id:$id,datos:$datos){id}}"
          : "mutation($datos:ProductoInput!){crearProducto(datos:$datos){id}}",
        { datos, ...(p ? { id: p.id } : {}) },
            );
      guardado();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      titulo={p ? "Editar producto" : "Nuevo producto"}
      onClose={() => {
        if (!busy) cerrar();
      }}
    >
      <form onSubmit={guardar}>
        <fieldset disabled={busy}>
          <div className="form-grid">
            <label>
              Nombre
              <input
                name="nombre"
                required
                maxLength={120}
                defaultValue={p?.nombre}
              />
            </label>
            <label>
              Marca
              <input
                name="marca"
                required
                maxLength={80}
                defaultValue={p?.marca}
              />
            </label>
            <label>
              Precio (MXN)
              <input
                name="precio"
                type="number"
                min="0.01"
                max="999999.99"
                step="0.01"
                required
                defaultValue={p?.precio}
              />
            </label>
            <label>
              Stock
              <input
                name="stock"
                type="number"
                min="0"
                max="100000"
                step="1"
                required
                defaultValue={p?.stock ?? 1}
              />
            </label>
            <label>
              Categoría
              <select
                name="categoriaId"
                defaultValue={p?.categoria.id || categorias[0]?.id}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Imagen
              <input
                name="imagen"
                required
                list="imagenes"
                defaultValue={p?.imagen || "/images/keyboard.jpg"}
              />
              <datalist id="imagenes">
                {[
                  "laptop.jpg",
                  "gpu.png",
                  "ram.jpg",
                  "keyboard.jpg",
                  "headphones.jpg",
                  "controller.jpg",
                  "controller-white.jpg",
                ].map((s) => (
                  <option key={s} value={`/images/${s}`} />
                ))}
              </datalist>
            </label>
          </div>
          <label>
            Descripción
            <textarea
              name="descripcion"
              rows={3}
              required
              maxLength={2000}
              defaultValue={p?.descripcion}
            />
          </label>
          <label>
            Especificaciones (separadas por ;)
            <textarea
              name="especificaciones"
              rows={2}
              maxLength={2000}
              defaultValue={p?.especificaciones}
            />
          </label>
        </fieldset>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={cerrar}
          >
            Cancelar
          </button>
          <button className="btn" disabled={busy}>
            {busy ? "Guardando…" : "Guardar producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
