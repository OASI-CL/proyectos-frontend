import { useAuth } from '../hooks/useAuth'
import { ETIQUETAS_ROL } from '../lib/format'

/**
 * Gestión de usuarios.
 *
 * Esta pantalla depende de Cognito: los usuarios se crean en el User Pool y
 * la tabla `usuarios` de la base solo guarda el scope (a qué empresa u
 * organismo pertenece cada persona). Mientras el User Pool no exista, no hay
 * nada real que administrar, así que la página documenta el modelo de roles
 * en vez de simular un CRUD que todavía no puede funcionar.
 */
export function AdminUsuarios() {
  const { esAdmin } = useAuth()

  if (!esAdmin) {
    return (
      <div className="alerta alerta--aviso">
        Esta sección es solo para administradores.
      </div>
    )
  }

  const roles: { rol: string; puede: string }[] = [
    { rol: 'admin', puede: 'Todo. Gestiona usuarios, abre y cierra comités, edita catálogos.' },
    { rol: 'oasi', puede: 'Lee todo. Crea y edita proyectos y permisos. Arma la agenda de comité.' },
    { rol: 'organismo_lector', puede: 'Solo lectura, y solo de los permisos de su organismo.' },
    { rol: 'empresa', puede: 'Solo sus propios proyectos. Crea proyectos y les agrega permisos.' },
  ]

  return (
    <>
      <div className="pagina-header">
        <div className="pagina-header__texto">
          <h1>Usuarios</h1>
          <p className="pagina-header__descripcion">
            Roles del sistema y cómo se asignan.
          </p>
        </div>
      </div>

      <div className="alerta alerta--aviso">
        <div>
          <strong>Pendiente de conectar con Cognito.</strong>
          <div style={{ marginTop: 4 }}>
            Los usuarios se crean en el User Pool de AWS Cognito y sus grupos definen el rol.
            La tabla <code>usuarios</code> de la base complementa con el scope (empresa u
            organismo). Mientras el User Pool no esté creado, el backend corre en modo
            desarrollo y el rol se simula con el selector de la barra superior.
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2>Roles y permisos</h2>
        </div>
        <div className="panel__cuerpo panel__cuerpo--sin-padding">
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Rol</th>
                  <th>Qué puede hacer</th>
                  <th style={{ width: 200 }}>Grupo en Cognito</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.rol}>
                    <td className="celda-principal">{ETIQUETAS_ROL[r.rol]}</td>
                    <td>{r.puede}</td>
                    <td><code className="badge-id">{r.rol}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h2>Cómo dar de alta a alguien</h2>
        </div>
        <div className="panel__cuerpo">
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Crear el usuario en el User Pool de Cognito.</li>
            <li>Agregarlo al grupo que corresponda: <code className="badge-id">admin</code>,{' '}
              <code className="badge-id">oasi</code>,{' '}
              <code className="badge-id">organismo_lector</code> o{' '}
              <code className="badge-id">empresa</code>.
            </li>
            <li>
              Insertar la fila en la tabla <code>usuarios</code> con su <code>cognito_sub</code> y,
              si el rol lo requiere, el <code>empresa_id</code> u <code>organismo_id</code> que
              define qué datos puede ver.
            </li>
          </ol>
        </div>
      </div>
    </>
  )
}
