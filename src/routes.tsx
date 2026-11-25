import { createBrowserRouter, Outlet } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";

import Login from "./pages/Login";

import Home from "./pages/Home";

import AdminDashboard from "./pages/AdminDashboard";
import BranchDashboard from "./pages/BranchDashboard";

import Locations from "./pages/Locations";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import AdminSalesView from "./pages/AdminSalesView";
import SucursalSalesView from "./pages/SucursalSalesView";
import Products from "./pages/Products";
import Manufacture from "./pages/Manufacture";
import ManufactureHistory from "./pages/ManufactureHistory";

import Users from "./pages/Users";
import Stock from "./pages/Stock";
import AdminStockView from "./pages/AdminStockView";
import Ingresos from "./pages/Ingresos";
import Viandas from "./pages/Viandas";
import ConsumoCocina from "./pages/ConsumoCocina";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // "/" -> redirige según rol
      { index: true, element: <Home /> },

      // ADMIN
      {
        path: "admin",
        element: (
          <ProtectedRoute role="admin">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "locations", element: <Locations /> },
          { path: "stock", element: <AdminStockView /> },
          { path: "orders", element: <Orders /> },
          { path: "sales", element: <AdminSalesView /> },
          { path: "reports", element: <Reports /> },
          { path: "users", element: <Users /> },
          { path: "ingresos", element: <Ingresos /> },
          { path: "products", element: <Products /> },
          { path: "viandas", element: <Viandas /> },
          { path: "manufacture", element: <Manufacture /> },
          { path: "manufacture-history", element: <ManufactureHistory /> },
          { path: "consumo-cocina", element: <ConsumoCocina /> },
        ],
      },

      // SUCURSAL
      {
        path: "sucursal",
        element: (
          <ProtectedRoute role="sucursal">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <BranchDashboard /> },
          { path: "stock", element: <Stock /> },
          { path: "orders", element: <Orders /> },
          { path: "sales", element: <Sales /> },
          { path: "ventas", element: <SucursalSalesView /> },
          { path: "manufacture", element: <Manufacture /> },
          { path: "manufacture-history", element: <ManufactureHistory /> },
          { path: "consumo-cocina", element: <ConsumoCocina /> },
        ],
      },

      // 404
      { path: "*", element: <NotFound /> },
    ],
  },
]);
