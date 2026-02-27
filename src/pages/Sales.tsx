import { useEffect, useState } from "react";
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
  ModalFooter,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
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
  X
} from "lucide-react";
import clsx from 'clsx';

type CartItem = {
  producto: number;
  producto_nombre: string;
  sub_ubicacion_origen: number;
  sub_ubicacion_nombre: string;
  cantidad: number;
  precio_venta_momento: number;
  stock_disponible: number;
};

export default function Sales() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Modal de recibo
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ id: number; items: CartItem[]; total: number } | null>(null);

  const session = tokenStorage.getSession();
  const sucursal = tokenStorage.getSucursal();
  const isAdmin = session?.rol === "admin";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const [productosData, stockData] = await Promise.all([
        listProductos(),
        listStock({ ubicacion: sucursal ?? undefined, solo_con_stock: true })
      ]);
      setProductos(productosData);
      setStock(stockData);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockForProduct = (productoId: number): Stock[] => {
    return stock.filter(s => s.producto === productoId);
  };

  const addToCart = (producto: Producto, stockItem: Stock) => {
    const existingItem = cart.find(
      item => item.producto === producto.id && item.sub_ubicacion_origen === stockItem.sub_ubicacion
    );

    if (existingItem) {
      setCart(cart.map(item =>
        item.producto === producto.id && item.sub_ubicacion_origen === stockItem.sub_ubicacion
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
        stock_disponible: stockItem.cantidad
      }]);
    }
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

  const handleSale = async () => {
    if (cart.length === 0) {
      setErr("Agregá al menos un producto al carrito");
      return;
    }

    if (!sucursal) {
      setErr("No se pudo determinar la sucursal");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const items: VentaItemCreate[] = cart.map(item => ({
        producto: item.producto,
        sub_ubicacion_origen: item.sub_ubicacion_origen,
        cantidad: item.cantidad,
        precio_venta_momento: item.precio_venta_momento.toString()
      }));

      const result = await createVenta({ sucursal, items });
      
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
        <h1 className="text-3xl font-bold text-gray-900">Registro de Ventas</h1>
        <p className="text-gray-600 mt-1">
          Seleccioná productos y registrá ventas
        </p>
      </div>

      {err && <Alert variant="error">{err}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Buscador */}
          <Card>
            <CardBody>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardBody>
          </Card>

          {/* Lista de productos */}
          <Card>
            <CardHeader>
              <CardTitle>Productos Disponibles</CardTitle>
              <CardDescription>
                Hacé clic en un producto para agregarlo al carrito
              </CardDescription>
            </CardHeader>
            <CardBody className="p-0">
              {filteredProductos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">No se encontraron productos</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredProductos.map((producto) => {
                    const stockItems = getStockForProduct(producto.id);
                    const totalStock = stockItems.reduce((sum, s) => sum + s.cantidad, 0);

                    if (totalStock === 0) return null;

                    return (
                      <div key={producto.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>
                            {producto.sku && (
                              <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-emerald-600">
                              ${parseFloat(producto.precio_venta).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">Stock: {totalStock}</p>
                          </div>
                        </div>

                        {/* Sub-ubicaciones disponibles */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {stockItems.map((stockItem) => (
                            <button
                              key={stockItem.id}
                              onClick={() => addToCart(producto, stockItem)}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                            >
                              <MapPin className="h-4 w-4" />
                              <span>{stockItem.sub_ubicacion_nombre}</span>
                              <span className="font-semibold">({stockItem.cantidad})</span>
                              <Plus className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
            <CardBody>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.producto_nombre}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {item.sub_ubicacion_nombre}
                          </p>
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
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => updateCartItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-12 text-center border border-gray-300 rounded py-1 text-sm"
                            min="1"
                            max={item.stock_disponible}
                          />
                          <button
                            onClick={() => updateCartItemQuantity(index, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stock_disponible}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-gray-900">
                          ${(item.cantidad * item.precio_venta_momento).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
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
                      {busy ? "Procesando..." : "Confirmar Venta"}
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal de recibo */}
      <Modal open={showReceipt} onClose={() => setShowReceipt(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            ¡Venta Registrada!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Venta #{receiptData?.id}
          </p>

          {/* Detalle de items */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Detalle de productos</h3>
            <div className="space-y-2">
              {receiptData?.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.producto_nombre}</p>
                    <p className="text-xs text-gray-500">
                      {item.cantidad} x ${item.precio_venta_momento.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(item.cantidad * item.precio_venta_momento).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 mt-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
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
