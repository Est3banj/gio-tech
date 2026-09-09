import { useState, useMemo } from "react";
import { Asesor } from "../types";

interface AdminAsesoresListProps {
  asesores: Asesor[];
  onEdit: (asesor: Asesor) => void;
  onDelete: (id: string) => void;
}

function AdminAsesoresList({ asesores, onEdit, onDelete }: AdminAsesoresListProps) {
  const [searchAsesor, setSearchAsesor] = useState("");

  const filteredAsesores = useMemo(() => {
    return asesores.filter(
      (asesor) =>
        (asesor.nombreCompleto || "")
          .toLowerCase()
          .includes(searchAsesor.toLowerCase()) ||
        (asesor.email || "").toLowerCase().includes(searchAsesor.toLowerCase()) ||
        (asesor.whatsappNumber || "").includes(searchAsesor)
    );
  }, [asesores, searchAsesor]);

  return (
    <div className="admin-card-pro p-0 overflow-hidden">
      <div className="p-4 border-bottom border-subtle d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h3 className="admin-card-title mb-0">Asesores Registrados</h3>
          <p className="admin-card-subtitle mb-0">
            Lista de colaboradores con permisos de atención al cliente
          </p>
        </div>
        <span className="badge bg-secondary fs-6 align-self-start align-self-md-center">
          {filteredAsesores.length} de {asesores.length} asesores
        </span>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-body-tertiary border-bottom border-subtle">
        <div className="admin-search-input-wrap">
          <i className="bi bi-search admin-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="form-control admin-search-input"
            placeholder="Buscar asesor por nombre, correo electrónico o WhatsApp..."
            value={searchAsesor}
            onChange={(e) => setSearchAsesor(e.target.value)}
          />
          {searchAsesor && (
            <button
              type="button"
              className="admin-search-clear-btn"
              onClick={() => setSearchAsesor("")}
            >
              <i className="bi bi-x-circle-fill" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredAsesores.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-people fs-1 d-block mb-2" />
          <p className="mb-0">
            {asesores.length === 0
              ? "No hay asesores registrados en el sistema."
              : "No se encontraron asesores con ese criterio de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table admin-pro-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Asesor</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAsesores.map((asesor) => {
                const initial = (asesor.nombreCompleto || asesor.email || "A")
                  .charAt(0)
                  .toUpperCase();
                const isAdmin = asesor.rol === "admin";

                return (
                  <tr key={asesor.id} className="admin-table-row">
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`admin-user-avatar-circle ${
                            isAdmin ? "admin" : "asesor"
                          }`}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="fw-bold">{asesor.nombreCompleto}</div>
                          <small className="text-muted">{asesor.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/${asesor.whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none d-inline-flex align-items-center gap-1 text-success fw-semibold"
                      >
                        <i className="bi bi-whatsapp" />
                        <span>{asesor.whatsappNumber}</span>
                      </a>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          isAdmin
                            ? "bg-danger text-white"
                            : "bg-primary-subtle text-primary border border-primary-subtle"
                        }`}
                      >
                        {isAdmin ? "Administrador" : "Asesor Comercial"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEdit(asesor)}
                          title="Editar asesor"
                          aria-label={`Editar ${asesor.nombreCompleto}`}
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(asesor.id)}
                          title="Eliminar asesor"
                          aria-label={`Eliminar ${asesor.nombreCompleto}`}
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAsesoresList;