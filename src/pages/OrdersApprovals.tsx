// src/pages/OrdersApprovals.tsx
import Orders from "./Orders";

export default function OrdersApprovals() {
  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Aprobar / Rechazar pedidos</h2>
        <p className="page__subtitle">
          Placeholder: por ahora reutiliza la lista. Cuando estén los endpoints, armamos la UI.
        </p>
      </div>

      <Orders />
    </div>
  );
}
