import { apiFetch } from "./http";

export type TokenResponse = {
  refresh: string;
  access: string;
  rol: "admin" | "sucursal";
  sucursal: number | null;
  username: string;
  cuenta_pareada: string | null;
};

export function login(username: string, password: string) {
  return apiFetch<TokenResponse>("/api/token/", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

export function switchAccount(refresh: string) {
  return apiFetch<TokenResponse>("/api/users/switch/", {
    method: "POST",
    body: { refresh },
    auth: true,
  });
}
