import { Navigate } from "react-router-dom";
import { tokenStorage } from "../utils/storage";

type Props = {
  children: React.ReactNode;
  /** Si se indica, solo ese rol puede ver la ruta; el resto vuelve al inicio. */
  role?: "admin" | "sucursal";
};

export function ProtectedRoute({ children, role }: Props) {
  if (!tokenStorage.getAccess()) return <Navigate to="/login" replace />;
  if (role && tokenStorage.getRole() !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
