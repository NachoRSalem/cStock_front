import { useEffect, useState } from "react";
import { getDashboard, type DashboardData, type DashboardKPIs, type ReporteFilters } from "../api/reports";
import { listSucursales, type Sucursal } from "../api/locations";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { Alert } from "../components/ui/Alert";
import { LoadingSpinner } from "../components/ui/Loading";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Filter, Package,
  AlertTriangle, ShoppingCart, Truck, Factory, Clock,
  MapPin, ChevronDown, ChevronUp
} from "lucide-react";
import { tokenStorage } from "../utils/storage";

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("es-AR").format(n);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

const COLORS = ["#1e40af", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

const urgenciaConfig = {
  critica: { bg: "bg-red-100", text: "text-red-700", label: "Crítica" },
  alta: { bg: "bg-orange-100", text: "text-orange-700", label: "Alta" },
  media: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Media" },
  baja: { bg: "bg-blue-100", text: "text-blue-700", label: "Baja" },
};

const estadoPedidosConfig = {
  borrador: { color: "#9ca3af", label: "Borrador" },
  pendiente: { color: "#f59e0b", label: "Pendiente" },
  aprobado: { color: "#3b82f6", label: "Aprobado" },
  rechazado: { color: "#ef4444", label: "Rechazado" },
  recibido: { color: "#10b981", label: "Recibido" },
};

export default function Reports() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSucursal, setSelectedSucursal] = useState<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [stockMinimo, setStockMinimo] = useState(5);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    expiring: true,
    topVendidos: true,
    stockBajo: true,
    stockUbicacion: false,
  });

  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";

  useEffect(() => {
    if (isAdmin) {
      listSucursales()
        .then(setSucursales)
        .catch((e) => console.error("Error cargando sucursales:", e));
    }
  }, [isAdmin]);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);

    const filters: ReporteFilters = { stock_minimo: stockMinimo };
    if (selectedSucursal) filters.sucursal = selectedSucursal;
    if (fechaDesde) filters.fecha_desde = fechaDesde;
    if (fechaHasta) filters.fecha_hasta = fechaHasta;

    getDashboard(filters)
      .then(setData)
      .catch((e) => setError(e?.message ?? "Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApplyFilters = () => loadDashboard();
  const handleClearFilters = () => {
    setSelectedSucursal(undefined);
    setFechaDesde("");
    setFechaHasta("");
    setStockMinimo(5);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  if (!data) return null;

  const kpis: DashboardKPIs = data.kpis;

  const chartVentasTendencia = data.ventas_tendencia.map(d => ({
    fecha: formatDate(d.fecha),
    Ventas: d.total_ventas,
    Items: d.cantidad_items,
  }));

  const chartVentasCategoria = data.ventas_por_categoria.map(c => ({
    name: c.categoria,
    value: c.revenue,
    porcentaje: c.porcentaje,
  }));

  const chartPedidosEstado = Object.entries(data.pedidos_estado).map(([key, value]) => ({
    name: estadoPedidosConfig[key as keyof typeof estadoPedidosConfig]?.label ?? key,
    value,
    color: estadoPedidosConfig[key as keyof typeof estadoPedidosConfig]?.color ?? "#999",
  }));

  const chartComparativa = data.comparativa_sucursales.map(s => ({
    name: s.sucursal,
    "Valor Stock": s.stock_value,
    Ventas: s.ventas,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Dashboard de Reportes</h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Métricas consolidadas de stock, ventas, pedidos y fabricación
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra los datos por sucursal, rango de fechas y stock mínimo</CardDescription>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Sucursal</label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    value={selectedSucursal ?? ""}
                    onChange={(e) => setSelectedSucursal(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Todas</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Hasta</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Stock mínimo</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="primary" onClick={handleApplyFilters} disabled={loading} className="flex-1">
                  {loading ? "Cargando..." : "Aplicar"}
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>Limpiar</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {data && (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-soft-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Ventas</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{money(kpis.total_ventas_periodo)}</p>
                    <p className="text-xs text-neutral-500 mt-1">{kpis.cantidad_ventas} ventas · Ticket: {money(kpis.promedio_ticket)}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-soft-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{money(kpis.total_stock_value)}</p>
                    <p className="text-xs text-neutral-500 mt-1">{kpis.stock_items_count} lotes</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-soft-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Pedidos</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{kpis.total_pedidos_recibidos}</p>
                    <p className="text-xs text-neutral-500 mt-1">recibidos en período</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Truck className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="hover:shadow-soft-lg transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Fabricación</p>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{kpis.fabricaciones_periodo}</p>
                    <p className="text-xs text-neutral-500 mt-1">{kpis.total_producido} unidades</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Factory className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* KPIs secundarios */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardBody className="py-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-red-50 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{kpis.expiring_7_days}</p>
                    <p className="text-xs text-neutral-500">Vencen en 7 días</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="py-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-orange-50 rounded-md">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-600">{kpis.expiring_15_days}</p>
                    <p className="text-xs text-neutral-500">Vencen en 15 días</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="py-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-yellow-50 rounded-md">
                    <TrendingDown className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">{kpis.low_stock_count}</p>
                    <p className="text-xs text-neutral-500">Stock bajo (&lt;{kpis.stock_minimo_configurado})</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="py-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{data.stock_por_ubicacion.length}</p>
                    <p className="text-xs text-neutral-500">Sub-ubicaciones</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendencia de ventas */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas</CardTitle>
                <CardDescription>Evolución diaria de ingresos</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-64 sm:h-72">
                  {chartVentasTendencia.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartVentasTendencia}>
                        <defs>
                          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e40af" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => money(value)} />
                        <Area type="monotone" dataKey="Ventas" stroke="#1e40af" fill="url(#colorVentas)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm">Sin datos en el período</div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Ventas por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
                <CardDescription>Distribución de ingresos</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-64 sm:h-72">
                  {chartVentasCategoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartVentasCategoria}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {chartVentasCategoria.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => money(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm">Sin datos en el período</div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Estado de pedidos */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Pedidos</CardTitle>
                <CardDescription>Distribución por estado</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartPedidosEstado} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartPedidosEstado.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Comparativa sucursales */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativa por Sucursal</CardTitle>
                <CardDescription>Valor stock vs ventas</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-64 sm:h-72">
                  {chartComparativa.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartComparativa}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => money(value)} />
                        <Legend />
                        <Bar dataKey="Valor Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400 text-sm">Sin datos</div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tablas detalladas */}
          {/* Productos próximos a vencer */}
          <Card>
            <button
              onClick={() => toggleSection("expiring")}
              className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="text-left">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Productos Próximos a Vencer
                </CardTitle>
                <CardDescription>
                  {data.productos_proximos_vencer.length} productos con vencimiento próximo
                </CardDescription>
              </div>
              {expandedSections.expiring ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>
            {expandedSections.expiring && (
              <CardBody>
                {data.productos_proximos_vencer.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8 text-sm">No hay productos próximos a vencer</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                          <TableHead className="hidden md:table-cell">Lote</TableHead>
                          <TableHead className="hidden md:table-cell">Vencimiento</TableHead>
                          <TableHead>Días</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead>Urgencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.productos_proximos_vencer.map((p, i) => {
                          const config = urgenciaConfig[p.urgencia];
                          return (
                            <TableRow key={`${p.producto_id}-${p.lote}-${i}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <p className="text-sm">{p.producto_nombre}</p>
                                  {p.categoria && <p className="text-xs text-neutral-500">{p.categoria}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div>
                                  <p className="text-sm">{p.sucursal}</p>
                                  <p className="text-xs text-neutral-500">{p.sub_ubicacion}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm font-mono text-neutral-600">{p.lote}</TableCell>
                              <TableCell className="hidden md:table-cell text-sm">{p.fecha_vencimiento}</TableCell>
                              <TableCell>
                                <span className={`font-semibold ${p.dias_restantes <= 3 ? "text-red-600" : p.dias_restantes <= 7 ? "text-orange-600" : "text-yellow-600"}`}>
                                  {p.dias_restantes}d
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-sm">{p.cantidad}</TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${config.bg} ${config.text}`}>
                                  {config.label}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            )}
          </Card>

          {/* Productos más vendidos */}
          <Card>
            <button
              onClick={() => toggleSection("topVendidos")}
              className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="text-left">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Top 10 Productos Más Vendidos
                </CardTitle>
                <CardDescription>Ranking por cantidad vendida en el período</CardDescription>
              </div>
              {expandedSections.topVendidos ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>
            {expandedSections.topVendidos && (
              <CardBody>
                {data.productos_mas_vendidos.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8 text-sm">Sin datos de ventas</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.productos_mas_vendidos.map((p, i) => (
                          <TableRow key={p.producto_nombre}>
                            <TableCell>
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i < 3 ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                                {i + 1}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{p.producto_nombre}</TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-neutral-500">{p.categoria}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{formatNumber(p.cantidad_vendida)}</TableCell>
                            <TableCell className="text-right text-sm font-semibold text-emerald-600">{money(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            )}
          </Card>

          {/* Stock bajo */}
          <Card>
            <button
              onClick={() => toggleSection("stockBajo")}
              className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="text-left">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-yellow-500" />
                  Stock Bajo
                </CardTitle>
                <CardDescription>Productos con stock por debajo del mínimo ({kpis.stock_minimo_configurado} unidades)</CardDescription>
              </div>
              {expandedSections.stockBajo ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>
            {expandedSections.stockBajo && (
              <CardBody>
                {data.top_productos_stock_bajo.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8 text-sm">Todos los productos tienen stock suficiente</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Mínimo</TableHead>
                          <TableHead>Diferencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.top_productos_stock_bajo.map((p) => {
                          const diff = p.stock_minimo - p.cantidad_actual;
                          return (
                            <TableRow key={p.producto_id}>
                              <TableCell className="font-medium text-sm">{p.producto_nombre}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-neutral-500">{p.categoria}</TableCell>
                              <TableCell className="text-right">
                                <span className="font-semibold text-red-600">{p.cantidad_actual}</span>
                              </TableCell>
                              <TableCell className="text-right text-sm">{p.stock_minimo}</TableCell>
                              <TableCell>
                                <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                  -{diff.toFixed(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            )}
          </Card>

          {/* Stock por ubicación */}
          <Card>
            <button
              onClick={() => toggleSection("stockUbicacion")}
              className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="text-left">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Stock por Ubicación
                </CardTitle>
                <CardDescription>Valor del stock en cada sub-ubicación</CardDescription>
              </div>
              {expandedSections.stockUbicacion ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>
            {expandedSections.stockUbicacion && (
              <CardBody>
                {data.stock_por_ubicacion.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8 text-sm">Sin stock registrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sucursal</TableHead>
                          <TableHead>Sub-ubicación</TableHead>
                          <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                          <TableHead className="text-right">Productos</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.stock_por_ubicacion.map((s, i) => (
                          <TableRow key={`${s.sucursal_id}-${s.sub_ubicacion_id}`}>
                            <TableCell className="font-medium text-sm">{s.sucursal}</TableCell>
                            <TableCell className="text-sm">{s.sub_ubicacion}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                                s.tipo === "heladera" ? "bg-blue-100 text-blue-700" :
                                s.tipo === "freezer" ? "bg-cyan-100 text-cyan-700" :
                                "bg-neutral-100 text-neutral-700"
                              }`}>
                                {s.tipo}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm">{s.productos_count}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">{money(s.valor_total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            )}
          </Card>
        </>
      )}
    </div>
  );
}