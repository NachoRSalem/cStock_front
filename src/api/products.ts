import productosMock from "../mock-data/productos.json";

export type Categoria = {
  id: number;
  nombre: string;
};

export type TipoConservacion = "ambiente" | "heladera" | "freezer";

export type Producto = {
  id: number;
  nombre: string;
  categoria: number;
  categoria_nombre: string;
  tipo_conservacion: TipoConservacion;
  precio_venta: string;
  costo_compra: string;
  sku: string | null;
  dias_caducidad: number | null;
  es_fabricable: boolean;
};

export type ProductoCreateUpdate = {
  nombre: string;
  categoria: number;
  tipo_conservacion: TipoConservacion;
  precio_venta: string | number;
  costo_compra: string | number;
  sku?: string | null;
  dias_caducidad?: number | null;
  es_fabricable?: boolean;
};

export type CategoriaCreateUpdate = {
  nombre: string;
};

const categoriasMock: Categoria[] = [
  { id: 1, nombre: "Facturas" },
  { id: 2, nombre: "Panes" },
  { id: 3, nombre: "Sandwiches" },
  { id: 4, nombre: "Bocaditos" },
  { id: 5, nombre: "Tortas" },
  { id: 6, nombre: "Insumos" },
];

let productosData = [...productosMock] as Producto[];

export function listProductos(params?: { tipo_conservacion?: string; categoria?: number; search?: string }) {
  let filtered = [...productosData];

  if (params?.tipo_conservacion) {
    filtered = filtered.filter((p) => p.tipo_conservacion === params.tipo_conservacion);
  }

  if (params?.categoria) {
    filtered = filtered.filter((p) => p.categoria === params.categoria);
  }

  if (params?.search) {
    filtered = filtered.filter((p) =>
      p.nombre.toLowerCase().includes(params.search!.toLowerCase())
    );
  }

  return Promise.resolve(filtered);
}

export function getProducto(id: number) {
  const producto = productosData.find((p) => p.id === id);
  if (!producto) {
    return Promise.reject(new Error("Producto no encontrado"));
  }
  return Promise.resolve(producto);
}

export function createProducto(body: ProductoCreateUpdate) {
  const newProducto: Producto = {
    id: Math.max(...productosData.map((p) => p.id)) + 1,
    nombre: body.nombre,
    categoria: body.categoria,
    categoria_nombre:
      categoriasMock.find((c) => c.id === body.categoria)?.nombre || "Sin categoría",
    tipo_conservacion: body.tipo_conservacion,
    precio_venta: String(body.precio_venta),
    costo_compra: String(body.costo_compra),
    sku: body.sku || null,
    dias_caducidad: body.dias_caducidad || null,
    es_fabricable: body.es_fabricable || false,
  };
  productosData.push(newProducto);
  return Promise.resolve(newProducto);
}

export function updateProducto(id: number, body: ProductoCreateUpdate) {
  const index = productosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Producto no encontrado"));
  }
  const updated: Producto = {
    ...productosData[index],
    nombre: body.nombre || productosData[index].nombre,
    categoria: body.categoria || productosData[index].categoria,
    categoria_nombre:
      categoriasMock.find((c) => c.id === (body.categoria || productosData[index].categoria))
        ?.nombre || productosData[index].categoria_nombre,
    tipo_conservacion: body.tipo_conservacion || productosData[index].tipo_conservacion,
    precio_venta: body.precio_venta
      ? String(body.precio_venta)
      : productosData[index].precio_venta,
    costo_compra: body.costo_compra
      ? String(body.costo_compra)
      : productosData[index].costo_compra,
    sku: body.sku !== undefined ? body.sku : productosData[index].sku,
    dias_caducidad: body.dias_caducidad ?? productosData[index].dias_caducidad,
    es_fabricable: body.es_fabricable ?? productosData[index].es_fabricable,
  };
  productosData[index] = updated;
  return Promise.resolve(updated);
}

export function deleteProducto(id: number) {
  const index = productosData.findIndex((p) => p.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Producto no encontrado"));
  }
  productosData.splice(index, 1);
  return Promise.resolve(undefined);
}

export function listCategorias() {
  return Promise.resolve(categoriasMock);
}

export function createCategoria(body: CategoriaCreateUpdate) {
  const newCategoria: Categoria = {
    id: Math.max(...categoriasMock.map((c) => c.id)) + 1,
    nombre: body.nombre,
  };
  categoriasMock.push(newCategoria);
  return Promise.resolve(newCategoria);
}

export function updateCategoria(id: number, body: CategoriaCreateUpdate) {
  const index = categoriasMock.findIndex((c) => c.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Categoría no encontrada"));
  }
  categoriasMock[index] = { ...categoriasMock[index], ...body };
  return Promise.resolve(categoriasMock[index]);
}

export function deleteCategoria(id: number) {
  const index = categoriasMock.findIndex((c) => c.id === id);
  if (index === -1) {
    return Promise.reject(new Error("Categoría no encontrada"));
  }
  categoriasMock.splice(index, 1);
  return Promise.resolve(undefined);
}