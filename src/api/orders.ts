import { apiFetch } from "./http";

export type PedidoEstado = "borrador" | "pendiente" | "aprobado" | "rechazado" | "recibido";
export type OrigenTipo = "distribuidor" | "sucursal";

export type PedidoItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_costo_momento: string;
  sub_ubicacion_destino: number | null;
  sub_ubicacion_origen: number | null;
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
  precio_costo_momento: string | number 
};

export type PedidoCreateBody = { 
  destino: number; 
  items: PedidoItemCreate[];
  origen_tipo?: OrigenTipo;
  origen_sucursal?: number;
};

export type PedidoRecibirItem = { 
  id: number; 
  sub_ubicacion_destino: number 
};

export type PedidoRecibirBody = { 
  items: PedidoRecibirItem[] 
};

export type PedidoAprobarItem = {
  id: number;
  sub_ubicacion_origen?: number; // legacy - single sub-ubicación
  sub_ubicaciones_origen?: { sub_ubicacion: number; cantidad: number; }[]; // new - multiple sub-ubicaciones
};

export type PedidoAprobarBody = {
  origen_tipo: OrigenTipo;
  origen_sucursal?: number;
  items?: PedidoAprobarItem[];
};

export function listPedidos() {
  return apiFetch<Pedido[]>("/api/inventory/pedidos/");
}

export function createPedido(body: PedidoCreateBody) {
  return apiFetch<Pedido>("/api/inventory/pedidos/", { method: "POST", body });
}

export function enviarARevision(id: number) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/enviar_a_revision/`, { method: "POST" });
}

export function aprobarPedido(id: number, body: PedidoAprobarBody) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/aprobar/`, { 
    method: "POST", 
    body 
  });
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
  return apiFetch<DisponibilidadSucursal[]>(`/api/inventory/pedidos/${pedidoId}/disponibilidad_sucursales/`);
}

export function rechazarPedido(id: number) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/rechazar/`, { method: "POST" });
}

export function recibirPedido(id: number, body: PedidoRecibirBody) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/recibir/`, { method: "POST", body });
}
export function getPedido(id: number) {
  return apiFetch<Pedido>(`/api/inventory/pedidos/${id}/`);
}

export function updatePedido(id: number, body: PedidoCreateBody) {
  return apiFetch<Pedido>(`/api/inventory/pedidos/${id}/`, { method: "PUT", body });
}

export function deletePedido(id: number) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/`, { method: "DELETE" });
}