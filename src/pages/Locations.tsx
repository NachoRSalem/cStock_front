// src/pages/Locations.tsx
import { useEffect, useState } from "react";
import { listSucursales, type Sucursal } from "../api/locations";

export default function Locations() {
  const [data, setData] = useState<Sucursal[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listSucursales()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Error"));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Sucursales</h2>
        <p className="page__subtitle">Listado de ubicaciones y sub-ubicaciones.</p>
      </div>

      {err && <pre className="alert alert--error">{err}</pre>}

      <div className="stack">
        {data.map((s) => (
          <div key={s.id} className="card">
            <div className="card__body">
              <div className="row row--between">
                <div className="card__title">{s.nombre}</div>
                <div className="badge">{s.tipo}</div>
              </div>

              {s.sub_ubicaciones?.length ? (
                <div className="sublist">
                  {s.sub_ubicaciones.map((u) => (
                    <div key={u.id} className="sublist__item">
                      <span className="mono">#{u.id}</span> {u.nombre}{" "}
                      <span className="muted">· {u.tipo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">Sin sub-ubicaciones</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
