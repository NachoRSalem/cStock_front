import { tokenStorage } from "../utils/storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const JSON_HEADERS = { "Content-Type": "application/json" };

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };

  const session = tokenStorage.getSession();
  if (!session) return null;

  //  Actualiza SOLO el access y conserva rol/sucursal/username/refresh
  tokenStorage.setSession({ ...session, access: data.access });

  return data.access;
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
    fetch(`${API_BASE}${path}`, {
      method,
      headers: h,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

  const res = await makeReq(headers);

  // si token expira, refresh 1 vez
  if (auth && (res.status === 401 || res.status === 403)) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      tokenStorage.clear();
      throw new Error("Sesión expirada. Volvé a iniciar sesión.");
    }

    const retryHeaders = { ...headers, Authorization: `Bearer ${newAccess}` };
    const retry = await makeReq(retryHeaders);

    if (!retry.ok) {
      const t = await retry.text();
      throw new Error(t || `HTTP ${retry.status}`);
    }

    return (await retry.json()) as T;
  }

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}
