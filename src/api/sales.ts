import { apiFetch } from "./http";

export type VentaItemCreate = {
  producto: number;
  sub_ubicacion_origen: number;
  cantidad: number;
  precio_venta_momento: string | number;
};
export type VentaCreateBody = { sucursal: number; items: VentaItemCreate[] };
export type Venta = { id: number };

export type VentaItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  sub_ubicacion_origen: number;
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
  items: VentaItem[];
};

export function createVenta(body: VentaCreateBody) {
  return apiFetch<Venta>("/api/sales/ventas/", { method: "POST", body });
}

export function listVentas(params?: { sucursal?: number }) {
  const qs = params?.sucursal ? `?sucursal=${params.sucursal}` : "";
  return apiFetch<VentaDetalle[]>(`/api/sales/ventas/${qs}`);
}
