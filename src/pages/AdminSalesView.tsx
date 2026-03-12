import { useEffect, useState } from "react";
import { listVentas, type VentaDetalle } from "../api/sales";
import { listSucursales, type Sucursal } from "../api/locations";
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
} from "../components/ui";
import {
  ShoppingCart,
  Building2,
  Warehouse,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { Button } from "../components/ui";
import clsx from "clsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(val: string | number) {
  return `$${parseFloat(val as string).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── expandable venta row ─────────────────────────────────────────────────────

function VentaRow({ venta }: { venta: VentaDetalle }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-neutral-50 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <TableCell>
          <div className="flex items-center gap-2 text-neutral-500">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-mono text-xs text-neutral-400">#{venta.id}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(venta.fecha)}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-sm text-neutral-700">
            <User className="h-3.5 w-3.5 text-neutral-400" />
            {venta.vendedor_nombre}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant="default">{venta.items.length} ítem{venta.items.length !== 1 ? "s" : ""}</Badge>
        </TableCell>
        <TableCell className="text-right font-bold text-emerald-600 text-base">
          {fmtMoney(venta.total)}
        </TableCell>
      </TableRow>

      {open && (
        <TableRow>
          <td colSpan={5} className="bg-neutral-50 p-0">
            <div className="px-8 py-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-neutral-500 text-xs uppercase">
                    <th className="text-left pb-1 font-medium">Producto</th>
                    <th className="text-center pb-1 font-medium">Cantidad</th>
                    <th className="text-right pb-1 font-medium">Precio</th>
                    <th className="text-right pb-1 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {venta.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-neutral-800 font-medium">{item.producto_nombre}</td>
                      <td className="py-1.5 text-center text-neutral-600">{item.cantidad}</td>
                      <td className="py-1.5 text-right text-neutral-600">{fmtMoney(item.precio_venta_momento)}</td>
                      <td className="py-1.5 text-right font-semibold text-neutral-800">
                        {fmtMoney(item.cantidad * parseFloat(item.precio_venta_momento))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </TableRow>
      )}
    </>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type SelectedSucursal = { id: number; nombre: string; tipo: string };

export default function AdminSalesView() {
  const [allVentas, setAllVentas]     = useState<VentaDetalle[]>([]);
  const [sucursales, setSucursales]   = useState<Sucursal[]>([]);
  const [err, setErr]                 = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<SelectedSucursal | null>(null);
  
  // Estados de paginación para vista detallada
  const [ventasDetalle, setVentasDetalle] = useState<VentaDetalle[]>([]);
  const [paginacion, setPaginacion] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const [ventasData, sucData] = await Promise.all([listVentas({ page: 1 }), listSucursales()]);
        setAllVentas(ventasData.results);
        setSucursales(sucData);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Cargar ventas paginadas cuando se selecciona una sucursal
  useEffect(() => {
    if (!selected) return;
    
    async function loadDetalle() {
      setLoadingDetalle(true);
      try {
        if (!selected) return;
        const data = await listVentas({ sucursal: selected.id, page: paginaActual });
        setVentasDetalle(data.results);
        setPaginacion({ count: data.count, next: data.next, previous: data.previous });
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando ventas");
      } finally {
        setLoadingDetalle(false);
      }
    }
    loadDetalle();
  }, [selected, paginaActual]);

  if (loading) return <PageLoader message="Cargando ventas..." />;

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selected) {
    const totalRev = ventasDetalle.reduce((s, v) => s + parseFloat(v.total), 0);
    const totalPaginas = Math.ceil(paginacion.count / 10);

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => {
            setSelected(null);
            setPaginaActual(1);
          }}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold text-neutral-900">{selected.nombre}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Historial de ventas</p>
          </div>
        </div>

        {err && <Alert variant="error">{err}</Alert>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
            <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 sm:h-12 sm:w-12">
                <Receipt className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-neutral-500 sm:text-sm">Ventas totales</div>
                <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{paginacion.count}</div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:h-12 sm:w-12">
                <DollarSign className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-neutral-500 sm:text-sm">Ingresos (página actual)</div>
                <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{fmtMoney(totalRev)}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {loadingDetalle ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-neutral-500 mt-4">Cargando ventas...</p>
            </CardBody>
          </Card>
        ) : paginacion.count === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">No hay ventas registradas para esta ubicación</p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ventas registradas</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Ítems</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventasDetalle.map((v) => (
                    <VentaRow key={v.id} venta={v} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="text-sm text-neutral-600">
                  Mostrando <span className="font-medium">{ventasDetalle.length}</span> de{" "}
                  <span className="font-medium">{paginacion.count}</span> ventas
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={!paginacion.previous}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum: number;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaActual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaActual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaActual - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaActual(pageNum)}
                          className={clsx(
                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                            paginaActual === pageNum
                              ? "bg-emerald-500 text-white"
                              : "text-neutral-600 hover:bg-neutral-100"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={!paginacion.next}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // ── INDEX VIEW (sucursal cards) ────────────────────────────────────────────
  const totalGlobal  = allVentas.reduce((s, v) => s + parseFloat(v.total), 0);
  const ventasPorSuc = sucursales.reduce<Record<number, VentaDetalle[]>>((acc, suc) => {
    acc[suc.id] = allVentas.filter((v) => v.sucursal === suc.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Ventas Globales</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Seleccioná una ubicación para ver su historial de ventas
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {/* global summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
              <Building2 className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-neutral-500 sm:text-sm">Sucursales</div>
              <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{sucursales.length}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 sm:h-12 sm:w-12">
              <Receipt className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-neutral-500 sm:text-sm">Total ventas</div>
              <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{allVentas.length}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:h-12 sm:w-12">
              <DollarSign className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-neutral-500 sm:text-sm">Ingresos totales</div>
              <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">{fmtMoney(totalGlobal)}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardBody className="flex items-start gap-3 p-4 sm:gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 sm:h-12 sm:w-12">
              <TrendingUp className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-neutral-500 sm:text-sm">Ticket promedio</div>
              <div className="break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">
                {allVentas.length > 0 ? fmtMoney(totalGlobal / allVentas.length) : "$0"}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* location cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sucursales
          .sort((a, b) => {
            if (a.tipo === "almacen" && b.tipo !== "almacen") return 1;
            if (b.tipo === "almacen" && a.tipo !== "almacen") return -1;
            return a.nombre.localeCompare(b.nombre);
          })
          .map((suc) => {
            const ventas    = ventasPorSuc[suc.id] ?? [];
            const total     = ventas.reduce((s, v) => s + parseFloat(v.total), 0);
            const isAlmacen = suc.tipo === "almacen";
            const lastVenta = ventas[0];

            return (
              <button
                key={suc.id}
                onClick={() => setSelected({ id: suc.id, nombre: suc.nombre, tipo: suc.tipo })}
                className={clsx(
                  "rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5",
                  isAlmacen
                    ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                    : "border-primary-100 bg-white hover:border-primary-400"
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={clsx("p-2.5 rounded-xl", isAlmacen ? "bg-amber-100" : "bg-primary-100")}>
                    {isAlmacen
                      ? <Warehouse  className="h-6 w-6 text-amber-600" />
                      : <Building2  className="h-6 w-6 text-primary-600" />}
                  </div>
                  <Badge variant={isAlmacen ? "pending" : "default"}>
                    {isAlmacen ? "Almacén" : "Sucursal"}
                  </Badge>
                </div>

                <div className="break-words text-lg font-semibold leading-tight text-neutral-900">
                  {suc.nombre}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm sm:gap-4">
                  <span className="text-neutral-500 break-words">
                    <span className="font-bold text-neutral-800">{ventas.length}</span> ventas
                  </span>
                  <span className="break-all font-bold text-emerald-600">{fmtMoney(total)}</span>
                </div>

                {lastVenta && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-neutral-400">
                    <Calendar className="h-3 w-3" />
                    <span className="break-words">Última: {fmtDate(lastVenta.fecha)}</span>
                  </div>
                )}

                <div className={clsx(
                  "mt-4 text-xs font-medium",
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
