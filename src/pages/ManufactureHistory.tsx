import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Factory,
  Package,
  Warehouse,
} from "lucide-react";
import clsx from "clsx";

import { listSucursales, type Sucursal } from "../api/locations";
import { listFabricaciones, type FabricacionDetalle } from "../api/recipes";
import { tokenStorage } from "../utils/storage";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageLoader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FabricacionRow({ f }: { f: FabricacionDetalle }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-neutral-50" onClick={() => setOpen((p) => !p)}>
        <TableCell>
          <button className="text-neutral-500">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </TableCell>
        <TableCell>
          <div className="font-medium text-neutral-900">{f.producto_final_nombre}</div>
          <div className="text-xs text-neutral-500">#{f.id}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-neutral-700">{f.cantidad_producida}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-neutral-700">{f.sub_ubicacion_destino_nombre}</div>
        </TableCell>
        <TableCell>
          <div className="text-xs text-neutral-600 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {fmtDate(f.creado_en)}
          </div>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow>
          <td colSpan={5} className="bg-neutral-50 p-0">
            <div className="px-8 py-3">
              <div className="text-xs uppercase text-neutral-500 mb-2">Consumo por insumo</div>
              {f.consumos_resumen.length === 0 ? (
                <div className="text-sm text-neutral-500">Sin consumos registrados.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {f.consumos_resumen.map((c) => (
                    <div key={c.insumo_id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-neutral-700">{c.insumo_nombre}</span>
                      <Badge variant="default">{Number(c.cantidad_total_consumida).toFixed(3)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </TableRow>
      )}
    </>
  );
}

type ManufactureHistoryProps = {
  embedded?: boolean;
};

export default function ManufactureHistory({ embedded = false }: ManufactureHistoryProps) {
  const role = tokenStorage.getRole();
  const sucursalId = tokenStorage.getSucursal();

  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selected, setSelected] = useState<Sucursal | null>(null);

  const [fabricaciones, setFabricaciones] = useState<FabricacionDetalle[]>([]);
  const [paginacion, setPaginacion] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (role === "admin" && !selected) return;
    loadFabricaciones();
  }, [paginaActual, selected?.id, role]);

  async function loadInitial() {
    setLoading(true);
    setErr(null);
    try {
      const sucData = await listSucursales();
      setSucursales(sucData);

      if (role === "sucursal" && sucursalId) {
        const own = sucData.find((s) => s.id === sucursalId) || null;
        setSelected(own);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando sucursales");
    } finally {
      setLoading(false);
    }
  }

  async function loadFabricaciones() {
    setLoadingList(true);
    setErr(null);
    try {
      const data = await listFabricaciones({
        ubicacion: role === "admin" ? selected?.id : undefined,
        page: paginaActual,
      });
      setFabricaciones(data.results);
      setPaginacion({ count: data.count, next: data.next, previous: data.previous });
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando historial de fabricaciones");
    } finally {
      setLoadingList(false);
    }
  }

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(paginacion.count / 10)), [paginacion.count]);

  if (loading) {
    return <PageLoader message="Cargando historial de fabricación..." />;
  }

  if (role === "admin" && !selected) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Historial de Fabricaciones</h1>
            <p className="text-sm text-neutral-500 mt-1">Seleccioná una sucursal para ver su historial</p>
          </div>
        )}
        {embedded && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Historial de Fabricaciones</h2>
            <p className="text-sm text-neutral-500 mt-1">Seleccioná una sucursal para ver su historial</p>
          </div>
        )}

        {err && <Alert variant="error">{err}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sucursales.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-soft-lg transition-shadow" onClick={() => {
              setSelected(s);
              setPaginaActual(1);
            }}>
              <CardBody className="flex items-center gap-3 p-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  {s.tipo === "almacen" ? <Warehouse className="h-5 w-5 text-primary-600" /> : <Building2 className="h-5 w-5 text-primary-600" />}
                </div>
                <div>
                  <div className="font-medium text-neutral-900">{s.nombre}</div>
                  <div className="text-xs text-neutral-500 capitalize">{s.tipo}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          {embedded ? (
            <h2 className="text-xl font-bold text-neutral-900">Historial de Fabricaciones</h2>
          ) : (
            <h1 className="text-2xl font-bold text-neutral-900">Historial de Fabricaciones</h1>
          )}
          <p className="text-sm text-neutral-500 mt-1">
            {selected ? `Sucursal: ${selected.nombre}` : "Tu sucursal"}
          </p>
        </div>
        {role === "admin" && (
          <Button variant="ghost" size="sm" onClick={() => {
            setSelected(null);
            setPaginaActual(1);
          }}>
            <ArrowLeft className="h-4 w-4" />
            Cambiar sucursal
          </Button>
        )}
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Fabricaciones registradas
          </CardTitle>
          <CardDescription>
            {paginacion.count} registro{paginacion.count !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {loadingList ? (
            <div className="py-10 text-center text-neutral-500">Cargando...</div>
          ) : fabricaciones.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">No hay fabricaciones registradas.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Producto final</TableHead>
                      <TableHead>Cant. producida</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fabricaciones.map((f) => (
                      <FabricacionRow key={f.id} f={f} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-sm text-neutral-600">
                    Mostrando <span className="font-medium">{fabricaciones.length}</span> de{" "}
                    <span className="font-medium">{paginacion.count}</span> fabricaciones
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={!paginacion.previous}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum: number;
                        if (totalPaginas <= 5) pageNum = i + 1;
                        else if (paginaActual <= 3) pageNum = i + 1;
                        else if (paginaActual >= totalPaginas - 2) pageNum = totalPaginas - 4 + i;
                        else pageNum = paginaActual - 2 + i;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPaginaActual(pageNum)}
                            className={clsx(
                              "w-8 h-8 rounded-lg text-sm font-medium",
                              paginaActual === pageNum ? "bg-primary-500 text-white" : "text-neutral-600 hover:bg-neutral-100"
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
                      onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={!paginacion.next}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
