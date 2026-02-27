import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardBody } from "../components/ui";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">
          Vista general del sistema de gestión de stock
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card hover className="overflow-hidden">
          <CardBody className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Productos</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">248</p>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs mes anterior
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Ventas del Mes</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">1,453</p>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% vs mes anterior
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Pedidos Activos</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">23</p>
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  5 pendientes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Completados Hoy</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">18</p>
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  100% a tiempo
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a
              href="/admin/products"
              className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
            >
              <Package className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div>
                <p className="font-medium text-neutral-900">Gestionar Productos</p>
                <p className="text-xs text-neutral-500">Ver y editar inventario</p>
              </div>
            </a>

            <a
              href="/admin/orders"
              className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
            >
              <FileText className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div>
                <p className="font-medium text-neutral-900">Ver Pedidos</p>
                <p className="text-xs text-neutral-500">Revisar pedidos activos</p>
              </div>
            </a>

            <a
              href="/admin/sales"
              className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
            >
              <ShoppingCart className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div>
                <p className="font-medium text-neutral-900">Registrar Ventas</p>
                <p className="text-xs text-neutral-500">Nueva transacción</p>
              </div>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
