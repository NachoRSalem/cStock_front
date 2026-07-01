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

// --- Producción de Viandas ---

export type ProduccionViandaItemCreate = {
  producto: number;
  cantidad: number;
};

export type ProduccionViandaItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_venta_momento: string;
};

export type ProduccionVianda = {
  id: number;
  ubicacion: number;
  ubicacion_nombre: string;
  sub_ubicacion_destino: number;
  sub_ubicacion_destino_nombre: string;
  fecha: string;
  registrado_por: number;
  registrado_por_nombre: string;
  creado_en: string;
  items: ProduccionViandaItem[];
};

export type ProduccionesViandaPaginadas = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProduccionVianda[];
};

export function createProduccionVianda(body: {
  ubicacion?: number;
  sub_ubicacion_destino: number;
  fecha: string;
  items: ProduccionViandaItemCreate[];
}) {
  return apiFetch<ProduccionVianda>("/api/consumos/producciones-vianda/", { method: "POST", body });
}

export function listProduccionesVianda(params?: {
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
  return apiFetch<ProduccionesViandaPaginadas>(`/api/consumos/producciones-vianda/${qs}`);
}

export function deleteProduccionVianda(id: number) {
  return apiFetch<void>(`/api/consumos/producciones-vianda/${id}/`, { method: "DELETE" });
}

export type ViandaRapidaCreada = {
  id: number;
  nombre: string;
  precio_venta: string;
  categoria_nombre: string;
};

export function crearViandaRapida(body: { nombre: string; precio_venta: string | number }) {
  return apiFetch<ViandaRapidaCreada>("/api/consumos/producciones-vianda/crear-vianda-rapida/", { method: "POST", body });
}
