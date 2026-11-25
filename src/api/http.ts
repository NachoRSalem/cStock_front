import { tokenStorage } from "../utils/storage";

let rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";
if (rawBase && !rawBase.startsWith("http://") && !rawBase.startsWith("https://")) {
  rawBase = `https://${rawBase}`;
}
const API_BASE = rawBase.replace(/\/$/, "");
const JSON_HEADERS = { "Content-Type": "application/json" };

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const NETWORK_ERROR = "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.";

/** Convierte el cuerpo de error de DRF (JSON) en un texto legible. */
function readableError(raw: string, status: number): string {
  if (!raw) return `Error ${status}`;
  try {
    const data = JSON.parse(raw);
    if (typeof data === "string") return data;
    if (data?.detail) return String(data.detail);
    if (data?.error) return String(data.error);
    const parts: string[] = [];
    for (const [field, value] of Object.entries(data ?? {})) {
      const msg = Array.isArray(value) ? value.join(" ") : String(value);
      parts.push(field === "non_field_errors" ? msg : `${field}: ${msg}`);
    }
    if (parts.length) return parts.join(" · ");
  } catch {
    /* no era JSON (por ejemplo una página HTML de error) */
  }
  return status >= 500 ? "Error interno del servidor. Intentá de nuevo en unos minutos." : raw;
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(NETWORK_ERROR);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ refresh }),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };

  const session = tokenStorage.getSession();
  if (!session) return null;

  // Actualiza SOLO el access y conserva rol/sucursal/username/refresh
  tokenStorage.setSession({ ...session, access: data.access });

  return data.access;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(readableError(await res.text(), res.status));
  }
  // 204 No Content o sin cuerpo
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }
  return (await res.json()) as T;
}

export async function apiFetch<T>(
  path: string,
  opts: { method?: Method; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const method = opts.method ?? "GET";
  const auth = opts.auth ?? true;

  const headers: Record<string, string> = { ...JSON_HEADERS };

  if (auth) {
    const access = tokenStorage.getAccess();
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  const makeReq = (h: Record<string, string>) =>
    request(`${API_BASE}${path}`, {
      method,
      headers: h,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

  const res = await makeReq(headers);

  // Login: un 401 acá significa credenciales incorrectas, no sesión vencida.
  if (!auth && res.status === 401) {
    throw new Error("Usuario o contraseña incorrectos.");
  }

  // si el token expira, refresh 1 vez
  if (auth && (res.status === 401 || res.status === 403)) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      tokenStorage.clear();
      // Sesión vencida: volver al login en lugar de dejar la pantalla con errores.
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
      throw new Error("Sesión expirada. Volvé a iniciar sesión.");
    }

    const retry = await makeReq({ ...headers, Authorization: `Bearer ${newAccess}` });
    return parse<T>(retry);
  }

  return parse<T>(res);
}
