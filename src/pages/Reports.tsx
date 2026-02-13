// src/pages/Reports.tsx
import { useEffect, useState } from "react";
import { getReporteEconomico } from "../api/reports";

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getReporteEconomico().then(setData).catch((e) => setErr(e?.message ?? "Error"));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Reporte económico</h2>
        <p className="page__subtitle">Datos crudos del backend (por ahora).</p>
      </div>

      {err && <pre className="alert alert--error">{err}</pre>}

      <section className="card">
        <div className="card__body">
          <pre className="code">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
