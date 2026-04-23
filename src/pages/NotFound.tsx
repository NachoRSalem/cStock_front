import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-7xl font-bold text-neutral-900 mb-2">404</h1>
        <p className="text-lg text-neutral-600 mb-2">Página no encontrada</p>
        <p className="text-sm text-neutral-500 mb-8">
          La ruta que intentaste acceder no existe o ha sido movida.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            <Home className="w-5 h-5" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}