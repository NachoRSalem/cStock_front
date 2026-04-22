import { Button } from "../components/ui";
import { Package, Users, AlertCircle } from "lucide-react";

export default function WelcomeModal() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-emerald-500 p-6 rounded-t-2xl">
          <div className="flex items-center gap-3 text-white">
            <Package className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">Bienvenido al Sistema de Gestión de Stock</h2>
              <p className="text-primary-100 text-sm">Demo de Portfolio</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Esta es una <strong>versión de prueba</strong> del sistema. 
              Todos los datos son ficticios y con fines de demostración.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Credenciales de Prueba
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <span className="text-neutral-500">Usuario Admin:</span>
                <div className="font-mono font-semibold text-neutral-900">admin / admin123</div>
                <span className="text-xs text-neutral-500">(Accede al panel de administración)</span>
              </div>
              
              <div className="bg-neutral-50 p-3 rounded-lg">
                <span className="text-neutral-500">Usuario Sucursal:</span>
                <div className="font-mono font-semibold text-neutral-900">sucursal / paso123</div>
                <span className="text-xs text-neutral-500">(Accede a Sucursal Norte)</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-500 text-center pt-2">
            Explorá todas las funcionalidades: Stock, Pedidos, Ventas, Reportes, etc.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100">
          <Button className="w-full" size="lg">
            Comenzar a Explorar
          </Button>
        </div>
      </div>
    </div>
  );
}