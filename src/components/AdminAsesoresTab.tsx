import { useState, FormEvent } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getApp, getApps, initializeApp, deleteApp } from "firebase/app";
import { getAuth as getAuthSecondary } from "firebase/auth";
import { db } from "../firebase";
import { Asesor } from "../types";
import AdminAsesoresList from "./AdminAsesoresList";
import { getAsesorCreationErrorMessage } from "../utils/auth-errors";

interface AdminAsesoresTabProps {
  asesores: Asesor[];
  editandoAsesor: Asesor | null;
  setEditandoAsesor: (v: Asesor | null) => void;
  emailAsesor: string;
  setEmailAsesor: (v: string) => void;
  passwordAsesor: string;
  setPasswordAsesor: (v: string) => void;
  nombreCompletoAsesor: string;
  setNombreCompletoAsesor: (v: string) => void;
  whatsappAsesor: string;
  setWhatsappAsesor: (v: string) => void;
  rolAsesor: string;
  setRolAsesor: (v: string) => void;
  setError: (v: string) => void;
  setSuccess: (v: string) => void;
  setKey: (v: string) => void;
}

function AdminAsesoresTab({
  asesores,
  editandoAsesor,
  setEditandoAsesor,
  emailAsesor,
  setEmailAsesor,
  passwordAsesor,
  setPasswordAsesor,
  nombreCompletoAsesor,
  setNombreCompletoAsesor,
  whatsappAsesor,
  setWhatsappAsesor,
  rolAsesor,
  setRolAsesor,
  setError,
  setSuccess,
  setKey,
}: AdminAsesoresTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAsesor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const primaryApp = getApp();
      const secondaryApp =
        getApps().find((a) => a.name === "Secondary") ||
        initializeApp(primaryApp.options, "Secondary");
      const secondaryAuth = getAuthSecondary(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        emailAsesor,
        passwordAsesor
      );
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        email: emailAsesor,
        nombreCompleto: nombreCompletoAsesor,
        rol: rolAsesor,
        whatsappNumber: whatsappAsesor,
      });

      try {
        await setDoc(doc(db, "perfiles_publicos", user.uid), {
          nombreCompleto: nombreCompletoAsesor,
          whatsappNumber: whatsappAsesor,
        });
      } catch (mirrorErr) {
        console.error(
          "Error al sincronizar perfiles_publicos (remediar con backfill):",
          mirrorErr
        );
      }

      try {
        await secondaryAuth.signOut?.();
      } catch {
        /* ignore logout errors */
      }
      try {
        await deleteApp(secondaryApp);
      } catch {
        /* ignore delete errors */
      }

      setSuccess("¡Asesor registrado exitosamente!");
      setEmailAsesor("");
      setPasswordAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
    } catch (err: unknown) {
      console.error("Error al registrar asesor:", err);
      const fbErr = err as { code?: string; message?: string };
      const errorMessage = getAsesorCreationErrorMessage(fbErr.code, fbErr.message);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAsesor = (asesor: Asesor) => {
    setEditandoAsesor(asesor);
    setEmailAsesor(asesor.email);
    setNombreCompletoAsesor(asesor.nombreCompleto);
    setWhatsappAsesor(asesor.whatsappNumber);
    setPasswordAsesor("");
    setKey("asesores");
  };

  const handleUpdateAsesor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!editandoAsesor) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "usuarios", editandoAsesor.id), {
        nombreCompleto: nombreCompletoAsesor,
        whatsappNumber: whatsappAsesor,
      });
      try {
        await updateDoc(doc(db, "perfiles_publicos", editandoAsesor.id), {
          nombreCompleto: nombreCompletoAsesor,
          whatsappNumber: whatsappAsesor,
        });
      } catch (mirrorErr) {
        console.error(
          "Error al sincronizar perfiles_publicos (remediar con backfill):",
          mirrorErr
        );
      }
      setSuccess("¡Asesor comercial actualizado exitosamente!");
      setEditandoAsesor(null);
      setEmailAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
      setPasswordAsesor("");
    } catch (err: unknown) {
      console.error("Error al actualizar asesor:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar asesor: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsesor = async (id: string) => {
    setError("");
    setSuccess("");
    if (
      window.confirm(
        "¿Eliminar asesor? Esto lo elimina del listado y su acceso al sistema."
      )
    ) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        try {
          await deleteDoc(doc(db, "perfiles_publicos", id));
        } catch (mirrorErr) {
          console.error(
            "Error al borrar perfiles_publicos (queda doc huérfano del perfil):",
            mirrorErr
          );
        }
        setSuccess("Asesor comercial eliminado exitosamente.");
      } catch (err: unknown) {
        console.error("Error al eliminar asesor:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar asesor: ${message}`);
      }
    }
  };

  return (
    <div className="admin-asesores-container d-flex flex-column gap-4">
      {/* ─── Form Card ─────────────────────────────── */}
      <div className="admin-card-pro">
        <div className="admin-card-header-clean mb-3">
          <div className="admin-card-header-icon advisors">
            <i className="bi bi-person-badge-fill" />
          </div>
          <div>
            <h3 className="admin-card-title mb-0">
              {editandoAsesor ? "Editar Asesor Comercial" : "Registrar Nuevo Asesor"}
            </h3>
            <p className="admin-card-subtitle mb-0">
              Crea credenciales de acceso para tu equipo de atención y ventas
            </p>
          </div>
        </div>

        <form onSubmit={editandoAsesor ? handleUpdateAsesor : handleAddAsesor}>
          <div className="row g-3">
            {/* Nombre Completo */}
            <div className="col-12 col-md-6">
              <label htmlFor="nombre-completo-asesor-input" className="form-label fw-semibold">
                Nombre y Apellidos <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person" />
                </span>
                <input
                  id="nombre-completo-asesor-input"
                  type="text"
                  className="form-control"
                  placeholder="Ej: Carlos Gómez"
                  value={nombreCompletoAsesor}
                  onChange={(e) => setNombreCompletoAsesor(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="col-12 col-md-6">
              <label htmlFor="email-asesor-input" className="form-label fw-semibold">
                Correo Electrónico (Usuario de acceso) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  id="email-asesor-input"
                  type="email"
                  className="form-control"
                  placeholder="asesor@giotech.com"
                  value={emailAsesor}
                  onChange={(e) => setEmailAsesor(e.target.value)}
                  required
                  disabled={!!editandoAsesor}
                />
              </div>
            </div>

            {/* Password (only for new) */}
            {!editandoAsesor && (
              <div className="col-12 col-md-6">
                <label htmlFor="password-asesor-input" className="form-label fw-semibold">
                  Contraseña de Ingreso <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-key" />
                  </span>
                  <input
                    id="password-asesor-input"
                    type="password"
                    className="form-control"
                    placeholder="Mínimo 6 caracteres"
                    value={passwordAsesor}
                    onChange={(e) => setPasswordAsesor(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* WhatsApp */}
            <div className={`col-12 ${!editandoAsesor ? "col-md-6" : "col-md-6"}`}>
              <label htmlFor="whatsapp-asesor-input" className="form-label fw-semibold">
                Número de WhatsApp Directo <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text text-success">
                  <i className="bi bi-whatsapp" />
                </span>
                <input
                  id="whatsapp-asesor-input"
                  type="text"
                  className="form-control"
                  placeholder="Ej: 573223652569"
                  value={whatsappAsesor}
                  onChange={(e) => setWhatsappAsesor(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Rol */}
            <div className="col-12 col-md-6">
              <label htmlFor="rol-asesor-select" className="form-label fw-semibold">Rol Asignado</label>
              <select
                id="rol-asesor-select"
                className="form-select"
                value={rolAsesor}
                onChange={(e) => setRolAsesor(e.target.value)}
                disabled={!!editandoAsesor}
              >
                <option value="asesor">Asesor Comercial (Gestión de ventas)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="col-12 d-flex gap-2 justify-content-end pt-2">
              {editandoAsesor && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() => {
                    setEditandoAsesor(null);
                    setEmailAsesor("");
                    setNombreCompletoAsesor("");
                    setWhatsappAsesor("");
                    setPasswordAsesor("");
                  }}
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
                    <span>Procesando...</span>
                  </>
                ) : editandoAsesor ? (
                  <>
                    <i className="bi bi-check2-circle" />
                    <span>Actualizar Asesor</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus-fill" />
                    <span>Registrar Asesor</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── List ──────────────────────────────────── */}
      <AdminAsesoresList
        asesores={asesores}
        onEdit={handleEditAsesor}
        onDelete={handleDeleteAsesor}
      />
    </div>
  );
}

export default AdminAsesoresTab;
