import { useEffect, useState } from "react";
import { listStock, type Stock } from "../api/stock";
import { listSucursales, type Sucursal } from "../api/locations";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardBody, 
  Badge, 
  PageLoader,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "../components/ui";
import { 
  Package, 
  MapPin, 
  Thermometer, 
  Refrigerator, 
  Snowflake, 
  TrendingUp, 
  Filter,
  Building2,
  Layers
} from "lucide-react";
import clsx from 'clsx';

export default function AdminStockView() {
  const [items, setItems] = useState<Stock[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filteredItems, setFilteredItems] = useState<Stock[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterSucursal, setFilterSucursal] = useState<string>("all");
  const [filterSubUbicacion, setFilterSubUbicacion] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [soloConStock, setSoloConStock] = useState(true);
  const [groupBySubUbicacion, setGroupBySubUbicacion] = useState(true);

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const [stockData, sucursalesData] = await Promise.all([
          listStock({ solo_con_stock: soloConStock }),
          listSucursales()
        ]);
        setItems(stockData);
        setFilteredItems(stockData);
        setSucursales(sucursalesData);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [soloConStock]);

  useEffect(() => {
    let filtered = [...items];
    
    if (filterTipo !== "all") {
      filtered = filtered.filter(item => item.producto_tipo_conservacion === filterTipo);
    }
    
    if (filterSucursal !== "all") {
      filtered = filtered.filter(item => item.ubicacion_id.toString() === filterSucursal);
    }
    
    if (filterSubUbicacion !== "all") {
      filtered = filtered.filter(item => item.sub_ubicacion.toString() === filterSubUbicacion);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por sub-ubicación si está habilitado
    if (groupBySubUbicacion) {
      filtered.sort((a, b) => {
        const subComp = a.sub_ubicacion_nombre.localeCompare(b.sub_ubicacion_nombre);
        if (subComp !== 0) return subComp;
        return a.producto_nombre.localeCompare(b.producto_nombre);
      });
    }
    
    setFilteredItems(filtered);
  }, [items, filterTipo, filterSucursal, filterSubUbicacion, searchTerm, groupBySubUbicacion]);

  const subUbicaciones = Array.from(
    new Map(items.map(item => [item.sub_ubicacion, item.sub_ubicacion_nombre])).entries()
  );

  const totalProductos = filteredItems.length;
  const totalUnidades = filteredItems.reduce((sum, item) => sum + item.cantidad, 0);
  const totalSucursales = new Set(filteredItems.map(item => item.ubicacion_id)).size;
  const totalSubUbicaciones = new Set(filteredItems.map(item => item.sub_ubicacion)).size;

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ambiente":
        return <Thermometer className="h-4 w-4" />;
      case "heladera":
        return <Refrigerator className="h-4 w-4" />;
      case "freezer":
        return <Snowflake className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTipoBadgeVariant = (tipo: string): "default" | "draft" | "pending" | "approved" => {
    switch (tipo) {
      case "ambiente":
        return "approved";
      case "heladera":
        return "pending";
      case "freezer":
        return "draft";
      default:
        return "default";
    }
  };

  const getCantidadColor = (cantidad: number) => {
    if (cantidad < 10) return "text-red-600";
    if (cantidad < 50) return "text-orange-600";
    return "text-emerald-600";
  };

  const getSucursalNombre = (ubicacionId: number) => {
    return sucursales.find(s => s.id === ubicacionId)?.nombre ?? "Desconocida";
  };

  if (loading) {
    return <PageLoader message="Cargando stock global..." />;
  }

  // Agrupar items por sub-ubicación para renderizado
  const groupedItems: { [key: string]: Stock[] } = {};
  if (groupBySubUbicacion) {
    filteredItems.forEach(item => {
      const key = item.sub_ubicacion_nombre;
      if (!groupedItems[key]) {
        groupedItems[key] = [];
      }
      groupedItems[key].push(item);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Global - Todas las Sucursales</h1>
        <p className="text-gray-600 mt-1">
          Vista consolidada del inventario de todas las ubicaciones
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Sucursales</div>
              <div className="text-3xl font-bold text-gray-900">{totalSucursales}</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Layers className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Sub-ubicaciones</div>
              <div className="text-3xl font-bold text-gray-900">{totalSubUbicaciones}</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Productos</div>
              <div className="text-3xl font-bold text-gray-900">{totalProductos}</div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total unidades</div>
              <div className="text-3xl font-bold text-gray-900">{totalUnidades}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-base">Filtros y búsqueda</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Buscador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar producto
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 hover:border-gray-400"
              />
            </div>

            {/* Filtros en grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursal
                </label>
                <select 
                  value={filterSucursal} 
                  onChange={(e) => setFilterSucursal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                >
                  <option value="all">Todas</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de conservación
                </label>
                <select 
                  value={filterTipo} 
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                >
                  <option value="all">Todos</option>
                  <option value="ambiente">Ambiente</option>
                  <option value="heladera">Heladera</option>
                  <option value="freezer">Freezer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-ubicación
                </label>
                <select 
                  value={filterSubUbicacion} 
                  onChange={(e) => setFilterSubUbicacion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-gray-300 hover:border-gray-400"
                >
                  <option value="all">Todas</option>
                  {subUbicaciones.map(([id, nombre]) => (
                    <option key={id} value={id.toString()}>{nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all">
                  <input 
                    type="checkbox" 
                    checked={soloConStock} 
                    onChange={(e) => setSoloConStock(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Solo con stock</span>
                </label>
              </div>
            </div>

            {/* Toggle de agrupación */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                <input 
                  type="checkbox" 
                  checked={groupBySubUbicacion} 
                  onChange={(e) => setGroupBySubUbicacion(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Agrupar por sub-ubicación</span>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabla de stock */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario Global</CardTitle>
          <CardDescription>
            {filteredItems.length} productos encontrados
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay productos en stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {groupBySubUbicacion ? (
                // Vista agrupada por sub-ubicación
                <div className="divide-y divide-gray-200">
                  {Object.entries(groupedItems).map(([subUbicacion, items]) => (
                    <div key={subUbicacion}>
                      {/* Header de grupo */}
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary-600" />
                          <h3 className="font-semibold text-gray-900">{subUbicacion}</h3>
                          <Badge variant="default" className="ml-2">
                            {items.length} productos
                          </Badge>
                        </div>
                      </div>

                      {/* Tabla de items del grupo */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Sucursal</TableHead>
                            <TableHead className="text-center">Tipo</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-gray-900">{item.producto_nombre}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Building2 className="h-3 w-3" />
                                  {getSucursalNombre(item.ubicacion_id)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={getTipoBadgeVariant(item.producto_tipo_conservacion)}>
                                  <div className="flex items-center gap-1.5">
                                    {getTipoIcon(item.producto_tipo_conservacion)}
                                    {item.producto_tipo_conservacion.charAt(0).toUpperCase() + item.producto_tipo_conservacion.slice(1)}
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={clsx("font-bold text-lg", getCantidadColor(item.cantidad))}>
                                  {item.cantidad}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              ) : (
                // Vista normal sin agrupar
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Sub-ubicación</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.producto_nombre}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="h-3 w-3" />
                            {getSucursalNombre(item.ubicacion_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {item.sub_ubicacion_nombre}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getTipoBadgeVariant(item.producto_tipo_conservacion)}>
                            <div className="flex items-center gap-1.5">
                              {getTipoIcon(item.producto_tipo_conservacion)}
                              {item.producto_tipo_conservacion.charAt(0).toUpperCase() + item.producto_tipo_conservacion.slice(1)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={clsx("font-bold text-lg", getCantidadColor(item.cantidad))}>
                            {item.cantidad}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
