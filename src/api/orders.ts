import { apiFetch } from "./http";

export type PedidoEstado = "borrador" | "pendiente" | "aprobado" | "rechazado" | "recibido";

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
  provisto_desde_almacen: boolean;
};

export type PedidoItemCreate = { 
  producto: number; 
  cantidad: number; 
  precio_costo_momento: string | number 
};

export type PedidoCreateBody = { 
  destino: number; 
  items: PedidoItemCreate[] 
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
  sub_ubicacion_origen: number;
};

export type PedidoAprobarBody = {
  provisto_desde_almacen: boolean;
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

export function aprobarPedido(id: number, body?: PedidoAprobarBody) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/aprobar/`, { 
    method: "POST", 
    body: body || { provisto_desde_almacen: false } 
  });
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