import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, CookingPot, Plus, Trash2, Warehouse } from "lucide-react";
import clsx from "clsx";

import { listStock, type Stock } from "../api/stock";
import { listSucursales, type Sucursal } from "../api/locations";
import { createConsumo, listConsumos, deleteConsumo, type ConsumoCocina, type ConsumoItemCreate } from "../api/consumos";
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
  ConfirmDialog,
  ProductAutocomplete,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui";

type LineaConsumo = {
  key: number;
  producto: number | null;
  nombre: string;
  cantidad: string;
  sub_ubicacion_origen: number | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function ConsumoCocinaPage() {
  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";
  const sucursalSesion = tokenStorage.getSucursal();

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);

  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [ubicacionId, setUbicacionId] = useState<number | null>(isAdmin ? null : sucursalSesion);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [lineas, setLineas] = useState<LineaConsumo[]>([
    { key: Date.now(), producto: null, nombre: "", cantidad: "", sub_ubicacion_origen: null },
  ]);

  // Historial
  const [consumos, setConsumos] = useState<ConsumoCocina[]>([]);
  const [paginacion, setPaginacion] = useState({ count: 0, next: null as string | null, previous: null as string | null });
  const [paginaActual, setPaginaActual] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (!ubicacionId) {
      setStock([]);
      return;
    }
    loadStockForUbicacion(ubicacionId);
    setPaginaActual(1);
  }, [ubicacionId]);

  useEffect(() => {
    if (!ubicacionId) return;
    loadHistory();
  }, [paginaActual, ubicacionId]);

  async function loadInitial() {
    setFetching(true);
    setErr(null);
    try {
      const sucData = await listSucursales();
      setSucursales(sucData);
      if (!isAdmin && sucursalSesion) {
        setUbicacionId(sucursalSesion);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setFetching(false);
    }
  }

  async function loadStockForUbicacion(id: number) {
    try {
      const data = await listStock({ ubicacion: id, solo_con_stock: true });
      setStock(data);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando stock");
    }
  }

  async function loadHistory() {
    if (!ubicacionId) return;
    setLoadingHistory(true);
    try {
      const data = await listConsumos({
        ubicacion: isAdmin ? ubicacionId : undefined,
        page: paginaActual,
      });
      setConsumos(data.results);
      setPaginacion({ count: data.count, next: data.next, previous: data.previous });
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando historial");
    } finally {
      setLoadingHistory(false);
    }
  }

  const disponibilidad = useMemo(() => {
    const map = new Map<number, { sub_ubicacion: number; nombre: string; disponible: number }[]>();
    lineas.forEach((ln) => {
      if (!ln.producto) return;
      const candidatos = stock.filter((s) => s.producto === ln.producto && Number(s.cantidad) > 0);
      const porSub = new Map<number, { nombre: string; disponible: number }>();
      candidatos.forEach((s) => {
        const curr = porSub.get(s.sub_ubicacion);
        if (curr) {
          curr.disponible += Number(s.cantidad);
        } else {
          porSub.set(s.sub_ubicacion, { nombre: s.sub_ubicacion_nombre, disponible: Number(s.cantidad) });
        }
      });
      map.set(ln.producto, Array.from(porSub.entries()).map(([sub_ubicacion, d]) => ({ sub_ubicacion, ...d })));
    });
    return map;
  }, [lineas, stock]);

  function addLinea() {
    setLineas((prev) => [
      ...prev,
      { key: Date.now() + prev.length, producto: null, nombre: "", cantidad: "", sub_ubicacion_origen: null },
    ]);
  }

  function removeLinea(key: number) {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLinea(key: number, patch: Partial<LineaConsumo>) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  async function handleGuardar() {
    if (!ubicacionId || !fecha) {
      setErr("Completá sucursal y fecha.");
      return;
    }
    if (lineas.length === 0) {
      setErr("Agregá al menos un producto.");
      return;
    }

    const items: ConsumoItemCreate[] = [];
    for (const ln of lineas) {
      if (!ln.producto || !ln.sub_ubicacion_origen) {
        setErr("Todos los items deben tener producto y sub-ubicación.");
        return;
      }
      const cant = parseFloat(ln.cantidad);
      if (!Number.isFinite(cant) || cant <= 0) {
        setErr(`La cantidad de ${ln.nombre} debe ser mayor a 0.`);
        return;
      }

      // Validar stock local
      const opts = disponibilidad.get(ln.producto) || [];
      const opt = opts.find((o) => o.sub_ubicacion === ln.sub_ubicacion_origen);
      if (!opt || opt.disponible < cant) {
        setErr(`Stock insuficiente de ${ln.nombre} en ${opt?.nombre ?? "la ubicación seleccionada"}.`);
        return;
      }

      items.push({
        producto: ln.producto,
        cantidad: ln.cantidad,
        sub_ubicacion_origen: ln.sub_ubicacion_origen,
      });
    }

    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      await createConsumo({
        ubicacion: ubicacionId,
        fecha,
        items,
      });
      setOk("Consumo registrado correctamente.");
      setLineas([{ key: Date.now(), producto: null, nombre: "", cantidad: "", sub_ubicacion_origen: null }]);
      await loadStockForUbicacion(ubicacionId);
      setPaginaActual(1);
      await loadHistory();
    } catch (e: any) {
      setErr(e?.message ?? "Error registrando consumo");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    setBusy(true);
    setErr(null);
    try {
      await deleteConsumo(id);
      setOk("Consumo eliminado.");
      await loadHistory();
      if (ubicacionId) await loadStockForUbicacion(ubicacionId);
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando consumo");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  }

  const ubicacionSeleccionada = useMemo(
    () => sucursales.find((s) => s.id === ubicacionId) ?? null,
    [sucursales, ubicacionId]
  );

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(paginacion.count / 10)), [paginacion.count]);

  if (fetching) {
    return (
      <div className="py-16 text-center text-neutral-500">Cargando módulo de consumo...</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Consumo de Cocina</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {ubicacionSeleccionada
              ? `Sucursal: ${ubicacionSeleccionada.nombre}`
              : "Seleccioná una sucursal para ver y registrar consumos"}
          </p>
        </div>
        {isAdmin && ubicacionId && (
          <Button variant="ghost" size="sm" onClick={() => { setUbicacionId(null); setPaginaActual(1); }}>
            <ArrowLeft className="h-4 w-4" />
            Cambiar sucursal
          </Button>
        )}
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">{ok}</Alert>}

      {isAdmin && !ubicacionId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sucursales.map((s) => (
            <Card key={s.id} className="cursor-pointer hover:shadow-soft-lg transition-shadow" onClick={() => {
              setUbicacionId(s.id);
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
      )}

      {(!isAdmin || ubicacionId) && (
        <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CookingPot className="h-5 w-5" />
            Nuevo consumo
          </CardTitle>
          <CardDescription>
            Seleccioná los productos, la cantidad usada y de qué sub-ubicación salió.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Sucursal</label>
              <select
                value={ubicacionId ?? ""}
                onChange={(e) => {
                  setUbicacionId(Number(e.target.value) || null);
                  setLineas([{ key: Date.now(), producto: null, nombre: "", cantidad: "", sub_ubicacion_origen: null }]);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-neutral-900 border-neutral-300"
                disabled={!isAdmin}
              >
                <option value="">Seleccionar...</option>
                {sucursales
                  .filter((s) => (isAdmin ? true : s.id === sucursalSesion))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-neutral-900 border-neutral-300"
              />
            </div>
          </div>

          {lineas.map((ln) => {
            const opts = ln.producto ? disponibilidad.get(ln.producto) || [] : [];
            const selectedOpt = opts.find((o) => o.sub_ubicacion === ln.sub_ubicacion_origen);
            const cant = parseFloat(ln.cantidad);
            const suficiente = selectedOpt && Number.isFinite(cant) && selectedOpt.disponible >= cant;

            return (
              <div key={ln.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-neutral-200 rounded-xl p-4">
                <div className="md:col-span-4">
                  <label className="block text-xs text-neutral-600 mb-1">Producto</label>
                  <ProductAutocomplete
                    value={ln.producto}
                    selectedName={ln.nombre}
                    onSelect={(p) => {
                      if (p) {
                        updateLinea(ln.key, { producto: p.id, nombre: p.nombre, sub_ubicacion_origen: null });
                      } else {
                        updateLinea(ln.key, { producto: null, nombre: "", sub_ubicacion_origen: null });
                      }
                    }}
                    placeholder="Buscar producto..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-neutral-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={ln.cantidad}
                    onChange={(e) => updateLinea(ln.key, { cantidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                    placeholder="0.000"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs text-neutral-600 mb-1">Sub-ubicación origen</label>
                  <select
                    value={ln.sub_ubicacion_origen ?? ""}
                    onChange={(e) => updateLinea(ln.key, { sub_ubicacion_origen: Number(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                    disabled={!ln.producto || opts.length === 0}
                  >
                    <option value="">
                      {ln.producto ? (opts.length === 0 ? "Sin stock" : "Seleccionar...") : "Elegí producto"}
                    </option>
                    {opts.map((o) => (
                      <option key={o.sub_ubicacion} value={o.sub_ubicacion}>
                        {o.nombre} (disp: {o.disponible.toFixed(3)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-2">
                  {ln.producto && ln.sub_ubicacion_origen && (
                    <Badge variant={suficiente ? "approved" : "danger"}>
                      {suficiente ? "OK" : "Falta stock"}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeLinea(ln.key)}
                    disabled={lineas.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between">
            <Button type="button" size="sm" variant="outline" onClick={addLinea}>
              <Plus className="h-4 w-4" />
              Agregar producto
            </Button>
            <Button onClick={handleGuardar} loading={busy} disabled={!ubicacionId || busy}>
              Registrar consumo
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de consumos</CardTitle>
          <CardDescription>
            {paginacion.count} registro{paginacion.count !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {loadingHistory ? (
            <div className="py-10 text-center text-neutral-500">Cargando...</div>
          ) : consumos.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">No hay consumos registrados.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead className="text-right">Costo total</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumos.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{fmtDate(c.fecha)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {c.items.map((it) => (
                              <Badge key={it.id} variant="default">
                                {it.producto_nombre} x{Number(it.cantidad).toFixed(3)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-neutral-900">
                          {money(parseFloat(c.total_costo))}
                        </TableCell>
                        <TableCell>
                          {isAdmin && (
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setDeleteTarget({ id: c.id, label: `Consumo del ${fmtDate(c.fecha)}` })}
                                disabled={busy}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPaginas > 1 && (
                <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-sm text-neutral-600">
                    Mostrando <span className="font-medium">{consumos.length}</span> de{" "}
                    <span className="font-medium">{paginacion.count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={!paginacion.previous}
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        title="Eliminar consumo"
        message={`¿Eliminar ${deleteTarget?.label}? El stock NO se revertirá automáticamente.`}
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
