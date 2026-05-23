import { useEffect, useState } from "react";
import {
  listIngresos,
  createIngreso,
  updateIngreso,
  deleteIngreso,
  getBalance,
  type Ingreso,
  type IngresoCreateUpdate,
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
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Scale } from "lucide-react";

function money(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function Ingresos() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingreso | null>(null);
  const [form, setForm] = useState<IngresoCreateUpdate>({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
  });

  const [showDelete, setShowDelete] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: number; descripcion: string } | null>(null);

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
      const [ingData, balData] = await Promise.all([
        listIngresos(params),
        getBalance(params),
      ]);
      setIngresos(ingData);
      setBalance(balData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setFetching(false);
    }
  }

  function openForm(ing?: Ingreso) {
    setErr(null);
    if (ing) {
      setEditing(ing);
      setForm({
        monto: ing.monto,
        fecha: ing.fecha,
        descripcion: ing.descripcion,
      });
    } else {
      setEditing(null);
      setForm({
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
      });
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleSave() {
    if (!form.monto || !form.fecha) {
      setErr("Completá monto y fecha");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      if (editing) {
        await updateIngreso(editing.id, form);
      } else {
        await createIngreso(form);
      }
      await loadData();
      closeForm();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ingreso");
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(id: number, descripcion: string) {
    setDeleteData({ id, descripcion });
    setShowDelete(true);
  }

  async function confirmDelete() {
    if (!deleteData) return;
    setBusy(true);
    setErr(null);
    setShowDelete(false);
    try {
      await deleteIngreso(deleteData.id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando ingreso");
    } finally {
      setBusy(false);
      setDeleteData(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Ingresos y Balance</h1>
        <p className="text-sm text-neutral-500 mt-1">Registro de cuotas de comedor y comparación contra gastos</p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {fetching && (
        <div className="text-sm text-neutral-500">Cargando datos...</div>
      )}

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase">Gastos (mercadería)</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{money(balance.total_egresos)}</p>
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
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase">Cuotas comedor</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{money(balance.total_ingresos_cuotas)}</p>
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
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase">Ventas kiosco</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{money(balance.total_ventas_kiosco)}</p>
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
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase">Balance</p>
                  <p className={`text-xl font-bold mt-1 ${balance.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {money(balance.balance)}
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

      {/* Botón nuevo */}
      <div className="flex justify-end">
        <Button onClick={() => openForm()} size="lg">
          <Plus className="h-5 w-5" />
          Cargar ingreso
        </Button>
      </div>

      {/* Tabla */}
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
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingresos.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="text-sm">{ing.fecha}</TableCell>
                      <TableCell className="text-sm">{ing.descripcion || "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {money(parseFloat(ing.monto))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openForm(ing)} disabled={busy}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ing.id, ing.descripcion || `Ingreso ${ing.id}`)}
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

      {/* Modal formulario */}
      <Modal open={showForm} onClose={closeForm} title={editing ? "Editar ingreso" : "Nuevo ingreso"} size="md">
        <div className="space-y-4">
          <Input
            label="Monto"
            type="number"
            step="0.01"
            required
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <Input
            label="Descripción"
            value={form.descripcion || ""}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Ej: Cuota comedor abril"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={closeForm} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={busy}>
            {editing ? "Guardar cambios" : "Cargar ingreso"}
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
        title="Eliminar ingreso"
        message={`¿Eliminar el ingreso "${deleteData?.descripcion}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
