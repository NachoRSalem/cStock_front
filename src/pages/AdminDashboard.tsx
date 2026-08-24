import { Card, CardBody, CardHeader, CardTitle } from "../components/ui";
import {
  Building2,
  FileText,
  CheckSquare,
  BarChart3,
  Users,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const features = [
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Gestión de Sucursales",
      description: "Administrar sucursales y sub-ubicaciones del sistema",
      link: "/admin/locations",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: "Productos y Categorías",
      description: "Gestionar catálogo de productos y sus categorías",
      link: "/admin/products",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Gestión de Pedidos",
      description: "Ver y administrar todos los pedidos del sistema",
      link: "/admin/orders",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      title: "Aprobar Pedidos",
      description: "Revisar y aprobar pedidos pendientes",
      link: "/admin/orders",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Reportes y Estadísticas",
      description: "Ver reportes económicos y comparativos",
      link: "/admin/reports",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Usuarios del Sistema",
      description: "Administrar usuarios y permisos",
      link: "/admin/users",
      iconBg: "bg-neutral-100",
      iconColor: "text-neutral-600",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Panel Administrador
        </h1>
        <p className="text-neutral-600 mt-1">
          Acceso completo a todas las funcionalidades del sistema
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {features.map((feature) => (
          <Link key={feature.link} to={feature.link}>
            <Card hover className="h-full transition-all hover:border-primary-300">
              <CardBody>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.iconBg}`}>
                  <span className={feature.iconColor}>{feature.icon}</span>
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
          <CardTitle>Capacidades del Administrador</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Ver stock, pedidos y ventas de todas las sucursales</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Aprobar o rechazar pedidos de mercadería</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Generar reportes económicos comparativos</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Administrar usuarios y permisos del sistema</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
