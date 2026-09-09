import {
  getFirebaseAuthErrorMessage,
  getPasswordResetErrorMessage,
  getAsesorCreationErrorMessage,
} from './auth-errors';

describe('auth-errors utility', () => {
  describe('getFirebaseAuthErrorMessage', () => {
    it('returns appropriate message for auth/invalid-credential', () => {
      expect(getFirebaseAuthErrorMessage('auth/invalid-credential')).toBe(
        'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos.'
      );
    });

    it('returns appropriate message for auth/wrong-password', () => {
      expect(getFirebaseAuthErrorMessage('auth/wrong-password')).toBe(
        'Contraseña incorrecta. Por favor, verifica tus datos.'
      );
    });

    it('returns appropriate message for auth/user-not-found', () => {
      expect(getFirebaseAuthErrorMessage('auth/user-not-found')).toBe(
        'Correo electrónico no registrado. Verifica tus datos.'
      );
    });

    it('returns appropriate message for auth/invalid-email', () => {
      expect(getFirebaseAuthErrorMessage('auth/invalid-email')).toBe(
        'El formato del correo electrónico es inválido.'
      );
    });

    it('returns appropriate message for auth/too-many-requests', () => {
      expect(getFirebaseAuthErrorMessage('auth/too-many-requests')).toBe(
        'Demasiados intentos fallidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intenta más tarde.'
      );
    });

    it('returns appropriate message for auth/user-disabled', () => {
      expect(getFirebaseAuthErrorMessage('auth/user-disabled')).toBe(
        'Esta cuenta de usuario ha sido deshabilitada por el administrador.'
      );
    });

    it('returns appropriate message for auth/network-request-failed', () => {
      expect(getFirebaseAuthErrorMessage('auth/network-request-failed')).toBe(
        'Error de conexión a internet. Verifica tu red e intenta nuevamente.'
      );
    });

    it('returns default fallback message for unknown error code or undefined', () => {
      expect(getFirebaseAuthErrorMessage('unknown-error')).toBe(
        'Error al iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.'
      );
      expect(getFirebaseAuthErrorMessage(undefined)).toBe(
        'Error al iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.'
      );
    });
  });

  describe('getPasswordResetErrorMessage', () => {
    it('returns appropriate message for auth/user-not-found', () => {
      expect(getPasswordResetErrorMessage('auth/user-not-found')).toBe(
        'No hay ninguna cuenta registrada con este correo electrónico.'
      );
    });

    it('returns appropriate message for auth/invalid-email', () => {
      expect(getPasswordResetErrorMessage('auth/invalid-email')).toBe(
        'El formato del correo electrónico es inválido.'
      );
    });

    it('returns appropriate message for auth/too-many-requests', () => {
      expect(getPasswordResetErrorMessage('auth/too-many-requests')).toBe(
        'Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo.'
      );
    });

    it('returns appropriate message for auth/network-request-failed', () => {
      expect(getPasswordResetErrorMessage('auth/network-request-failed')).toBe(
        'Error de conexión a internet. Verifica tu red e intenta nuevamente.'
      );
    });

    it('returns default fallback message for unknown code or undefined', () => {
      expect(getPasswordResetErrorMessage('some-code')).toBe(
        'Error al enviar el correo de restablecimiento.'
      );
      expect(getPasswordResetErrorMessage(undefined)).toBe(
        'Error al enviar el correo de restablecimiento.'
      );
    });
  });

  describe('getAsesorCreationErrorMessage', () => {
    it('returns appropriate message for auth/email-already-in-use', () => {
      expect(
        getAsesorCreationErrorMessage('auth/email-already-in-use')
      ).toBe('El correo electrónico ya se encuentra registrado por otro usuario o asesor.');
    });

    it('returns appropriate message for auth/weak-password', () => {
      expect(
        getAsesorCreationErrorMessage('auth/weak-password')
      ).toBe('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
    });

    it('returns appropriate message for auth/invalid-email', () => {
      expect(
        getAsesorCreationErrorMessage('auth/invalid-email')
      ).toBe('El formato del correo electrónico es inválido.');
    });

    it('returns custom default message when provided', () => {
      expect(
        getAsesorCreationErrorMessage('auth/internal-error', 'Custom Firebase error')
      ).toBe('Error al registrar asesor: Custom Firebase error');
    });

    it('returns fallback message when code is unknown and no message is provided', () => {
      expect(
        getAsesorCreationErrorMessage('unknown-error')
      ).toBe('Error al registrar asesor. Por favor verifica los datos e intenta nuevamente.');
    });
  });
});
