import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";

import Login from "./pages/Login";

import Home from "./pages/Home";

import AdminDashboard from "./pages/AdminDashboard";
import BranchDashboard from "./pages/BranchDashboard";

import Locations from "./pages/Locations";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";

import OrdersApprovals from "./pages/OrdersApprovals";
import Receive from "./pages/Receive";
import Users from "./pages/Users";
import Stock from "./pages/Stock";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <Layout />, //
    children: [
      // "/" -> redirige según rol
      { index: true, element: <Home /> },

      // ADMIN 
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/locations", element: <Locations /> },
      { path: "admin/orders", element: <Orders /> },
      { path: "admin/orders/aprobaciones", element: <OrdersApprovals /> },
      { path: "admin/sales", element: <Sales /> },
      { path: "admin/reports", element: <Reports /> },
      { path: "admin/users", element: <Users /> },

      // SUCURSAL
      { path: "sucursal", element: <BranchDashboard /> },
      { path: "sucursal/stock", element: <Stock /> },
      { path: "sucursal/orders", element: <Orders /> },
      { path: "sucursal/receive", element: <Receive /> },
      { path: "sucursal/sales", element: <Sales /> },



      // 404
      { path: "*", element: <NotFound /> },
    ],
  },
]);
