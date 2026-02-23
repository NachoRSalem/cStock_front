// src/pages/AdminDashboard.tsx
export default function AdminDashboard() {
  return (
    <div className="page">
      <div className="page__header">
        <h2 className="page__title">Panel Administrador</h2>
        <p className="page__subtitle">
          Accedé a sucursales, pedidos, aprobaciones, reportes y usuarios.
        </p>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card__body">
            <ul className="list">
              <li className="list__item">Ver todo: stock/pedidos/ventas (todas las sucursales)</li>
              <li className="list__item">Aprobar / rechazar pedidos</li>
              <li className="list__item">Reportes económicos comparativos</li>
              <li className="list__item">PDF de pedidos (cuando lo conectemos)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
