import { tokenStorage } from "../utils/storage";
import { Card, CardBody, CardHeader, CardTitle, Badge } from "../components/ui";
import {
  Warehouse,
  ClipboardCheck,
  TruckIcon,
  ShoppingCart,
  CheckSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function BranchDashboard() {
  const sucursal = tokenStorage.getSucursal();
  const username = tokenStorage.getUsername();

  const features = [
    {
      icon: <Warehouse className="h-5 w-5" />,
      title: "Mi Stock",
      description: "Ver inventario disponible en tu sucursal",
      link: "/sucursal/stock",
      color: "primary",
    },
    {
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Mis Pedidos",
      description: "Gestionar pedidos de mercadería",
      link: "/sucursal/orders",
      color: "blue",
    },
    {
      icon: <TruckIcon className="h-5 w-5" />,
      title: "Recibir Pedido",
      description: "Confirmar recepción de mercadería",
      link: "/sucursal/receive",
      color: "orange",
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Registrar Venta",
      description: "Registrar nueva transacción de venta",
      link: "/sucursal/sales",
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Panel Sucursal
          </h1>
          <p className="text-neutral-600 mt-1">
            Bienvenido, <span className="font-medium">{username}</span>
          </p>
        </div>
        {sucursal && (
          <Badge variant="info" className="self-start sm:self-center">
            Sucursal ID: {sucursal}
          </Badge>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {features.map((feature) => (
          <Link key={feature.link} to={feature.link}>
            <Card hover className="h-full transition-all hover:border-primary-300">
              <CardBody>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-100`}
                >
                  <span className={`text-${feature.color}-600`}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-600">{feature.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Funciones de Sucursal</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>Ver y gestionar el stock de tu sucursal</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>Crear y enviar pedidos de mercadería</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>Confirmar recepción de pedidos aprobados</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>Registrar ventas realizadas</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
