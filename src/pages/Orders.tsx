// src/pages/Orders.tsx
import { useEffect, useState } from "react";
import { createPedido, listPedidos, recibirPedido, type Pedido } from "../api/orders";

export default function Orders() {
  const [items, setItems] = useState<Pedido[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [destino, setDestino] = useState("1");
  const [pedidoItemsJson, setPedidoItemsJson] = useState(
    JSON.stringify([{ producto: 1, cantidad: 50, precio_costo_momento: "850.00" }], null, 2)
  );

  const [recibirId, setRecibirId] = useState("");
  const [recibirItemsJson, setRecibirItemsJson] = useState(
    JSON.stringify([{ producto: 1, cantidad: 50, sub_ubicacion_destino: 2 }], null, 2)
  );

  async function reload() {
    setErr(null);
    const data = await listPedidos();
    setItems(data);
  }

  useEffect(() => {
    reload().catch((e) => setErr(e?.message ?? "Error"));
  }, []);

  async function onCreate() {
    setErr(null);
    setBusy(true);
    try {
      const itemsParsed = JSON.parse(pedidoItemsJson);
      await createPedido({ destino: Number(destino), items: itemsParsed });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Error creando pedido");
    } finally {
      setBusy(false);
    }
  }

  async function onRecibir() {
    setErr(null);
    setBusy(true);
    try {
      const id = Number(recibirId);
      if (!id) throw new Error("Poné un ID de pedido válido");
      const itemsParsed = JSON.parse(recibirItemsJson);
      await recibirPedido(id, { items: itemsParsed });
      await reload();
    } catch (e: any) {
      setErr(e?.message ?? "Error recibiendo pedido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Pedidos</h2>
        <p className="page__subtitle">Crear pedidos, recibir y ver listado.</p>
      </div>

      {err && <pre className="alert alert--error">{err}</pre>}

      <div className="grid grid--2">
        <section className="card">
          <div className="card__header">
            <div className="card__title">Crear pedido</div>
            <div className="muted">Destino + items (modo dev en JSON)</div>
          </div>

          <div className="card__body">
            <div className="form">
              <div className="field">
                <label className="label">Destino (ID sucursal/almacén)</label>
                <input className="input" value={destino} onChange={(e) => setDestino(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">Items (JSON)</label>
                <textarea
                  className="textarea"
                  rows={10}
                  value={pedidoItemsJson}
                  onChange={(e) => setPedidoItemsJson(e.target.value)}
                />
              </div>

              <button className="btn btn--primary" disabled={busy} onClick={onCreate}>
                {busy ? "Procesando..." : "Crear"}
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div className="card__title">Recibir pedido</div>
            <div className="muted">ID + items (modo dev en JSON)</div>
          </div>

          <div className="card__body">
            <div className="form">
              <div className="field">
                <label className="label">ID Pedido</label>
                <input className="input" value={recibirId} onChange={(e) => setRecibirId(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">Items (JSON)</label>
                <textarea
                  className="textarea"
                  rows={10}
                  value={recibirItemsJson}
                  onChange={(e) => setRecibirItemsJson(e.target.value)}
                />
              </div>

              <button className="btn" disabled={busy} onClick={onRecibir}>
                {busy ? "Procesando..." : "Recibir"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <div className="card__title">Listado (raw)</div>
          <div className="muted">Respuesta del backend</div>
        </div>
        <div className="card__body">
          <pre className="code">{JSON.stringify(items, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
