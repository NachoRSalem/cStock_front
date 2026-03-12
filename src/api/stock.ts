import { apiFetch } from "./http";

export type Stock = {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_tipo_conservacion: "ambiente" | "heladera" | "freezer";
  producto_dias_caducidad: number | null;
  sub_ubicacion: number;
  sub_ubicacion_nombre: string;
  sub_ubicacion_tipo: "ambiente" | "heladera" | "freezer";
  ubicacion_id: number;
  ubicacion_nombre: string;
  cantidad: number;
  ultima_actualizacion: string;
  fecha_ingreso: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
};

export function listStock(params?: {
  ubicacion?: number;
  sub_ubicacion?: number;
  producto?: number;
  solo_con_stock?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.ubicacion) query.set("ubicacion", params.ubicacion.toString());
  if (params?.sub_ubicacion) query.set("sub_ubicacion", params.sub_ubicacion.toString());
  if (params?.producto) query.set("producto", params.producto.toString());
  if (params?.solo_con_stock) query.set("solo_con_stock", "true");

  const queryString = query.toString();
  return apiFetch<Stock[]>(`/api/inventory/stock/${queryString ? "?" + queryString : ""}`);
}

export type StockCreateBody = {
  producto: number;
  sub_ubicacion: number;
  cantidad: number;
  fecha_ingreso?: string;
  lote?: string;
};

export function createStock(body: StockCreateBody) {
  return apiFetch<Stock>("/api/inventory/stock/", {
    method: "POST",
    body,
  });
}

export type StockUpdateBody = {
  cantidad: number;
  fecha_ingreso?: string;
  lote?: string;
};

export function updateStock(id: number, body: StockUpdateBody) {
  return apiFetch<Stock>(`/api/inventory/stock/${id}/`, {
    method: "PATCH",
    body,
  });
}
