// src/pages/Products.tsx
import { useEffect, useState } from "react";
import { 
  listProductos, 
  listCategorias, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  type Producto, 
  type Categoria,
  type ProductoCreateUpdate,
  type CategoriaCreateUpdate
} from "../api/products";

type TabType = "productos" | "categorias";

export default function Products() {
  const [tab, setTab] = useState<TabType>("productos");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  
  // Formulario producto
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [productForm, setProductForm] = useState<ProductoCreateUpdate>({
    nombre: "",
    categoria: 0,
    tipo_conservacion: "ambiente",
    precio_venta: "",
    costo_compra: "",
    sku: ""
  });
  
  // Formulario categoría
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState<CategoriaCreateUpdate>({ nombre: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const [prodData, catData] = await Promise.all([
        listProductos({ search: searchTerm || undefined }),
        listCategorias()
      ]);
      setProductos(prodData);
      setCategorias(catData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // Filtrado local de productos
  const filteredProducts = productos.filter(p => {
    if (filterCategoria !== "all" && p.categoria.toString() !== filterCategoria) return false;
    if (filterTipo !== "all" && p.tipo_conservacion !== filterTipo) return false;
    return true;
  });

  function openProductForm(product?: Producto) {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        nombre: product.nombre,
        categoria: product.categoria,
        tipo_conservacion: product.tipo_conservacion,
        precio_venta: product.precio_venta,
        costo_compra: product.costo_compra,
        sku: product.sku || ""
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        nombre: "",
        categoria: categorias[0]?.id || 0,
        tipo_conservacion: "ambiente",
        precio_venta: "",
        costo_compra: "",
        sku: ""
      });
    }
    setShowProductForm(true);
  }

  function closeProductForm() {
    setShowProductForm(false);
    setEditingProduct(null);
  }

  async function handleSaveProduct() {
    if (!productForm.nombre || !productForm.categoria) {
      setErr("Completá todos los campos obligatorios");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id, productForm);
      } else {
        await createProducto(productForm);
      }
      await loadData();
      closeProductForm();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando producto");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProduct(id: number, nombre: string) {
    if (!confirm(`¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) return;
    
    setBusy(true);
    setErr(null);
    try {
      await deleteProducto(id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando producto");
    } finally {
      setBusy(false);
    }
  }

  function openCatForm(cat?: Categoria) {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ nombre: cat.nombre });
    } else {
      setEditingCat(null);
      setCatForm({ nombre: "" });
    }
    setShowCatForm(true);
  }

  function closeCatForm() {
    setShowCatForm(false);
    setEditingCat(null);
  }

  async function handleSaveCat() {
    if (!catForm.nombre) {
      setErr("El nombre es obligatorio");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      if (editingCat) {
        await updateCategoria(editingCat.id, catForm);
      } else {
        await createCategoria(catForm);
      }
      await loadData();
      closeCatForm();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando categoría");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCat(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`)) return;
    
    setBusy(true);
    setErr(null);
    try {
      await deleteCategoria(id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando categoría. Puede que tenga productos asociados.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <h2 className="page__title">Productos</h2>
        </div>
        <div className="card">
          <div className="card__body" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="muted">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Gestión de Productos</h2>
        <p className="page__subtitle">Administración de productos y categorías</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "2px solid #e0e0e0" }}>
        <button
          onClick={() => setTab("productos")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: "none",
            borderBottom: tab === "productos" ? "3px solid #1976d2" : "3px solid transparent",
            fontWeight: tab === "productos" ? "bold" : "normal",
            color: tab === "productos" ? "#1976d2" : "#666",
            cursor: "pointer"
          }}
        >
          📦 Productos ({productos.length})
        </button>
        <button
          onClick={() => setTab("categorias")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            background: "none",
            borderBottom: tab === "categorias" ? "3px solid #1976d2" : "3px solid transparent",
            fontWeight: tab === "categorias" ? "bold" : "normal",
            color: tab === "categorias" ? "#1976d2" : "#666",
            cursor: "pointer"
          }}
        >
          🏷️ Categorías ({categorias.length})
        </button>
      </div>

      {/* TAB: PRODUCTOS */}
      {tab === "productos" && (
        <>
          {!showProductForm && (
            <button className="btn btn--primary" onClick={() => openProductForm()} style={{ marginBottom: "1rem" }}>
              + Crear nuevo producto
            </button>
          )}

          {/* Formulario crear/editar producto */}
          {showProductForm && (
            <section className="card" style={{ marginBottom: "2rem" }}>
              <div className="card__header">
                <div className="card__title">{editingProduct ? "Editar producto" : "Nuevo producto"}</div>
                <button className="btn" onClick={closeProductForm} disabled={busy}>Cancelar</button>
              </div>
              <div className="card__body">
                <div className="form" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="field">
                    <label className="label">Nombre *</label>
                    <input
                      className="input"
                      value={productForm.nombre}
                      onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                      placeholder="Ej: Coca Cola 500ml"
                    />
                  </div>
                  
                  <div className="field">
                    <label className="label">Categoría *</label>
                    <select
                      className="input"
                      value={productForm.categoria}
                      onChange={(e) => setProductForm({ ...productForm, categoria: Number(e.target.value) })}
                    >
                      <option value="">Seleccionar...</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">Tipo de conservación *</label>
                    <select
                      className="input"
                      value={productForm.tipo_conservacion}
                      onChange={(e) => setProductForm({ ...productForm, tipo_conservacion: e.target.value as any })}
                    >
                      <option value="ambiente">🌡️ Temperatura Ambiente</option>
                      <option value="heladera">❄️ Heladera</option>
                      <option value="freezer">🧊 Freezer</option>
                    </select>
                  </div>

                  <div className="field">
                    <label className="label">SKU / Código de barras</label>
                    <input
                      className="input"
                      value={productForm.sku || ""}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="field">
                    <label className="label">Precio de venta *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={productForm.precio_venta}
                      onChange={(e) => setProductForm({ ...productForm, precio_venta: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="field">
                    <label className="label">Costo de compra *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={productForm.costo_compra}
                      onChange={(e) => setProductForm({ ...productForm, costo_compra: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button className="btn btn--primary" onClick={handleSaveProduct} disabled={busy} style={{ marginTop: "1rem" }}>
                  {busy ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </section>
          )}

          {/* Filtros */}
          <section className="card" style={{ marginBottom: "1rem" }}>
            <div className="card__body">
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div className="field" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
                  <label className="label">Buscar</label>
                  <input
                    className="input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre..."
                    onKeyDown={(e) => e.key === "Enter" && loadData()}
                  />
                </div>
                <div className="field" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
                  <label className="label">Categoría</label>
                  <select className="input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                    <option value="all">Todas</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, minWidth: "200px", marginBottom: 0 }}>
                  <label className="label">Tipo</label>
                  <select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="ambiente">Ambiente</option>
                    <option value="heladera">Heladera</option>
                    <option value="freezer">Freezer</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="btn" onClick={loadData}>Buscar</button>
                </div>
              </div>
            </div>
          </section>

          {/* Lista de productos */}
          <section className="card">
            <div className="card__header">
              <div className="card__title">Productos</div>
              <div className="muted">{filteredProducts.length} productos</div>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <div className="muted">No hay productos</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f5f5f5" }}>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Nombre</th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Categoría</th>
                        <th style={{ padding: "0.75rem", textAlign: "center" }}>Tipo</th>
                        <th style={{ padding: "0.75rem", textAlign: "right" }}>Precio Venta</th>
                        <th style={{ padding: "0.75rem", textAlign: "right" }}>Costo</th>
                        <th style={{ padding: "0.75rem", textAlign: "center" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ fontWeight: 500 }}>{prod.nombre}</div>
                            {prod.sku && <div className="muted" style={{ fontSize: "0.75rem" }}>SKU: {prod.sku}</div>}
                          </td>
                          <td style={{ padding: "0.75rem" }}>{prod.categoria_nombre}</td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span className="badge">
                              {prod.tipo_conservacion === "ambiente" && "🌡️"}
                              {prod.tipo_conservacion === "heladera" && "❄️"}
                              {prod.tipo_conservacion === "freezer" && "🧊"}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: "bold" }}>
                            ${parseFloat(prod.precio_venta).toFixed(2)}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right" }}>
                            ${parseFloat(prod.costo_compra).toFixed(2)}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                              <button
                                className="btn"
                                onClick={() => openProductForm(prod)}
                                disabled={busy}
                                style={{ fontSize: "0.875rem", padding: "0.25rem 0.75rem" }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="btn"
                                onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                                disabled={busy}
                                style={{ fontSize: "0.875rem", padding: "0.25rem 0.75rem", color: "#d32f2f" }}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* TAB: CATEGORÍAS */}
      {tab === "categorias" && (
        <>
          {!showCatForm && (
            <button className="btn btn--primary" onClick={() => openCatForm()} style={{ marginBottom: "1rem" }}>
              + Crear nueva categoría
            </button>
          )}

          {/* Formulario crear/editar categoría */}
          {showCatForm && (
            <section className="card" style={{ marginBottom: "2rem" }}>
              <div className="card__header">
                <div className="card__title">{editingCat ? "Editar categoría" : "Nueva categoría"}</div>
                <button className="btn" onClick={closeCatForm} disabled={busy}>Cancelar</button>
              </div>
              <div className="card__body">
                <div className="form">
                  <div className="field">
                    <label className="label">Nombre *</label>
                    <input
                      className="input"
                      value={catForm.nombre}
                      onChange={(e) => setCatForm({ nombre: e.target.value })}
                      placeholder="Ej: Bebidas, Golosinas, Snacks..."
                    />
                  </div>
                  <button className="btn btn--primary" onClick={handleSaveCat} disabled={busy}>
                    {busy ? "Guardando..." : editingCat ? "Guardar cambios" : "Crear categoría"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Lista de categorías */}
          <section className="card">
            <div className="card__header">
              <div className="card__title">Categorías</div>
              <div className="muted">{categorias.length} categorías</div>
            </div>
            <div className="card__body">
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px"
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: "1.125rem" }}>{cat.nombre}</div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn"
                        onClick={() => openCatForm(cat)}
                        disabled={busy}
                        style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                        disabled={busy}
                        style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", color: "#d32f2f" }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
