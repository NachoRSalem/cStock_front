import pedidosMock from "../mock-data/pedidos.json";

export type PedidoEstado = "borrador" | "pendiente" | "aprobado" | "rechazado" | "recibido";
export type OrigenTipo = "distribuidor" | "sucursal" | "mixto";

export type PedidoItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_costo_momento: string;
  sub_ubicacion_destino: number | null;
  sub_ubicacion_origen: number | null;
  sub_ubicaciones_origen_detalle?: Array<{
    sub_ubicacion_id: number;
    sub_ubicacion_nombre: string;
    cantidad: number;
  }> | null;
};

export type Pedido = {
  id: number;
  creado_por: number;
  destino: number;
  destino_nombre: string;
  estado: PedidoEstado;
  fecha_creacion: string;
  items: PedidoItem[];
  origen_tipo: OrigenTipo;
  origen_sucursal: number | null;
  origen_sucursal_nombre: string | null;
};

export type PedidoItemCreate = {
  producto: number;
  cantidad: number;
  precio_costo_momento: string | number;
};

export type PedidoCreateBody = {
  destino: number;
  items: PedidoItemCreate[];
  origen_tipo?: OrigenTipo;
  origen_sucursal?: number;
};

export type PedidoRecibirItem = {
  id: number;
  sub_ubicacion_destino: number;
};

export type PedidoRecibirBody = {
  items: PedidoRecibirItem[];
};

export type PedidoAprobarItem = {
  id: number;
  origen_tipo?: "distribuidor" | "sucursal";
  origen_sucursal?: number;
  sub_ubicacion_origen?: number;
  sub_ubicaciones_origen?: { sub_ubicacion: number; cantidad: number }[];
};

export type PedidoAprobarBody = {
  origen_tipo?: OrigenTipo;
  origen_sucursal?: number;
  items?: PedidoAprobarItem[];
};

let pedidosData = [...pedidosMock] as Pedido[];

export function listPedidos() {
  return Promise.resolve(pedidosData);
}

export function getPedido(id: number) {
  const pedido = pedidosData.find((p) => p.id === id);
  if (!pedido) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  return Promise.resolve(pedido);
}

export function createPedido(body: PedidoCreateBody) {
  const newPedido: Pedido = {
    id: Math.max(...pedidosData.map((p) => p.id)) + 1,
    creado_por: 1,
    destino: body.destino,
    destino_nombre: body.destino === 1 ? "Almacén Central" : "Sucursal Norte",
    estado: "borrador",
    fecha_creacion: new Date().toISOString().split("T")[0],
    items: body.items.map((item, idx) => ({
      id: Date.now() + idx,
      producto: item.producto,
      producto_nombre: "",
      cantidad: item.cantidad,
      precio_costo_momento: String(item.precio_costo_momento),
      sub_ubicacion_destino: null,
      sub_ubicacion_origen: null,
    })),
    origen_tipo: body.origen_tipo || "distribuidor",
    origen_sucursal: body.origen_sucursal || null,
    origen_sucursal_nombre:
      body.origen_sucursal === 1
        ? "Almacén Central"
        : body.origen_sucursal === 2
        ? "Sucursal Norte"
        : null,
  };
  pedidosData.push(newPedido);
  return Promise.resolve(newPedido);
}

export function updatePedido(id: number, body: PedidoCreateBody) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  pedidosData[index] = {
    ...pedidosData[index],
    destino: body.destino,
    destino_nombre: body.destino === 1 ? "Almacén Central" : "Sucursal Norte",
    items: body.items.map((item, idx) => ({
      id: Date.now() + idx,
      producto: item.producto,
      producto_nombre: "",
      cantidad: item.cantidad,
      precio_costo_momento: String(item.precio_costo_momento),
      sub_ubicacion_destino: null,
      sub_ubicacion_origen: null,
    })),
    origen_tipo: body.origen_tipo || pedidosData[index].origen_tipo,
    origen_sucursal: body.origen_sucursal !== undefined ? body.origen_sucursal : pedidosData[index].origen_sucursal,
    origen_sucursal_nombre:
      body.origen_sucursal === 1
        ? "Almacén Central"
        : body.origen_sucursal === 2
        ? "Sucursal Norte"
        : pedidosData[index].origen_sucursal_nombre,
  };
  return Promise.resolve(pedidosData[index]);
}

export function deletePedido(id: number) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  if (pedidosData[index].estado !== "borrador") {
    return Promise.reject(new Error("Solo se pueden eliminar pedidos en estado borrador"));
  }
  pedidosData.splice(index, 1);
  return Promise.resolve({ status: "deleted" });
}

export function enviarARevision(id: number) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  if (pedidosData[index].estado !== "borrador") {
    return Promise.reject(new Error("Solo pedidos en borrador pueden enviarse a revisión"));
  }
  pedidosData[index].estado = "pendiente";
  return Promise.resolve({ status: "pendiente" });
}

export function aprobarPedido(id: number, body?: PedidoAprobarBody) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  if (pedidosData[index].estado !== "pendiente") {
    return Promise.reject(new Error("Solo pedidos pendientes pueden ser aprobados"));
  }
  pedidosData[index].estado = "aprobado";
  if (body) {
    if (body.origen_tipo) pedidosData[index].origen_tipo = body.origen_tipo;
    if (body.origen_sucursal) {
      pedidosData[index].origen_sucursal = body.origen_sucursal;
      pedidosData[index].origen_sucursal_nombre =
        body.origen_sucursal === 1 ? "Almacén Central" : "Sucursal Norte";
    }
  }
  return Promise.resolve({ status: "aprobado" });
}

export type DisponibilidadSucursal = {
  sucursal_id: number;
  sucursal_nombre: string;
  puede_completar: boolean;
  productos: {
    producto_id: number;
    producto_nombre: string;
    cantidad_requerida: number;
    cantidad_disponible: number;
    suficiente: boolean;
  }[];
};

export function getDisponibilidadSucursales(pedidoId: number) {
  const pedido = pedidosData.find((p) => p.id === pedidoId);
  if (!pedido) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }

  const disponibilidad: DisponibilidadSucursal[] = [
    {
      sucursal_id: 1,
      sucursal_nombre: "Almacén Central",
      puede_completar: true,
      productos: pedido.items.map((item) => ({
        producto_id: item.producto,
        producto_nombre: item.producto_nombre,
        cantidad_requerida: item.cantidad,
        cantidad_disponible: item.cantidad * 2,
        suficiente: true,
      })),
    },
    {
      sucursal_id: 2,
      sucursal_nombre: "Sucursal Norte",
      puede_completar: true,
      productos: pedido.items.map((item) => ({
        producto_id: item.producto,
        producto_nombre: item.producto_nombre,
        cantidad_requerida: item.cantidad,
        cantidad_disponible: item.cantidad,
        suficiente: true,
      })),
    },
  ];

  return Promise.resolve(disponibilidad);
}

export function rechazarPedido(id: number) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  if (pedidosData[index].estado !== "pendiente") {
    return Promise.reject(new Error("Solo pedidos pendientes pueden ser rechazados"));
  }
  pedidosData[index].estado = "rechazado";
  return Promise.resolve({ status: "rechazado" });
}

export function recibirPedido(id: number, _body: PedidoRecibirBody) {
  const index = pedidosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Pedido no encontrado"));
  }
  if (pedidosData[index].estado !== "aprobado") {
    return Promise.reject(new Error("Solo pedidos aprobados pueden ser recibidos"));
  }
  pedidosData[index].estado = "recibido";
  return Promise.resolve({ status: "recibido" });
}