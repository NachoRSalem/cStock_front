// src/pages/OrdersApprovals.tsx
import { useEffect, useState } from "react";
import { aprobarPedido, listPedidos, rechazarPedido, type Pedido } from "../api/orders";

export default function OrdersApprovals() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listPedidos();
      setPedidos(data);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function handleAprobar(id: number) {
    if (!confirm("¿Aprobar este pedido?")) return;
    
    setBusy(true);
    setErr(null);
    try {
      await aprobarPedido(id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error aprobando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function handleRechazar(id: number) {
    if (!confirm("¿Rechazar este pedido? Esta acción no se puede deshacer.")) return;
    
    setBusy(true);
    setErr(null);
    try {
      await rechazarPedido(id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error rechazando pedido");
    } finally {
      setBusy(false);
    }
  }

  const pedidosPendientes = pedidos.filter(p => p.estado === "pendiente");
  const pedidosOtros = pedidos.filter(p => p.estado !== "pendiente");

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <h2 className="page__title">Aprobar / Rechazar pedidos</h2>
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
        <h2 className="page__title">Aprobar / Rechazar pedidos</h2>
        <p className="page__subtitle">Gestión de pedidos pendientes de aprobación</p>
      </div>

      {err && <div className="alert alert--error">{err}</div>}

      {/* Pedidos pendientes */}
      {pedidosPendientes.length > 0 ? (
        <section className="card" style={{ marginBottom: "2rem" }}>
          <div className="card__header">
            <div className="card__title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⏳ Pendientes de aprobación
              <span className="badge" style={{ backgroundColor: "#f57c00", color: "white" }}>
                {pedidosPendientes.length}
              </span>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {pedidosPendientes.map((pedido, idx) => (
                <div 
                  key={pedido.id} 
                  style={{ 
                    padding: "1.5rem", 
                    borderBottom: idx < pedidosPendientes.length - 1 ? "1px solid #f0f0f0" : undefined,
                    backgroundColor: "#fffbf0"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                        Pedido #{pedido.id}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#666", marginBottom: "0.25rem" }}>
                        📍 Destino: <strong>{pedido.destino_nombre}</strong>
                      </div>
                      <div className="muted" style={{ fontSize: "0.875rem" }}>
                        📅 {new Date(pedido.fecha_creacion).toLocaleString("es-AR")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        className="btn btn--primary" 
                        onClick={() => handleAprobar(pedido.id)}
                        disabled={busy}
                        style={{ fontSize: "0.875rem", padding: "0.5rem 1.5rem" }}
                      >
                        ✓ Aprobar
                      </button>
                      <button 
                        className="btn" 
                        onClick={() => handleRechazar(pedido.id)}
                        disabled={busy}
                        style={{ 
                          fontSize: "0.875rem", 
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#fff",
                          border: "1px solid #d32f2f",
                          color: "#d32f2f"
                        }}
                      >
                        ✕ Rechazar
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: "#fff", padding: "1rem", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                    <div style={{ fontWeight: 500, marginBottom: "0.75rem", fontSize: "0.875rem" }}>Productos solicitados:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {pedido.items.map(item => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{item.producto_nombre}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <span className="muted" style={{ fontSize: "0.875rem" }}>
                              <strong style={{ color: "#000" }}>{item.cantidad}</strong> unidades
                            </span>
                            <span className="muted" style={{ fontSize: "0.875rem" }}>
                              ${item.precio_costo_momento} c/u
                            </span>
                            <span style={{ fontWeight: "bold", minWidth: "80px", textAlign: "right" }}>
                              ${(item.cantidad * parseFloat(item.precio_costo_momento)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ 
                      borderTop: "2px solid #e0e0e0", 
                      marginTop: "0.75rem", 
                      paddingTop: "0.75rem", 
                      display: "flex", 
                      justifyContent: "space-between",
                      fontSize: "1.125rem",
                      fontWeight: "bold"
                    }}>
                      <span>Total del pedido:</span>
                      <span style={{ color: "#f57c00" }}>
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
      ) : (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <div className="card__body" style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 500, marginBottom: "0.5rem" }}>
              No hay pedidos pendientes de aprobación
            </div>
            <div className="muted">Todos los pedidos han sido procesados</div>
          </div>
        </div>
      )}

      {/* Historial de otros pedidos */}
      {pedidosOtros.length > 0 && (
        <section className="card">
          <div className="card__header">
            <div className="card__title">Historial reciente</div>
            <div className="muted">{pedidosOtros.length} pedidos</div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#f5f5f5" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Pedido</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Destino</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Fecha</th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>Estado</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosOtros.slice(0, 10).map((pedido) => {
                    const total = pedido.items.reduce((sum, item) => 
                      sum + (item.cantidad * parseFloat(item.precio_costo_momento)), 0
                    );
                    
                    const estadoConfig = {
                      borrador: { emoji: "📝", text: "Borrador", color: "#757575" },
                      aprobado: { emoji: "✅", text: "Aprobado", color: "#388e3c" },
                      recibido: { emoji: "📦", text: "Recibido", color: "#1976d2" },
                      rechazado: { emoji: "❌", text: "Rechazado", color: "#d32f2f" }
                    }[pedido.estado] || { emoji: "", text: pedido.estado, color: "#757575" };

                    return (
                      <tr key={pedido.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.75rem" }}>
                          <strong>#{pedido.id}</strong>
                        </td>
                        <td style={{ padding: "0.75rem" }}>{pedido.destino_nombre}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <div className="muted" style={{ fontSize: "0.875rem" }}>
                            {new Date(pedido.fecha_creacion).toLocaleDateString("es-AR")}
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center" }}>
                          <span style={{ 
                            padding: "0.25rem 0.75rem", 
                            borderRadius: "12px", 
                            backgroundColor: estadoConfig.color + "20",
                            color: estadoConfig.color,
                            fontSize: "0.875rem",
                            fontWeight: 500
                          }}>
                            {estadoConfig.emoji} {estadoConfig.text}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 500 }}>
                          ${total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
