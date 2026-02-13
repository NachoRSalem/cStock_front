// src/pages/Sales.tsx
import { useState } from "react";
import { createVenta } from "../api/sales";

export default function Sales() {
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [ventaJson, setVentaJson] = useState(
    JSON.stringify(
      {
        sucursal: 1,
        items: [{ producto: 1, sub_ubicacion_origen: 2, cantidad: 5, precio_venta_momento: "1200.00" }],
      },
      null,
      2
    )
  );

  async function onSend() {
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const body = JSON.parse(ventaJson);
      const res = await createVenta(body);
      setOk(`Venta registrada (id: ${res.id})`);
    } catch (e: any) {
      setErr(e?.message ?? "Error registrando venta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page__header">
        <h2 className="page__title">Ventas</h2>
        <p className="page__subtitle">Registrar venta (modo dev en JSON).</p>
      </div>

      {ok && <pre className="alert alert--ok">{ok}</pre>}
      {err && <pre className="alert alert--error">{err}</pre>}

      <section className="card">
        <div className="card__body">
          <div className="form">
            <div className="field">
              <label className="label">Body (JSON)</label>
              <textarea className="textarea" rows={14} value={ventaJson} onChange={(e) => setVentaJson(e.target.value)} />
            </div>

            <button className="btn btn--primary" disabled={busy} onClick={onSend}>
              {busy ? "Procesando..." : "Registrar venta"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
