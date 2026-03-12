// src/pages/Products.tsx
import { useEffect, useState } from "react";
import { 
  listProductos, 
  listCategorias, 
  createProducto, 
  updateProducto, 
  deleteProducto,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  type Producto, 
  type Categoria,
  type ProductoCreateUpdate,
  type CategoriaCreateUpdate
} from "../api/products";
import { listSucursales, type Sucursal } from "../api/locations";
import { listStock, updateStock, createStock, type Stock } from "../api/stock";
import { tokenStorage } from "../utils/storage";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardBody, 
  Button, 
  Badge, 
  Input, 
  Modal, 
  ModalFooter,
  PageLoader,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ConfirmDialog
} from "../components/ui";
import { Plus, Edit2, Trash2, Package, Tag, Thermometer, Refrigerator, Snowflake, Search, DollarSign, Filter, PackagePlus } from "lucide-react";
import clsx from 'clsx';

type TabType = "productos" | "categorias";

export default function Products() {
  const session = tokenStorage.getSession();
  const isAdmin = session?.rol === "admin";
  
  const [tab, setTab] = useState<TabType>("productos");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  
  // Formulario producto
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [productForm, setProductForm] = useState<ProductoCreateUpdate>({
    nombre: "",
    categoria: 0,
    tipo_conservacion: "ambiente",
    precio_venta: "",
    costo_compra: "",
    sku: "",
    dias_caducidad: null
  });
  
  // Formulario categoría
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState<CategoriaCreateUpdate>({ nombre: "" });

  // Estados para ConfirmDialogs
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState(false);
  const [showDeleteCatConfirm, setShowDeleteCatConfirm] = useState(false);
  const [deleteProductData, setDeleteProductData] = useState<{ id: number; nombre: string } | null>(null);
  const [deleteCatData, setDeleteCatData] = useState<{ id: number; nombre: string } | null>(null);

  // Estados para modal de actualizar stock
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Producto | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedSucursalForStock, setSelectedSucursalForStock] = useState<number | null>(null);
  const [stockItems, setStockItems] = useState<Stock[]>([]);
  const [stockUpdates, setStockUpdates] = useState<Record<number, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const [prodData, catData] = await Promise.all([
        listProductos({ search: searchTerm || undefined }),
        listCategorias()
      ]);
      setProductos(prodData);
      setCategorias(catData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  // Filtrado local de productos
  const filteredProducts = productos.filter(p => {
    if (filterCategoria !== "all" && p.categoria.toString() !== filterCategoria) return false;
    if (filterTipo !== "all" && p.tipo_conservacion !== filterTipo) return false;
    return true;
  });

  function openProductForm(product?: Producto) {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        nombre: product.nombre,
        categoria: product.categoria,
        tipo_conservacion: product.tipo_conservacion,
        precio_venta: product.precio_venta,
        costo_compra: product.costo_compra,
        sku: product.sku || "",
        dias_caducidad: product.dias_caducidad
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        nombre: "",
        categoria: categorias[0]?.id || 0,
        tipo_conservacion: "ambiente",
        precio_venta: "",
        costo_compra: "",
        sku: "",
        dias_caducidad: null
      });
    }
    setShowProductForm(true);
  }

  function closeProductForm() {
    setShowProductForm(false);
    setEditingProduct(null);
  }

  async function handleSaveProduct() {
    if (!productForm.nombre || !productForm.categoria) {
      setErr("Completá todos los campos obligatorios");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id, productForm);
      } else {
        await createProducto(productForm);
      }
      await loadData();
      closeProductForm();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando producto");
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteProduct(id: number, nombre: string) {
    setDeleteProductData({ id, nombre });
    setShowDeleteProductConfirm(true);
  }

  async function confirmDeleteProduct() {
    if (!deleteProductData) return;
    
    setBusy(true);
    setErr(null);
    setShowDeleteProductConfirm(false);
    try {
      await deleteProducto(deleteProductData.id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando producto");
    } finally {
      setBusy(false);
      setDeleteProductData(null);
    }
  }

  function openCatForm(cat?: Categoria) {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ nombre: cat.nombre });
    } else {
      setEditingCat(null);
      setCatForm({ nombre: "" });
    }
    setShowCatForm(true);
  }

  function closeCatForm() {
    setShowCatForm(false);
    setEditingCat(null);
  }

  async function handleSaveCat() {
    if (!catForm.nombre) {
      setErr("El nombre es obligatorio");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      if (editingCat) {
        await updateCategoria(editingCat.id, catForm);
      } else {
        await createCategoria(catForm);
      }
      await loadData();
      closeCatForm();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando categoría");
    } finally {
      setBusy(false);
    }
  }

  function handleDeleteCat(id: number, nombre: string) {
    setDeleteCatData({ id, nombre });
    setShowDeleteCatConfirm(true);
  }

  async function confirmDeleteCat() {
    if (!deleteCatData) return;
    
    setBusy(true);
    setErr(null);
    setShowDeleteCatConfirm(false);
    try {
      await deleteCategoria(deleteCatData.id);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando categoría. Puede que tenga productos asociados.");
    } finally {
      setBusy(false);
      setDeleteCatData(null);
    }
  }

  // Funciones para modal de stock
  async function openStockModal(product: Producto) {
    setSelectedProductForStock(product);
    setShowStockModal(true);
    setSelectedSucursalForStock(null);
    setStockItems([]);
    setStockUpdates({});
    
    // Cargar sucursales
    try {
      const sucursalesData = await listSucursales();
      setSucursales(sucursalesData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando sucursales");
    }
  }

  function closeStockModal() {
    setShowStockModal(false);
    setSelectedProductForStock(null);
    setSelectedSucursalForStock(null);
    setStockItems([]);
    setStockUpdates({});
  }

  async function handleSucursalChange(sucursalId: number) {
    setSelectedSucursalForStock(sucursalId);
    setStockUpdates({});
    
    if (!selectedProductForStock) return;
    
    // Cargar stock del producto en esa sucursal
    try {
      const stockData = await listStock({
        producto: selectedProductForStock.id,
        ubicacion: sucursalId
      });
      setStockItems(stockData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando stock");
    }
  }

  function handleStockQuantityChange(subUbicacionId: number, newQuantity: number) {
    if (newQuantity < 0) return;
    setStockUpdates(prev => ({
      ...prev,
      [subUbicacionId]: newQuantity
    }));
  }

  async function handleSaveStock() {
    if (!selectedProductForStock || !selectedSucursalForStock) return;
    
    setBusy(true);
    setErr(null);
    
    try {
      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Procesar cada cambio de stock
      for (const [subUbicacionId, newQuantity] of Object.entries(stockUpdates)) {
        const existingStock = stockItems.find(s => s.sub_ubicacion === parseInt(subUbicacionId));
        
        if (existingStock) {
          // Actualizar stock existente
          await updateStock(existingStock.id, { cantidad: newQuantity });
        } else {
          // Crear nuevo registro de stock
          const createBody: any = {
            producto: selectedProductForStock.id,
            sub_ubicacion: parseInt(subUbicacionId),
            cantidad: newQuantity
          };
          
          // Si el producto tiene días de caducidad, agregar fecha_ingreso y generar lote
          if (selectedProductForStock.dias_caducidad) {
            createBody.fecha_ingreso = today;
            createBody.lote = `LOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          await createStock(createBody);
        }
      }
      
      closeStockModal();
      // Opcional: recargar la tabla si muestras stock en ella
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando stock");
    } finally {
      setBusy(false);
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ambiente":
        return <Thermometer className="h-4 w-4" />;
      case "heladera":
        return <Refrigerator className="h-4 w-4" />;
      case "freezer":
        return <Snowflake className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTipoBadgeVariant = (tipo: string): "default" | "draft" | "pending" | "approved" => {
    switch (tipo) {
      case "ambiente":
        return "approved";
      case "heladera":
        return "pending";
      case "freezer":
        return "draft";
      default:
        return "default";
    }
  };

  if (loading) {
    return <PageLoader message="Cargando productos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Gestión de Productos</h1>
        <p className="text-sm text-neutral-500 mt-1">Administración de productos y categorías</p>
      </div>

      {/* Alert de errores */}
      {err && <Alert variant="error">{err}</Alert>}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setTab("productos")}
          className={clsx(
            "flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors",
            tab === "productos"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
          )}
        >
          <Package className="h-4 w-4" />
          Productos
          <Badge variant="default">{productos.length}</Badge>
        </button>
        <button
          onClick={() => setTab("categorias")}
          className={clsx(
            "flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors",
            tab === "categorias"
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
          )}
        >
          <Tag className="h-4 w-4" />
          Categorías
          <Badge variant="default">{categorias.length}</Badge>
        </button>
      </div>

      {/* TAB: PRODUCTOS */}
      {tab === "productos" && (
        <div className="space-y-6">
          {!showProductForm && (
            <Button onClick={() => openProductForm()} size="lg">
              <Plus className="h-5 w-5" />
              Registrar nuevo producto
            </Button>
          )}

          {/* Modal Formulario crear/editar producto */}
          <Modal
            open={showProductForm}
            onClose={closeProductForm}
            title={editingProduct ? "Editar producto" : "Nuevo producto"}
            description="Completá los datos del producto"
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  required
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  placeholder="Ej: Coca Cola 500ml"
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => setProductForm({ ...productForm, categoria: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipo de conservación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={productForm.tipo_conservacion}
                    onChange={(e) => setProductForm({ ...productForm, tipo_conservacion: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="ambiente">🌡️ Temperatura Ambiente</option>
                    <option value="heladera">❄️ Heladera</option>
                    <option value="freezer">🧊 Freezer</option>
                  </select>
                </div>

                <Input
                  label="SKU / Código de barras"
                  value={productForm.sku || ""}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="Opcional"
                />

                <Input
                  label="Días de caducidad"
                  type="number"
                  value={productForm.dias_caducidad || ""}
                  onChange={(e) => setProductForm({ ...productForm, dias_caducidad: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Ej: 90 días = 3 meses"
                  helperText="Días desde la compra hasta el vencimiento (opcional)"
                />

                <Input
                  label="Precio de venta"
                  type="number"
                  step="0.01"
                  required
                  value={productForm.precio_venta}
                  onChange={(e) => setProductForm({ ...productForm, precio_venta: e.target.value })}
                  placeholder="0.00"
                />

                <Input
                  label="Costo de compra"
                  type="number"
                  step="0.01"
                  required
                  value={productForm.costo_compra}
                  onChange={(e) => setProductForm({ ...productForm, costo_compra: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={closeProductForm} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct} loading={busy}>
                {editingProduct ? "Guardar cambios" : "Crear producto"}
              </Button>
            </ModalFooter>
          </Modal>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary-600" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Buscar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre..."
                  onKeyDown={(e) => e.key === "Enter" && loadData()}
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="all">Todas</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
                  >
                    <option value="all">Todos</option>
                    <option value="ambiente">Ambiente</option>
                    <option value="heladera">Heladera</option>
                    <option value="freezer">Freezer</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button onClick={loadData} className="w-full">
                    <Search className="h-4 w-4" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Lista de productos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>{filteredProducts.length} productos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">No hay productos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-right">Precio Venta</TableHead>
                        <TableHead className="text-right">Costo</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((prod) => (
                        <TableRow key={prod.id}>
                          <TableCell>
                            <div className="font-medium text-neutral-900">{prod.nombre}</div>
                            {prod.sku && (
                              <div className="text-xs text-neutral-500 mt-0.5">SKU: {prod.sku}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{prod.categoria_nombre}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getTipoBadgeVariant(prod.tipo_conservacion)}>
                              <div className="flex items-center gap-1.5">
                                {getTipoIcon(prod.tipo_conservacion)}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 font-semibold text-emerald-600">
                              <DollarSign className="h-3 w-3" />
                              {parseFloat(prod.precio_venta).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-neutral-600">
                            ${parseFloat(prod.costo_compra).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openProductForm(prod)}
                                disabled={busy}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openStockModal(prod)}
                                  disabled={busy}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Actualizar Stock"
                                >
                                  <PackagePlus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                                disabled={busy}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB: CATEGORÍAS */}
      {tab === "categorias" && (
        <div className="space-y-6">
          {!showCatForm && (
            <Button onClick={() => openCatForm()} size="lg">
              <Plus className="h-5 w-5" />
              Crear nueva categoría
            </Button>
          )}

          {/* Modal Formulario crear/editar categoría */}
          <Modal
            open={showCatForm}
            onClose={closeCatForm}
            title={editingCat ? "Editar categoría" : "Nueva categoría"}
            description="Ingresá el nombre de la categoría"
            size="md"
          >
            <div className="space-y-4">
              <Input
                label="Nombre"
                required
                value={catForm.nombre}
                onChange={(e) => setCatForm({ nombre: e.target.value })}
                placeholder="Ej: Bebidas, Golosinas, Snacks..."
              />
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={closeCatForm} disabled={busy}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCat} loading={busy}>
                {editingCat ? "Guardar cambios" : "Crear categoría"}
              </Button>
            </ModalFooter>
          </Modal>

          {/* Lista de categorías */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Categorías</CardTitle>
                <CardDescription>{categorias.length} categorías</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {categorias.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">No hay categorías</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Tag className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="font-medium text-lg text-neutral-900">{cat.nombre}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openCatForm(cat)}
                          disabled={busy}
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCat(cat.id, cat.nombre)}
                          disabled={busy}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showDeleteProductConfirm}
        onClose={() => {
          setShowDeleteProductConfirm(false);
          setDeleteProductData(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Eliminar producto"
        message={`¿Eliminar el producto "${deleteProductData?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />

      <ConfirmDialog
        open={showDeleteCatConfirm}
        onClose={() => {
          setShowDeleteCatConfirm(false);
          setDeleteCatData(null);
        }}
        onConfirm={confirmDeleteCat}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${deleteCatData?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={busy}
      />

      {/* Modal de Actualizar Stock */}
      <Modal
        open={showStockModal}
        onClose={closeStockModal}
        title={`Actualizar Stock - ${selectedProductForStock?.nombre || ""}`}
        description="Seleccioná una sucursal y actualizá el stock en sus sub-ubicaciones"
        size="lg"
      >
        <div className="space-y-4">
          {/* Selector de sucursal */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sucursal / Almacén
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={selectedSucursalForStock || ""}
              onChange={(e) => handleSucursalChange(parseInt(e.target.value))}
              disabled={busy}
            >
              <option value="">Seleccionar sucursal...</option>
              {sucursales.map((suc) => (
                <option key={suc.id} value={suc.id}>
                  {suc.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Aviso sobre caducidad */}
          {selectedProductForStock?.dias_caducidad && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-900">
                  <strong>Producto con caducidad:</strong> Este producto tiene configurado un tiempo de caducidad de {selectedProductForStock.dias_caducidad} días. 
                  Al agregar nuevo stock, se registrará automáticamente la fecha de ingreso para el control de vencimientos.
                </div>
              </div>
            </div>
          )}

          {/* Lista de sub-ubicaciones con stock */}
          {selectedSucursalForStock && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                <h3 className="font-medium text-neutral-900">Sub-ubicaciones</h3>
              </div>
              <div className="divide-y divide-neutral-100">
                {sucursales
                  .find((s) => s.id === selectedSucursalForStock)
                  ?.sub_ubicaciones.map((subUbic) => {
                    const existingStock = stockItems.find(
                      (s) => s.sub_ubicacion === subUbic.id
                    );
                    const currentQuantity = stockUpdates[subUbic.id] ?? existingStock?.cantidad ?? 0;

                    // Información de vencimiento
                    const hasExpiration = existingStock?.fecha_vencimiento;
                    const diasParaVencer = existingStock?.dias_para_vencer ?? null;
                    const isExpiringSoon = diasParaVencer !== null && diasParaVencer <= 30 && diasParaVencer > 0;
                    const isExpired = diasParaVencer !== null && diasParaVencer <= 0;

                    return (
                      <div
                        key={subUbic.id}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-neutral-100 rounded-lg">
                            {subUbic.tipo === "ambiente" && <Thermometer className="h-5 w-5 text-amber-600" />}
                            {subUbic.tipo === "heladera" && <Refrigerator className="h-5 w-5 text-blue-600" />}
                            {subUbic.tipo === "freezer" && <Snowflake className="h-5 w-5 text-cyan-600" />}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{subUbic.nombre}</div>
                            <div className="text-xs text-neutral-500 capitalize">{subUbic.tipo}</div>
                            {hasExpiration && (
                              <div className="text-xs mt-1">
                                {isExpired && (
                                  <span className="text-red-600 font-medium">⚠️ Vencido</span>
                                )}
                                {isExpiringSoon && !isExpired && (
                                  <span className="text-orange-600 font-medium">⏰ Vence en {diasParaVencer} días</span>
                                )}
                                {!isExpired && !isExpiringSoon && diasParaVencer !== null && (
                                  <span className="text-green-600">✓ Vence en {diasParaVencer} días</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-neutral-600">
                            Stock actual: <span className="font-semibold">{existingStock?.cantidad || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStockQuantityChange(subUbic.id, Math.max(0, currentQuantity - 1))
                              }
                              disabled={busy || currentQuantity <= 0}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={currentQuantity}
                              onChange={(e) =>
                                handleStockQuantityChange(subUbic.id, parseInt(e.target.value) || 0)
                              }
                              className="w-20 text-center"
                              min="0"
                              disabled={busy}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStockQuantityChange(subUbic.id, currentQuantity + 1)
                              }
                              disabled={busy}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {!selectedSucursalForStock && (
            <div className="text-center py-8 text-neutral-500">
              Seleccioná una sucursal para ver sus sub-ubicaciones
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={closeStockModal} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveStock}
            loading={busy}
            disabled={!selectedSucursalForStock || Object.keys(stockUpdates).length === 0}
          >
            Guardar Stock
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
