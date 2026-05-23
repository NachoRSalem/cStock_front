import { apiFetch } from "./http";

export type Ingreso = {
  id: number;
  monto: string;
  fecha: string;
  descripcion: string;
  tipo: string;
  registrado_por: number;
  registrado_por_nombre: string;
  creado_en: string;
};

export type IngresoCreateUpdate = {
  monto: string | number;
  fecha: string;
  descripcion?: string;
  tipo?: string;
};

export type BalanceData = {
  total_egresos: number;
  total_ingresos_cuotas: number;
  total_ventas_kiosco: number;
  total_ingresos: number;
  balance: number;
};

export function listIngresos(params?: { fecha_desde?: string; fecha_hasta?: string }) {
  const query = new URLSearchParams();
  if (params?.fecha_desde) query.set("fecha_desde", params.fecha_desde);
  if (params?.fecha_hasta) query.set("fecha_hasta", params.fecha_hasta);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<Ingreso[]>(`/api/sales/ingresos/${qs}`);
}

export function createIngreso(body: IngresoCreateUpdate) {
  return apiFetch<Ingreso>("/api/sales/ingresos/", { method: "POST", body });
}

export function updateIngreso(id: number, body: IngresoCreateUpdate) {
  return apiFetch<Ingreso>(`/api/sales/ingresos/${id}/`, { method: "PUT", body });
}

export function deleteIngreso(id: number) {
  return apiFetch<void>(`/api/sales/ingresos/${id}/`, { method: "DELETE" });
}

export function getBalance(params?: { fecha_desde?: string; fecha_hasta?: string }) {
  const query = new URLSearchParams();
  if (params?.fecha_desde) query.set("fecha_desde", params.fecha_desde);
  if (params?.fecha_hasta) query.set("fecha_hasta", params.fecha_hasta);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<BalanceData>(`/api/sales/balance/${qs}`);
}
