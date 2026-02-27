// src/api/reports.ts
import { apiFetch } from "./http";

export type ReporteSucursal = {
  sucursal_id: number;
  sucursal_nombre: string;
  total_gastos: number;
  total_ventas: number;
  balance: number;
};

export type ReporteEconomico = {
  por_sucursal: ReporteSucursal[];
  totales: {
    total_gastos: number;
    total_ventas: number;
    balance: number;
  };
};

export type ReporteFilters = {
  sucursal?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export function getReporteEconomico(filters?: ReporteFilters) {
  const params = new URLSearchParams();
  if (filters?.sucursal) params.append('sucursal', filters.sucursal.toString());
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
  
  const query = params.toString();
  return apiFetch<ReporteEconomico>(`/api/sales/reporte-economico/${query ? `?${query}` : ''}`);
}
