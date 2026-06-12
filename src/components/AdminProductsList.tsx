import { useState } from "react";
import { Card, Table, Button, Form } from "react-bootstrap";
import { Product } from "../types";

interface AdminProductsListProps {
  productos: Product[];
  onEdit: (producto: Product) => void;
  onDelete: (id: string) => void;
}

function AdminProductsList({ productos, onEdit, onDelete }: AdminProductsListProps) {
  const [searchProducto, setSearchProducto] = useState("");

  return (
    <Card className="p-4 mb-4 shadow-sm">
      <h3 className="mb-3">Lista de Productos</h3>
      <p className="text-muted mb-3">
        Aquí puede ver todos los productos del catálogo. 
        Use "Agregar Producto" para crear nuevos productos.
      </p>
      
      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="🔍 Buscar productos..."
          value={searchProducto}
          onChange={(e) => setSearchProducto(e.target.value)}
        />
      </Form.Group>
      
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio Contado</th>
            <th>Cuotas</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos
            .filter((producto) => {
              if (!searchProducto) return true;
              const searchLower = searchProducto.toLowerCase();
              const nombre = (producto.nombre || "").toLowerCase();
              const descripcion = (producto.descripcion || "").toLowerCase();
              return (
                nombre.includes(searchLower) ||
                descripcion.includes(searchLower)
              );
            })
            .map((producto) => (
              <tr key={producto.id}>
                <td className="align-middle">
                  {producto.imagen ? (
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        background: "#f0f0f0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="text-muted">📷</span>
                    </div>
                  )}
                </td>
                <td className="align-middle">
                  <strong>{producto.nombre}</strong>
                  {producto.descripcion && (
                    <>
                      <br />
                      <small className="text-muted">
                        {producto.descripcion.substring(0, 50)}
                        {producto.descripcion.length > 50 ? "..." : ""}
                      </small>
                    </>
                  )}
                </td>
                <td className="align-middle">
                  <strong>${Number(producto.contado || 0).toLocaleString("es-CO")}</strong>
                </td>
                <td className="align-middle">
                  {producto.cuotas12 ? (
                    <span>
                      ${Number(producto.cuotas12).toLocaleString("es-CO")} x 12
                      {producto.cuotaInicial && (
                        <span className="text-muted"> (Ini: ${Number(producto.cuotaInicial).toLocaleString("es-CO")})</span>
                      )}
                    </span>
                  ) : producto.cuotas6 ? (
                    <span>
                      ${Number(producto.cuotas6).toLocaleString("es-CO")} x 16
                      {producto.cuotas8 && (
                        <span className="text-muted"> / ${Number(producto.cuotas8).toLocaleString("es-CO")} x 8</span>
                      )}
                      {producto.cuotaInicial && (
                        <span className="text-muted"> (Ini: ${Number(producto.cuotaInicial).toLocaleString("es-CO")})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted">No disponible</span>
                  )}
                </td>
                <td className="align-middle">
                  <div className="d-flex gap-1 flex-wrap">
                    {producto.nuevo && (
                      <span className="badge bg-success">NUEVO</span>
                    )}
                    {producto.promo && (
                      <span className="badge bg-danger">PROMO</span>
                    )}
                    {!producto.nuevo && !producto.promo && (
                      <span className="badge bg-secondary">Normal</span>
                    )}
                  </div>
                </td>
                <td className="align-middle">
                  <div className="d-flex gap-2">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onEdit(producto)}
                      style={{ minWidth: "70px" }}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(producto.id)}
                      style={{ minWidth: "80px" }}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      {productos.filter((producto) => {
        if (!searchProducto) return true;
        const searchLower = searchProducto.toLowerCase();
        const nombre = (producto.nombre || "").toLowerCase();
        const descripcion = (producto.descripcion || "").toLowerCase();
        return (
          nombre.includes(searchLower) ||
          descripcion.includes(searchLower)
        );
      }).length === 0 && (
        <div className="text-center py-4 text-muted">
          <p className="mb-0">
            {searchProducto
              ? `No se encontraron productos que coincidan con "${searchProducto}"`
              : "No hay productos registrados"}
          </p>
        </div>
      )}
    </Card>
  );
}

export default AdminProductsList;