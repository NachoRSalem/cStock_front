import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, UtensilsCrossed, X } from "lucide-react";

import { createProducto, listProductos, patchProducto, type Producto } from "../api/products";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  ModalFooter,
  PageLoader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui";
import { formatoPrecio } from "../utils/units";

function mensaje(e: unknown, defecto: string) {
  return e instanceof Error ? e.message : defecto;
}

export default function Viandas() {
  const [viandas, setViandas] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Edición rápida del precio
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [precioEdit, setPrecioEdit] = useState("");

  // Alta
  const [showNueva, setShowNueva] = useState(false);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [nuevaPrecio, setNuevaPrecio] = useState("");
  const [nuevaErr, setNuevaErr] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    setErr(null);
    try {
      setViandas(await listProductos({ es_vianda: true }));
    } catch (e) {
      setErr(mensaje(e, "Error cargando viandas"));
    } finally {
      setLoading(false);
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? viandas.filter((v) => v.nombre.toLowerCase().includes(q)) : viandas;
  }, [viandas, busqueda]);

  function empezarEdicion(v: Producto) {
    setEditandoId(v.id);
    setPrecioEdit(String(parseFloat(v.precio_venta)));
    setOk(null);
    setErr(null);
  }

  async function guardarPrecio(v: Producto) {
    const precio = parseFloat(precioEdit);
    if (!Number.isFinite(precio) || precio < 0) {
      setErr("Ingresá un precio válido.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const actualizada = await patchProducto(v.id, { precio_venta: precio });
      setViandas((prev) => prev.map((x) => (x.id === v.id ? actualizada : x)));
      setEditandoId(null);
      setOk(`Precio de "${v.nombre}" actualizado a ${formatoPrecio(precio)}.`);
    } catch (e) {
      setErr(mensaje(e, "No se pudo actualizar el precio"));
    } finally {
      setBusy(false);
    }
  }

  async function crearVianda() {
    const precio = parseFloat(nuevaPrecio);
    if (!nuevaNombre.trim()) {
      setNuevaErr("El nombre es obligatorio.");
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setNuevaErr("Ingresá un precio de venta válido.");
      return;
    }
    setBusy(true);
    setNuevaErr(null);
    try {
      const creada = await createProducto({ nombre: nuevaNombre.trim(), precio_venta: precio, es_vianda: true });
      setViandas((prev) => [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setShowNueva(false);
      setNuevaNombre("");
      setNuevaPrecio("");
      setOk(`Vianda "${creada.nombre}" creada.`);
    } catch (e) {
      setNuevaErr(mensaje(e, "No se pudo crear la vianda"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader message="Cargando viandas..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <UtensilsCrossed className="h-7 w-7 text-emerald-600" />
            Viandas
          </h1>
          <p className="text-neutral-600 mt-1">
            Las viandas no manejan stock ni costo de compra: al venderlas solo entra el dinero.
          </p>
        </div>
        <Button onClick={() => { setNuevaErr(null); setShowNueva(true); }}>
          <Plus className="h-4 w-4" />
          Nueva vianda
        </Button>
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">{ok}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Viandas creadas</CardTitle>
          <CardDescription>
            {filtradas.length} {filtradas.length === 1 ? "vianda" : "viandas"} · tocá el lápiz para cambiar el precio de venta
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar vianda..."
              className="w-full rounded-xl border border-neutral-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {filtradas.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">
              <UtensilsCrossed className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
              {viandas.length === 0 ? "Todavía no hay viandas creadas" : "Ninguna vianda coincide con la búsqueda"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Precio de venta</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-neutral-900">{v.nombre}</TableCell>
                      <TableCell className="text-right">
                        {editandoId === v.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            autoFocus
                            value={precioEdit}
                            onChange={(e) => setPrecioEdit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") guardarPrecio(v);
                              if (e.key === "Escape") setEditandoId(null);
                            }}
                            className="w-32 rounded-lg border border-neutral-300 px-3 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="font-semibold text-emerald-600">{formatoPrecio(parseFloat(v.precio_venta))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {editandoId === v.id ? (
                            <>
                              <Button size="sm" onClick={() => guardarPrecio(v)} loading={busy} aria-label="Guardar precio">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)} disabled={busy} aria-label="Cancelar">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => empezarEdicion(v)} aria-label={`Editar precio de ${v.nombre}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={showNueva} onClose={() => setShowNueva(false)} title="Nueva vianda" size="md">
        <div className="space-y-4">
          {nuevaErr && <Alert variant="error">{nuevaErr}</Alert>}
          <Input
            label="Nombre"
            required
            value={nuevaNombre}
            onChange={(e) => setNuevaNombre(e.target.value)}
            placeholder="Ej: Guiso de lentejas"
          />
          <Input
            label="Precio de venta"
            type="number"
            step="0.01"
            min="0"
            required
            value={nuevaPrecio}
            onChange={(e) => setNuevaPrecio(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNueva(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={crearVianda} loading={busy}>
            Crear vianda
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
