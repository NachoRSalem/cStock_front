// src/pages/Home.tsx
import { Navigate } from "react-router-dom";
import { tokenStorage } from "../utils/storage";

export default function Home() {
  const role = tokenStorage.getRole();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "sucursal") return <Navigate to="/sucursal" replace />;
  return <Navigate to="/login" replace />;
}
