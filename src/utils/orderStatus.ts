import { type BadgeProps } from "../components/ui";

// Mapa de estados de pedidos a variantes de badges
export const orderStatusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  'Borrador': { label: 'Borrador', variant: 'draft' },
  'Pendiente': { label: 'Pendiente', variant: 'pending' },
  'Aprobado': { label: 'Aprobado', variant: 'approved' },
  'Recibido': { label: 'Recibido', variant: 'received' },
  'Cancelado': { label: 'Cancelado', variant: 'cancelled' },
};

export function getOrderStatusBadge(status: string) {
  return orderStatusMap[status] || { label: status, variant: 'default' as const };
}
