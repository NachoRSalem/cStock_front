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

  useEffect(() => {
    async function load() {
      setErr(null);
      setLoading(true);
      try {
        const [ventasData, sucData] = await Promise.all([listVentas(), listSucursales()]);
        setAllVentas(ventasData);
        setSucursales(sucData);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PageLoader message="Cargando ventas..." />;

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (selected) {
    const ventas     = allVentas.filter((v) => v.sucursal === selected.id);
    const totalRev   = ventas.reduce((s, v) => s + parseFloat(v.total), 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{selected.nombre}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Historial de ventas</p>
          </div>
        </div>

        {err && <Alert variant="error">{err}</Alert>}

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <Receipt className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-500">Ventas totales</div>
                <div className="text-3xl font-bold text-neutral-900">{ventas.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-neutral-500">Ingresos totales</div>
                <div className="text-3xl font-bold text-neutral-900">{fmtMoney(totalRev)}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {ventas.length === 0 ? (
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
                  {ventas.map((v) => (
                    <VentaRow key={v.id} venta={v} />
                  ))}
                </TableBody>
              </Table>
            </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Sucursales</div>
              <div className="text-3xl font-bold text-neutral-900">{sucursales.length}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Receipt className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Total ventas</div>
              <div className="text-3xl font-bold text-neutral-900">{allVentas.length}</div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardBody className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-neutral-500">Ingresos totales</div>
              <div className="text-3xl font-bold text-neutral-900">{fmtMoney(totalGlobal)}</div>
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
              <div className="text-3xl font-bold text-neutral-900">
                {allVentas.length > 0 ? fmtMoney(totalGlobal / allVentas.length) : "$0"}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* location cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  "text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md hover:-translate-y-0.5",
                  isAlmacen
                    ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                    : "border-primary-100 bg-white hover:border-primary-400"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx("p-2.5 rounded-xl", isAlmacen ? "bg-amber-100" : "bg-primary-100")}>
                    {isAlmacen
                      ? <Warehouse  className="h-6 w-6 text-amber-600" />
                      : <Building2  className="h-6 w-6 text-primary-600" />}
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
                    <span className="font-bold text-neutral-800">{ventas.length}</span> ventas
                  </span>
                  <span className="font-bold text-emerald-600">{fmtMoney(total)}</span>
                </div>

                {lastVenta && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
                    <Calendar className="h-3 w-3" />
                    Última: {fmtDate(lastVenta.fecha)}
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
