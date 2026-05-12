// src/components/Login.jsx
import React, { useState } from "react";
// Importar 'setPersistence', 'browserSessionPersistence', 'browserLocalPersistence', 'sendPasswordResetEmail'
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
// Importar InputGroup para el ojo de la contraseña
import { Container, Form, Button, Card, Alert, Row, Col, InputGroup } from "react-bootstrap";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Nuevo estado para mensajes de éxito (ej. restablecer contraseña)

  // *** NUEVOS ESTADOS para funcionalidades ***
  const [showPassword, setShowPassword] = useState(false); // Para alternar visibilidad de contraseña
  const [rememberMe, setRememberMe] = useState(false); // Para el checkbox "Recordarme"

  const navigate = useNavigate();

  // Función para manejar el inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(""); // Limpiar mensajes de éxito previos
    try {
      // Configurar la persistencia de la sesión
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "usuarios", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = "cliente";
      let userName = user.email;
      if (userDocSnap.exists() && userDocSnap.data().rol) {
        const userData = userDocSnap.data();
        userRole = userData.rol;
        userName = userData.nombreCompleto || user.email;
      }

      onLogin({ uid: user.uid, email: user.email, rol: userRole, nombreCompleto: userName });
      
      // Redirigir al panel
      navigate("/panel");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      // Mensajes de error más amigables
      if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
      } else if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        setError("Correo electrónico no registrado o inválido.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Por favor, inténtalo más tarde.");
      } else {
        setError("Error al iniciar sesión: " + err.message);
      }
    }
  };

  // *** NUEVA FUNCIÓN para restablecer contraseña ***
  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico para restablecer la contraseña.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Se ha enviado un correo electrónico a tu dirección para restablecer la contraseña. Revisa tu bandeja de entrada.");
    } catch (err) {
      console.error("Error al restablecer contraseña:", err);
      if (err.code === "auth/user-not-found") {
        setError("No hay cuenta registrada con este correo electrónico.");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de correo electrónico inválido.");
      } else {
        setError("Error al enviar el correo de restablecimiento: " + err.message);
      }
    }
  };


  return (
    <Container className="py-5 login-page">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="login-card">
            {/* Ícono de marca */}
            <div className="login-brand-icon">
              <i className="bi bi-phone-fill"></i>
            </div>
            <h3 className="text-center mb-4 fw-bold" style={{ fontSize: '1.4rem', letterSpacing: '-0.02em', color: 'var(--gio-dark-text)' }}>Iniciar sesión</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>} {/* Mostrar mensajes de éxito */}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Correo</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Contraseña</Form.Label>
                {/* *** InputGroup para el toggle de visibilidad *** */}
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"} // Cambia el tipo según el estado
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                    <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i> {/* Icono de ojo */}
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* *** Checkbox "Recordarme" y Enlace "Olvidé mi contraseña" *** */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Group controlId="formBasicCheckbox">
                  <Form.Check
                    type="checkbox"
                    label="Recordarme"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </Form.Group>
                <Button variant="link" onClick={handlePasswordReset} className="p-0 text-decoration-none">
                  Olvidé mi contraseña
                </Button>
              </div>

              <Button variant="primary" type="submit" className="w-100">
                Ingresar
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;