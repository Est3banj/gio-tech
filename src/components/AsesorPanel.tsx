// src/components/AsesorPanel.tsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

interface AsesorData {
  nombreCompleto?: string;
  whatsappNumber?: string;
  rol?: string;
}

const AsesorPanel: React.FC = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [asesorData, setAsesorData] = useState<AsesorData | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.uid) {
      const fetchAsesorData = async () => {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as AsesorData;
            setAsesorData(data);
            setWhatsappNumber(data.whatsappNumber || '');
          } else {
            console.warn(`Documento de usuario para ${currentUser.email} no encontrado en Firestore.`);
            setError("Tus datos no se encontraron en la base de datos. Contacta al administrador.");
          }

          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/?asesor=${currentUser.uid}`);
        } catch (err) {
          console.error("Error al cargar datos del asesor:", err);
          setError("Error al cargar tus datos. Asegúrate de que tu perfil exista en Firestore.");
        }
      };
      fetchAsesorData();
    } else {
      setAsesorData(null);
      setWhatsappNumber('');
      setShareLink('');
    }
  }, [currentUser]);

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentUser || !currentUser.uid) {
      setError("No hay usuario autenticado para actualizar.");
      return;
    }
    try {
      await updateDoc(doc(db, "usuarios", currentUser.uid), {
        whatsappNumber: whatsappNumber
      });
      setSuccess("Número de WhatsApp actualizado exitosamente!");
    } catch (err) {
      console.error("Error al actualizar WhatsApp:", err);
      const errorObj = err as { message?: string };
      setError(`Error al actualizar: ${errorObj.message}`);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setSuccess('¡Enlace copiado al portapapeles!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!currentUser) {
    return (
      <Container className="py-5 text-center">
        <p>Por favor, inicia sesión para acceder al Panel del Asesor.</p>
        <Button variant="primary" onClick={() => window.location.href = "/login"}>Ir a Login</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="text-center mb-4">Panel del Asesor - {asesorData?.nombreCompleto || currentUser?.email}</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="p-4 mb-4 shadow-sm">
        <h3 className="mb-3">Tu Información de Contacto</h3>
        <Form onSubmit={handleUpdateWhatsapp}>
          <Form.Group className="mb-3">
            <Form.Label>Número de WhatsApp Personal</Form.Label>
            <Form.Control
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Ej: 573XXYYYYYYY"
              required
            />
            <Form.Text className="text-muted">
              Este es el número al que los clientes te contactarán al usar tu enlace único.
            </Form.Text>
          </Form.Group>
          <Button variant="primary" type="submit">Actualizar Número</Button>
        </Form>
      </Card>

      <Card className="p-4 shadow-sm">
        <h3 className="mb-3">Tu Enlace Único de Compartir</h3>
        {shareLink ? (
          <>
            <p className="lead text-break">{shareLink}</p>
            <Button variant="outline-primary" onClick={copyShareLink}>
              <i className="bi bi-clipboard me-2"></i> Copiar Enlace
            </Button>
          </>
        ) : (
          <p className="text-muted">Generando tu enlace...</p>
        )}
      </Card>
    </Container>
  );
};

export default AsesorPanel;
