// src/pages/Orders.tsx
import { useEffect, useState } from "react";
import { createPedido, enviarARevision, listPedidos, type Pedido, type PedidoItemCreate } from "../api/orders";
import { listProductos, type Producto } from "../api/products";
import { listSucursales, type Sucursal } from "../api/locations";
import { tokenStorage } from "../utils/storage";

type PedidoItemForm = {
  producto: number;
  cantidad: number;
  precio_costo_momento: string;
};

export default function Orders() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  const [showCreate, setShowCreate] = useState(false);
  const [destino, setDestino] = useState<number | null>(null);
  const [items, setItems] = useState<PedidoItemForm[]>([]);

  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const [pedidosData, productosData, sucursalesData] = await Promise.all([
        listPedidos(),
        listProductos(),
        listSucursales()
      ]);
      setPedidos(pedidosData);
      setProductos(productosData);
      setSucursales(sucursalesData);
      
      // Debug: mostrar datos de sesión
      console.log('Session data:', session);
      console.log('Sucursales cargadas:', sucursalesData);
      console.log('Productos cargados:', productosData);
      
      // Si es usuario de sucursal, auto-seleccionar su sucursal
      if (!isAdmin && session?.sucursal) {
        // Manejar tanto número como string (por compatibilidad con sesiones antiguas)
        const sucursalId = typeof session.sucursal === 'number' 
          ? session.sucursal 
          : parseInt(session.sucursal as any, 10);
        
        if (!isNaN(sucursalId)) {
          console.log('Setting destino to:', sucursalId);
          setDestino(sucursalId);
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // También inicializar el destino cuando se abre el formulario de crear
  useEffect(() => {
    if (showCreate && !isAdmin && session?.sucursal && !destino) {
      const sucursalId = typeof session.sucursal === 'number' 
        ? session.sucursal 
        : parseInt(session.sucursal as any, 10);
      
      if (!isNaN(sucursalId)) {
        setDestino(sucursalId);
      }
    }
  }, [showCreate, isAdmin, session, destino]);

  function addItem() {
    setItems([...items, { producto: 0, cantidad: 1, precio_costo_momento: "0" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof PedidoItemForm, value: any) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    console.log('Items actualizados:', newItems);
  }

  async function onCreate() {
    if (!destino) {
      setErr("Seleccioná un destino");
      return;
    }
    if (items.length === 0) {
      setErr("Agregá al menos un producto");
      return;
    }
    // Validar que todos los productos estén seleccionados
    const productosNoSeleccionados = items.some(item => !item.producto || item.producto === 0);
    if (productosNoSeleccionados) {
      setErr("Todos los productos deben estar seleccionados");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const itemsToSend: PedidoItemCreate[] = items.map(item => {
        const producto = productos.find(p => p.id === item.producto);
        return {
          producto: item.producto,
          cantidad: item.cantidad,
          precio_costo_momento: item.precio_costo_momento || producto?.costo_compra.toString() || "0"
        };
      });

      await createPedido({ destino, items: itemsToSend });
      await loadData();
      setShowCreate(false);
      setItems([]);
      setDestino(isAdmin ? null : session?.sucursal ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Error creando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function onEnviarARevision(id: number) {
    if (!confirm("¿Enviar este pedido a revisión del administrador?")) return;
    
    setBusy(true);
    setErr(null);
    try {
      await enviarARevision(id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error enviando a revisión");
    } finally {
      setBusy(false);
    }
  }

  const pedidosPorEstado = {
    borrador: pedidos.filter(p => p.estado === "borrador"),
    pendiente: pedidos.filter(p => p.estado === "pendiente"),
    aprobado: pedidos.filter(p => p.estado === "aprobado"),
    recibido: pedidos.filter(p => p.estado === "recibido"),
    rechazado: pedidos.filter(p => p.estado === "rechazado")
  };

  const estadoLabels = {
    borrador: "📝 Borrador",
    pendiente: "⏳ Pendiente",
    aprobado: "✅ Aprobado",
    recibido: "📦 Recibido",
    rechazado: "❌ Rechazado"
  };

  const estadoColors = {
    borrador: "#757575",
    pendiente: "#f57c00",
    aprobado: "#388e3c",
    recibido: "#1976d2",
    rechazado: "#d32f2f"
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <h2 className="page__title">Pedidos</h2>
        </div>
        <div className="card">
          <div className="card__body" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="muted">Cargando pedidos...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Pedidos</h2>
        <p className="page__subtitle">Gestión de pedidos de mercadería</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Botón crear */}
      {!showCreate && (
        <button className="btn btn--primary" onClick={() => setShowCreate(true)} style={{ marginBottom: "1rem" }}>
          + Crear nuevo pedido
        </button>
      )}

      {/* Formulario crear pedido */}
      {showCreate && (
        <section className="card" style={{ marginBottom: "2rem" }}>
          <div className="card__header">
            <div className="card__title">Nuevo pedido</div>
            <button className="btn" onClick={() => setShowCreate(false)} disabled={busy}>
              Cancelar
            </button>
          </div>
          <div className="card__body">
            <div className="form">
              <div className="field">
                <label className="label">Destino</label>
                {!isAdmin ? (
                  // Usuario de sucursal: mostrar su sucursal (no editable)
                  <>
                    <div style={{ 
                      padding: "0.75rem", 
                      backgroundColor: "#f5f5f5", 
                      border: "1px solid #e0e0e0", 
                      borderRadius: "4px",
                      fontWeight: 500
                    }}>
                      {(() => {
                        const sucursal = sucursales.find(s => s.id === destino);
                        if (sucursal) {
                          return (
                            <>
                              {sucursal.nombre}
                              <span className="muted" style={{ marginLeft: "0.5rem", fontWeight: "normal" }}>
                                ({sucursal.tipo})
                              </span>
                            </>
                          );
                        }
                        // Si no encuentra la sucursal, mostrar info de debug
                        return (
                          <span className="muted">
                            No se pudo cargar la sucursal (ID: {destino})
                          </span>
                        );
                      })()}
                    </div>
                    {!sucursales.find(s => s.id === destino) && destino && (
                      <div className="muted" style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#f57c00" }}>
                        ⚠️ Cerrá sesión y volvé a iniciar sesión para que se actualicen tus datos
                      </div>
                    )}
                  </>
                ) : (
                  // Admin: puede seleccionar destino
                  <select 
                    className="input" 
                    value={destino ?? ""} 
                    onChange={(e) => setDestino(Number(e.target.value))}
                  >
                    <option value="">Seleccionar...</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.tipo})</option>
                    ))}
                  </select>
                )}
                {!isAdmin && sucursales.find(s => s.id === destino) && (
                  <div className="muted" style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>Tu sucursal asignada</div>
                )}
              </div>

              <div className="field">
                <label className="label">Productos</label>
                {items.length === 0 ? (
                  <div className="muted" style={{ marginBottom: "0.5rem" }}>No hay productos agregados</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    {items.map((item, index) => {
                      const producto = productos.find(p => p.id === item.producto);
                      return (
                        <div 
                          key={index} 
                          style={{ 
                            display: "flex", 
                            gap: "0.5rem", 
                            alignItems: "center", 
                            padding: "0.75rem", 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "4px" 
                          }}
                        >
                          <div style={{ flex: 2 }}>
                            <select 
                              className="input" 
                              value={item.producto || ""} 
                              onChange={(e) => {
                                const prodId = Number(e.target.value);
                                console.log('Producto seleccionado ID:', prodId);
                                console.log('Estado actual items:', items);
                                
                                const prod = productos.find(p => p.id === prodId);
                                console.log('Producto encontrado:', prod);
                                
                                const newItems = [...items];
                                newItems[index] = {
                                  ...newItems[index],
                                  producto: prodId,
                                  precio_costo_momento: prod ? prod.costo_compra.toString() : newItems[index].precio_costo_momento
                                };
                                setItems(newItems);
                                console.log('Items después de actualizar:', newItems);
                              }}
                            >
                              <option value="">Seleccionar producto...</option>
                              {productos.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} - {p.categoria_nombre || "Sin categoría"} - ${p.costo_compra}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="Cantidad" 
                            value={item.cantidad}
                            onChange={(e) => {
                              console.log('Cantidad cambiada a:', e.target.value);
                              updateItem(index, "cantidad", Number(e.target.value));
                            }}
                            min="1"
                            style={{ flex: 1 }}
                          />
                          
                          <input 
                            type="number" 
                            className="input" 
                            placeholder="Costo"
                            value={item.precio_costo_momento}
                            readOnly
                            disabled
                            step="0.01"
                            min="0"
                            style={{ flex: 1, backgroundColor: "#f5f5f5" }}
                          />
                          
                          <button 
                            type="button"
                            className="btn" 
                            onClick={() => removeItem(index)} 
                            style={{ padding: "0.5rem 1rem" }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button type="button" className="btn" onClick={addItem} disabled={productos.length === 0}>
                  + Agregar producto
                </button>
              </div>

              <button className="btn btn--primary" onClick={onCreate} disabled={busy || !destino || items.length === 0}>
                {busy ? "Creando..." : "Crear pedido"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Listado por estados */}
      {Object.entries(pedidosPorEstado).map(([estado, pedidosEstado]) => {
        if (pedidosEstado.length === 0) return null;
        
        return (
          <section key={estado} className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card__header">
              <div className="card__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {estadoLabels[estado as keyof typeof estadoLabels]}
                <span className="badge" style={{ backgroundColor: estadoColors[estado as keyof typeof estadoColors], color: "white" }}>
                  {pedidosEstado.length}
                </span>
              </div>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {pedidosEstado.map((pedido, idx) => (
                  <div 
                    key={pedido.id} 
                    style={{ 
                      padding: "1rem", 
                      borderBottom: idx < pedidosEstado.length - 1 ? "1px solid #f0f0f0" : undefined 
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                          Pedido #{pedido.id} - {pedido.destino_nombre}
                        </div>
                        <div className="muted" style={{ fontSize: "0.875rem" }}>
                          {new Date(pedido.fecha_creacion).toLocaleString("es-AR")}
                        </div>
                      </div>
                      {pedido.estado === "borrador" && (
                        <button 
                          className="btn btn--primary" 
                          onClick={() => onEnviarARevision(pedido.id)}
                          disabled={busy}
                          style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                        >
                          Enviar a revisión
                        </button>
                      )}
                    </div>
                    
                    <div style={{ backgroundColor: "#f9f9f9", padding: "0.75rem", borderRadius: "4px" }}>
                      <div style={{ fontWeight: 500, marginBottom: "0.5rem", fontSize: "0.875rem" }}>Productos:</div>
                      {pedido.items.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                          <span>{item.producto_nombre}</span>
                          <span>
                            <span style={{ fontWeight: "bold" }}>{item.cantidad}</span> unidades × ${item.precio_costo_momento}
                          </span>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid #e0e0e0", marginTop: "0.5rem", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                        <span>Total:</span>
                        <span>
                          ${pedido.items.reduce((sum, item) => 
                            sum + (item.cantidad * parseFloat(item.precio_costo_momento)), 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {pedidos.length === 0 && !showCreate && (
        <div className="card">
          <div className="card__body" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="muted">No hay pedidos registrados</div>
          </div>
        </div>
      )}
    </div>
  );
}
