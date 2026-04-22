import { apiFetch } from "./http";
import sucursalesMock from "../mock-data/sucursales.json";

export type SubUbicacion = { id: number; nombre: string; tipo: "heladera" | "freezer" | "ambiente" };
export type Sucursal = { id: number; nombre: string; tipo: string; sub_ubicaciones: SubUbicacion[] };

export type SubUbicacionCreateBody = {
  ubicacion: number;
  nombre: string;
  tipo: "heladera" | "freezer" | "ambiente";
};

export function listSucursales() {
  return Promise.resolve(sucursalesMock);
}

export function createSubUbicacion(body: SubUbicacionCreateBody) {
  const newSubUbicacion = {
    id: Date.now(),
    ...body
  };
  sucursalesMock[0].sub_ubicaciones.push(newSubUbicacion);
  return Promise.resolve(newSubUbicacion);
}
