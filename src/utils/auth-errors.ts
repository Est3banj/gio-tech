/**
 * Mapeo amigable y contextual de errores de Firebase Authentication al español.
 */
export const getFirebaseAuthErrorMessage = (code?: string): string => {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Correo electrónico o contraseña incorrectos. Por favor, verifica tus datos.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta. Por favor, verifica tus datos.';
    case 'auth/user-not-found':
      return 'Correo electrónico no registrado. Verifica tus datos.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico es inválido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por seguridad, tu cuenta ha sido bloqueada temporalmente. Intenta más tarde.';
    case 'auth/user-disabled':
      return 'Esta cuenta de usuario ha sido deshabilitada por el administrador.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Verifica tu red e intenta nuevamente.';
    default:
      return 'Error al iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.';
  }
};

/**
 * Mapeo de errores para el restablecimiento de contraseña.
 */
export const getPasswordResetErrorMessage = (code?: string): string => {
  switch (code) {
    case 'auth/user-not-found':
      return 'No hay ninguna cuenta registrada con este correo electrónico.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico es inválido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Verifica tu red e intenta nuevamente.';
    default:
      return 'Error al enviar el correo de restablecimiento.';
  }
};

/**
 * Mapeo de errores al crear o gestionar asesores en el panel administrativo.
 */
export const getAsesorCreationErrorMessage = (code?: string, defaultMessage?: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
    case 'auth/email-already-exists':
      return 'El correo electrónico ya se encuentra registrado por otro usuario o asesor.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico es inválido.';
    case 'auth/missing-password':
      return 'Por favor ingresa una contraseña válida para el asesor.';
    case 'auth/operation-not-allowed':
      return 'El registro de asesores no está habilitado en este momento.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Verifica tu red e intenta nuevamente.';
    default:
      return defaultMessage ? `Error al registrar asesor: ${defaultMessage}` : 'Error al registrar asesor. Por favor verifica los datos e intenta nuevamente.';
  }
};

