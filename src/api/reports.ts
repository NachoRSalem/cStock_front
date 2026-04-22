import ventasMock from "../mock-data/ventas.json";
import stockMock from "../mock-data/stock.json";

export type ReporteSucursal = {
  sucursal_id: number;
  sucursal_nombre: string;
  total_ventas: number;
  total_gastos: number;
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
};

function calcularGastos(sucursalId: number) {
  return stockMock.reduce((total, s) => {
    if (s.ubicacion_id !== sucursalId) return total;
    return total + Number(s.cantidad) * 200;
  }, 0);
}

export function getReporteEconomico(filters?: ReporteFilters) {
  const ventas = filters?.sucursal
    ? ventasMock.filter((v) => v.sucursal === filters.sucursal)
    : ventasMock;

  const filteredByDate = ventas.filter((v) => {
    if (!filters?.fecha_desde || !filters?.fecha_hasta) return true;
    const fechaVenta = new Date(v.fecha);
    return (
      fechaVenta >= new Date(filters.fecha_desde) &&
      fechaVenta <= new Date(filters.fecha_hasta)
    );
  });

  const ventasPorSucursal = filteredByDate.reduce(
    (acc, v) => {
      if (!acc[v.sucursal]) {
        acc[v.sucursal] = { nombre: v.sucursal_nombre, total: 0 };
      }
      acc[v.sucursal].total += Number(v.total);
      return acc;
    },
    {} as Record<number, { nombre: string; total: number }>
  );

  const por_sucursal: ReporteSucursal[] = Object.entries(ventasPorSucursal).map(
    ([sucursalId, data]) => {
      const sucursalNum = Number(sucursalId);
      const totalVentas = data.total;
      const totalGastos = calcularGastos(sucursalNum);
      return {
        sucursal_id: sucursalNum,
        sucursal_nombre: data.nombre,
        total_ventas: totalVentas,
        total_gastos: totalGastos,
        balance: totalVentas - totalGastos,
      };
    }
  );

  const totales = por_sucursal.reduce(
    (acc, s) => ({
      total_ventas: acc.total_ventas + s.total_ventas,
      total_gastos: acc.total_gastos + s.total_gastos,
      balance: acc.balance + s.balance,
    }),
    { total_ventas: 0, total_gastos: 0, balance: 0 }
  );

  return Promise.resolve({ por_sucursal, totales });
}