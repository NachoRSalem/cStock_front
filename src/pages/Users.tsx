import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Alert,
  PageLoader,
} from "../components/ui";
import { Users as UsersIcon, Shield, Building2, User } from "lucide-react";
import { listUsuarios, type UsuarioListado } from "../api/users";

export default function Users() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listUsuarios()
      .then(setUsuarios)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error cargando usuarios"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const admins = usuarios.filter((u) => u.rol === "admin");
  const porSucursal = usuarios
    .filter((u) => u.rol === "sucursal")
    .reduce<Record<string, UsuarioListado[]>>((acc, u) => {
      const clave = u.sucursal_nombre || "Sin sucursal";
      (acc[clave] ??= []).push(u);
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-emerald-600" />
          Usuarios
        </h1>
        <p className="text-neutral-600 mt-1">
          Usuarios del sistema. Las contraseñas no se muestran; para cambiarlas usá el panel de administración de Django.
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <CardTitle>Administradores</CardTitle>
          </div>
          <CardDescription>Usuarios con acceso completo al sistema</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {admins.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">
                    {u.username}
                    {!u.is_active && <span className="ml-2 text-xs text-red-600">(inactivo)</span>}
                  </div>
                  <div className="text-sm text-neutral-600">
                    Acceso completo al sistema
                    {u.cuenta_pareada_username && ` · Cuenta pareada: ${u.cuenta_pareada_username}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <CardTitle>Usuarios de Sucursales</CardTitle>
          </div>
          <CardDescription>Usuarios con acceso limitado a su sucursal</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {Object.entries(porSucursal).map(([sucursal, users]) => (
              <div key={sucursal}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
                  <Building2 className="h-4 w-4 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">{sucursal}</h3>
                  <span className="text-xs text-neutral-500">
                    ({users.length} {users.length === 1 ? "usuario" : "usuarios"})
                  </span>
                </div>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {u.username}
                          {!u.is_active && <span className="ml-2 text-xs text-red-600">(inactivo)</span>}
                        </div>
                        <div className="text-sm text-neutral-600">
                          Acceso a {sucursal}
                          {u.cuenta_pareada_username && ` · Cuenta pareada: ${u.cuenta_pareada_username}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(porSucursal).length === 0 && (
              <p className="text-sm text-neutral-500">No hay usuarios de sucursal.</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
