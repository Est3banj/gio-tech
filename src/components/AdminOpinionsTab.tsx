import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { subscribeToOpiniones } from "../services/opinion.service";
import type { Opinion } from "../types";

interface AdminOpinionsTabProps {
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
}

const EMPTY_FORM = {
  autor: "",
  estrellas: 5,
  texto: "",
  ubicacion: "",
  perfilUrl: "",
  activo: true,
};

type OpinionForm = typeof EMPTY_FORM;

function AdminOpinionsTab({ setError, setSuccess }: AdminOpinionsTabProps) {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<OpinionForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Opinion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToOpiniones(
      (lista) => {
        setOpinions(lista);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error al cargar opiniones:", err);
        setError(`Error al cargar opiniones: ${err.message}`);
        setIsLoading(false);
      }
    );
    return unsub;
  }, [setError]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const autor = form.autor.trim();
    const texto = form.texto.trim();
    if (!autor || !texto) {
      setError("El nombre del autor y el texto de la opinión son obligatorios.");
      return;
    }
    if (texto.length < 10) {
      setError("El texto de la opinión es muy corto (mínimo 10 caracteres).");
      return;
    }
    if (form.perfilUrl && !/^https?:\/\//i.test(form.perfilUrl.trim())) {
      setError("El enlace del perfil debe empezar con http:// o https://");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        autor,
        estrellas: Number(form.estrellas),
        texto,
        ubicacion: form.ubicacion.trim(),
        perfilUrl: form.perfilUrl.trim(),
        activo: form.activo,
      };

      if (editing) {
        // createdAt se conserva para no perder el orden por fecha
        await updateDoc(doc(db, "opiniones", editing.id), payload);
        setSuccess("Opinión actualizada.");
      } else {
        await addDoc(collection(db, "opiniones"), {
          ...payload,
          createdAt: new Date(),
        });
        setSuccess("Opinión guardada. Ya aparecerá en la home (si está activa).");
      }
      resetForm();
    } catch (err: unknown) {
      console.error("Error al guardar opinión:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(
        /permission/i.test(message)
          ? "Sin permisos: desplegá las reglas de Firestore (firebase deploy --only firestore:rules)."
          : `Error al guardar la opinión: ${message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (op: Opinion) => {
    setEditing(op);
    setForm({
      autor: op.autor,
      estrellas: op.estrellas,
      texto: op.texto,
      ubicacion: op.ubicacion || "",
      perfilUrl: op.perfilUrl || "",
      activo: op.activo,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActivo = async (op: Opinion) => {
    setError("");
    setSuccess("");
    try {
      await updateDoc(doc(db, "opiniones", op.id), { activo: !op.activo });
      setSuccess(op.activo ? "Opinión oculta en la home." : "Opinión visible en la home.");
    } catch (err: unknown) {
      console.error("Error al cambiar visibilidad:", err);
      setError("No se pudo cambiar la visibilidad de la opinión.");
    }
  };

  const handleDelete = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      await deleteDoc(doc(db, "opiniones", id));
      setConfirmDeleteId(null);
      setSuccess("Opinión eliminada.");
      if (editing?.id === id) resetForm();
    } catch (err: unknown) {
      console.error("Error al eliminar opinión:", err);
      setError("No se pudo eliminar la opinión.");
    }
  };

  return (
    <div className="admin-opiniones">
      {/* ─── Encabezado ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="mb-1">Opiniones de Google</h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
            Reseñas reales de tu ficha de Google. La home muestra hasta 10 activas en
            rotación.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
            setError("");
            setSuccess("");
          }}
        >
          <i className={`bi ${showForm ? "bi-x-lg" : "bi-plus-lg"} me-2`} aria-hidden="true" />
          {showForm ? "Cerrar" : "Nueva opinión"}
        </button>
      </div>

      {/* ─── Formulario alta/edición ─── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card border mb-4" style={{ padding: "1.5rem" }}>
          <h5 className="mb-3">{editing ? "Editar opinión" : "Nueva opinión"}</h5>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="op-autor">
                Nombre del autor *
              </label>
              <input
                id="op-autor"
                type="text"
                className="form-control"
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
                placeholder="Ej: María Fernanda"
                maxLength={60}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label" htmlFor="op-estrellas">
                Calificación *
              </label>
              <select
                id="op-estrellas"
                className="form-select"
                value={form.estrellas}
                onChange={(e) => setForm({ ...form, estrellas: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((v) => (
                  <option key={v} value={v}>
                    {v} estrella{v > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label" htmlFor="op-ubicacion">
                Ubicación (opcional)
              </label>
              <input
                id="op-ubicacion"
                type="text"
                className="form-control"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                placeholder="Ej: Mocoa, Putumayo"
                maxLength={60}
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="op-texto">
                Texto de la reseña *
              </label>
              <textarea
                id="op-texto"
                className="form-control"
                rows={3}
                value={form.texto}
                onChange={(e) => setForm({ ...form, texto: e.target.value })}
                placeholder="Copiá aquí el texto tal cual aparece en Google…"
                maxLength={600}
                required
              />
              <div className="form-text">{form.texto.length}/600</div>
            </div>

            <div className="col-md-8">
              <label className="form-label" htmlFor="op-url">
                Enlace al perfil del autor en Google (opcional)
              </label>
              <input
                id="op-url"
                type="url"
                className="form-control"
                value={form.perfilUrl}
                onChange={(e) => setForm({ ...form, perfilUrl: e.target.value })}
                placeholder="https://www.google.com/maps/contrib/…"
              />
              <div className="form-text">
                Si lo dejás vacío, el nombre se muestra sin enlace.
              </div>
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="op-activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="op-activo">
                  Visible en la home
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Guardando…
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Agregar opinión"
              )}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ─── Listado ─── */}
      {isLoading ? (
        <p className="text-muted">Cargando opiniones…</p>
      ) : opinions.length === 0 ? (
        <div className="alert alert-info mb-0">
          Todavía no cargaste opiniones. Usá{" "}
          <strong>Nueva opinión</strong> para pegar las primeras reseñas de Google.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table admin-pro-table mb-0 align-middle">
            <thead>
              <tr>
                <th>Autor</th>
                <th style={{ width: "110px" }}>Estrellas</th>
                <th>Reseña</th>
                <th style={{ width: "120px" }}>Visible</th>
                <th style={{ width: "190px" }} className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {opinions.map((op) => (
                <tr key={op.id} className="admin-table-row">
                  <td>
                    <strong>{op.autor}</strong>
                    {op.ubicacion && (
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                        {op.ubicacion}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="text-warning" style={{ letterSpacing: "1px" }}>
                      {Array.from({ length: op.estrellas }).map((_, i) => (
                        <i key={i} className="bi bi-star-fill" aria-hidden="true" />
                      ))}
                    </span>
                    <span className="visually-hidden">{op.estrellas} de 5</span>
                  </td>
                  <td>
                    <span
                      title={op.texto}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: "0.85rem",
                      }}
                    >
                      {op.texto}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-sm ${op.activo ? "btn-outline-success" : "btn-outline-secondary"}`}
                      onClick={() => handleToggleActivo(op)}
                      title={op.activo ? "Ocultar de la home" : "Mostrar en la home"}
                    >
                      <i
                        className={`bi ${op.activo ? "bi-eye-fill" : "bi-eye-slash-fill"} me-1`}
                        aria-hidden="true"
                      />
                      {op.activo ? "Sí" : "No"}
                    </button>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(op)}
                    >
                      <i className="bi bi-pencil-square" aria-hidden="true" /> Editar
                    </button>
                    {confirmDeleteId === op.id ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(op.id)}
                      >
                        ¿Eliminar? Sí
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmDeleteId(op.id)}
                        onBlur={() => setConfirmDeleteId(null)}
                      >
                        <i className="bi bi-trash3" aria-hidden="true" /> Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOpinionsTab;
