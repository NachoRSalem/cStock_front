// src/pages/Receive.tsx
import { useMemo, useState } from "react";
import { getPedido, recibirPedido, type Pedido, type PedidoItem } from "../api/orders";

export default function Receive() {
  const [pedidoId, setPedidoId] = useState("");
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const [destinos, setDestinos] = useState<Record<number, number>>({}); // key = pedidoItem.id
  const [loadingPedido, setLoadingPedido] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const items = pedido?.items ?? [];

  const faltanDestinos = useMemo(() => {
    if (!items.length) return false;
    return items.some((it) => !destinos[it.id] && it.sub_ubicacion_destino == null);
  }, [items, destinos]);

  async function buscarPedido() {
    setErr(null);
    setOk(null);

    const id = Number(pedidoId);
    if (!id) {
      setErr("Ingresá un ID de pedido válido.");
      return;
    }

    try {
      setLoadingPedido(true);
      const p = await getPedido(id);
      setPedido(p);

      // precargar si ya vienen destinos seteados
      const preset: Record<number, number> = {};
      for (const it of p.items ?? []) {
        if (it.sub_ubicacion_destino != null) preset[it.id] = it.sub_ubicacion_destino;
      }
      setDestinos(preset);
    } catch (e: any) {
      setPedido(null);
      setDestinos({});
      setErr(e?.message ?? "Error buscando pedido.");
    } finally {
      setLoadingPedido(false);
    }
  }

  async function confirmarRecepcion() {
    setErr(null);
    setOk(null);

    if (!pedido) {
      setErr("Primero buscá un pedido.");
      return;
    }

    if (items.length === 0) {
      setErr("El pedido no tiene items.");
      return;
    }

    // armamos body según tu tipo: { items: [{ id, sub_ubicacion_destino }] }
    const body = {
      items: items.map((it) => ({
        id: it.id,
        sub_ubicacion_destino:
          destinos[it.id] ?? it.sub_ubicacion_destino ?? 0,
      })),
    };

    // validación: todos con destino
    if (body.items.some((x) => !x.sub_ubicacion_destino || x.sub_ubicacion_destino <= 0)) {
      setErr("Asigná sub-ubicación destino a todos los productos.");
      return;
    }

    try {
      setBusy(true);
      await recibirPedido(pedido.id, body);
      setOk("Pedido recibido OK.");

      // recargar para ver estado actualizado
      const p = await getPedido(pedido.id);
      setPedido(p);
    } catch (e: any) {
      setErr(e?.message ?? "Error confirmando recepción.");
    } finally {
      setBusy(false);
    }
  }

  function renderItem(it: PedidoItem) {
    const value = destinos[it.id] ?? it.sub_ubicacion_destino ?? "";

    return (
      <div key={it.id} className="card">
        <div className="card__body row row--between" style={{ flexWrap: "wrap" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div style={{ fontWeight: 600 }}>{it.producto_nombre}</div>
            <div className="muted">
              Cantidad: <span className="mono">{it.cantidad}</span> · Item ID: <span className="mono">#{it.id}</span>
            </div>
          </div>

          {/* Por ahora hardcodeo opciones. Luego lo conectamos a /sub_ubicaciones de la sucursal */}
          <select
            className="input"
            style={{ width: 220 }}
            value={value}
            onChange={(e) =>
              setDestinos((prev) => ({ ...prev, [it.id]: Number(e.target.value) }))
            }
          >
            <option value="">Sub-ubicación destino</option>
            <option value={1}>Heladera 1</option>
            <option value={2}>Heladera 2</option>
            <option value={3}>Freezer 1</option>
            <option value={4}>Freezer 2</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h2 className="page__title">Recibir pedido</h2>
        <p className="page__subtitle">Buscá el pedido y asigná sub-ubicación destino a cada ítem.</p>
      </div>

      {ok && <div className="alert alert--ok">{ok}</div>}
      {err && <div className="alert alert--error">{err}</div>}

      <section className="card">
        <div className="card__body stack">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label className="label">ID Pedido</label>
              <input
                className="input"
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                placeholder="Ej: 12"
              />
            </div>

            <button className="btn" onClick={buscarPedido} disabled={loadingPedido}>
              {loadingPedido ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {pedido && (
            <div className="card">
              <div className="card__body">
                <div className="row row--between" style={{ flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Pedido #{pedido.id}</div>
                    <div className="muted">
                      Estado: <span className="mono">{pedido.estado}</span> · Destino:{" "}
                      <span className="mono">{pedido.destino_nombre}</span>
                    </div>
                  </div>
                  <div className="badge">Items: {pedido.items?.length ?? 0}</div>
                </div>
              </div>
            </div>
          )}

          {pedido && items.length > 0 && (
            <div className="stack">
              {items.map(renderItem)}

              <button
                className="btn btn--primary"
                onClick={confirmarRecepcion}
                disabled={busy || faltanDestinos}
                title={faltanDestinos ? "Faltan sub-ubicaciones en algunos items" : ""}
              >
                {busy ? "Procesando..." : "Confirmar recepción"}
              </button>

              {faltanDestinos && (
                <div className="muted">
                  Completá la sub-ubicación destino en todos los productos antes de confirmar.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}