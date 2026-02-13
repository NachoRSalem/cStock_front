import { apiFetch } from "./http";

export type SubUbicacion = { id: number; nombre: string; tipo: "heladera" | "freezer" | "ambiente" };
export type Sucursal = { id: number; nombre: string; tipo: string; sub_ubicaciones: SubUbicacion[] };

export function listSucursales() {
  return apiFetch<Sucursal[]>("/api/locations/sucursales/");
}
