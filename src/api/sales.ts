import ventasMock from "../mock-data/ventas.json";

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

export type VentasPaginadas = {
  count: number;
  next: string | null;
  previous: string | null;
  results: VentaDetalle[];
};

let ventasData = [...ventasMock] as VentaDetalle[];

export function createVenta(body: VentaCreateBody) {
  const newVenta: VentaDetalle = {
    id: Math.max(...ventasData.map((v) => v.id)) + 1,
    vendedor: 1,
    vendedor_nombre: "admin",
    sucursal: body.sucursal,
    sucursal_nombre: body.sucursal === 1 ? "Almacén Central" : "Sucursal Norte",
    fecha: new Date().toISOString().split("T")[0],
    total: String(
      body.items.reduce(
        (sum, item) =>
          sum + Number(item.cantidad) * Number(item.precio_venta_momento),
        0
      )
    ),
    items: body.items.map((item, idx) => ({
      id: Date.now() + idx,
      producto: item.producto,
      producto_nombre: "",
      sub_ubicacion_origen: item.sub_ubicacion_origen,
      cantidad: item.cantidad,
      precio_venta_momento: String(item.precio_venta_momento),
    })),
  };
  ventasData.unshift(newVenta);
  return Promise.resolve({ id: newVenta.id });
}

export function listVentas(params?: { sucursal?: number; page?: number }) {
  let filtered = [...ventasData];

  if (params?.sucursal) {
    filtered = filtered.filter((v) => v.sucursal === params.sucursal);
  }

  const page = params?.page || 1;
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const result: VentasPaginadas = {
    count: filtered.length,
    next: end < filtered.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: filtered.slice(start, end),
  };

  return Promise.resolve(result);
}

export function getVenta(id: number) {
  const venta = ventasData.find((v) => v.id === id);
  if (!venta) {
    return Promise.reject(new Error("Venta no encontrada"));
  }
  return Promise.resolve(venta);
}

export function getVentasPorFecha(sucursal: number, fechaInicio: string, fechaFin: string) {
  const filtered = ventasData.filter((v) => {
    const fechaVenta = new Date(v.fecha);
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    return v.sucursal === sucursal && fechaVenta >= inicio && fechaVenta <= fin;
  });
  return Promise.resolve(filtered);
}