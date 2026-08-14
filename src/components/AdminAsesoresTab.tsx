import { FormEvent } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getApp, getApps, initializeApp, deleteApp } from "firebase/app";
import { getAuth as getAuthSecondary } from "firebase/auth";
import { Card, Form, Button } from "react-bootstrap";
import { db } from "../firebase";
import { Asesor } from "../types";
import AdminAsesoresList from "./AdminAsesoresList";

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
  const handleAddAsesor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const primaryApp = getApp();
      const secondaryApp =
        getApps().find((a) => a.name === "Secondary") ||
        initializeApp(primaryApp.options, "Secondary");
      const secondaryAuth = getAuthSecondary(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        emailAsesor,
        passwordAsesor,
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
          mirrorErr,
        );
      }

      try {
        await secondaryAuth.signOut?.();
      } catch { /* ignore logout errors */ }
      try {
        await deleteApp(secondaryApp);
      } catch { /* ignore delete errors */ }

      setSuccess("Asesor registrado exitosamente!");
      setEmailAsesor("");
      setPasswordAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
    } catch (err: unknown) {
      console.error("Error al registrar asesor:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al registrar asesor: ${message}`);
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
          mirrorErr,
        );
      }
      setSuccess("Asesor actualizado exitosamente!");
      setEditandoAsesor(null);
      setEmailAsesor("");
      setNombreCompletoAsesor("");
      setWhatsappAsesor("");
      setPasswordAsesor("");
    } catch (err: unknown) {
      console.error("Error al actualizar asesor:", err);
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al actualizar asesor: ${message}`);
    }
  };

  const handleDeleteAsesor = async (id: string) => {
    setError("");
    setSuccess("");
    if (
      window.confirm(
        "¿Eliminar asesor? Esto lo elimina del listado y su acceso.",
      )
    ) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        try {
          await deleteDoc(doc(db, "perfiles_publicos", id));
        } catch (mirrorErr) {
          console.error(
            "Error al borrar perfiles_publicos (queda doc huérfano del perfil):",
            mirrorErr,
          );
        }
        setSuccess("Asesor eliminado exitosamente del listado.");
      } catch (err: unknown) {
        console.error("Error al eliminar asesor:", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(`Error al eliminar asesor: ${message}`);
      }
    }
  };

  return (
    <>
      <Card className="p-4 mb-4 shadow-sm">
        <h3 className="mb-3">
          {editandoAsesor ? "Editar Asesor" : "Registrar Nuevo Asesor"}
        </h3>
        <Form
          onSubmit={editandoAsesor ? handleUpdateAsesor : handleAddAsesor}
        >
          <Form.Group className="mb-3">
            <Form.Label>Nombre Completo</Form.Label>
            <Form.Control
              type="text"
              value={nombreCompletoAsesor}
              onChange={(e) => setNombreCompletoAsesor(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={emailAsesor}
              onChange={(e) => setEmailAsesor(e.target.value)}
              required
              disabled={!!editandoAsesor}
            />
          </Form.Group>
          {!editandoAsesor && (
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={passwordAsesor}
                onChange={(e) => setPasswordAsesor(e.target.value)}
                required
              />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Número de WhatsApp</Form.Label>
            <Form.Control
              type="text"
              value={whatsappAsesor}
              onChange={(e) => setWhatsappAsesor(e.target.value)}
              placeholder="Ej: 573XXYYYYYYY"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              value={rolAsesor}
              onChange={(e) => setRolAsesor(e.target.value)}
              disabled={!!editandoAsesor}
            >
              <option value="asesor">Asesor (Acceso total)</option>
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit" className="me-2">
            {editandoAsesor ? "Actualizar Asesor" : "Registrar Asesor"}
          </Button>
          {editandoAsesor && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditandoAsesor(null);
                setEmailAsesor("");
                setNombreCompletoAsesor("");
                setWhatsappAsesor("");
                setPasswordAsesor("");
              }}
            >
              Cancelar Edición
            </Button>
          )}
        </Form>
      </Card>

      <AdminAsesoresList
        asesores={asesores}
        onEdit={handleEditAsesor}
        onDelete={handleDeleteAsesor}
      />
    </>
  );
}

export default AdminAsesoresTab;
