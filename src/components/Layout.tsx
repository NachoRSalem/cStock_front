import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { tokenStorage } from "../utils/storage";
import { useState, useMemo, useEffect } from "react";
import { listPedidos } from "../api/orders";
import clsx from "clsx";
import {
  Home,
  MapPin,
  Package,
  FileText,
  CheckSquare,
  ShoppingCart,
  BarChart3,
  Users,
  Warehouse,
  ClipboardCheck,
  TruckIcon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Array<"admin" | "sucursal">;
};

function NavLink({
  to,
  label,
  icon,
  roleType,
  onClick,
  collapsed,
  badge,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  roleType?: "admin" | "sucursal" | "shared";
  onClick?: () => void;
  collapsed?: boolean;
  badge?: number;
}) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative",
        collapsed && "justify-center",
        active
          ? roleType === "admin"
            ? "bg-emerald-500 text-white shadow-sm"
            : roleType === "sucursal"
            ? "bg-primary-500 text-white shadow-sm"
            : "bg-neutral-100 text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      <span className={clsx("flex-shrink-0", active ? "text-white" : "text-neutral-500 group-hover:text-neutral-700")}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className={clsx(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
              active 
                ? "bg-white text-neutral-900"
                : "bg-red-500 text-white"
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export function Layout() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  const role = tokenStorage.getRole();
  const username = tokenStorage.getUsername();
  const sucursal = tokenStorage.getSucursal();
  const session = tokenStorage.getSession();

  // Cargar pedidos pendientes
  useEffect(() => {
    async function loadPendientes() {
      try {
        const pedidos = await listPedidos();
        
        if (role === "admin") {
          // Admin: contar pedidos pendientes (enviados a revisión)
          const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
          setPedidosPendientes(pendientes);
        } else if (role === "sucursal") {
          // Sucursal: contar pedidos aprobados destinados a esta sucursal
          const aprobados = pedidos.filter(p => 
            p.estado === "aprobado" && p.destino === session?.sucursal
          ).length;
          setPedidosPendientes(aprobados);
        }
      } catch (err) {
        // Ignorar errores silenciosamente
        console.error("Error loading pedidos:", err);
      }
    }

    loadPendientes();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadPendientes, 30000);
    
    return () => clearInterval(interval);
  }, [role, session?.sucursal]);

  const navItems: NavItem[] = useMemo(
    () => [
      { to: "/", label: "Inicio", icon: <Home className="h-5 w-5" />, roles: ["admin", "sucursal"] },

      // Admin
      { to: "/admin/locations", label: "Sucursales", icon: <MapPin className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/stock", label: "Stock Global", icon: <Warehouse className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/products", label: "Productos", icon: <Package className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/orders", label: "Pedidos", icon: <FileText className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/sales", label: "Ventas", icon: <ShoppingCart className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/reports", label: "Reportes", icon: <BarChart3 className="h-5 w-5" />, roles: ["admin"] },
      { to: "/admin/users", label: "Usuarios", icon: <Users className="h-5 w-5" />, roles: ["admin"] },

      // Sucursal
      { to: "/sucursal/stock", label: "Mi stock", icon: <Warehouse className="h-5 w-5" />, roles: ["sucursal"] },
      { to: "/sucursal/orders", label: "Mis pedidos", icon: <ClipboardCheck className="h-5 w-5" />, roles: ["sucursal"] },
      { to: "/sucursal/sales", label: "Registrar venta", icon: <ShoppingCart className="h-5 w-5" />, roles: ["sucursal"] },
      { to: "/sucursal/ventas", label: "Mis ventas", icon: <BarChart3 className="h-5 w-5" />, roles: ["sucursal"] },
    ],
    []
  );

  const visibleItems = navItems.filter((it) => !it.roles || (role ? it.roles.includes(role) : true));

  function logout() {
    tokenStorage.clear();
    nav("/login");
  }

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            GS
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Gestión Stock</h1>
              <p className="text-xs text-neutral-500">Sistema de logística</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className={clsx("h-5 w-5 text-neutral-500 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="h-5 w-5 text-neutral-500" />
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="px-4 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="space-y-1 text-sm">
            {username && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Usuario:</span>
                <span className="font-medium text-neutral-900">{username}</span>
              </div>
            )}
            {role && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Rol:</span>
                <span className={clsx("px-2 py-0.5 rounded-md text-xs font-medium", role === "admin" ? "bg-emerald-100 text-emerald-700" : "bg-primary-100 text-primary-700")}>
                  {role === "admin" ? "Administrador" : "Sucursal"}
                </span>
              </div>
            )}
            {role === "sucursal" && sucursal && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Sucursal:</span>
                <span className="font-medium text-neutral-900">{sucursal}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleItems.map((it) => {
          let type: "admin" | "sucursal" | "shared" = "shared";

          if (it.roles?.includes("admin") && !it.roles?.includes("sucursal")) {
            type = "admin";
          } else if (it.roles?.includes("sucursal") && !it.roles?.includes("admin")) {
            type = "sucursal";
          }

          // Agregar badge a los links de pedidos
          const isPedidosLink = it.to === "/admin/orders" || it.to === "/sucursal/orders";
          const badge = isPedidosLink ? pedidosPendientes : undefined;

          return (
            <NavLink
              key={it.to}
              to={it.to}
              label={it.label}
              icon={it.icon}
              roleType={type}
              onClick={closeMobileSidebar}
              collapsed={sidebarCollapsed}
              badge={badge}
            />
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100">
        <button
          onClick={logout}
          title={sidebarCollapsed ? "Cerrar sesión" : undefined}
          className={clsx(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-colors",
            sidebarCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 z-30",
          sidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 flex lg:hidden flex-col bg-white border-r border-neutral-200 w-72 z-50 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-neutral-700" />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-neutral-900">
              {username ? `Hola, ${username}` : "Sistema de Gestión"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-neutral-700">En línea</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
