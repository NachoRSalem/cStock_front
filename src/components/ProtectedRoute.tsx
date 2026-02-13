// componets/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { tokenStorage } from "../utils/storage";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = tokenStorage.getAccess();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
