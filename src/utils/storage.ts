const SESSION_KEY = "session";

export type SessionData = {
  access: string;
  refresh: string;
  rol: "admin" | "sucursal";
  sucursal: number | null;
  username: string;
};

export const tokenStorage = {
  getSession(): SessionData | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  getAccess(): string | null {
    return this.getSession()?.access ?? null;
  },

  getRefresh(): string | null {
    return this.getSession()?.refresh ?? null;
  },

  getRole(): "admin" | "sucursal" | null {
    return this.getSession()?.rol ?? null;
  },

  getSucursal(): number | null {
    return this.getSession()?.sucursal ?? null;
  },

  getUsername(): string | null {
    return this.getSession()?.username ?? null;
  },

  setSession(session: SessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  clear() {
    localStorage.removeItem(SESSION_KEY);
  },
};
