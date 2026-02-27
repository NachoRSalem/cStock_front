import { useEffect, useState } from "react";
import { listSucursales, type Sucursal } from "../api/locations";
import { Card, CardBody, CardHeader, CardTitle, Badge, PageLoader, Alert } from "../components/ui";
import { MapPin, Building2 } from "lucide-react";

export default function Locations() {
  const [data, setData] = useState<Sucursal[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSucursales()
      .then(setData)
      .catch((e) => setErr(e?.message ?? "Error"))
      .finally(() => setLoading(false));
  }, []);

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
                  <p className="text-sm font-medium text-neutral-700 mb-3">
                    Sub-ubicaciones ({s.sub_ubicaciones.length})
                  </p>
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
                  <p className="text-sm text-neutral-500">Sin sub-ubicaciones</p>
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
    </div>
  );
}
