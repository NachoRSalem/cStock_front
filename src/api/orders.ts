import { apiFetch } from "./http";

export type PedidoEstado = "borrador" | "pendiente" | "aprobado" | "rechazado" | "recibido";

export type PedidoItem = {
  id: number;
  producto: number;
  producto_nombre: string;
  cantidad: number;
  precio_costo_momento: string;
  sub_ubicacion_destino: number | null;
};

export type Pedido = {
  id: number;
  creado_por: number;
  destino: number;
  destino_nombre: string;
  estado: PedidoEstado;
  fecha_creacion: string;
  items: PedidoItem[];
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

export function listPedidos() {
  return apiFetch<Pedido[]>("/api/inventory/pedidos/");
}

export function createPedido(body: PedidoCreateBody) {
  return apiFetch<Pedido>("/api/inventory/pedidos/", { method: "POST", body });
}

export function enviarARevision(id: number) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/enviar_a_revision/`, { method: "POST" });
}

export function aprobarPedido(id: number) {
  return apiFetch<{ status: string }>(`/api/inventory/pedidos/${id}/aprobar/`, { method: "POST" });
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