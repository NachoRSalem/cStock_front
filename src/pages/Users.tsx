import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "../components/ui";
import {
  Users as UsersIcon,
  Shield,
  Building2,
  User,
  Key,
} from "lucide-react";

const USUARIOS_DEMO = [
  { 
    rol: "admin", 
    username: "admin", 
    sucursal: "Almacén Central", 
    password: "admin123",
    descripcion: "Acceso completo al sistema (panel de administración)"
  },
  { 
    rol: "sucursal", 
    username: "sucursal", 
    sucursal: "Sucursal Norte", 
    password: "paso123",
    descripcion: "Acceso limitadas a Sucursal Norte"
  },
];

export default function Users() {
  const adminUsuarios = USUARIOS_DEMO.filter(u => u.rol === "admin");
  const sucursalUsuarios = USUARIOS_DEMO.filter(u => u.rol === "sucursal");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-emerald-600" />
          Credenciales de Prueba
        </h1>
        <p className="text-neutral-600 mt-1">
          Usuarios disponibles para esta versión demo
        </p>
      </div>

      {/* Nota informativa */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-amber-700">
          <Key className="h-5 w-5" />
          <span className="font-medium">Versión de Demostración</span>
        </div>
        <p className="text-sm text-amber-600 mt-1">
          Estas son las credenciales de prueba para explorar el sistema. 
          Todos los datos mostrados son ficticios.
        </p>
      </div>

      {/* Administradores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <CardTitle>Administrador</CardTitle>
          </div>
          <CardDescription>
            Usuario con acceso completo al sistema
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {adminUsuarios.map((user, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 flex items-center gap-2">
                      {user.username}
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">{user.descripcion}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500 mb-1">Contraseña</div>
                  <div className="font-mono px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-neutral-900">
                    {user.password}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Usuarios de Sucursal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <CardTitle>Usuario de Sucursal</CardTitle>
          </div>
          <CardDescription>
            Usuario con acceso limitado a su sucursal
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {sucursalUsuarios.map((user, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 flex items-center gap-2">
                      {user.username}
                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs font-bold rounded-full">
                        SUCURSAL
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">{user.descripcion}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500 mb-1">Contraseña</div>
                  <div className="font-mono px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-300 text-neutral-900">
                    {user.password}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}