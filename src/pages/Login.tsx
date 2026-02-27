import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { tokenStorage } from "../utils/storage";
import { Button, Input, Alert } from "../components/ui";
import { LogIn, Package } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 text-white mb-4 shadow-lg">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Gestión de Stock</h1>
          <p className="text-neutral-600">Sistema de logística y pedidos</p>
        </div>

        {/* Login Card */}
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
