import { apiFetch } from "./http";

export type VentaItemCreate = {
  producto: number;
  /** Las viandas no salen de ninguna sub-ubicación: se omite. */
  sub_ubicacion_origen?: number;
  cantidad: number;
  precio_venta_momento?: string | number;
};
export type VentaCreateBody = { sucursal: number; items: VentaItemCreate[] };
export type Venta = { id: number };

export type VentaItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  sub_ubicacion_origen: number | null;
  cantidad: number;
  precio_venta_momento: string;
};

export type VentaDetalle = {
  id: number;
  vendedor: number;
  vendedor_nombre: string;
  sucursal: number;
  sucursal_nombre: string;
  fecha: string;
  total: string;
  estado: "completada" | "anulada";
  anulada_en: string | null;
  anulada_por_nombre: string | null;
  items: VentaItem[];
};

export type VentasPaginadas = {
  count: number;
  next: string | null;
  previous: string | null;
  results: VentaDetalle[];
};

export function createVenta(body: VentaCreateBody) {
  return apiFetch<Venta>("/api/sales/ventas/", { method: "POST", body });
}

export function anularVenta(id: number) {
  return apiFetch<VentaDetalle>(`/api/sales/ventas/${id}/anular/`, { method: "POST" });
}

export function listVentas(params?: { sucursal?: number; page?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.sucursal) queryParams.set("sucursal", params.sucursal.toString());
  if (params?.page) queryParams.set("page", params.page.toString());
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiFetch<VentasPaginadas>(`/api/sales/ventas/${qs}`);
}
