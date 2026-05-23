import { apiFetch } from "./http";

export type ConsumoItemCreate = {
  producto: number;
  cantidad: string | number;
  sub_ubicacion_origen: number;
};

export type ConsumoItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: string;
  sub_ubicacion_origen: number;
  sub_ubicacion_origen_nombre: string;
  costo_unitario_momento: string;
};

export type ConsumoCocina = {
  id: number;
  ubicacion: number;
  ubicacion_nombre: string;
  fecha: string;
  registrado_por: number;
  registrado_por_nombre: string;
  creado_en: string;
  total_costo: string;
  items: ConsumoItem[];
};

export type ConsumosPaginados = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ConsumoCocina[];
};

export function createConsumo(body: {
  ubicacion?: number;
  fecha: string;
  items: ConsumoItemCreate[];
}) {
  return apiFetch<ConsumoCocina>("/api/consumos/consumos/", { method: "POST", body });
}

export function listConsumos(params?: {
  ubicacion?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.ubicacion) query.set("ubicacion", params.ubicacion.toString());
  if (params?.fecha_desde) query.set("fecha_desde", params.fecha_desde);
  if (params?.fecha_hasta) query.set("fecha_hasta", params.fecha_hasta);
  if (params?.page) query.set("page", params.page.toString());
  const qs = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ConsumosPaginados>(`/api/consumos/consumos/${qs}`);
}

export function deleteConsumo(id: number) {
  return apiFetch<void>(`/api/consumos/consumos/${id}/`, { method: "DELETE" });
}
