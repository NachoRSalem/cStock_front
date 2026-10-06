import { useEffect, useState } from "react";
import {
  listIngresos,
  createIngreso,
  updateIngreso,
  deleteIngreso,
  listGastos,
  createGasto,
  deleteGasto,
  getBalance,
  type Ingreso,
  type IngresoCreateUpdate,
  type GastoOperativo,
  type GastoOperativoCreateUpdate,
  type BalanceData,
} from "../api/ingresos";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Button,
  Input,
  Modal,
  ModalFooter,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ConfirmDialog,
} from "../components/ui";
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Scale, Settings, Receipt } from "lucide-react";
import { formatCurrency, sanitizeNumberInput } from "../utils/formatters";

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [activeTab, setActiveTab] = useState<"ingresos" | "gastos">("ingresos");

  // Form Ingresos
  const [showFormIngreso, setShowFormIngreso] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<Ingreso | null>(null);
  const [formIngreso, setFormIngreso] = useState<IngresoCreateUpdate>({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    medio_pago: "efectivo",
  });

  // Form Gastos
  const [showFormGasto, setShowFormGasto] = useState(false);
  const [formGasto, setFormGasto] = useState<GastoOperativoCreateUpdate>({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    categoria: "General",
    descripcion: "",
  });

  const [showDelete, setShowDelete] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: number; type: "ingreso" | "gasto"; descripcion: string } | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [configCuotaRapida, setConfigCuotaRapida] = useState(() => {
    const stored = localStorage.getItem("cuotaRapidaConfig");
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return { monto: "", descripcion: "" };
  });
  const [settingsForm, setSettingsForm] = useState({ monto: "", descripcion: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setFetching(true);
    setErr(null);
    try {
      const params = {
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      };
      const [ingData, gasData, balData] = await Promise.all([
        listIngresos(params),
        listGastos(params),
        getBalance(params),
      ]);
      setIngresos(ingData);
      setGastos(gasData);
      setBalance(balData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setFetching(false);
    }
  }

  function openFormIngreso(ing?: Ingreso) {
    setErr(null);
    if (ing) {
      setEditingIngreso(ing);
      setFormIngreso({
        monto: ing.monto,
        fecha: ing.fecha,
        descripcion: ing.descripcion,
        medio_pago: ing.medio_pago || "efectivo",
      });
    } else {
      setEditingIngreso(null);
      setFormIngreso({
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        medio_pago: "efectivo",
      });
    }
    setShowFormIngreso(true);
  }

  function openFormGasto() {
    setErr(null);
    setFormGasto({
      monto: "",
      fecha: new Date().toISOString().split("T")[0],
      categoria: "General",
      descripcion: "",
    });
    setShowFormGasto(true);
  }

  function openRapida() {
    setErr(null);
    setEditingIngreso(null);
    setFormIngreso({
      monto: configCuotaRapida.monto || "",
      fecha: new Date().toISOString().split("T")[0],
      descripcion: configCuotaRapida.descripcion || "",
      medio_pago: "efectivo",
    });
    setShowFormIngreso(true);
  }

  function openSettings() {
    setSettingsForm({ ...configCuotaRapida });
    setShowSettings(true);
  }

  function saveSettings() {
    const config = { monto: settingsForm.monto, descripcion: settingsForm.descripcion };
    localStorage.setItem("cuotaRapidaConfig", JSON.stringify(config));
    setConfigCuotaRapida(config);
    setShowSettings(false);
  }

  function closeFormIngreso() {
    setShowFormIngreso(false);
    setEditingIngreso(null);
  }

  function closeFormGasto() {
    setShowFormGasto(false);
  }

  async function handleSaveIngreso() {
    if (!formIngreso.monto || !formIngreso.fecha) {
      setErr("Completá monto y fecha");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (editingIngreso) {
        await updateIngreso(editingIngreso.id, formIngreso);
      } else {
        await createIngreso(formIngreso);
      }
      await loadData();
      closeFormIngreso();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ingreso");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveGasto() {
    if (!formGasto.monto || !formGasto.fecha) {
      setErr("Completá monto y fecha del gasto");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createGasto(formGasto);
      await loadData();
      closeFormGasto();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando gasto operativo");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(id: number, type: "ingreso" | "gasto", descripcion: string) {
    setDeleteData({ id, type, descripcion });
    setShowDelete(true);
  }

  async function confirmDelete() {
    if (!deleteData) return;
    setBusy(true);
    setErr(null);
    setShowDelete(false);
    try {
      if (deleteData.type === "ingreso") {
        await deleteIngreso(deleteData.id);
      } else {
        await deleteGasto(deleteData.id);
      }
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? `Error eliminando ${deleteData.type}`);
    } finally {
      setBusy(false);
      setDeleteData(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Ingresos, Gastos y Balance</h1>
        <p className="text-sm text-neutral-500 mt-1">Gestión global de cuotas, ventas, gastos operativos y balance económico</p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {fetching && (
        <div className="text-sm text-neutral-500">Cargando datos...</div>
      )}

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase">Egresos (compras)</p>
                  <p className="break-words text-xl font-bold text-red-600 mt-1">{formatCurrency(balance.total_egresos)}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase">Gastos oper.</p>
                  <p className="break-words text-xl font-bold text-amber-600 mt-1">{formatCurrency(balance.total_gastos_operativos || 0)}</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Receipt className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase">Cuotas comedor</p>
                  <p className="break-words text-xl font-bold text-blue-600 mt-1">{formatCurrency(balance.total_ingresos_cuotas)}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase">Ventas kiosco</p>
                  <p className="break-words text-xl font-bold text-emerald-600 mt-1">{formatCurrency(balance.total_ventas_kiosco)}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-500 uppercase">Balance Neto</p>
                  <p className={`text-xl font-bold mt-1 ${(balance.balance_neto ?? balance.balance) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(balance.balance_neto ?? balance.balance)}
                  </p>
                </div>
                <div className="p-2 bg-neutral-50 rounded-lg">
                  <Scale className="w-5 h-5 text-neutral-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de período</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex items-end">
              <Button onClick={loadData} className="w-full">
                Aplicar filtros
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Navegación por pestañas */}
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "ingresos" ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
            onClick={() => setActiveTab("ingresos")}
          >
            Ingresos ({ingresos.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "gastos" ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
            onClick={() => setActiveTab("gastos")}
          >
            Gastos Operativos Globales ({gastos.length})
          </button>
        </div>

        {activeTab === "ingresos" ? (
            <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={openSettings} title="Configurar cuota rápida">
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={openRapida} size="sm" variant="secondary">
              <Plus className="h-4 w-4" />
              Cuota rápida
            </Button>
            <Button onClick={() => openFormIngreso()} size="sm">
              <Plus className="h-4 w-4" />
              Nuevo ingreso
            </Button>
          </div>
        ) : (
          <Button onClick={openFormGasto} size="sm">
            <Plus className="h-4 w-4" />
            Nuevo gasto operativo
          </Button>
        )}
      </div>

      {/* Tabla Ingresos */}
      {activeTab === "ingresos" && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos registrados</CardTitle>
            <CardDescription>{ingresos.length} registros</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {ingresos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No hay ingresos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Medio de Pago</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresos.map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell className="text-sm">{ing.fecha}</TableCell>
                        <TableCell className="text-sm">{ing.descripcion || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {ing.medio_pago === "mercado_pago" ? "Mercado Pago" : ing.medio_pago === "cuenta_bancaria" ? "Cuenta Bancaria" : "Efectivo"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(ing.monto)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openFormIngreso(ing)} disabled={busy}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ing.id, "ingreso", ing.descripcion || `Ingreso ${ing.id}`)}
                              disabled={busy}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      )}

      {/* Tabla Gastos Operativos */}
      {activeTab === "gastos" && (
        <Card>
          <CardHeader>
            <CardTitle>Gastos Operativos Registrados</CardTitle>
            <CardDescription>Gastos generales de administración, servicios, sueldos, mantenimiento</CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            {gastos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">No hay gastos operativos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Registrado por</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastos.map((gas) => (
                      <TableRow key={gas.id}>
                        <TableCell className="text-sm">{gas.fecha}</TableCell>
                        <TableCell className="text-sm font-medium">{gas.categoria || "General"}</TableCell>
                        <TableCell className="text-sm">{gas.descripcion || "—"}</TableCell>
                        <TableCell className="text-sm text-neutral-500">{gas.registrado_por_nombre || "Admin"}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {formatCurrency(gas.monto)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(gas.id, "gasto", gas.descripcion || `Gasto ${gas.id}`)}
                              disabled={busy}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      )}

      {/* Modal formulario Ingreso */}
      <Modal open={showFormIngreso} onClose={closeFormIngreso} title={editingIngreso ? "Editar ingreso" : "Nuevo ingreso"} size="md">
        <div className="space-y-4">
          <Input
            label="Monto"
            type="text"
            required
            value={formIngreso.monto}
            onChange={(e) => setFormIngreso({ ...formIngreso, monto: sanitizeNumberInput(e.target.value) })}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              value={formIngreso.fecha}
              onChange={(e) => setFormIngreso({ ...formIngreso, fecha: e.target.value })}
            />
          </div>
          <Input
            label="Descripción"
            value={formIngreso.descripcion || ""}
            onChange={(e) => setFormIngreso({ ...formIngreso, descripcion: e.target.value })}
            placeholder="Ej: Cuota comedor abril"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Medio de Pago</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              value={formIngreso.medio_pago || "efectivo"}
              onChange={(e) => setFormIngreso({ ...formIngreso, medio_pago: e.target.value })}
            >
              <option value="efectivo">Efectivo</option>
              <option value="mercado_pago">Mercado Pago</option>
              <option value="cuenta_bancaria">Cuenta Bancaria</option>
            </select>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={closeFormIngreso} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSaveIngreso} loading={busy}>
            {editingIngreso ? "Guardar cambios" : "Cargar ingreso"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal formulario Gasto Operativo */}
      <Modal open={showFormGasto} onClose={closeFormGasto} title="Nuevo Gasto Operativo Global" size="md">
        <div className="space-y-4">
          <Input
            label="Monto"
            type="text"
            required
            value={formGasto.monto}
            onChange={(e) => setFormGasto({ ...formGasto, monto: sanitizeNumberInput(e.target.value) })}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              value={formGasto.fecha}
              onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              value={formGasto.categoria || "General"}
              onChange={(e) => setFormGasto({ ...formGasto, categoria: e.target.value })}
            >
              <option value="Servicios">Servicios (Luz, Agua, Gas, Internet)</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Sueldos">Sueldos y Honorarios</option>
              <option value="Mantenimiento">Mantenimiento y Reparaciones</option>
              <option value="Impuestos">Impuestos y Tasas</option>
              <option value="General">General / Otros</option>
            </select>
          </div>
          <Input
            label="Descripción / Detalle"
            value={formGasto.descripcion || ""}
            onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })}
            placeholder="Ej: Pago de servicio de luz mensual"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={closeFormGasto} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSaveGasto} loading={busy}>
            Registrar Gasto Operativo
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteData(null);
        }}
        onConfirm={confirmDelete}
        title={`Eliminar ${deleteData?.type === "ingreso" ? "ingreso" : "gasto operativo"}`}
        message={`¿Eliminar ${deleteData?.type === "ingreso" ? "el ingreso" : "el gasto"} "${deleteData?.descripcion}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />

      {/* Modal configuración cuota rápida */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configurar cuota rápida" size="md">
        <div className="space-y-4">
          <Input
            label="Monto predeterminado"
            type="text"
            value={settingsForm.monto}
            onChange={(e) => setSettingsForm({ ...settingsForm, monto: sanitizeNumberInput(e.target.value) })}
            placeholder="0.00"
          />
          <Input
            label="Descripción predeterminada"
            value={settingsForm.descripcion}
            onChange={(e) => setSettingsForm({ ...settingsForm, descripcion: e.target.value })}
            placeholder="Ej: Cuota comedor"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowSettings(false)}>
            Cancelar
          </Button>
          <Button onClick={saveSettings}>
            Guardar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
