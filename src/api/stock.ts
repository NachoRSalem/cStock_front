import stockMock from "../mock-data/stock.json";
import productosMock from "../mock-data/productos.json";

export type TipoConservacion = "ambiente" | "heladera" | "freezer";

export type Stock = {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_tipo_conservacion: TipoConservacion;
  producto_dias_caducidad: number | null;
  sub_ubicacion: number;
  sub_ubicacion_nombre: string;
  sub_ubicacion_tipo: TipoConservacion;
  ubicacion_id: number;
  ubicacion_nombre: string;
  cantidad: number;
  ultima_actualizacion: string;
  fecha_ingreso: string | null;
  lote: string | null;
  fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
};

let stockData = [...stockMock] as Stock[];

function getProductoTipo(productoId: number): TipoConservacion {
  const producto = productosMock.find((p) => p.id === productoId);
  return (producto?.tipo_conservacion as TipoConservacion) || "ambiente";
}

function getProductoDias(productoId: number): number | null {
  const producto = productosMock.find((p) => p.id === productoId);
  return producto?.dias_caducidad || null;
}

export function listStock(params?: {
  ubicacion?: number;
  sub_ubicacion?: number;
  producto?: number;
  solo_con_stock?: boolean;
}) {
  let filtered = [...stockData];

  if (params?.ubicacion) {
    filtered = filtered.filter((s) => s.ubicacion_id === params.ubicacion);
  }

  if (params?.sub_ubicacion) {
    filtered = filtered.filter((s) => s.sub_ubicacion === params.sub_ubicacion);
  }

  if (params?.producto) {
    filtered = filtered.filter((s) => s.producto === params.producto);
  }

  if (params?.solo_con_stock) {
    filtered = filtered.filter((s) => s.cantidad > 0);
  }

  return Promise.resolve(filtered);
}

export function getStock(id: number) {
  const stock = stockData.find((s) => s.id === id);
  if (!stock) {
    return Promise.reject(new Error("Stock no encontrado"));
  }
  return Promise.resolve(stock);
}

export type StockCreateBody = {
  producto: number;
  sub_ubicacion: number;
  cantidad: number;
  fecha_ingreso?: string;
  lote?: string;
  ubicacion_id: number;
  ubicacion_nombre: string;
  sub_ubicacion_nombre: string;
  sub_ubicacion_tipo?: TipoConservacion;
};

export function createStock(body: StockCreateBody) {
  const producto = productosMock.find((p) => p.id === body.producto);
  const newStock: Stock = {
    id: Math.max(...stockData.map((s) => s.id)) + 1,
    producto: body.producto,
    producto_nombre: producto?.nombre || "Unknown",
    producto_tipo_conservacion: getProductoTipo(body.producto),
    producto_dias_caducidad: getProductoDias(body.producto),
    sub_ubicacion: body.sub_ubicacion,
    sub_ubicacion_nombre: body.sub_ubicacion_nombre,
    sub_ubicacion_tipo: body.sub_ubicacion_tipo || "ambiente",
    ubicacion_id: body.ubicacion_id,
    ubicacion_nombre: body.ubicacion_nombre,
    cantidad: body.cantidad,
    ultima_actualizacion: new Date().toISOString().split("T")[0],
    fecha_ingreso: body.fecha_ingreso || new Date().toISOString().split("T")[0],
    lote: body.lote || `L${Date.now()}`,
    fecha_vencimiento: null,
    dias_para_vencer: producto?.dias_caducidad || null,
  };
  stockData.push(newStock);
  return Promise.resolve(newStock);
}

export type StockUpdateBody = {
  cantidad: number;
  fecha_ingreso?: string;
  lote?: string;
};

export function updateStock(id: number, body: StockUpdateBody) {
  const index = stockData.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Stock no encontrado"));
  }
  stockData[index] = {
    ...stockData[index],
    cantidad: body.cantidad,
    ultima_actualizacion: new Date().toISOString().split("T")[0],
    fecha_ingreso: body.fecha_ingreso || stockData[index].fecha_ingreso,
    lote: body.lote || stockData[index].lote,
  };
  return Promise.resolve(stockData[index]);
}

export function deleteStock(id: number) {
  const index = stockData.findIndex((s) => s.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Stock no encontrado"));
  }
  stockData.splice(index, 1);
  return Promise.resolve(undefined);
}