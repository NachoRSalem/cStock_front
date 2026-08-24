import { apiFetch } from "./http";

export type RecetaInsumo = {
  id: number;
  producto_insumo: number;
  producto_insumo_nombre: string;
  cantidad_requerida: number;
};

export type RecetaInsumoUpsert = {
  producto_insumo: number;
  cantidad_requerida: number;
};

export type RecetaUpsertBody = {
  producto_final: number;
  activa: boolean;
  notas?: string | null;
  insumos: RecetaInsumoUpsert[];
};

export type Receta = {
  id: number;
  producto_final: number;
  producto_final_nombre: string;
  activa: boolean;
  notas: string | null;
  insumos: RecetaInsumo[];
  creado_en: string;
  actualizado_en: string;
};

export type FabricacionConsumo = {
  id: number;
  insumo_nombre: string;
  sub_ubicacion_origen: number;
  sub_ubicacion_origen_nombre: string;
  lote: string | null;
  cantidad_consumida: number;
};

export type Fabricacion = {
  id: number;
  receta: number;
  producto_final_nombre: string;
  ubicacion: number;
  ubicacion_nombre: string;
  sub_ubicacion_destino: number;
  sub_ubicacion_destino_nombre: string;
  cantidad_producida: number;
  creado_por: number;
  creado_en: string;
  consumos: FabricacionConsumo[];
  stock_generado_id?: number;
};

export type FabricacionResumenConsumo = {
  insumo_id: number;
  insumo_nombre: string;
  cantidad_total_consumida: number;
};

export type FabricacionDetalle = Fabricacion & {
  consumos_resumen: FabricacionResumenConsumo[];
};

export type FabricacionListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FabricacionDetalle[];
};

export type FabricarBody = {
  cantidad_producir: number;
  sub_ubicacion_destino: number;
  sub_ubicaciones_origen: Record<string, number>;
};

export function listRecetasFabricables() {
  return apiFetch<Receta[]>("/api/recipes/recetas/fabricables/?activa=true");
}

export function fabricarReceta(recetaId: number, body: FabricarBody) {
  return apiFetch<Fabricacion>(`/api/recipes/recetas/${recetaId}/fabricar/`, {
    method: "POST",
    body,
  });
}

export function listFabricaciones(params?: { ubicacion?: number; page?: number }) {
  const query = new URLSearchParams();
  if (params?.ubicacion) query.set("ubicacion", String(params.ubicacion));
  if (params?.page) query.set("page", String(params.page));
  const qs = query.toString();
  return apiFetch<FabricacionListResponse>(`/api/recipes/fabricaciones/${qs ? `?${qs}` : ""}`);
}

export function updateReceta(recetaId: number, body: RecetaUpsertBody) {
  return apiFetch<Receta>(`/api/recipes/recetas/${recetaId}/`, {
    method: "PUT",
    body,
  });
}
