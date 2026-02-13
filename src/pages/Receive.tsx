// src/pages/Receive.tsx
import { useState } from "react";
import { recibirPedido } from "../api/orders";

export default function Receive() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [pedidoId, setPedidoId] = useState("");
  const [itemsJson, setItemsJson] = useState(
    JSON.stringify([{ producto: 1, cantidad: 50, sub_ubicacion_destino: 2 }], null, 2)
  );

  async function onReceive() {
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const id = Number(pedidoId);
      if (!id) throw new Error("Poné un ID de pedido válido");
      const items = JSON.parse(itemsJson);
      await recibirPedido(id, { items });
      setOk("Pedido recibido OK");
    } catch (e: any) {
      setErr(e?.message ?? "Error recibiendo pedido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h2 className="page__title">Recibir pedido</h2>
        <p className="page__subtitle">Confirmá recepción y asigná sub-ubicación destino.</p>
      </div>

      {ok && <pre className="alert alert--ok">{ok}</pre>}
      {err && <pre className="alert alert--error">{err}</pre>}

      <section className="card">
        <div className="card__body">
          <div className="form">
            <div className="field">
              <label className="label">ID Pedido</label>
              <input className="input" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Items (JSON)</label>
              <textarea className="textarea" rows={12} value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} />
            </div>

            <button className="btn btn--primary" disabled={busy} onClick={onReceive}>
              {busy ? "Procesando..." : "Confirmar recepción"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
