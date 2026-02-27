import { useEffect, useState } from "react";
import { listStock, type Stock } from "../api/stock";
import { listSucursales, type Sucursal } from "../api/locations";
import { tokenStorage } from "../utils/storage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  PageLoader,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "../components/ui";
import {
  Package,
  MapPin,
  Thermometer,
  Refrigerator,
  Snowflake,
  Calendar,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  ArrowLeft,
  Warehouse,
} from "lucide-react";
import clsx from "clsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function tipoIcon(tipo: string) {
  switch (tipo) {
    case "heladera": return <Refrigerator className="h-4 w-4" />;
    case "freezer":  return <Snowflake    className="h-4 w-4" />;
    default:         return <Thermometer  className="h-4 w-4" />;
  }
}

function tipoBadgeVariant(tipo: string): "default" | "draft" | "pending" | "approved" {
  if (tipo === "heladera") return "pending";
  if (tipo === "freezer")  return "draft";
  return "approved";
}

function stockColor(cantidad: number) {
  if (cantidad <= 0)  return "text-red-600";
  if (cantidad < 10)  return "text-orange-500";
  if (cantidad < 20)  return "text-yellow-600";
  return "text-emerald-600";
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ─── shared mini-table ────────────────────────────────────────────────────────

function StockTable({ rows }: { rows: Stock[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Sub-ubicación</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Última act.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <span className="font-medium text-neutral-900">{item.producto_nombre}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <MapPin className="h-3 w-3" />
                  {item.sub_ubicacion_nombre}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={tipoBadgeVariant(item.producto_tipo_conservacion)}>
                  <span className="flex items-center gap-1">
                    {tipoIcon(item.producto_tipo_conservacion)}
                    {item.producto_tipo_conservacion.charAt(0).toUpperCase() +
                      item.producto_tipo_conservacion.slice(1)}
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={clsx("font-bold text-lg", stockColor(item.cantidad))}>
                  {item.cantidad}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.ultima_actualizacion).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── collapsible group panel ──────────────────────────────────────────────────

function GroupPanel({
  title,
  icon,
  rows,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  rows: Stock[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const totalUnidades = rows.reduce((s, r) => s + r.cantidad, 0);
  const bajoStock     = rows.filter((r) => r.cantidad > 0 && r.cantidad < 10).length;
  const sinStock      = rows.filter((r) => r.cantidad <= 0).length;

  return (
    <Card className={clsx("overflow-hidden", !open && "shadow-sm")}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={clsx(
          "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
          open ? "bg-primary-50 border-b border-primary-100" : "hover:bg-neutral-50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-primary-100">
            {icon}
          </div>
          <div>
            <div className="font-semibold text-neutral-900">{title}</div>
            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
              <span>{rows.length} productos</span>
              <span>·</span>
              <span>{totalUnidades} unidades</span>
              {bajoStock > 0 && (
                <span className="text-orange-500 font-medium">⚠ {bajoStock} bajo stock</span>
              )}
              {sinStock > 0 && (
                <span className="text-red-500 font-medium">✕ {sinStock} sin stock</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-neutral-400">
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </button>

      {open && (
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-sm">
              Sin productos en esta sección
            </div>
          ) : (
            <StockTable rows={rows} />
          )}
        </CardBody>
      )}
    </Card>
  );
}

export default function StockPage() {
  const [allStock, setAllStock]           = useState<Stock[]>([]);
  const [sucursales, setSucursales]       = useState<Sucursal[]>([]);
  const [err, setErr]                     = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [filterTipo, setFilterTipo]       = useState<string>("all");
  const [soloConStock, setSoloConStock]   = useState(true);
  // Admin drill-down: null = index, object = detail for that location
  const [selectedUbicacion, setSelectedUbicacion] = useState<{ id: number; nombre: string; tipo: string } | null>(null);

  const sucursalId = tokenStorage.getSucursal();
  const session    = tokenStorage.getSession();
  const isAdmin    = session?.rol === "admin";

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const [stockData, sucData] = await Promise.all([
          listStock({ solo_con_stock: soloConStock, ubicacion: isAdmin ? undefined : (sucursalId ?? undefined) }),
          isAdmin ? listSucursales() : Promise.resolve([]),
        ]);
        setAllStock(stockData);
        setSucursales(sucData);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando stock");
      } finally {
        setLoading(false);
      }
    }
    load();
    // reset drill-down on filter change
    setSelectedUbicacion(null);
  }, [soloConStock, sucursalId, isAdmin]);

  // Tipo filter applied always
  const filtered = filterTipo === "all"
    ? allStock
    : allStock.filter((i) => i.producto_tipo_conservacion === filterTipo);

  // For the drill-down detail (admin selected a location  OR sucursal user)
  const detailItems = selectedUbicacion
    ? filtered.filter((i) => i.ubicacion_id === selectedUbicacion.id)
    : filtered;

  const bySubUbicacion = groupBy(
    detailItems,
    (i) => `${i.sub_ubicacion}|||${i.sub_ubicacion_nombre}|||${i.sub_ubicacion_tipo}`
  );

  const subUbicTipoIcon = (tipo: string) => {
    if (tipo === "freezer")  return <Snowflake    className="h-5 w-5 text-blue-500" />;
    if (tipo === "heladera") return <Refrigerator className="h-5 w-5 text-teal-500" />;
    return                          <Thermometer  className="h-5 w-5 text-amber-500" />;
  };

  if (loading) return <PageLoader message="Cargando inventario..." />;

  // ── SHARED filter bar ────────────────────────────────────────────────────
  const filterBar = (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-600" />
          <CardTitle className="text-base">Filtros</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tipo de conservación
            </label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
            >
              <option value="all">Todos</option>
              <option value="ambiente">Ambiente</option>
              <option value="heladera">Heladera</option>
              <option value="freezer">Freezer</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-primary-400 hover:bg-primary-50 transition-all">
              <input
                type="checkbox"
                checked={soloConStock}
                onChange={(e) => setSoloConStock(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">Solo con stock</span>
            </label>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // ── DETAIL VIEW (sub-ubicación groups) — used by both sucursal user and admin drill-down ──
  const detailView = (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-3">
        {isAdmin && selectedUbicacion && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUbicacion(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {isAdmin && selectedUbicacion ? selectedUbicacion.nombre : "Mi Stock"}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Inventario agrupado por sub-ubicación
          </p>
        </div>
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {filterBar}

      {/* summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Package className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Registros</div>
              <div className="text-3xl font-bold text-neutral-900">{detailItems.length}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Unidades totales</div>
              <div className="text-3xl font-bold text-neutral-900">
                {detailItems.reduce((s, i) => s + i.cantidad, 0)}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {detailItems.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No hay productos en stock con los filtros actuales</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Layers className="h-4 w-4" />
            <span>{Object.keys(bySubUbicacion).length} sub-ubicaciones</span>
          </div>
          {Object.entries(bySubUbicacion)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, rows]) => {
              const parts = key.split("|||");
              const nombre = parts[1];
              const tipo   = parts[2] ?? "ambiente";
              return (
                <GroupPanel
                  key={key}
                  title={nombre}
                  icon={subUbicTipoIcon(tipo)}
                  rows={rows}
                />
              );
            })}
        </div>
      )}
    </div>
  );

  // ── SUCURSAL USER → always detail view ─────────────────────────────────
  if (!isAdmin) return detailView;

  // ── ADMIN DRILL-DOWN → show detail for selected location ───────────────
  if (selectedUbicacion) return detailView;

  // ── ADMIN INDEX → location picker cards ─────────────────────────────────
  // Compute per-location summary from all stock
  const byUbicacion = groupBy(filtered, (i) => `${i.ubicacion_id}|||${i.ubicacion_nombre}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Stock Global</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Seleccioná una ubicación para ver su inventario
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {filterBar}

      {/* location cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sucursales
          .sort((a, b) => {
            // almacén last
            if (a.tipo === "almacen" && b.tipo !== "almacen") return 1;
            if (b.tipo === "almacen" && a.tipo !== "almacen") return -1;
            return a.nombre.localeCompare(b.nombre);
          })
          .map((suc) => {
            const key      = `${suc.id}|||${suc.nombre}`;
            const rows     = byUbicacion[key] ?? [];
            const total    = rows.reduce((s, r) => s + r.cantidad, 0);
            const bajo     = rows.filter((r) => r.cantidad > 0 && r.cantidad < 10).length;
            const sinSt    = rows.filter((r) => r.cantidad <= 0).length;
            const isAlmacen = suc.tipo === "almacen";

            return (
              <button
                key={suc.id}
                onClick={() => setSelectedUbicacion({ id: suc.id, nombre: suc.nombre, tipo: suc.tipo })}
                className={clsx(
                  "text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md hover:-translate-y-0.5",
                  isAlmacen
                    ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                    : "border-primary-100 bg-white hover:border-primary-400"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx(
                    "p-2.5 rounded-xl",
                    isAlmacen ? "bg-amber-100" : "bg-primary-100"
                  )}>
                    {isAlmacen
                      ? <Warehouse   className="h-6 w-6 text-amber-600" />
                      : <Building2   className="h-6 w-6 text-primary-600" />
                    }
                  </div>
                  <Badge variant={isAlmacen ? "pending" : "default"}>
                    {isAlmacen ? "Almacén" : "Sucursal"}
                  </Badge>
                </div>

                <div className="font-semibold text-neutral-900 text-lg leading-tight mb-1">
                  {suc.nombre}
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-neutral-500">
                    <span className="font-bold text-neutral-800">{rows.length}</span> productos
                  </span>
                  <span className="text-neutral-500">
                    <span className="font-bold text-neutral-800">{total}</span> uds.
                  </span>
                </div>

                {(bajo > 0 || sinSt > 0) && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {bajo  > 0 && <span className="text-orange-500 font-medium">⚠ {bajo} bajo stock</span>}
                    {sinSt > 0 && <span className="text-red-500 font-medium">✕ {sinSt} sin stock</span>}
                  </div>
                )}

                <div className={clsx(
                  "mt-4 text-xs font-medium flex items-center gap-1",
                  isAlmacen ? "text-amber-600" : "text-primary-600"
                )}>
                  Ver detalle →
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}