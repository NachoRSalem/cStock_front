import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Factory, PackageCheck, Plus, Trash2 } from "lucide-react";

import { fabricarReceta, listRecetasFabricables, updateReceta, type Receta } from "../api/recipes";
import { type Producto } from "../api/products";
import { listStock, type Stock } from "../api/stock";
import { listSucursales, type Sucursal } from "../api/locations";
import ManufactureHistory from "./ManufactureHistory";
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
  Input,
  Modal,
  ModalFooter,
  ProductAutocomplete,
} from "../components/ui";

type RecipeFormItem = {
  key: number;
  producto_insumo: number;
  cantidad_requerida: string;
};

export default function Manufacture() {
  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";
  const sucursalSesion = tokenStorage.getSucursal();

  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [productosCache, setProductosCache] = useState<Record<number, Producto>>({});
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [ubicacionId, setUbicacionId] = useState<number | null>(isAdmin ? null : sucursalSesion);
  const [recetaId, setRecetaId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<string>("1");
  const [subDestinoId, setSubDestinoId] = useState<number | null>(null);
  const [subOrigenByInsumo, setSubOrigenByInsumo] = useState<Record<string, number>>({});
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeFormErr, setRecipeFormErr] = useState<string | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeFormItem[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!ubicacionId) {
      setStock([]);
      return;
    }

    loadStockForUbicacion(ubicacionId);
  }, [ubicacionId]);

  async function loadInitialData() {
    setLoading(true);
    setErr(null);
    try {
      const [recetasData, sucursalesData] = await Promise.all([
        listRecetasFabricables(),
        listSucursales(),
      ]);

      setRecetas(recetasData);
      setSucursales(sucursalesData);

      if (!isAdmin && sucursalSesion) {
        setUbicacionId(sucursalSesion);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando recetas de fabricación");
    } finally {
      setLoading(false);
    }
  }

  async function reloadRecetas() {
    const recetasData = await listRecetasFabricables();
    setRecetas(recetasData);
    return recetasData;
  }

  async function loadStockForUbicacion(id: number) {
    try {
      const stockData = await listStock({ ubicacion: id, solo_con_stock: true });
      setStock(stockData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando stock de la ubicación");
    }
  }

  const recetaSeleccionada = useMemo(
    () => recetas.find((r) => r.id === recetaId) ?? null,
    [recetas, recetaId]
  );

  const ubicacionSeleccionada = useMemo(
    () => sucursales.find((s) => s.id === ubicacionId) ?? null,
    [sucursales, ubicacionId]
  );

  const cantidadNumero = useMemo(() => {
    const n = Number(cantidad);
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return 0;
    return n;
  }, [cantidad]);

  const insumoDisponibilidad = useMemo(() => {
    if (!recetaSeleccionada) return [] as Array<{
      insumoId: number;
      nombre: string;
      requerido: number;
      opciones: Array<{ sub_ubicacion: number; sub_ubicacion_nombre: string; disponible: number }>;
      suficiente: boolean;
      disponibleSeleccionado: number;
      restanteEstimado: number;
    }>;

    return recetaSeleccionada.insumos.map((ins) => {
      const requerido = Number(ins.cantidad_requerida) * cantidadNumero;
      const candidatos = stock.filter((s) => s.producto === ins.producto_insumo && Number(s.cantidad) > 0);

      const sumaPorSub = new Map<number, { nombre: string; disponible: number }>();
      candidatos.forEach((s) => {
        const current = sumaPorSub.get(s.sub_ubicacion);
        if (current) {
          current.disponible += Number(s.cantidad);
        } else {
          sumaPorSub.set(s.sub_ubicacion, {
            nombre: s.sub_ubicacion_nombre,
            disponible: Number(s.cantidad),
          });
        }
      });

      const opciones = Array.from(sumaPorSub.entries()).map(([sub_ubicacion, data]) => ({
        sub_ubicacion,
        sub_ubicacion_nombre: data.nombre,
        disponible: data.disponible,
      }));

      const selectedSub = subOrigenByInsumo[String(ins.id)];
      const selectedOpt = opciones.find((o) => o.sub_ubicacion === selectedSub);
      const suficiente = !!selectedOpt && selectedOpt.disponible >= requerido;
      const disponibleSeleccionado = selectedOpt?.disponible ?? 0;
      const restanteEstimado = disponibleSeleccionado - requerido;

      return {
        insumoId: ins.id,
        nombre: ins.producto_insumo_nombre,
        requerido,
        opciones,
        suficiente,
        disponibleSeleccionado,
        restanteEstimado,
      };
    });
  }, [recetaSeleccionada, stock, cantidadNumero, subOrigenByInsumo]);

  const canSubmit = useMemo(() => {
    if (!recetaSeleccionada || !ubicacionSeleccionada || !subDestinoId || cantidadNumero <= 0) {
      return false;
    }
    if (insumoDisponibilidad.length === 0) return false;

    return insumoDisponibilidad.every((ins) => {
      const sel = subOrigenByInsumo[String(ins.insumoId)];
      return !!sel && ins.suficiente;
    });
  }, [recetaSeleccionada, ubicacionSeleccionada, subDestinoId, cantidadNumero, insumoDisponibilidad, subOrigenByInsumo]);

  function resetFlow() {
    setRecetaId(null);
    setCantidad("1");
    setSubDestinoId(null);
    setSubOrigenByInsumo({});
  }

  function openRecipeConfig() {
    if (!recetaSeleccionada) return;

    const mapped = recetaSeleccionada.insumos.map((ins, idx) => ({
      key: Date.now() + idx,
      producto_insumo: ins.producto_insumo,
      cantidad_requerida: String(ins.cantidad_requerida),
    }));

    setRecipeItems(mapped.length > 0 ? mapped : [{ key: Date.now(), producto_insumo: 0, cantidad_requerida: "" }]);
    setRecipeFormErr(null);
    setShowRecipeModal(true);
  }

  function addRecipeItem() {
    setRecipeItems((prev) => [...prev, { key: Date.now() + prev.length, producto_insumo: 0, cantidad_requerida: "" }]);
  }

  function removeRecipeItem(key: number) {
    setRecipeItems((prev) => prev.filter((it) => it.key !== key));
  }

  function updateRecipeItem(key: number, patch: Partial<RecipeFormItem>) {
    setRecipeItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  async function saveRecipeConfig() {
    if (!recetaSeleccionada) return;

    if (recipeItems.length === 0) {
      setRecipeFormErr("La receta debe tener al menos un insumo.");
      return;
    }

    const parsed = recipeItems.map((it) => ({
      producto_insumo: Number(it.producto_insumo),
      cantidad_requerida: Number(it.cantidad_requerida),
    }));

    if (parsed.some((it) => !it.producto_insumo || !Number.isFinite(it.cantidad_requerida) || it.cantidad_requerida <= 0)) {
      setRecipeFormErr("Todos los insumos deben tener producto y cantidad mayor a 0.");
      return;
    }

    const ids = parsed.map((p) => p.producto_insumo);
    if (new Set(ids).size !== ids.length) {
      setRecipeFormErr("No podés repetir el mismo insumo en la receta.");
      return;
    }

    if (ids.includes(recetaSeleccionada.producto_final)) {
      setRecipeFormErr("El producto final no puede ser insumo de su propia receta.");
      return;
    }

    setBusy(true);
    setRecipeFormErr(null);
    setErr(null);
    try {
      await updateReceta(recetaSeleccionada.id, {
        producto_final: recetaSeleccionada.producto_final,
        activa: true,
        notas: recetaSeleccionada.notas,
        insumos: parsed,
      });

      const recetasData = await reloadRecetas();
      const updated = recetasData.find((r) => r.id === recetaSeleccionada.id) ?? null;
      if (updated) {
        setRecetaId(updated.id);
      }

      setShowRecipeModal(false);
      setOk("Receta guardada correctamente.");
    } catch (e: any) {
      setRecipeFormErr(e?.message ?? "Error guardando receta");
    } finally {
      setBusy(false);
    }
  }

  async function handleFabricar() {
    if (!recetaSeleccionada || !canSubmit || !subDestinoId) return;

    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const payload = {
        cantidad_producir: cantidadNumero,
        sub_ubicacion_destino: subDestinoId,
        sub_ubicaciones_origen: subOrigenByInsumo,
      };

      const result = await fabricarReceta(recetaSeleccionada.id, payload);
      setOk(`Fabricación registrada (#${result.id}): ${result.producto_final_nombre} x ${result.cantidad_producida}`);
      await loadStockForUbicacion(ubicacionSeleccionada!.id);
      resetFlow();
    } catch (e: any) {
      setErr(e?.message ?? "Error registrando fabricación");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-neutral-500">
        Cargando módulo de fabricación...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Fabricación de Productos</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Generá productos compuestos descontando insumos de stock.
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}
      {ok && <Alert variant="success">{ok}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Nueva fabricación
          </CardTitle>
          <CardDescription>
            La receta es global (misma fórmula para todas las sucursales). El stock se valida recién al fabricar.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Ubicación</label>
              <select
                value={ubicacionId ?? ""}
                onChange={(e) => {
                  const next = Number(e.target.value) || null;
                  setUbicacionId(next);
                  resetFlow();
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
              <label className="block text-sm font-medium text-neutral-700 mb-2">Producto fabricable</label>
              <ProductAutocomplete
                value={recetaSeleccionada?.producto_final ?? null}
                selectedName={recetaSeleccionada?.producto_final_nombre ?? ""}
                onSelect={(product) => {
                  if (!product) {
                    setRecetaId(null);
                    setSubOrigenByInsumo({});
                    return;
                  }

                  const recipe = recetas.find((r) => r.producto_final === product.id) ?? null;
                  setRecetaId(recipe?.id ?? null);
                  setSubOrigenByInsumo({});
                }}
                onlyFabricable
                disabled={!ubicacionId}
                placeholder="Escribí para buscar producto fabricable..."
              />
            </div>

            <Input
              label="Cantidad a producir"
              type="number"
              step="1"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Sub-ubicación destino</label>
              <select
                value={subDestinoId ?? ""}
                onChange={(e) => setSubDestinoId(Number(e.target.value) || null)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white text-neutral-900 border-neutral-300"
                disabled={!ubicacionSeleccionada}
              >
                <option value="">Seleccionar...</option>
                {ubicacionSeleccionada?.sub_ubicaciones.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {recetaSeleccionada && (
            <div className="space-y-3 border border-neutral-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-neutral-900">Insumos requeridos</div>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={openRecipeConfig}>
                    Configurar receta
                  </Button>
                )}
              </div>
              {insumoDisponibilidad.length === 0 && (
                <Alert variant="warning">
                  Este producto está marcado como fabricable pero aún no tiene insumos en su receta.
                  Cargá los insumos en la receta para poder registrar fabricación.
                </Alert>
              )}
              {insumoDisponibilidad.map((ins) => (
                <div key={ins.insumoId} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border-b border-neutral-100 pb-3 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-neutral-800">{ins.nombre}</div>
                    <div className="text-xs text-neutral-500">Requerido: {ins.requerido.toFixed(3)}</div>
                    {subOrigenByInsumo[String(ins.insumoId)] && (
                      <div className="text-xs text-neutral-500 mt-0.5">
                        Disponible: {ins.disponibleSeleccionado.toFixed(3)} • Restante estimado: {ins.restanteEstimado.toFixed(3)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Sub-ubicación origen</label>
                    <select
                      value={subOrigenByInsumo[String(ins.insumoId)] ?? ""}
                      onChange={(e) =>
                        setSubOrigenByInsumo((prev) => ({
                          ...prev,
                          [String(ins.insumoId)]: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {ins.opciones.map((o) => (
                        <option key={o.sub_ubicacion} value={o.sub_ubicacion}>
                          {o.sub_ubicacion_nombre} (disp: {o.disponible.toFixed(3)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center md:justify-end">
                    {ins.suficiente ? (
                      <Badge variant="approved" className="flex items-center gap-1">
                        <PackageCheck className="h-3.5 w-3.5" />
                        Stock suficiente
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Insuficiente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetFlow} disabled={busy}>
              Limpiar
            </Button>
            <Button onClick={handleFabricar} loading={busy} disabled={!canSubmit || busy}>
              Registrar fabricación
            </Button>
          </div>
        </CardBody>
      </Card>

      <ManufactureHistory embedded />

      <Modal
        open={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        title={`Configurar receta: ${recetaSeleccionada?.producto_final_nombre ?? ""}`}
        description="Definí qué insumos y qué cantidad consume por cada unidad producida"
        size="lg"
      >
        <div className="space-y-4">
          {recipeFormErr && <Alert variant="error">{recipeFormErr}</Alert>}

          <div className="space-y-3">
            {recipeItems.map((item) => (
              <div key={item.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border border-neutral-200 rounded-lg p-3">
                <div className="md:col-span-3">
                  <label className="block text-xs text-neutral-600 mb-1">Insumo</label>
                  <div>
                    <ProductAutocomplete
                      value={item.producto_insumo || null}
                      selectedName={
                        item.producto_insumo
                          ? (productosCache[item.producto_insumo]?.nombre ?? "")
                          : ""
                      }
                      onSelect={(product) => {
                        if (!product) {
                          updateRecipeItem(item.key, { producto_insumo: 0 });
                          return;
                        }

                        setProductosCache((prev) => ({ ...prev, [product.id]: product }));
                        updateRecipeItem(item.key, { producto_insumo: product.id });
                      }}
                      excludeIds={recipeItems.filter((ri) => ri.key !== item.key).map((ri) => ri.producto_insumo).filter((id) => !!id)}
                      placeholder="Buscar insumo..."
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs text-neutral-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.cantidad_requerida}
                    onChange={(e) => updateRecipeItem(item.key, { cantidad_requerida: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeRecipeItem(item.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Button type="button" size="sm" variant="outline" onClick={addRecipeItem}>
              <Plus className="h-4 w-4" />
              Agregar insumo
            </Button>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowRecipeModal(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={saveRecipeConfig} loading={busy}>
            Guardar receta
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
