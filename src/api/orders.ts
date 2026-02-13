import { apiFetch } from "./http";

export type PedidoItemCreate = { producto: number; cantidad: number; precio_costo_momento: string | number };
export type PedidoCreateBody = { destino: number; items: PedidoItemCreate[] };

export type PedidoRecibirItem = { producto: number; cantidad: number; sub_ubicacion_destino: number };
export type PedidoRecibirBody = { items: PedidoRecibirItem[] };

export type Pedido = { id: number; destino: number; estado?: string; items?: any[] };

export function listPedidos() {
  return apiFetch<Pedido[]>("/api/inventory/pedidos/");
}

export function createPedido(body: PedidoCreateBody) {
  return apiFetch<Pedido>("/api/inventory/pedidos/", { method: "POST", body });
}

export function recibirPedido(id: number, body: PedidoRecibirBody) {
  return apiFetch<Pedido>(`/api/inventory/pedidos/${id}/recibir/`, { method: "POST", body });
}
