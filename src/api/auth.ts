import usuariosMock from "../mock-data/usuarios.json";

export type TokenResponse = {
  refresh: string;
  access: string;
  rol: "admin" | "sucursal";
  sucursal: number | null;
  username: string;
};

export function login(username: string, password: string) {
  const user = usuariosMock.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return Promise.reject(new Error("Invalid credentials"));
  }
  return Promise.resolve({
    refresh: "mock-refresh-token",
    access: "mock-access-token",
    rol: user.rol as "admin" | "sucursal",
    sucursal: user.sucursal,
    username: user.username,
  });
}