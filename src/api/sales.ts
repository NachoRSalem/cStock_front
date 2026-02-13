import { apiFetch } from "./http";

export type VentaItemCreate = {
  producto: number;
  sub_ubicacion_origen: number;
  cantidad: number;
  precio_venta_momento: string | number;
};
export type VentaCreateBody = { sucursal: number; items: VentaItemCreate[] };
export type Venta = { id: number };

export function createVenta(body: VentaCreateBody) {
  return apiFetch<Venta>("/api/sales/ventas/", { method: "POST", body });
}
