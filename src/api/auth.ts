import { apiFetch } from "./http";

export type TokenResponse = {
  refresh: string;
  access: string;
  rol: "admin" | "sucursal";
  sucursal: number | null;
  username: string;
};

export function login(username: string, password: string) {
  return apiFetch<TokenResponse>("/api/token/", {
    method: "POST",
    body: { username, password },
    auth: false, // 🔐 login no necesita token
  });
}
