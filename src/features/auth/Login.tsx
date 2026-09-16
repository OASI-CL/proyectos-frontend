import { useState } from 'react'
import {
  confirmarRecuperacion,
  definirNuevaPassword,
  iniciarSesion,
  pedirCodigoRecuperacion,
} from '../../lib/auth'

type Paso = 'login' | 'nueva_password' | 'pedir_codigo' | 'confirmar_codigo'

/**
 * Sign-in screen.
 *
 * Covers the three flows a real Cognito pool actually produces:
 *   - normal sign-in
 *   - first sign-in for an admin-created user, which Cognito forces into a
 *     "set your password" challenge
 *   - forgotten password (code by email, then new password)
 */
export function Login({ onLogin }: { onLogin: () => void }) {
  const [paso, setPaso] = useState<Paso>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function ejecutar(accion: () => Promise<void>) {
    setEnviando(true)
    setError(null)
    try {
      await accion()
    } finally {
      setEnviando(false)
    }
  }

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault()
    ejecutar(async () => {
      const r = await iniciarSesion(email.trim(), password)
      if (r.estado === 'ok') onLogin()
      else if (r.estado === 'nueva_password_requerida') {
        setPassword('')
        setPassword2('')
        setPaso('nueva_password')
        setAviso('Es tu primer ingreso: definí una contraseña nueva.')
      } else setError(r.mensaje)
    })
  }

  const submitNuevaPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    ejecutar(async () => {
      const r = await definirNuevaPassword(password)
      if (r.estado === 'ok') onLogin()
      else setError(r.estado === 'error' ? r.mensaje : 'No se pudo completar.')
    })
  }

  const submitPedirCodigo = (e: React.FormEvent) => {
    e.preventDefault()
    ejecutar(async () => {
      const r = await pedirCodigoRecuperacion(email.trim())
      if (r.estado === 'ok') {
        setPaso('confirmar_codigo')
        setAviso('Te mandamos un código al correo.')
      } else setError(r.estado === 'error' ? r.mensaje : 'No se pudo enviar el código.')
    })
  }

  const submitConfirmarCodigo = (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    ejecutar(async () => {
      const r = await confirmarRecuperacion(email.trim(), codigo.trim(), password)
      if (r.estado === 'ok') {
        setPaso('login')
        setPassword('')
        setPassword2('')
        setCodigo('')
        setAviso('Contraseña actualizada. Ya podés entrar.')
      } else setError(r.estado === 'error' ? r.mensaje : 'No se pudo cambiar la contraseña.')
    })
  }

  return (
    <div className="login">
      <div className="login__caja">
        <div className="login__marca">
          <img
            src="/logo-ministerio.png"
            alt=""
            className="login__logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div>
            <div className="login__titulo">OASI</div>
            <div className="login__sub">Catastro seguimiento permisos sectoriales</div>
          </div>
        </div>

        {aviso && <div className="alerta alerta--info">{aviso}</div>}
        {error && <div className="alerta alerta--error">{error}</div>}

        {paso === 'login' && (
          <form onSubmit={submitLogin} className="columna" style={{ gap: 14 }}>
            <div className="campo">
              <label className="campo__label" htmlFor="l-email">Correo institucional</label>
              <input
                id="l-email"
                className="input"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo__label" htmlFor="l-pass">Contraseña</label>
              <input
                id="l-pass"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primario" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
            <button
              type="button"
              className="btn btn--texto"
              onClick={() => {
                setPaso('pedir_codigo')
                setError(null)
                setAviso(null)
              }}
            >
              Olvidé mi contraseña
            </button>
          </form>
        )}

        {paso === 'nueva_password' && (
          <form onSubmit={submitNuevaPassword} className="columna" style={{ gap: 14 }}>
            <p className="texto-sm texto-suave mb-0">
              Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.
            </p>
            <div className="campo">
              <label className="campo__label" htmlFor="n-pass">Contraseña nueva</label>
              <input
                id="n-pass"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo__label" htmlFor="n-pass2">Repetir contraseña</label>
              <input
                id="n-pass2"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar y entrar'}
            </button>
          </form>
        )}

        {paso === 'pedir_codigo' && (
          <form onSubmit={submitPedirCodigo} className="columna" style={{ gap: 14 }}>
            <div className="campo">
              <label className="campo__label" htmlFor="r-email">Correo institucional</label>
              <input
                id="r-email"
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primario" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviarme el código'}
            </button>
            <button type="button" className="btn btn--texto" onClick={() => setPaso('login')}>
              Volver
            </button>
          </form>
        )}

        {paso === 'confirmar_codigo' && (
          <form onSubmit={submitConfirmarCodigo} className="columna" style={{ gap: 14 }}>
            <div className="campo">
              <label className="campo__label" htmlFor="c-codigo">Código recibido</label>
              <input
                id="c-codigo"
                className="input"
                inputMode="numeric"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo__label" htmlFor="c-pass">Contraseña nueva</label>
              <input
                id="c-pass"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="campo">
              <label className="campo__label" htmlFor="c-pass2">Repetir contraseña</label>
              <input
                id="c-pass2"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primario" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
            <button type="button" className="btn btn--texto" onClick={() => setPaso('login')}>
              Volver
            </button>
          </form>
        )}

        <div className="login__pie">Gobierno de Chile</div>
      </div>
    </div>
  )
}
