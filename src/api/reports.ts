// src/api/reports.ts
import { apiFetch } from "./http";

export type ReporteSucursal = {
  sucursal_id: number;
  sucursal_nombre: string;
  total_gastos: number;
  total_ventas: number;
  balance: number;
};

export type ReporteEconomico = {
  por_sucursal: ReporteSucursal[];
  totales: {
    total_gastos: number;
    total_ventas: number;
    balance: number;
  };
};

export type ReporteFilters = {
  sucursal?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  stock_minimo?: number;
};

export function getReporteEconomico(filters?: ReporteFilters) {
  const params = new URLSearchParams();
  if (filters?.sucursal) params.append('sucursal', filters.sucursal.toString());
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);

  const query = params.toString();
  return apiFetch<ReporteEconomico>(`/api/sales/reporte-economico/${query ? `?${query}` : ''}`);
}

// Dashboard types
export type DashboardKPIs = {
  total_stock_value: number;
  stock_items_count: number;
  low_stock_count: number;
  stock_minimo_configurado: number;
  expiring_7_days: number;
  expiring_15_days: number;
  expiring_30_days: number;
  total_ventas_periodo: number;
  total_pedidos_recibidos: number;
  fabricaciones_periodo: number;
  total_producido: number;
  promedio_ticket: number;
  cantidad_ventas: number;
};

export type StockPorUbicacion = {
  sucursal: string;
  sucursal_id: number;
  sub_ubicacion: string;
  sub_ubicacion_id: number;
  tipo: string;
  productos_count: number;
  valor_total: number;
};

export type ProductoProximoVencer = {
  producto_id: number;
  producto_nombre: string;
  categoria: string | null;
  sucursal: string;
  sub_ubicacion: string;
  lote: string | null;
  fecha_ingreso: string | null;
  fecha_vencimiento: string | null;
  dias_restantes: number;
  cantidad: number;
  urgencia: 'critica' | 'alta' | 'media' | 'baja';
};

export type ProductoMasVendido = {
  producto_nombre: string;
  categoria: string | null;
  cantidad_vendida: number;
  revenue: number;
};

export type VentaPorCategoria = {
  categoria: string;
  cantidad: number;
  revenue: number;
  porcentaje: number;
};

export type VentaTendencia = {
  fecha: string;
  total_ventas: number;
  cantidad_items: number;
  promedio_ticket: number;
};

export type PedidosEstado = {
  borrador: number;
  pendiente: number;
  aprobado: number;
  rechazado: number;
  recibido: number;
};

export type ProductoStockBajo = {
  producto_id: number;
  producto_nombre: string;
  categoria: string | null;
  cantidad_actual: number;
  stock_minimo: number;
};

export type ComparativaSucursal = {
  sucursal: string;
  sucursal_id: number;
  stock_value: number;
  ventas: number;
};

export type DashboardData = {
  kpis: DashboardKPIs;
  stock_por_ubicacion: StockPorUbicacion[];
  productos_proximos_vencer: ProductoProximoVencer[];
  productos_mas_vendidos: ProductoMasVendido[];
  ventas_por_categoria: VentaPorCategoria[];
  ventas_tendencia: VentaTendencia[];
  pedidos_estado: PedidosEstado;
  top_productos_stock_bajo: ProductoStockBajo[];
  comparativa_sucursales: ComparativaSucursal[];
};

export function getDashboard(filters?: ReporteFilters) {
  const params = new URLSearchParams();
  if (filters?.sucursal) params.append('sucursal', filters.sucursal.toString());
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
  if (filters?.stock_minimo) params.append('stock_minimo', filters.stock_minimo.toString());

  const query = params.toString();
  return apiFetch<DashboardData>(`/api/sales/dashboard/${query ? `?${query}` : ''}`);
}
