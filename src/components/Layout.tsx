import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { tokenStorage } from "../utils/storage";
import { useMemo } from "react";

type NavItem = { to: string; label: string; roles?: Array<"admin" | "sucursal"> };

function NavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation();

  // ✅ Activo si coincide exacto o si estás "dentro" de esa sección
  const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));

  return (
    <Link to={to} className={active ? "sidebar__link sidebar__link--active" : "sidebar__link"}>
      {label}
    </Link>
  );
}

export function Layout() {
  const nav = useNavigate();

  const role = tokenStorage.getRole(); // "admin" | "sucursal" | null
  const username = tokenStorage.getUsername();
  const sucursal = tokenStorage.getSucursal();

  const navItems: NavItem[] = useMemo(
    () => [
      { to: "/", label: "Inicio", roles: ["admin", "sucursal"] },

      // Admin
      { to: "/admin/locations", label: "Sucursales", roles: ["admin"] },
      { to: "/admin/orders", label: "Pedidos", roles: ["admin"] },
      { to: "/admin/orders/aprobaciones", label: "Aprobar pedidos", roles: ["admin"] },
      { to: "/admin/sales", label: "Ventas", roles: ["admin"] },
      { to: "/admin/reports", label: "Reportes", roles: ["admin"] },
      { to: "/admin/users", label: "Usuarios", roles: ["admin"] },

      // Sucursal
      { to: "/sucursal/stock", label: "Mi stock", roles: ["sucursal"] },
      { to: "/sucursal/orders", label: "Mis pedidos", roles: ["sucursal"] },
      { to: "/sucursal/receive", label: "Recibir pedido", roles: ["sucursal"] },
      { to: "/sucursal/sales", label: "Registrar venta", roles: ["sucursal"] },
    ],
    []
  );

  // ✅ si no hay rol (dev), mostramos todo (o podrías mostrar un menú básico)
  const visibleItems = navItems.filter((it) => !it.roles || (role ? it.roles.includes(role) : true));

  function logout() {
    tokenStorage.clear();
    nav("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="sidebar__title">Gestión Stock</div>

          <div className="sidebar__meta">
            {username ? (
              <>
                <div>
                  Usuario: <span className="mono">{username}</span>
                </div>
                <div>
                  Rol: <span className="mono">{role ?? "-"}</span>
                </div>
                {role === "sucursal" && (
                  <div>
                    Sucursal: <span className="mono">{sucursal ?? "-"}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="muted">Sin sesión</div>
            )}
          </div>
        </div>

        <nav className="sidebar__nav">
          {visibleItems.map((it) => (
            <NavLink key={it.to} to={it.to} label={it.label} />
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="btn btn--danger" onClick={logout}>
            Salir
          </button>

          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Tip: para dev, podés navegar directo a las rutas.
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
