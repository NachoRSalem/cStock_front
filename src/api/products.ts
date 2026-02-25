import { apiFetch } from "./http";

export type Categoria = {
  id: number;
  nombre: string;
};

export type Producto = {
  id: number;
  nombre: string;
  categoria: number;
  categoria_nombre: string;
  tipo_conservacion: "ambiente" | "heladera" | "freezer";
  precio_venta: string;
  costo_compra: string;
  sku: string | null;
};

export type ProductoCreateUpdate = {
  nombre: string;
  categoria: number;
  tipo_conservacion: "ambiente" | "heladera" | "freezer";
  precio_venta: string | number;
  costo_compra: string | number;
  sku?: string | null;
};

export type CategoriaCreateUpdate = {
  nombre: string;
};

export function listProductos(params?: { tipo_conservacion?: string; categoria?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.tipo_conservacion) query.set("tipo_conservacion", params.tipo_conservacion);
  if (params?.categoria) query.set("categoria", params.categoria.toString());
  if (params?.search) query.set("search", params.search);
  
  const queryString = query.toString();
  return apiFetch<Producto[]>(`/api/products/productos/${queryString ? "?" + queryString : ""}`);
}

export function getProducto(id: number) {
  return apiFetch<Producto>(`/api/products/productos/${id}/`);
}

export function createProducto(body: ProductoCreateUpdate) {
  return apiFetch<Producto>("/api/products/productos/", { method: "POST", body });
}

export function updateProducto(id: number, body: ProductoCreateUpdate) {
  return apiFetch<Producto>(`/api/products/productos/${id}/`, { method: "PUT", body });
}

export function deleteProducto(id: number) {
  return apiFetch<void>(`/api/products/productos/${id}/`, { method: "DELETE" });
}

export function listCategorias() {
  return apiFetch<Categoria[]>("/api/products/categorias/");
}

export function createCategoria(body: CategoriaCreateUpdate) {
  return apiFetch<Categoria>("/api/products/categorias/", { method: "POST", body });
}

export function updateCategoria(id: number, body: CategoriaCreateUpdate) {
  return apiFetch<Categoria>(`/api/products/categorias/${id}/`, { method: "PUT", body });
}

export function deleteCategoria(id: number) {
  return apiFetch<void>(`/api/products/categorias/${id}/`, { method: "DELETE" });
}
