import { Amplify } from 'aws-amplify'
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  confirmResetPassword,
  signIn,
  signOut,
} from 'aws-amplify/auth'

/**
 * Cognito session handling.
 *
 * The app runs in one of two modes, decided by whether the Cognito
 * environment variables are set at build time:
 *
 *   configured   -> real sign-in. The ID token goes on every API call and the
 *                   backend verifies it against the User Pool's JWKS.
 *   not configured -> development mode. No login screen; the backend runs
 *                   AUTH_MODE=dev and the role comes from the switcher in the
 *                   top bar.
 *
 * Keeping both means the team can keep working locally without a pool, and
 * deploying is just a matter of setting the variables in Amplify.
 */

const USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined
const USER_POOL_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined

/** True when a real User Pool is wired up, i.e. login is required. */
export const cognitoConfigurado = Boolean(USER_POOL_ID && USER_POOL_CLIENT_ID)

if (cognitoConfigurado) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: USER_POOL_ID!,
        userPoolClientId: USER_POOL_CLIENT_ID!,
      },
    },
  })
}

/**
 * The ID token for the current session, or null if nobody is signed in.
 *
 * The backend verifies with `tokenUse: 'id'`, so it has to be the ID token —
 * the access token would be rejected. Amplify refreshes it internally when it
 * is close to expiring, so this is safe to call before every request.
 */
export async function obtenerIdToken(): Promise<string | null> {
  if (!cognitoConfigurado) return null
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch {
    return null
  }
}

export async function haySesion(): Promise<boolean> {
  if (!cognitoConfigurado) return true // dev mode: always "signed in"
  try {
    await getCurrentUser()
    return true
  } catch {
    return false
  }
}

export type ResultadoLogin =
  | { estado: 'ok' }
  | { estado: 'nueva_password_requerida' }
  | { estado: 'error'; mensaje: string }

/**
 * Signs in with email + password (SRP: the password itself never travels).
 *
 * Cognito puts admin-created users into a "must change password" challenge on
 * their first sign-in, which is why 'nueva_password_requerida' is a normal
 * outcome here and not an error.
 */
export async function iniciarSesion(email: string, password: string): Promise<ResultadoLogin> {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password,
      options: { authFlowType: 'USER_SRP_AUTH' },
    })

    if (isSignedIn) return { estado: 'ok' }

    if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return { estado: 'nueva_password_requerida' }
    }

    return {
      estado: 'error',
      mensaje: `Tu cuenta necesita un paso adicional (${nextStep?.signInStep ?? 'desconocido'}). Contactá a un administrador.`,
    }
  } catch (err) {
    return { estado: 'error', mensaje: mensajeCognito(err) }
  }
}

/** Second step for a first-time sign-in: set the definitive password. */
export async function definirNuevaPassword(password: string): Promise<ResultadoLogin> {
  try {
    const { isSignedIn } = await confirmSignIn({ challengeResponse: password })
    return isSignedIn
      ? { estado: 'ok' }
      : { estado: 'error', mensaje: 'No se pudo completar el cambio de contraseña.' }
  } catch (err) {
    return { estado: 'error', mensaje: mensajeCognito(err) }
  }
}

/** Sends the recovery code to the user's email. */
export async function pedirCodigoRecuperacion(email: string): Promise<ResultadoLogin> {
  try {
    await resetPassword({ username: email })
    return { estado: 'ok' }
  } catch (err) {
    return { estado: 'error', mensaje: mensajeCognito(err) }
  }
}

export async function confirmarRecuperacion(
  email: string,
  codigo: string,
  password: string,
): Promise<ResultadoLogin> {
  try {
    await confirmResetPassword({ username: email, confirmationCode: codigo, newPassword: password })
    return { estado: 'ok' }
  } catch (err) {
    return { estado: 'error', mensaje: mensajeCognito(err) }
  }
}

export async function cerrarSesion(): Promise<void> {
  if (!cognitoConfigurado) return
  await signOut()
}

/**
 * Cognito error names are not something to show a user. Translate the ones
 * that actually come up and fall back to the raw message for the rest.
 */
function mensajeCognito(err: unknown): string {
  const nombre = (err as { name?: string })?.name ?? ''
  const mensaje = (err as { message?: string })?.message ?? 'Error desconocido'

  switch (nombre) {
    case 'NotAuthorizedException':
      return 'Email o contraseña incorrectos.'
    case 'UserNotFoundException':
      // preventUserExistenceErrors is on, so Cognito normally hides this;
      // handled anyway in case the setting changes.
      return 'Email o contraseña incorrectos.'
    case 'PasswordResetRequiredException':
      return 'Tenés que restablecer tu contraseña. Usá “Olvidé mi contraseña”.'
    case 'UserNotConfirmedException':
      return 'Tu cuenta todavía no está confirmada. Contactá a un administrador.'
    case 'TooManyRequestsException':
    case 'LimitExceededException':
      return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
    case 'InvalidPasswordException':
      return 'La contraseña no cumple los requisitos: mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.'
    case 'CodeMismatchException':
      return 'El código no es correcto.'
    case 'ExpiredCodeException':
      return 'El código venció. Pedí uno nuevo.'
    default:
      return mensaje
  }
}
