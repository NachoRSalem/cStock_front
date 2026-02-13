// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { tokenStorage } from "../utils/storage";

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
    <div className="auth">
      <div className="auth__card card">
        <div className="card__header">
          <h2 className="page__title">Ingresar</h2>
          <p className="page__subtitle">Accedé con tu usuario y contraseña.</p>
        </div>

        <div className="card__body">
          <form onSubmit={onSubmit} className="form">
            <div className="field">
              <label className="label">Usuario</label>
              <input
                className="input"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Contraseña</label>
              <input
                className="input"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="btn btn--primary" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {err && <pre className="alert alert--error">{err}</pre>}
          </form>
        </div>
      </div>
    </div>
  );
}
