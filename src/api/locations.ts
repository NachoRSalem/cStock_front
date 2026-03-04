import { apiFetch } from "./http";

export type SubUbicacion = { id: number; nombre: string; tipo: "heladera" | "freezer" | "ambiente" };
export type Sucursal = { id: number; nombre: string; tipo: string; sub_ubicaciones: SubUbicacion[] };

export type SubUbicacionCreateBody = {
  ubicacion: number;
  nombre: string;
  tipo: "heladera" | "freezer" | "ambiente";
};

export function listSucursales() {
  return apiFetch<Sucursal[]>("/api/locations/sucursales/");
}

export function createSubUbicacion(body: SubUbicacionCreateBody) {
  return apiFetch<SubUbicacion>("/api/locations/sub-ubicaciones/", { method: "POST", body });
}
