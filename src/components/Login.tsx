// src/components/Login.tsx
import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Row, Col, InputGroup } from "react-bootstrap";
import type { User } from "../types";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
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

      onLogin({ uid: user.uid, email: user.email || '', rol: userRole as User['rol'], nombreCompleto: userName ?? undefined });
      
      navigate("/panel");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "auth/wrong-password") {
        setError("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
      } else if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/invalid-email") {
        setError("Correo electrónico no registrado o inválido.");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Por favor, inténtalo más tarde.");
      } else {
        setError("Error al iniciar sesión: " + firebaseError.message);
      }
    }
  };

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
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "auth/user-not-found") {
        setError("No hay cuenta registrada con este correo electrónico.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Formato de correo electrónico inválido.");
      } else {
        setError("Error al enviar el correo de restablecimiento: " + firebaseError.message);
      }
    }
  };

  return (
    <Container className="py-5 login-page">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="login-card">
            <div className="login-brand-icon">
              <i className="bi bi-phone-fill"></i>
            </div>
            <h3 className="text-center mb-4 fw-bold" style={{ fontSize: '1.4rem', letterSpacing: '-0.02em', color: 'var(--gio-dark-text)' }}>Iniciar sesión</h3>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

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
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                    <i className={showPassword ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"}></i>
                  </Button>
                </InputGroup>
              </Form.Group>

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
};

export default Login;
