// src/components/Login.tsx
import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import { getFirebaseAuthErrorMessage, getPasswordResetErrorMessage } from "../utils/auth-errors";
import type { User } from "../types";

export interface LoginProps {
  onLogin?: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await login(email, password, rememberMe);
      if (onLogin && user) {
        onLogin(user);
      }
      navigate("/panel");
    } catch (err: unknown) {
      console.error("Error al iniciar sesión:", err);
      const firebaseError = err as { code?: string; message?: string };
      setError(getFirebaseAuthErrorMessage(firebaseError.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico para restablecer la contraseña.");
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Se ha enviado un correo electrónico a tu dirección para restablecer la contraseña. Revisa tu bandeja de entrada.");
    } catch (err: unknown) {
      console.error("Error al restablecer contraseña:", err);
      const firebaseError = err as { code?: string; message?: string };
      setError(getPasswordResetErrorMessage(firebaseError.code));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Container className="py-5 login-page d-flex align-items-center justify-content-center">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={5} xl={4}>
          <Card className="login-card shadow-lg border-0">
            <div className="login-brand-icon">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h3 className="text-center mb-1 fw-bold login-title">Iniciar sesión</h3>
            <p className="text-center text-muted small mb-4">Accede a tu panel administrativo o de asesor</p>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")} className="py-2 small">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess("")} className="py-2 small">
                {success}
              </Alert>
            )}

            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label className="fw-semibold small">Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="ejemplo@giotech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  autoComplete="email"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label className="fw-semibold small">Contraseña</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Group controlId="formBasicCheckbox" className="mb-0">
                  <Form.Check
                    type="checkbox"
                    label={<span className="small text-muted">Recordarme</span>}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                  />
                </Form.Group>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResetting || isSubmitting}
                  className="btn btn-link p-0 text-decoration-none small text-danger fw-semibold"
                >
                  {isResetting ? "Enviando..." : "¿Olvidaste tu contraseña?"}
                </button>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-2 fw-bold login-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Iniciando sesión...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
