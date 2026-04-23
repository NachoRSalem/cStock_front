import { useEffect, useRef, useState } from "react";
import { createVenta, type VentaItemCreate } from "../api/sales";
import { listStock, type Stock } from "../api/stock";
import { listProductos, type Producto } from "../api/products";
import { tokenStorage } from "../utils/storage";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardBody, 
  Button, 
  Modal,
  Alert,
  Badge,
  ProductAutocomplete,
} from "../components/ui";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Search, 
  DollarSign, 
  Package, 
  MapPin,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import clsx from 'clsx';

// ─── Helpers de vencimiento ──────────────────────────────────────────────────

function vencimientoEstado(diasParaVencer: number | null) {
  if (diasParaVencer === null) return null;
  if (diasParaVencer <= 0) return "vencido";
  if (diasParaVencer <= 7) return "critico";
  if (diasParaVencer <= 30) return "proximo";
  return "vigente";
}

function vencimientoBadgeVariant(estado: string | null): "default" | "draft" | "pending" | "approved" | "danger" {
  if (estado === "vencido") return "danger";
  if (estado === "critico") return "draft";
  if (estado === "proximo") return "pending";
  return "approved";
}

function vencimientoTexto(diasParaVencer: number | null, fechaVencimiento: string | null) {
  if (diasParaVencer === null || !fechaVencimiento) return null;
  
  if (diasParaVencer <= 0) {
    const diasVencido = Math.abs(diasParaVencer);
    return `⚠️ Vencido hace ${diasVencido}d`;
  }
  
  if (diasParaVencer <= 7) {
    return `⏰ Vence en ${diasParaVencer}d`;
  }
  
  if (diasParaVencer <= 30) {
    return `⏳ ${diasParaVencer}d`;
  }
  
  const fecha = new Date(fechaVencimiento);
  return `✓ ${fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}`;
}

type CartItem = {
  producto: number;
  producto_nombre: string;
  sub_ubicacion_origen: number;
  sub_ubicacion_nombre: string;
  cantidad: number;
  precio_venta_momento: number;
  stock_disponible: number;
  lote: string | null;
  fecha_vencimiento: string | null;
  dias_para_vencer: number | null;
};

type ScanSelectionState = {
  producto: Producto;
  opciones: Stock[];
  codigo: string;
};

