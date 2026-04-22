import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { tokenStorage } from "../utils/storage";
import { Button, Input, Alert } from "../components/ui";
import { LogIn, Package, Users, AlertCircle } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const session = await login(username, password);
      tokenStorage.setSession(session);
      nav("/");
    } catch (e: any) {
      setErr(e?.message ?? "Error de login");
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    setShowWelcome(false);
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
          <div className="bg-gradient-to-r from-primary-500 to-emerald-500 p-6 rounded-t-2xl">
            <div className="flex items-center gap-3 text-white">
              <Package className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-bold">Sistema de Gestión de Stock</h2>
                <p className="text-primary-100 text-sm">Demo de Portfolio</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                Esta es una <strong>versión de prueba</strong> del sistema. 
                Todos los datos son ficticios y con fines de demostración.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Credenciales de Prueba
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <span className="text-neutral-500">Usuario Admin:</span>
                  <div className="font-mono font-semibold text-neutral-900">admin / admin123</div>
                  <span className="text-xs text-neutral-500">(Accede al panel de administración)</span>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <span className="text-neutral-500">Usuario Sucursal:</span>
                  <div className="font-mono font-semibold text-neutral-900">sucursal / paso123</div>
                  <span className="text-xs text-neutral-500">(Accede a Sucursal Norte)</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-500 text-center pt-2">
              Explorá todas las funcionalidades: Stock, Pedidos, Ventas, Reportes, etc.
            </p>
          </div>

          <div className="p-4 border-t border-neutral-100">
            <Button onClick={handleStart} className="w-full" size="lg">
              Comenzar a Explorar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 text-white mb-4 shadow-lg">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Gestión de Stock</h1>
          <p className="text-neutral-600">Sistema de logística y pedidos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft-xl border border-neutral-100 p-8 animate-slide-up">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Iniciar Sesión</h2>
            <p className="text-sm text-neutral-500">Ingresá con tu usuario y contraseña</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <Input
              label="Usuario"
              placeholder="Ingresá tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Contraseña"
              placeholder="Ingresá tu contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {err && (
              <Alert variant="error" className="animate-fade-in">
                {err}
              </Alert>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={!username || !password}
              className="w-full"
              size="lg"
            >
              <LogIn className="h-5 w-5" />
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-center text-xs text-neutral-500">
              Sistema de gestión de stock © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}