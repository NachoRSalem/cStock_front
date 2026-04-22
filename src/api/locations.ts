import sucursalesMock from "../mock-data/sucursales.json";

export type SubUbicacion = { id: number; nombre: string; tipo: "heladera" | "freezer" | "ambiente" };
export type Sucursal = { id: number; nombre: string; tipo: string; sub_ubicaciones: SubUbicacion[] };

export type SubUbicacionCreateBody = {
  ubicacion: number;
  nombre: string;
  tipo: "heladera" | "freezer" | "ambiente";
};

let sucursalesData = [...sucursalesMock] as Sucursal[];

export function listSucursales() {
  return Promise.resolve(sucursalesData);
}

export function getSucursal(id: number) {
  const sucursal = sucursalesData.find((s) => s.id === id);
  if (!sucursal) {
    return Promise.reject(new Error("Sucursal no encontrada"));
  }
  return Promise.resolve(sucursal);
}

export function createSubUbicacion(body: SubUbicacionCreateBody & { nombre: string }) {
  if (sucursalesData.length === 0) {
    return Promise.reject(new Error("No hay sucursales"));
  }
  const newSubUbicacion: SubUbicacion = {
    id: Math.max(...sucursalesData.flatMap((s) => s.sub_ubicaciones.map((su) => su.id))) + 1,
    nombre: body.nombre,
    tipo: body.tipo,
  };
  sucursalesData[0].sub_ubicaciones.push(newSubUbicacion);
  return Promise.resolve(newSubUbicacion);
}