export default function Sales() {
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [productosCache, setProductosCache] = useState<Record<number, Producto>>({});
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanInfo, setScanInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Modal de recibo
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ id: number; items: CartItem[]; total: number } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [scanSelection, setScanSelection] = useState<ScanSelectionState | null>(null);
  const [showScanSelectionModal, setShowScanSelectionModal] = useState(false);

  const session = tokenStorage.getSession();
  const sucursal = tokenStorage.getSucursal();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const stockData = await listStock({ ubicacion: sucursal ?? undefined, solo_con_stock: true });
      setStock(stockData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  const getStockForProduct = (productoId: number): Stock[] => {
    return stock.filter(s => s.producto === productoId);
  };

  const getCartUsedForStockItem = (stockItem: Stock): number => {
    return cart
      .filter(item =>
        item.producto === stockItem.producto &&
        item.sub_ubicacion_origen === stockItem.sub_ubicacion &&
        item.lote === stockItem.lote
      )
      .reduce((sum, item) => sum + item.cantidad, 0);
  };

  const getAvailableForStockItem = (stockItem: Stock): number => {
    const used = getCartUsedForStockItem(stockItem);
    return Math.max(0, stockItem.cantidad - used);
  };

  const getAvailableStockItemsForScan = (productoId: number): Stock[] => {
    return getStockForProduct(productoId)
      .filter((s) => getAvailableForStockItem(s) > 0)
      .sort((a, b) => {
        if (a.dias_para_vencer === null && b.dias_para_vencer === null) return 0;
        if (a.dias_para_vencer === null) return 1;
        if (b.dias_para_vencer === null) return -1;
        return a.dias_para_vencer - b.dias_para_vencer;
      });
  };

  const addToCart = (producto: Producto, stockItem: Stock) => {
    setProductosCache((prev) => ({ ...prev, [producto.id]: producto }));

    const existingItem = cart.find(
      item => item.producto === producto.id && 
             item.sub_ubicacion_origen === stockItem.sub_ubicacion &&
             item.lote === stockItem.lote
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.producto === producto.id && 
        item.sub_ubicacion_origen === stockItem.sub_ubicacion &&
        item.lote === stockItem.lote
          ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stock_disponible) }
          : item
      ));
    } else {
      setCart([...cart, {
        producto: producto.id,
        producto_nombre: producto.nombre,
        sub_ubicacion_origen: stockItem.sub_ubicacion,
        sub_ubicacion_nombre: stockItem.sub_ubicacion_nombre,
        cantidad: 1,
        precio_venta_momento: parseFloat(producto.precio_venta),
        stock_disponible: stockItem.cantidad,
        lote: stockItem.lote,
        fecha_vencimiento: stockItem.fecha_vencimiento,
        dias_para_vencer: stockItem.dias_para_vencer,
      }]);
    }
  };

  const addToCartByBarcode = (rawCode: string) => {
    void addToCartByBarcodeAsync(rawCode);
  };

  const addToCartByBarcodeAsync = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    setErr(null);
    setScanInfo(null);

    const matches = await listProductos({ search: code, limit: 20 });
    const producto = matches.find((p) => (p.sku ?? "").trim().toLowerCase() === code.toLowerCase());
    if (!producto) {
      setErr(`No se encontró producto para el código: ${code}`);
      return;
    }

    const opciones = getAvailableStockItemsForScan(producto.id);
    if (opciones.length === 0) {
      setErr(`Sin stock disponible para ${producto.nombre}`);
      return;
    }

    // Si hay más de una opción de lote/sub-ubicación, el vendedor debe elegir manualmente.
    if (opciones.length > 1) {
      setScanSelection({ producto, opciones, codigo: code });
      setShowScanSelectionModal(true);
      return;
    }

    const stockItem = opciones[0];

    addToCart(producto, stockItem);
    setScanInfo(`Escaneado: ${producto.nombre}`);
  };

  const getProductoForStock = (productoId: number): Producto | null => {
    if (selectedProduct?.id === productoId) return selectedProduct;
    return productosCache[productoId] ?? null;
  };

  const handleSelectScanStockOption = (stockId: number) => {
    if (!scanSelection) return;

    const selected = scanSelection.opciones.find((opt) => opt.id === stockId);
    if (!selected) return;

    addToCart(scanSelection.producto, selected);
    setScanInfo(`Escaneado: ${scanSelection.producto.nombre} (${selected.sub_ubicacion_nombre}${selected.lote ? ` - Lote ${selected.lote}` : ""})`);
    setShowScanSelectionModal(false);
    setScanSelection(null);
    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  };

  const closeScanSelectionModal = () => {
    setShowScanSelectionModal(false);
    setScanSelection(null);
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSubmit = () => {
    const code = barcodeInput.trim();
    if (!code) return;
    addToCartByBarcode(code);
    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  };

  const updateCartItemQuantity = (index: number, cantidad: number) => {
    const item = cart[index];
    const newCantidad = Math.max(1, Math.min(cantidad, item.stock_disponible));
    setCart(cart.map((it, i) => i === index ? { ...it, cantidad: newCantidad } : it));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalVenta = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_venta_momento), 0);

  const handleSale = () => {
    if (cart.length === 0) {
      setErr("Agregá al menos un producto al carrito");
      return;
    }

    if (!sucursal) {
      setErr("No se pudo determinar la sucursal");
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const confirmSale = async () => {
    setBusy(true);
    setErr(null);
    setShowConfirmModal(false);
    
    try {
      const items: VentaItemCreate[] = cart.map(item => ({
        producto: item.producto,
        sub_ubicacion_origen: item.sub_ubicacion_origen,
        cantidad: item.cantidad,
        precio_venta_momento: item.precio_venta_momento.toString()
      }));

      const result = await createVenta({ sucursal: sucursal!, items });
      
      // Mostrar recibo
      setReceiptData({
        id: result.id,
        items: [...cart],
        total: totalVenta
      });
      setShowReceipt(true);

      // Limpiar carrito y recargar datos
      setCart([]);
      await loadData();
    } catch (e: any) {
      setErr(e?.message ?? "Error registrando venta");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-neutral-300 mx-auto mb-4 animate-pulse" />
          <p className="text-neutral-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Registro de Ventas</h1>
        <p className="text-neutral-600 mt-1">
          Seleccioná productos y registrá ventas
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Escáner por código de barras */}
          <Card>
            <CardBody>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Lector de código de barras (SKU)
                  </label>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Escaneá el código y presioná Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeSubmit();
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleBarcodeSubmit}
                  className="w-full sm:w-auto"
                >
                  Cargar por código
                </Button>
              </div>
              {scanInfo && (
                <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {scanInfo}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Buscador */}
          <Card>
            <CardBody>
              <ProductAutocomplete
                value={selectedProduct?.id ?? null}
                selectedName={selectedProduct?.nombre ?? ""}
                onSelect={(product) => {
                  setSelectedProduct(product);
                  if (product) {
                    setProductosCache((prev) => ({ ...prev, [product.id]: product }));
                  }
                }}
                placeholder="Buscar producto por nombre o SKU..."
              />
            </CardBody>
          </Card>

          {/* Lista de productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Disponibles</CardTitle>
              <CardDescription>
                Seleccioná un producto para ver sus lotes/sub-ubicaciones disponibles
              </CardDescription>
            </CardHeader>
            <CardBody className="p-0">
              {!selectedProduct ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Buscá y seleccioná un producto</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {(() => {
                    const producto = selectedProduct;
                    const stockItems = getStockForProduct(producto.id);
                    const totalStock = stockItems.reduce((sum, s) => sum + s.cantidad, 0);

                    if (totalStock === 0) {
                      return (
                        <div className="text-center py-12">
                          <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                          <p className="text-neutral-500">El producto seleccionado no tiene stock disponible</p>
                        </div>
                      );
                    }

                    return (
                      <div key={producto.id} className="p-4 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-900">{producto.nombre}</h3>
                            {producto.sku && (
                              <p className="text-sm text-neutral-500">SKU: {producto.sku}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-emerald-600">
                              ${parseFloat(producto.precio_venta).toFixed(2)}
                            </p>
                            <p className="text-sm text-neutral-500">Stock: {totalStock}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {stockItems
                            .sort((a, b) => {
                              if (a.dias_para_vencer === null) return 1;
                              if (b.dias_para_vencer === null) return -1;
                              return a.dias_para_vencer - b.dias_para_vencer;
                            })
                            .map((stockItem) => {
                              const estado = vencimientoEstado(stockItem.dias_para_vencer);
                              const textoVenc = vencimientoTexto(stockItem.dias_para_vencer, stockItem.fecha_vencimiento);
                              const isVencidoOCritico = estado === "vencido" || estado === "critico";

                              return (
                                <button
                                  key={stockItem.id}
                                  onClick={() => addToCart(producto, stockItem)}
                                  className={clsx(
                                    "flex flex-col items-start gap-1 px-3 py-2 rounded-lg transition-colors text-sm border-2",
                                    isVencidoOCritico
                                      ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                                      : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                                  )}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <MapPin className="h-4 w-4" />
                                    <span>{stockItem.sub_ubicacion_nombre}</span>
                                    <span className="font-semibold">({stockItem.cantidad})</span>
                                    <Plus className="h-3.5 w-3.5 ml-auto" />
                                  </div>
                                  {textoVenc && (
                                    <div className="flex items-center gap-1 text-xs">
                                      {isVencidoOCritico && <AlertCircle className="h-3 w-3" />}
                                      <span>{textoVenc}</span>
                                    </div>
                                  )}
                                  {stockItem.lote && (
                                    <div className="text-xs opacity-75">
                                      Lote: {stockItem.lote}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-700" />
                <CardTitle>Carrito</CardTitle>
              </div>
              <CardDescription>
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </CardDescription>
            </CardHeader>
            <CardBody className="flex flex-col" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <>
                  {/* Lista de productos con scroll */}
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 24rem)' }}>
                    {cart.map((item, index) => {
                      const estado = vencimientoEstado(item.dias_para_vencer);
                      const textoVenc = vencimientoTexto(item.dias_para_vencer, item.fecha_vencimiento);
                      
                      return (
                        <div key={index} className="p-3 bg-neutral-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900 text-sm">{item.producto_nombre}</p>
                              <div className="flex flex-col gap-1 mt-1">
                                <p className="text-xs text-neutral-500 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.sub_ubicacion_nombre}
                                </p>
                                {textoVenc && (
                                  <Badge 
                                    variant={vencimientoBadgeVariant(estado)}
                                    className="text-xs w-fit"
                                  >
                                    {textoVenc}
                                  </Badge>
                                )}
                                {item.lote && (
                                  <p className="text-xs text-neutral-400">Lote: {item.lote}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItemQuantity(index, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-neutral-300 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-12 text-center border border-neutral-300 rounded py-1 text-sm"
                              min="1"
                              max={item.stock_disponible}
                            />
                            <button
                              onClick={() => updateCartItemQuantity(index, item.cantidad + 1)}
                              disabled={item.cantidad >= item.stock_disponible}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-neutral-300 rounded text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-neutral-900">
                            ${(item.cantidad * item.precio_venta_momento).toFixed(2)}
                          </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total y botón de confirmación - siempre visible */}
                  <div className="border-t border-neutral-200 mt-4 pt-4 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-neutral-900">Total</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        ${totalVenta.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleSale}
                      disabled={busy}
                      loading={busy}
                      className="w-full"
                    >
                      <DollarSign className="h-5 w-5" />
                      {busy ? "Procesando..." : "Registrar Venta"}
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">
            Confirmar Venta
          </h2>
          <p className="text-center text-neutral-600 mb-6">
            Revisá los detalles antes de registrar la venta
          </p>

          {/* Detalle de items */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-neutral-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{item.producto_nombre}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {item.sub_ubicacion_nombre}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {item.cantidad} × ${item.precio_venta_momento.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-neutral-900 text-lg">
                    ${(item.cantidad * item.precio_venta_momento).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-300 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-neutral-900">Total</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${totalVenta.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {err && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{err}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={confirmSale}
              loading={busy}
              disabled={busy}
              className="flex-1"
            >
              <DollarSign className="h-5 w-5" />
              Confirmar Venta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de selección de lote/sub-ubicación para escaneo */}
      <Modal open={showScanSelectionModal} onClose={closeScanSelectionModal}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Seleccionar origen del producto</h2>
          <p className="text-sm text-neutral-600 mb-4">
            El código {scanSelection?.codigo} corresponde a {scanSelection?.producto.nombre}. Elegí de qué sub-ubicación/lote se tomó.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {scanSelection?.opciones.map((opcion) => {
              const disponible = getAvailableForStockItem(opcion);
              const textoVenc = vencimientoTexto(opcion.dias_para_vencer, opcion.fecha_vencimiento);

              return (
                <button
                  key={opcion.id}
                  onClick={() => handleSelectScanStockOption(opcion.id)}
                  className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-neutral-900">{opcion.sub_ubicacion_nombre}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {opcion.lote ? `Lote: ${opcion.lote}` : "Sin lote"}
                        {textoVenc ? ` • ${textoVenc}` : ""}
                      </div>
                    </div>
                    <Badge variant="approved">Disponible: {disponible}</Badge>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={closeScanSelectionModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de recibo */}
      <Modal open={showReceipt} onClose={() => setShowReceipt(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-neutral-900 mb-2">
            ¡Venta Registrada!
          </h2>
          <p className="text-center text-neutral-600 mb-6">
            Venta #{receiptData?.id}
          </p>

          {/* Detalle de items */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-neutral-900 mb-3">Detalle de productos</h3>
            <div className="space-y-2">
              {receiptData?.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{item.producto_nombre}</p>
                    <p className="text-xs text-neutral-500">
                      {item.cantidad} x ${item.precio_venta_momento.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-900">
                    ${(item.cantidad * item.precio_venta_momento).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-300 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-neutral-900">Total</span>
                <span className="text-2xl font-bold text-emerald-600">
                  ${receiptData?.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowReceipt(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowReceipt(false);
                // Aquí podrías agregar funcionalidad de impresión
              }}
              className="flex-1"
            >
              Nueva Venta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
