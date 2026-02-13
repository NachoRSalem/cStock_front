// src/api/reports.ts
import { apiFetch } from "./http";
export function getReporteEconomico() {
  return apiFetch<any>("/api/sales/reporte-economico/");
}
