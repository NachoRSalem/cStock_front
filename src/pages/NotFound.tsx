// src/pages/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">404</h2>
        <p className="page__subtitle">No existe esta ruta.</p>
      </div>

      <div className="card">
        <div className="card__body">
          <Link className="link" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
