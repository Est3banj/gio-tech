import { useState, FormEvent } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { CarouselSlideAdmin } from "../types";
import ProductImage from "./common/ProductImage";

export interface ExtendedCarouselSlideAdmin extends CarouselSlideAdmin {
  descripcion?: string;
  enlace?: string;
}

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
  const [descripcionSlide, setDescripcionSlide] = useState("");
  const [enlaceSlide, setEnlaceSlide] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetSlideForm = () => {
    setUrlImagenSlide("");
    setTituloSlide("");
    setDescripcionSlide("");
    setEnlaceSlide("");
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
        "Por favor ingresa una URL válida para la imagen (debe comenzar con http:// o https://)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        url_imagen: urlImagenSlide.trim(),
        titulo: tituloSlide.trim() || "",
        descripcion: descripcionSlide.trim() || "",
        enlace: enlaceSlide.trim() || "",
        orden: parseInt(ordenSlide, 10) || 0,
        activo: activoSlide,
        createdAt: editandoSlide ? editandoSlide.createdAt : new Date(),
      };

      if (editandoSlide) {
        await updateDoc(doc(db, "carrusel", editandoSlide.id), payload);
        setSuccess("¡Slide actualizado exitosamente!");
      } else {
        await addDoc(collection(db, "carrusel"), payload);
        setSuccess("¡Slide agregado exitosamente al carrusel!");
      }
      resetSlideForm();
    } catch (err: unknown) {
      console.error("Error al guardar slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al guardar slide: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSlide = (slide: ExtendedCarouselSlideAdmin) => {
    setEditandoSlide(slide);
    setUrlImagenSlide(slide.url_imagen || "");
    setTituloSlide(slide.titulo || "");
    setDescripcionSlide(slide.descripcion || "");
    setEnlaceSlide(slide.enlace || "");
    setOrdenSlide(slide.orden?.toString() || "");
    setActivoSlide(slide.activo !== false);
    setPreviewImagenSlide(slide.url_imagen || "");
    setKey("carrusel");
  };

  const handleDeleteSlide = async (id: string) => {
    setError("");
    setSuccess("");
    if (window.confirm("¿Estás seguro de que deseas eliminar este banner del carrusel?")) {
      setDeletingId(id);
      try {
        await deleteDoc(doc(db, "carrusel", id));
        setSuccess("¡Banner eliminado exitosamente!");
      } catch (err: unknown) {
        console.error("Error al eliminar slide:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar slide: ${message}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleActivoSlide = async (slide: CarouselSlideAdmin) => {
    try {
      await updateDoc(doc(db, "carrusel", slide.id), {
        activo: !slide.activo,
      });
      setSuccess(
        `Slide ${!slide.activo ? "activado" : "desactivado"} exitosamente!`
      );
    } catch (err: unknown) {
      console.error("Error al cambiar estado del slide:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al cambiar estado: ${message}`);
    }
  };

  const sortedSlides = [...slides].sort(
    (a, b) => (a.orden || 0) - (b.orden || 0)
  );

  return (
    <div className="admin-carousel-container d-flex flex-column gap-4">
      {/* ─── Form Card ─────────────────────────────── */}
      <div className="admin-card-pro">
        <div className="admin-card-header-clean mb-3">
          <div className="admin-card-header-icon carousel">
            <i className="bi bi-images" />
          </div>
          <div>
            <h3 className="admin-card-title mb-0">
              {editandoSlide ? "Editar Slide / Banner" : "Nuevo Slide / Banner Promocional"}
            </h3>
            <p className="admin-card-subtitle mb-0">
              Configura las diapositivas de alta resolución que se exhiben en la portada
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitSlide}>
          <div className="row g-3">
            {/* URL Imagen */}
            <div className="col-12 col-md-8">
              <label htmlFor="url-imagen-slide-input" className="form-label fw-semibold">
                URL de la Imagen en Alta Resolución <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-link-45deg" />
                </span>
                <input
                  id="url-imagen-slide-input"
                  type="url"
                  className="form-control"
                  placeholder="https://ejemplo.com/banner-hero-1920x600.jpg"
                  value={urlImagenSlide}
                  onChange={(e) => handleUrlImagenChange(e.target.value)}
                  required
                />
              </div>
              <small className="text-muted">
                Recomendado: 1920x600px en formato JPG/WebP optimizado.
              </small>
            </div>

            {/* Orden & Activo */}
            <div className="col-6 col-md-2">
              <label htmlFor="orden-slide-input" className="form-label fw-semibold">
                Orden Numérico <span className="text-danger">*</span>
              </label>
              <input
                id="orden-slide-input"
                type="number"
                className="form-control"
                placeholder="1, 2, 3..."
                min="0"
                value={ordenSlide}
                onChange={(e) => setOrdenSlide(e.target.value)}
                required
              />
            </div>

            <div className="col-6 col-md-2 d-flex flex-column justify-content-center pt-3">
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="activo-slide-switch"
                  checked={activoSlide}
                  onChange={(e) => setActivoSlide(e.target.checked)}
                />
                <label
                  className="form-check-label fw-semibold"
                  htmlFor="activo-slide-switch"
                >
                  {activoSlide ? "Activo" : "Inactivo"}
                </label>
              </div>
            </div>

            {/* Live Preview of Slide */}
            {previewImagenSlide && (
              <div className="col-12">
                <label className="form-label fw-semibold">
                  Previsualización del Banner (Relación 16:9 / Panorámico)
                </label>
                <div className="admin-slide-preview-box">
                  <img
                    src={previewImagenSlide}
                    alt="Preview Slide"
                    className="admin-slide-preview-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.innerHTML =
                          '<div class="admin-slide-preview-error"><i class="bi bi-exclamation-triangle me-2"></i>Error al cargar imagen. Verifica la URL.</div>';
                      }
                    }}
                  />
                  {tituloSlide && (
                    <div className="admin-slide-preview-overlay">
                      <h4>{tituloSlide}</h4>
                      {descripcionSlide && <p>{descripcionSlide}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Título */}
            <div className="col-12 col-md-6">
              <label htmlFor="titulo-slide-input" className="form-label fw-semibold">
                Título o Titular del Banner (Opcional)
              </label>
              <input
                id="titulo-slide-input"
                type="text"
                className="form-control"
                placeholder="Ej: ¡Ofertas Especiales en Gama Alta!"
                value={tituloSlide}
                onChange={(e) => setTituloSlide(e.target.value)}
              />
            </div>

            {/* Descripción */}
            <div className="col-12 col-md-6">
              <label htmlFor="descripcion-slide-input" className="form-label fw-semibold">
                Descripción o Subtítulo (Opcional)
              </label>
              <input
                id="descripcion-slide-input"
                type="text"
                className="form-control"
                placeholder="Ej: Financia tu nuevo smartphone hasta en 16 quincenas"
                value={descripcionSlide}
                onChange={(e) => setDescripcionSlide(e.target.value)}
              />
            </div>

            {/* Enlace CTA */}
            <div className="col-12">
              <label htmlFor="enlace-slide-input" className="form-label fw-semibold">
                Enlace / Botón CTA de Destino (Opcional)
              </label>
              <input
                id="enlace-slide-input"
                type="text"
                className="form-control"
                placeholder="Ej: /catalogo o https://wa.me/573223652569"
                value={enlaceSlide}
                onChange={(e) => setEnlaceSlide(e.target.value)}
              />
            </div>

            {/* Submit Buttons */}
            <div className="col-12 d-flex gap-2 justify-content-end pt-2">
              {editandoSlide && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={resetSlideForm}
                  disabled={isSubmitting}
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                className="btn btn-danger px-5 py-2 fw-bold d-inline-flex align-items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Guardando...</span>
                  </>
                ) : editandoSlide ? (
                  <>
                    <i className="bi bi-check2-circle" />
                    <span>Actualizar Slide</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg" />
                    <span>Agregar Slide</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Slides List / Gallery ───────────────────── */}
      <div className="admin-card-pro p-0 overflow-hidden">
        <div className="p-4 border-bottom border-subtle d-flex justify-content-between align-items-center">
          <div>
            <h3 className="admin-card-title mb-0">Banners Activos en el Carrusel</h3>
            <p className="admin-card-subtitle mb-0">
              Organizados por orden ascendente de visualización
            </p>
          </div>
          <span className="badge bg-secondary fs-6">
            {slides.length} {slides.length === 1 ? "slide" : "slides"}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table admin-pro-table mb-0 align-middle">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Miniatura</th>
                <th>Título / Texto</th>
                <th style={{ width: "80px" }} className="text-center">
                  Orden
                </th>
                <th style={{ width: "130px" }} className="text-center">
                  Estado
                </th>
                <th style={{ width: "160px" }} className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSlides.map((slide) => (
                <tr key={slide.id} className="admin-table-row">
                  <td>
                    <div className="admin-banner-thumb-box">
                      <ProductImage
                        src={slide.url_imagen}
                        alt={slide.titulo || "Banner"}
                        variant="thumb"
                        className="admin-banner-thumb-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold">{slide.titulo || <span className="text-muted fst-italic">Sin título</span>}</div>
                    {(slide as ExtendedCarouselSlideAdmin).descripcion && (
                      <small className="text-muted d-block">
                        {(slide as ExtendedCarouselSlideAdmin).descripcion}
                      </small>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="badge bg-secondary-subtle text-dark border fw-bold px-2 py-1">
                      #{slide.orden ?? 0}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className={`btn btn-xs ${
                        slide.activo !== false ? "btn-success" : "btn-secondary"
                      } px-2 py-1`}
                      onClick={() => handleToggleActivoSlide(slide)}
                    >
                      <span className="d-inline-flex align-items-center gap-1">
                        <i
                          className={`bi ${
                            slide.activo !== false
                              ? "bi-check-circle-fill"
                              : "bi-pause-circle-fill"
                          }`}
                          aria-hidden="true"
                        />
                        <span>{slide.activo !== false ? "Activo" : "Inactivo"}</span>
                      </span>
                    </button>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditSlide(slide as ExtendedCarouselSlideAdmin)}
                        title="Editar slide"
                        aria-label="Editar slide"
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteSlide(slide.id)}
                        disabled={deletingId === slide.id}
                        title="Eliminar slide"
                        aria-label="Eliminar slide"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {slides.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-images fs-1 d-block mb-2 text-muted" />
            <p className="mb-0">No hay slides registrados en el carrusel.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCarouselManager;
