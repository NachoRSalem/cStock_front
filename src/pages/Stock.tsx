// src/pages/Stock.tsx
import { useEffect, useState } from "react";
import { listStock, type Stock } from "../api/stock";
import { tokenStorage } from "../utils/storage";

export default function StockPage() {
  const [items, setItems] = useState<Stock[]>([]);
  const [filteredItems, setFilteredItems] = useState<Stock[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterSubUbicacion, setFilterSubUbicacion] = useState<string>("all");
  const [soloConStock, setSoloConStock] = useState(true);

  const sucursal = tokenStorage.getSucursal();
  const session = tokenStorage.getSession();
  const sucursalNombre = session?.sucursal ?? "Sucursal";

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const data = await listStock({ 
          solo_con_stock: soloConStock,
          ubicacion: sucursal ?? undefined 
        });
        setItems(data);
        setFilteredItems(data);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando stock");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [soloConStock, sucursal]);

  // Aplicar filtros locales
  useEffect(() => {
    let filtered = [...items];
    
    if (filterTipo !== "all") {
      filtered = filtered.filter(item => item.producto_tipo_conservacion === filterTipo);
    }
    
    if (filterSubUbicacion !== "all") {
      filtered = filtered.filter(item => item.sub_ubicacion.toString() === filterSubUbicacion);
    }
    
    setFilteredItems(filtered);
  }, [items, filterTipo, filterSubUbicacion]);

  const subUbicaciones = Array.from(
    new Map(items.map(item => [item.sub_ubicacion, item.sub_ubicacion_nombre])).entries()
  );

  const totalItems = filteredItems.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Stock - {sucursalNombre}</h2>
        <p className="page__subtitle">
          Productos disponibles en todas las sub-ubicaciones
        </p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Filtros */}
      <section className="card">
        <div className="card__body">
          <div className="form" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1, minWidth: "200px" }}>
              <label className="label">Tipo de conservación</label>
              <select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                <option value="all">Todos</option>
                <option value="ambiente">Ambiente</option>
                <option value="heladera">Heladera</option>
                <option value="freezer">Freezer</option>
              </select>
            </div>

            <div className="field" style={{ flex: 1, minWidth: "200px" }}>
              <label className="label">Sub-ubicación</label>
              <select className="input" value={filterSubUbicacion} onChange={(e) => setFilterSubUbicacion(e.target.value)}>
                <option value="all">Todas</option>
                {subUbicaciones.map(([id, nombre]) => (
                  <option key={id} value={id.toString()}>{nombre}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input 
                type="checkbox" 
                id="soloConStock" 
                checked={soloConStock} 
                onChange={(e) => setSoloConStock(e.target.checked)}
                style={{ width: "auto" }}
              />
              <label htmlFor="soloConStock" style={{ margin: 0 }}>Solo con stock</label>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="card__body" style={{ textAlign: "center" }}>
            <div className="muted" style={{ fontSize: "0.875rem" }}>Total productos</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{filteredItems.length}</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <div className="card__body" style={{ textAlign: "center" }}>
            <div className="muted" style={{ fontSize: "0.875rem" }}>Total unidades</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{totalItems}</div>
          </div>
        </div>
      </div>

      {/* Tabla de stock */}
      <section className="card">
        <div className="card__header">
          <div className="card__title">Inventario</div>
          <div className="muted">{loading ? "Cargando..." : `${filteredItems.length} productos`}</div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div className="muted">Cargando stock...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <div className="muted">No hay productos en stock</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f5f5f5" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Producto</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Sub-ubicación</th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>Tipo</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Cantidad</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Última actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ fontWeight: 500 }}>{item.producto_nombre}</div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div className="muted" style={{ fontSize: "0.875rem" }}>
                          {item.sub_ubicacion_nombre}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <span className="badge">
                          {item.producto_tipo_conservacion === "ambiente" && "🌡️ Ambiente"}
                          {item.producto_tipo_conservacion === "heladera" && "❄️ Heladera"}
                          {item.producto_tipo_conservacion === "freezer" && "🧊 Freezer"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <span style={{ 
                          fontWeight: "bold", 
                          color: item.cantidad < 10 ? "#d32f2f" : item.cantidad < 50 ? "#f57c00" : "#388e3c" 
                        }}>
                          {item.cantidad}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div className="muted" style={{ fontSize: "0.875rem" }}>
                          {new Date(item.ultima_actualizacion).toLocaleString("es-AR")}
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
    </div>
  );
}
