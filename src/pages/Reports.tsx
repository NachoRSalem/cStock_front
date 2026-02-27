// src/pages/Reports.tsx
import { useEffect, useState } from "react";
import { getReporteEconomico, type ReporteEconomico, type ReporteFilters } from "../api/reports";
import { listSucursales, type Sucursal } from "../api/locations";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Alert } from "../components/ui/Alert";
import { LoadingSpinner } from "../components/ui/Loading";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { tokenStorage } from "../utils/storage";

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function Reports() {
  const [data, setData] = useState<ReporteEconomico | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedSucursal, setSelectedSucursal] = useState<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";

  // Cargar sucursales si es admin
  useEffect(() => {
    if (isAdmin) {
      listSucursales()
        .then(setSucursales)
        .catch((e) => console.error("Error cargando sucursales:", e));
    }
  }, [isAdmin]);

  // Cargar reporte
  const loadReport = () => {
    setLoading(true);
    setError(null);

    const filters: ReporteFilters = {};
    if (selectedSucursal) filters.sucursal = selectedSucursal;
    if (fechaDesde) filters.fecha_desde = fechaDesde;
    if (fechaHasta) filters.fecha_hasta = fechaHasta;

    getReporteEconomico(filters)
      .then(setData)
      .catch((e) => setError(e?.message ?? "Error al cargar el reporte"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleApplyFilters = () => {
    loadReport();
  };

  const handleClearFilters = () => {
    setSelectedSucursal(undefined);
    setFechaDesde("");
    setFechaHasta("");
  };

  // Datos para el gráfico
  const chartData = data?.por_sucursal.map((s) => ({
    nombre: s.sucursal_nombre,
    Gastos: s.total_gastos,
    Ventas: s.total_ventas,
    Balance: s.balance,
  })) ?? [];

  const totales = data?.totales ?? { total_gastos: 0, total_ventas: 0, balance: 0 };
  const margenTotal = totales.total_ventas > 0 ? (totales.balance / totales.total_ventas) * 100 : 0;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Cargando reporte..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes Económicos</h1>
        <p className="text-gray-600 mt-1">
          Análisis de gastos, ventas y rentabilidad por sucursal
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-700" />
            <CardTitle>Filtros</CardTitle>
          </div>
          <CardDescription>
            Filtra los datos por sucursal y rango de fechas
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedSucursal ?? ""}
                  onChange={(e) => setSelectedSucursal(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={handleApplyFilters} disabled={loading}>
                {loading ? "Cargando..." : "Aplicar"}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {money(totales.total_ventas)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gastos en Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {money(totales.total_gastos)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${totales.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {money(totales.balance)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${totales.balance >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <TrendingUp className={`w-6 h-6 ${totales.balance >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Margen de Ganancia</p>
                    <p className={`text-2xl font-bold mt-1 ${margenTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {pct(margenTotal / 100)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${margenTotal >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <TrendingUp className={`w-6 h-6 ${margenTotal >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparación de Gastos vs Ventas por Sucursal</CardTitle>
                <CardDescription>
                  Visualización de los ingresos y egresos de cada sucursal
                </CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Legend />
                      <Bar dataKey="Gastos" fill="#ef4444" />
                      <Bar dataKey="Ventas" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tabla de datos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle por Sucursal</CardTitle>
              <CardDescription>
                Datos completos de gastos, ventas y balance de cada sucursal
              </CardDescription>
            </CardHeader>
            <CardBody>
              {data.por_sucursal.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay datos disponibles para el período seleccionado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sucursal</TableHead>
                      <TableHead className="text-right">Gastos en Pedidos</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Margen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.por_sucursal.map((row) => {
                      const margen = row.total_ventas > 0 ? (row.balance / row.total_ventas) * 100 : 0;
                      return (
                        <TableRow key={row.sucursal_id}>
                          <TableCell className="font-medium">{row.sucursal_nombre}</TableCell>
                          <TableCell className="text-right">
                            {money(row.total_gastos)}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(row.total_ventas)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${row.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {money(row.balance)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${margen >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {pct(margen / 100)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
