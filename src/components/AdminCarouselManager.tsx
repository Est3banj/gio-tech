import { FormEvent } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Card, Form, Row, Col, Button, Table, Badge } from "react-bootstrap";
import { db } from "../firebase";
import { CarouselSlideAdmin } from "../types";

interface AdminCarouselManagerProps {
  slides: CarouselSlideAdmin[];
  urlImagenSlide: string;
  setUrlImagenSlide: (v: string) => void;
  tituloSlide: string;
  setTituloSlide: (v: string) => void;
  ordenSlide: string;
  setOrdenSlide: (v: string) => void;
  activoSlide: boolean;
  setActivoSlide: (v: boolean) => void;
  editandoSlide: CarouselSlideAdmin | null;
  setEditandoSlide: (v: CarouselSlideAdmin | null) => void;
  previewImagenSlide: string;
  setPreviewImagenSlide: (v: string) => void;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
  setKey: (v: string) => void;
}

function AdminCarouselManager({
  slides,
  urlImagenSlide,
  setUrlImagenSlide,
  tituloSlide,
  setTituloSlide,
  ordenSlide,
  setOrdenSlide,
  activoSlide,
  setActivoSlide,
  editandoSlide,
  setEditandoSlide,
  previewImagenSlide,
  setPreviewImagenSlide,
  setError,
  setSuccess,
  setKey,
}: AdminCarouselManagerProps) {
  const resetSlideForm = () => {
    setUrlImagenSlide("");
    setTituloSlide("");
    setOrdenSlide("");
    setActivoSlide(true);
    setEditandoSlide(null);
    setPreviewImagenSlide("");
  };

  const handleUrlImagenChange = (url: string) => {
    setUrlImagenSlide(url);
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      setPreviewImagenSlide(url);
    } else {
      setPreviewImagenSlide("");
    }
  };

  const handleSubmitSlide = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !urlImagenSlide ||
      (!urlImagenSlide.startsWith("http://") &&
        !urlImagenSlide.startsWith("https://"))
    ) {
      setError(
        "Por favor ingresa una URL válida para la imagen (debe comenzar con http:// o https://)",
      );
      return;
    }

    try {
      const payload = {
        url_imagen: urlImagenSlide,
        titulo: tituloSlide || "",
        orden: parseInt(ordenSlide) || 0,
        activo: activoSlide,
        createdAt: editandoSlide ? editandoSlide.createdAt : new Date(),
      };

      if (editandoSlide) {
        await updateDoc(doc(db, "carrusel", editandoSlide.id), payload);
        setSuccess("Slide actualizado exitosamente!");
      } else {
        await addDoc(collection(db, "carrusel"), payload);
        setSuccess("Slide agregado exitosamente!");
      }
      resetSlideForm();
    } catch (err: unknown) {
      console.error("Error al guardar slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar slide: ${message}`);
    }
  };

  const handleEditSlide = (slide: CarouselSlideAdmin) => {
    setEditandoSlide(slide);
    setUrlImagenSlide(slide.url_imagen || "");
    setTituloSlide(slide.titulo || "");
    setOrdenSlide(slide.orden?.toString() || "");
    setActivoSlide(slide.activo !== false);
    setPreviewImagenSlide(slide.url_imagen || "");
    setKey("carrusel");
  };

  const handleDeleteSlide = async (id: string) => {
    setError("");
    setSuccess("");
    if (window.confirm("¿Estás seguro de que quieres eliminar este slide?")) {
      try {
        await deleteDoc(doc(db, "carrusel", id));
        setSuccess("Slide eliminado exitosamente!");
      } catch (err: unknown) {
        console.error("Error al eliminar slide:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar slide: ${message}`);
      }
    }
  };

  const handleToggleActivoSlide = async (slide: CarouselSlideAdmin) => {
    try {
      await updateDoc(doc(db, "carrusel", slide.id), {
        activo: !slide.activo,
      });
      setSuccess(
        `Slide ${!slide.activo ? "activado" : "desactivado"} exitosamente!`,
      );
    } catch (err: unknown) {
      console.error("Error al cambiar estado del slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al cambiar estado: ${message}`);
    }
  };

  return (
    <>
      <Card className="p-4 mb-4 shadow-sm">
        <h3 className="mb-3">
          {editandoSlide ? "Editar Slide" : "Agregar Nuevo Slide"}
        </h3>
        <Form onSubmit={handleSubmitSlide}>
          <Form.Group className="mb-3">
            <Form.Label>URL de la Imagen</Form.Label>
            <Form.Control
              type="text"
              value={urlImagenSlide}
              onChange={(e) => handleUrlImagenChange(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
            <Form.Text className="text-muted">
              Ingresa la URL completa de la imagen (debe comenzar con
              http:// o https://)
            </Form.Text>
          </Form.Group>

          {previewImagenSlide && (
            <div className="mb-3">
              <Form.Label>Vista Previa</Form.Label>
              <div
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  height: "200px",
                  overflow: "hidden",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                }}
              >
                <img
                  src={previewImagenSlide}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6c757d;">Error al cargar la imagen</div>';
                    }
                  }}
                />
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Título/Texto del Slide (opcional)</Form.Label>
            <Form.Control
              type="text"
              value={tituloSlide}
              onChange={(e) => setTituloSlide(e.target.value)}
              placeholder="Ej: ¡Ofertas Especiales!"
            />
            <Form.Text className="text-muted">
              Este texto se mostrará sobre la imagen con fondo oscuro para
              mejor legibilidad
            </Form.Text>
          </Form.Group>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Orden de Visualización</Form.Label>
                <Form.Control
                  type="number"
                  value={ordenSlide}
                  onChange={(e) => setOrdenSlide(e.target.value)}
                  placeholder="1, 2, 3..."
                  min="0"
                  required
                />
                <Form.Text className="text-muted">
                  Los slides se mostrarán en orden ascendente (1, 2, 3...)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Form.Check
                  type="switch"
                  id="activo-slide-switch"
                  label={activoSlide ? "Slide Activo" : "Slide Inactivo"}
                  checked={activoSlide}
                  onChange={(e) => setActivoSlide(e.target.checked)}
                />
                <Form.Text className="text-muted">
                  Solo los slides activos se mostrarán en el carrusel
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Button variant="primary" type="submit" className="me-2">
            {editandoSlide ? "Actualizar Slide" : "Agregar Slide"}
          </Button>
          {editandoSlide && (
            <Button variant="secondary" onClick={resetSlideForm}>
              Cancelar Edición
            </Button>
          )}
        </Form>
      </Card>

      <Card className="p-4 mb-4 shadow-sm">
        <h3 className="mb-3">Slides del Carrusel</h3>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th style={{ width: "100px" }}>Imagen</th>
                <th>Título</th>
                <th style={{ width: "80px" }}>Orden</th>
                <th style={{ width: "100px" }}>Estado</th>
                <th style={{ width: "250px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {slides
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map((slide) => (
                  <tr key={slide.id}>
                    <td className="text-center align-middle">
                      <img
                        src={
                          slide.url_imagen ||
                          "https://via.placeholder.com/80"
                        }
                        alt={slide.titulo || "Slide"}
                        style={{
                          width: "80px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td className="align-middle">
                      {slide.titulo || (
                        <span className="text-muted">Sin título</span>
                      )}
                    </td>
                    <td className="align-middle text-center">
                      <Badge bg="secondary">{slide.orden || 0}</Badge>
                    </td>
                    <td className="align-middle text-center">
                      <Badge bg={slide.activo ? "success" : "secondary"}>
                        {slide.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditSlide(slide)}
                        >
                          ✏️ Editar
                        </Button>
                        <Button
                          variant={slide.activo ? "secondary" : "success"}
                          size="sm"
                          onClick={() => handleToggleActivoSlide(slide)}
                        >
                          {slide.activo ? "🔒 Desactivar" : "✅ Activar"}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteSlide(slide.id)}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>

          {slides.length === 0 && (
            <div className="text-center py-4 text-muted">
              <p className="mb-0">
                No hay slides registrados. Agrega el primero arriba.
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

export default AdminCarouselManager;
