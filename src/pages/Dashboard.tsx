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
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 lg:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600 sm:text-base">
          Vista general del sistema de gestión de stock
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Card hover className="overflow-hidden">
          <CardBody className="relative p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-600 sm:text-sm">Total Productos</p>
                <p className="mt-2 break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">248</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +12% vs mes anterior
                </p>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 sm:h-12 sm:w-12">
                <Package className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-600 sm:text-sm">Ventas del Mes</p>
                <p className="mt-2 break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">1,453</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  +8% vs mes anterior
                </p>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:h-12 sm:w-12">
                <ShoppingCart className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-600 sm:text-sm">Pedidos Activos</p>
                <p className="mt-2 break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">23</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  5 pendientes
                </p>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 sm:h-12 sm:w-12">
                <FileText className="h-5 w-5 text-orange-600 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="overflow-hidden">
          <CardBody className="relative p-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-600 sm:text-sm">Completados Hoy</p>
                <p className="mt-2 break-words text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">18</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  100% a tiempo
                </p>
              </div>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
                <CheckCircle className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="/admin/products"
              className="group flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/50"
            >
              <Package className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div className="min-w-0">
                <p className="font-medium text-neutral-900 break-words">Gestionar Productos</p>
                <p className="text-xs text-neutral-500">Ver y editar inventario</p>
              </div>
            </a>

            <a
              href="/admin/orders"
              className="group flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/50"
            >
              <FileText className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">Ver Pedidos</p>
                <p className="text-xs text-neutral-500">Revisar pedidos activos</p>
              </div>
            </a>

            <a
              href="/admin/sales"
              className="group flex items-start gap-3 rounded-xl border border-neutral-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/50"
            >
              <ShoppingCart className="h-5 w-5 text-neutral-600 group-hover:text-primary-600" />
              <div className="min-w-0">
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
