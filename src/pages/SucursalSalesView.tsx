import { useEffect, useState } from "react";
import { listVentas, type VentaDetalle, type VentasPaginadas } from "../api/sales";
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
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Receipt,
  ChevronLeft,
} from "lucide-react";
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
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
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
          <Badge variant="default">
            {venta.items.length} ítem{venta.items.length !== 1 ? "s" : ""}
          </Badge>
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
                      <td className="py-1.5 text-neutral-800 font-medium">
                        {item.producto_nombre}
                      </td>
                      <td className="py-1.5 text-center text-neutral-600">{item.cantidad}</td>
                      <td className="py-1.5 text-right text-neutral-600">
                        {fmtMoney(item.precio_venta_momento)}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-neutral-800">
                        {fmtMoney(
                          item.cantidad * parseFloat(item.precio_venta_momento)
                        )}
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

export default function SucursalSalesView() {
  const [ventas, setVentas]   = useState<VentaDetalle[]>([]);
  const [paginacion, setPaginacion] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [err, setErr]         = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sucursalId = tokenStorage.getSucursal();

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const data = await listVentas({ sucursal: sucursalId ?? undefined, page: paginaActual });
        setVentas(data.results);
        setPaginacion({ count: data.count, next: data.next, previous: data.previous });
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando ventas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sucursalId, paginaActual]);

  if (loading) return <PageLoader message="Cargando ventas..." />;

  const totalRev   = ventas.reduce((s, v) => s + parseFloat(v.total), 0);
  const avgTicket  = ventas.length > 0 ? totalRev / ventas.length : 0;
  const totalPaginas = Math.ceil(paginacion.count / 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mis Ventas</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Historial de ventas de tu sucursal
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {/* summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Receipt className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Total ventas</div>
              <div className="text-3xl font-bold text-neutral-900">{paginacion.count}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Ingresos (página actual)</div>
              <div className="text-3xl font-bold text-neutral-900">{fmtMoney(totalRev)}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Ticket promedio</div>
              <div className="text-3xl font-bold text-neutral-900">{fmtMoney(avgTicket)}</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ventas table */}
      {paginacion.count === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No hay ventas registradas aún</p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle de ventas</CardTitle>
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
                {ventas.map((v) => (
                  <VentaRow key={v.id} venta={v} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
              <div className="text-sm text-neutral-600">
                Mostrando <span className="font-medium">{ventas.length}</span> de{" "}
                <span className="font-medium">{paginacion.count}</span> ventas
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={!paginacion.previous}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
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
                            ? "bg-primary-500 text-white"
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
