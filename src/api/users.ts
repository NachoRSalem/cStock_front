import { apiFetch } from "./http";

export type UsuarioListado = {
  id: number;
  username: string;
  rol: "admin" | "sucursal";
  is_active: boolean;
  sucursal_asignada: number | null;
  sucursal_nombre: string | null;
  cuenta_pareada_username: string | null;
};

export function listUsuarios() {
  return apiFetch<UsuarioListado[]>("/api/users/");
}
