import { useState } from "react";
import { Card, Table, Button, Form, InputGroup } from "react-bootstrap";
import { Asesor } from "../types";

interface AdminAsesoresListProps {
  asesores: Asesor[];
  onEdit: (asesor: Asesor) => void;
  onDelete: (id: string) => void;
}

function AdminAsesoresList({ asesores, onEdit, onDelete }: AdminAsesoresListProps) {
  const [searchAsesor, setSearchAsesor] = useState("");

  const filteredAsesores = asesores.filter((asesor) =>
    asesor.nombreCompleto?.toLowerCase().includes(searchAsesor.toLowerCase()) ||
    asesor.email?.toLowerCase().includes(searchAsesor.toLowerCase()) ||
    asesor.whatsappNumber?.includes(searchAsesor)
  );

  return (
    <Card className="p-4 mb-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Asesores Registrados</h3>
        <span className="badge bg-secondary fs-6">
          {filteredAsesores.length} total
        </span>
      </div>

      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Buscar asesor por nombre, email o WhatsApp..."
          value={searchAsesor}
          onChange={(e) => setSearchAsesor(e.target.value)}
        />
      </InputGroup>

      {filteredAsesores.length === 0 ? (
        <div className="text-center py-4 text-muted">
          {asesores.length === 0 ? "No hay asesores registrados" : "No se encontraron asesores"}
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAsesores.map((asesor) => (
              <tr key={asesor.id}>
                <td>{asesor.nombreCompleto}</td>
                <td>{asesor.email}</td>
                <td>{asesor.whatsappNumber}</td>
                <td>
                  <span className={`badge ${asesor.rol === "admin" ? "bg-danger" : "bg-primary"}`}>
                    {asesor.rol}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onEdit(asesor)}
                      style={{ minWidth: "70px" }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(asesor.id)}
                      style={{ minWidth: "80px" }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

export default AdminAsesoresList;