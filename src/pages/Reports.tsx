// src/pages/Reports.tsx
import { useEffect, useMemo, useState } from "react";
import { getReporteEconomico } from "../api/reports";

type Period = "diario" | "semanal" | "mensual";

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

// Intenta “normalizar” el JSON del backend a un formato usable.
// Si tu back devuelve otros nombres, ajustamos este mapper.
function normalizeReport(raw: any) {
  // Caso A: el back ya trae totales
  const totals =
    raw?.totales ||
    raw?.total ||
    raw?.resumen ||
    raw?.kpis ||
    null;

  // Caso B: detalle por sucursal
  const byBranch =
    raw?.por_sucursal ||
    raw?.sucursales ||
    raw?.detalle ||
    raw?.items ||
    [];

  // Si byBranch no es array, intentamos convertir object->array
  const rows: any[] = Array.isArray(byBranch)
    ? byBranch
    : byBranch && typeof byBranch === "object"
    ? Object.entries(byBranch).map(([k, v]) => ({ sucursal: k, ...(v as any) }))
    : [];

  // Map a columnas comunes
  const mappedRows = rows.map((r) => {
    const nombre = r.nombre ?? r.sucursal_nombre ?? r.sucursal ?? r.id ?? "Sucursal";
    const ventas = toNumber(r.ventas ?? r.total_ventas ?? r.ingresos ?? r.recaudacion ?? 0);
    const costoPedidos = toNumber(r.costo_pedidos ?? r.gasto_pedidos ?? r.compras ?? r.costo ?? 0);
    const ganancia =
      r.ganancia != null
        ? toNumber(r.ganancia)
        : ventas - costoPedidos;

    const margen = ventas > 0 ? ganancia / ventas : 0;

    return { nombre, ventas, costoPedidos, ganancia, margen };
  });

  // Totales: si no vienen, los calculamos
  const totalVentas =
    totals?.ventas != null ? toNumber(totals.ventas) : mappedRows.reduce((a, b) => a + b.ventas, 0);

  const totalCosto =
    totals?.costo_pedidos != null ? toNumber(totals.costo_pedidos) : mappedRows.reduce((a, b) => a + b.costoPedidos, 0);

  const totalGanancia =
    totals?.ganancia != null ? toNumber(totals.ganancia) : mappedRows.reduce((a, b) => a + b.ganancia, 0);

  const totalMargen = totalVentas > 0 ? totalGanancia / totalVentas : 0;

  // Para encabezado de período si viene
  const label =
    raw?.periodo ||
    raw?.rango ||
    raw?.range ||
    null;

  return {
    label,
    totals: { totalVentas, totalCosto, totalGanancia, totalMargen },
    rows: mappedRows,
  };
}

function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <div className="card__body">
        <div className="muted" style={{ fontSize: 12 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
        {hint && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{hint}</div>}
      </div>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  // UI (si tu endpoint después soporta filtros, lo conectamos)
  const [period, setPeriod] = useState<Period>("mensual");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setErr(null);
    // Si tu backend soporta query params tipo ?periodo=mensual, lo conectamos acá.
    // Por ahora llamamos igual que antes:
    getReporteEconomico()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Error"));
  }, []);

  const report = useMemo(() => normalizeReport(data), [data]);

  // Orden: más ganancia primero
  const sortedRows = useMemo(() => {
    return [...(report.rows ?? [])].sort((a, b) => b.ganancia - a.ganancia);
  }, [report.rows]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="row row--between" style={{ flexWrap: "wrap" }}>
          <div>
            <h2 className="page__title">Reporte económico</h2>
            <p className="page__subtitle">
              {report.label ? `Período: ${report.label}` : "Resumen por sucursal + totales (vista mejorada)."}
            </p>
          </div>

          <div className="row" style={{ gap: 8 }}>
            <select
              className="input"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              style={{ width: 160 }}
              title="Periodo (UI)"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>

            <button className="btn" onClick={() => setShowRaw((s) => !s)}>
              {showRaw ? "Ocultar raw" : "Ver raw"}
            </button>
          </div>
        </div>
      </div>

      {err && <pre className="alert alert--error">{err}</pre>}

      {/* KPIs */}
      <div className="grid grid--4">
        <KpiCard title="Ventas" value={money(report.totals.totalVentas)} />
        <KpiCard title="Costo de pedidos" value={money(report.totals.totalCosto)} />
        <KpiCard title="Ganancia" value={money(report.totals.totalGanancia)} />
        <KpiCard title="Margen" value={pct(report.totals.totalMargen)} hint="Ganancia / Ventas" />
      </div>

      {/* Tabla por sucursal */}
      <section className="card">
        <div className="card__header">
          <div className="card__title">Resumen por sucursal</div>
          <div className="muted" style={{ fontSize: 12 }}>
            Ordenado por ganancia (mayor a menor). Período seleccionado: <span className="mono">{period}</span>
          </div>
        </div>

        <div className="card__body" style={{ paddingTop: 10 }}>
          {sortedRows.length === 0 ? (
            <div className="muted">El backend no devolvió detalle por sucursal (o no lo pude detectar).</div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Sucursal</th>
                    <th style={thRight}>Ventas</th>
                    <th style={thRight}>Costo pedidos</th>
                    <th style={thRight}>Ganancia</th>
                    <th style={thRight}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => (
                    <tr key={r.nombre}>
                      <td style={td}>{r.nombre}</td>
                      <td style={tdRight}>{money(r.ventas)}</td>
                      <td style={tdRight}>{money(r.costoPedidos)}</td>
                      <td style={tdRight}>
                        <span style={{ color: r.ganancia >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                          {money(r.ganancia)}
                        </span>
                      </td>
                      <td style={tdRight}>{pct(r.margen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Raw */}
      {showRaw && (
        <section className="card">
          <div className="card__header">
            <div className="card__title">Raw (debug)</div>
            <div className="muted" style={{ fontSize: 12 }}>Lo que viene del backend.</div>
          </div>
          <div className="card__body">
            <pre className="code">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </section>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  padding: "10px 8px",
  whiteSpace: "nowrap",
};

const thRight: React.CSSProperties = { ...th, textAlign: "right" };

const td: React.CSSProperties = {
  borderBottom: "1px solid var(--border)",
  padding: "10px 8px",
  whiteSpace: "nowrap",
};

const tdRight: React.CSSProperties = { ...td, textAlign: "right" };