import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  Button,
  Modal,
  ModalFooter,
  Input,
  Alert,
} from "../components/ui";
import {
  Users as UsersIcon,
  Eye,
  EyeOff,
  Shield,
  Building2,
  User,
  Lock,
  CheckCircle,
  X,
} from "lucide-react";
import clsx from "clsx";

type Usuario = {
  rol: "admin" | "sucursal";
  username: string;
  sucursal: string | null;
  password: string;
};

const USUARIOS: Usuario[] = [
  { rol: "admin", username: "admin", sucursal: null, password: "admin1234" },
  { rol: "sucursal", username: "KioscoCampo", sucursal: "KioscoCampo", password: "KioscoCampo1234" },
  { rol: "sucursal", username: "KioscoCentro", sucursal: "KioscoCentro", password: "KioscoCentro1234" },
  { rol: "sucursal", username: "ComedorCampo", sucursal: "ComedorCampo", password: "ComedorCampo1234" },
  { rol: "sucursal", username: "ComedorCentro", sucursal: "ComedorCentro", password: "ComedorCentro1234" },
  { rol: "sucursal", username: "Hidrocinetic", sucursal: "Hidrocinetic", password: "Hidrocinetic1234" },
];

export default function Users() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleRequestViewPasswords = () => {
    setShowAuthModal(true);
    setAdminPassword("");
    setAuthError(null);
  };

  const handleVerifyPassword = () => {
    setAuthLoading(true);
    setAuthError(null);

    // Simular verificación
    setTimeout(() => {
      if (adminPassword === "admin1234") {
        setShowPasswords(true);
        setShowAuthModal(false);
        setAdminPassword("");
      } else {
        setAuthError("Contraseña incorrecta");
      }
      setAuthLoading(false);
    }, 500);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setAdminPassword("");
    setAuthError(null);
  };

  const adminUsuarios = USUARIOS.filter(u => u.rol === "admin");
  const sucursalUsuarios = USUARIOS.filter(u => u.rol === "sucursal");

  // Agrupar usuarios de sucursal por sucursal
  const usuariosPorSucursal = sucursalUsuarios.reduce((acc, user) => {
    const sucursal = user.sucursal || "Sin sucursal";
    if (!acc[sucursal]) {
      acc[sucursal] = [];
    }
    acc[sucursal].push(user);
    return acc;
  }, {} as Record<string, Usuario[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-emerald-600" />
            Usuarios
          </h1>
          <p className="text-neutral-600 mt-1">
            Gestión de credenciales del sistema
          </p>
        </div>

        <Button
          variant={showPasswords ? "danger" : "primary"}
          onClick={() => showPasswords ? setShowPasswords(false) : handleRequestViewPasswords()}
        >
          {showPasswords ? (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar contraseñas
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Ver contraseñas
            </>
          )}
        </Button>
      </div>

      {/* Alerta de seguridad */}
      {showPasswords && (
        <Alert variant="warning">
          <Lock className="h-4 w-4" />
          <div>
            <strong>Contraseñas visibles</strong>
            <p className="text-xs mt-0.5">Las contraseñas están siendo mostradas. Asegurate de que nadie más esté viendo tu pantalla.</p>
          </div>
        </Alert>
      )}

      {/* Administradores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <CardTitle>Administradores</CardTitle>
          </div>
          <CardDescription>
            Usuarios con acceso completo al sistema
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
                    <div className="text-sm text-neutral-600">Acceso completo al sistema</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500 mb-1">Contraseña</div>
                  <div className={clsx(
                    "font-mono px-3 py-1.5 rounded-lg",
                    showPasswords 
                      ? "bg-white border border-emerald-300 text-neutral-900" 
                      : "bg-neutral-200 text-neutral-400"
                  )}>
                    {showPasswords ? user.password : "••••••••"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Usuarios de sucursal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <CardTitle>Usuarios de Sucursales</CardTitle>
          </div>
          <CardDescription>
            Usuarios con acceso limitado a su sucursal
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {Object.entries(usuariosPorSucursal).map(([sucursal, users]) => (
              <div key={sucursal}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
                  <Building2 className="h-4 w-4 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">{sucursal}</h3>
                  <span className="text-xs text-neutral-500">({users.length} {users.length === 1 ? 'usuario' : 'usuarios'})</span>
                </div>
                <div className="space-y-3">
                  {users.map((user, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-300 transition-colors"
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
                          <div className="text-sm text-neutral-600">Acceso a {user.sucursal}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500 mb-1">Contraseña</div>
                        <div className={clsx(
                          "font-mono px-3 py-1.5 rounded-lg",
                          showPasswords 
                            ? "bg-primary-50 border border-primary-300 text-neutral-900" 
                            : "bg-neutral-200 text-neutral-400"
                        )}>
                          {showPasswords ? user.password : "••••••••"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Modal de autenticación */}
      <Modal open={showAuthModal} onClose={handleCloseAuthModal}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-center mb-2 text-neutral-900">
            Verificación de seguridad
          </h3>
          <p className="text-center text-neutral-600 mb-6">
            Ingresá la contraseña de administrador para ver las contraseñas del sistema
          </p>

          {authError && (
            <Alert variant="error" className="mb-4">
              {authError}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña de administrador
              </label>
              <Input
                type="password"
                placeholder="Ingresá tu contraseña"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && adminPassword) {
                    handleVerifyPassword();
                  }
                }}
              />
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={handleCloseAuthModal} disabled={authLoading}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleVerifyPassword}
            disabled={!adminPassword || authLoading}
            loading={authLoading}
          >
            <CheckCircle className="h-4 w-4" />
            Verificar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
