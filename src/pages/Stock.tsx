// src/pages/Stock.tsx
import { tokenStorage } from "../utils/storage";

export default function Stock() {
  const sucursal = tokenStorage.getSucursal();
  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Mi Stock</h2>
        <p className="page__subtitle">
          Mostrar stock de la sucursal {typeof sucursal === "number" ? `ID ${sucursal}` : "(sin sucursal)"}.
        </p>
      </div>

      <section className="card">
        <div className="card__body">
          <p className="muted">Cuando esté el endpoint de stock, lo enchufamos acá.</p>
        </div>
      </section>
    </div>
  );
}
