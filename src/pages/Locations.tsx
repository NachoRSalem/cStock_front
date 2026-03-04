import { useEffect, useState } from "react";
import { listSucursales, createSubUbicacion, type Sucursal, type SubUbicacionCreateBody } from "../api/locations";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardTitle, 
  Badge, 
  PageLoader, 
  Alert, 
  Button, 
  Modal, 
  ModalFooter, 
  Input 
} from "../components/ui";
import { MapPin, Building2, Plus, CheckCircle, X } from "lucide-react";

export default function Locations() {
  const [data, setData] = useState<Sucursal[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para modal de agregar sub-ubicación
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  const [newSubUbicacion, setNewSubUbicacion] = useState<{ nombre: string; tipo: "heladera" | "freezer" | "ambiente" }>({
    nombre: "",
    tipo: "ambiente"
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const sucursales = await listSucursales();
      setData(sucursales);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = (sucursal: Sucursal) => {
    setSelectedSucursal(sucursal);
    setNewSubUbicacion({ nombre: "", tipo: "ambiente" });
    setErr(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedSucursal(null);
    setNewSubUbicacion({ nombre: "", tipo: "ambiente" });
    setErr(null);
  };

  const handleCreateSubUbicacion = async () => {
    if (!selectedSucursal) return;
    
    if (!newSubUbicacion.nombre.trim()) {
      setErr("El nombre es requerido");
      return;
    }

    setBusy(true);
    setErr(null);
    
    try {
      const body: SubUbicacionCreateBody = {
        ubicacion: selectedSucursal.id,
        nombre: newSubUbicacion.nombre.trim(),
        tipo: newSubUbicacion.tipo
      };
      
      await createSubUbicacion(body);
      
      // Recargar datos
      await loadData();
      
      // Cerrar modal
      handleCloseModal();
    } catch (e: any) {
      setErr(e?.message ?? "Error al crear sub-ubicación");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">Sucursales</h1>
        <p className="text-neutral-600 mt-1">
          Listado de ubicaciones y sub-ubicaciones
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {data.map((s) => (
          <Card key={s.id} hover>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <CardTitle>{s.nombre}</CardTitle>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      ID: {s.id}
                    </p>
                  </div>
                </div>
                <Badge variant="info">{s.tipo}</Badge>
              </div>
            </CardHeader>

            <CardBody className="pt-4">
              {s.sub_ubicaciones?.length ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-neutral-700">
                      Sub-ubicaciones ({s.sub_ubicaciones.length})
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenAddModal(s)}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {s.sub_ubicaciones.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-900">
                            {u.nombre}
                          </span>
                        </div>
                        <Badge variant="default" className="text-xs">
                          {u.tipo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 mb-3">Sin sub-ubicaciones</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAddModal(s)}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar sub-ubicación
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      {data.length === 0 && !err && (
        <Card>
          <CardBody className="text-center py-12">
            <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No hay sucursales registradas</p>
          </CardBody>
        </Card>
      )}

      {/* Modal para agregar sub-ubicación */}
      <Modal open={showAddModal} onClose={handleCloseModal}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <MapPin className="h-10 w-10 text-primary-600" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-center mb-2 text-neutral-900">
            Agregar Sub-ubicación
          </h3>
          <p className="text-center text-neutral-600 mb-6">
            {selectedSucursal?.nombre}
          </p>

          {err && (
            <Alert variant="error" className="mb-4">
              {err}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Ej: Góndola Central"
                value={newSubUbicacion.nombre}
                onChange={(e) => setNewSubUbicacion({ ...newSubUbicacion, nombre: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSubUbicacion.nombre.trim()) {
                    handleCreateSubUbicacion();
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={newSubUbicacion.tipo}
                onChange={(e) => setNewSubUbicacion({ ...newSubUbicacion, tipo: e.target.value as "heladera" | "freezer" | "ambiente" })}
                className="w-full px-3 py-2 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
              >
                <option value="ambiente">Ambiente</option>
                <option value="heladera">Heladera</option>
                <option value="freezer">Freezer</option>
              </select>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={handleCloseModal} disabled={busy}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateSubUbicacion}
            disabled={!newSubUbicacion.nombre.trim() || busy}
            loading={busy}
          >
            <CheckCircle className="h-4 w-4" />
            Crear Sub-ubicación
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
