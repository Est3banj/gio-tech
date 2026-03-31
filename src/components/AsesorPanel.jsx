// src/components/AsesorPanel.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Asume que 'db' está exportado desde firebase.js
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // setDoc necesario para usuarios
import { getAuth } from 'firebase/auth'; // Importar getAuth para obtener el usuario actual

import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function AsesorPanel() { // No necesitas pasar 'usuario' como prop si lo obtienes de auth
  const auth = getAuth(); // Obtener la instancia de auth
  const currentUser = auth.currentUser; // Obtener el usuario actualmente logueado

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [asesorData, setAsesorData] = useState(null); // Para almacenar los datos completos del asesor

  useEffect(() => {
    // Este efecto se ejecuta cuando el usuario actual cambia (al iniciar sesión, por ejemplo)
    if (currentUser && currentUser.uid) {
      const fetchAsesorData = async () => {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAsesorData(data); // Guarda todos los datos del asesor
            setWhatsappNumber(data.whatsappNumber || ''); // Establece el número de WhatsApp
          } else {
            // Si el documento de usuario no existe en Firestore (ej. nuevo usuario no registrado aún por admin),
            // puedes manejarlo aquí, por ejemplo, creando un documento básico con el rol "asesor" por defecto.
            // Esto solo si no lo haces al registrar desde AdminPanel.
            // Para GIO TECH, asumimos que un admin registra al asesor en Firestore.
            console.warn(`Documento de usuario para ${currentUser.email} no encontrado en Firestore.`);
            setError("Tus datos no se encontraron en la base de datos. Contacta al administrador.");
          }

          // Generar el link único para compartir
          const baseUrl = window.location.origin; // Obtiene el dominio actual (ej: http://localhost:5173)
          setShareLink(`${baseUrl}/?asesor=${currentUser.uid}`);
        } catch (err) {
          console.error("Error al cargar datos del asesor:", err);
          setError("Error al cargar tus datos. Asegúrate de que tu perfil exista en Firestore.");
        }
      };
      fetchAsesorData();
    } else {
      // Si no hay usuario logueado, limpiamos los estados
      setAsesorData(null);
      setWhatsappNumber('');
      setShareLink('');
    }
  }, [currentUser]); // Depende del currentUser para cargar datos

  // Función para actualizar el número de WhatsApp del asesor
  const handleUpdateWhatsapp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentUser || !currentUser.uid) {
      setError("No hay usuario autenticado para actualizar.");
      return;
    }
    try {
      // Actualizar el documento del usuario en Firestore
      await updateDoc(doc(db, "usuarios", currentUser.uid), {
        whatsappNumber: whatsappNumber
      });
      setSuccess("Número de WhatsApp actualizado exitosamente!");
    } catch (err) {
      console.error("Error al actualizar WhatsApp:", err);
      setError(`Error al actualizar: ${err.message}`);
    }
  };

  // Función para copiar el enlace al portapapeles
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setSuccess('¡Enlace copiado al portapapeles!');
    setTimeout(() => setSuccess(''), 3000); // Borrar mensaje después de 3 segundos
  };

  // Renderizado condicional si no hay usuario logueado
  if (!currentUser) {
    return (
      <Container className="py-5 text-center">
        <p>Por favor, inicia sesión para acceder al Panel del Asesor.</p>
        <Button variant="primary" onClick={() => window.location.href = "/login"}>Ir a Login</Button>
      </Container>
    );
  }

  // Renderizado del panel para el asesor logueado
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
}

export default AsesorPanel;