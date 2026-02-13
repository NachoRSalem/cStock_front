import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";

import Login from "./pages/Login";

// Home decide si vas a admin o sucursal
import Home from "./pages/Home";

// Dashboards por rol
import AdminDashboard from "./pages/AdminDashboard";
import BranchDashboard from "./pages/BranchDashboard";

// Páginas existentes (reutilizamos)
import Locations from "./pages/Locations";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";

// Nuevas (placeholders útiles)
import OrdersApprovals from "./pages/OrdersApprovals";
import Receive from "./pages/Receive";
import Users from "./pages/Users";
import Stock from "./pages/Stock";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <Layout />, // ✅ DEV: sin ProtectedRoute
    children: [
      // "/" -> redirige según rol
      { index: true, element: <Home /> },

      // ===== ADMIN =====
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/locations", element: <Locations /> },
      { path: "admin/orders", element: <Orders /> },
      { path: "admin/orders/aprobaciones", element: <OrdersApprovals /> },
      { path: "admin/sales", element: <Sales /> },
      { path: "admin/reports", element: <Reports /> },
      { path: "admin/users", element: <Users /> },

      // ===== SUCURSAL =====
      { path: "sucursal", element: <BranchDashboard /> },
      { path: "sucursal/stock", element: <Stock /> },
      { path: "sucursal/orders", element: <Orders /> },
      { path: "sucursal/receive", element: <Receive /> },
      { path: "sucursal/sales", element: <Sales /> },

      // Alias viejo
      { path: "locations", element: <Locations /> },
      { path: "orders", element: <Orders /> },
      { path: "envios", element: <Orders /> },
      { path: "sales", element: <Sales /> },
      { path: "reports", element: <Reports /> },

      // 404
      { path: "*", element: <NotFound /> },
    ],
  },
]);
