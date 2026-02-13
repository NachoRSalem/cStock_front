// src/pages/BranchDashboard.tsx
import { tokenStorage } from "../utils/storage";

export default function BranchDashboard() {
  const sucursal = tokenStorage.getSucursal();

  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Panel Sucursal</h2>
        <p className="page__subtitle">
          Estás operando sobre tu sucursal
          {typeof sucursal === "number" ? ` (ID: ${sucursal})` : ""}.
        </p>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card__body">
            <ul className="list">
              <li className="list__item">Registrar ventas</li>
              <li className="list__item">Ver solo tu información</li>
              <li className="list__item">Crear pedidos (si tu back lo permite)</li>
              <li className="list__item">Confirmar recepción de pedidos asignados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
