import { useApi } from '../hooks/useApi'
import { Contenido, Vacio } from './Estados'
import { fechaHora } from '../lib/format'
import type { HistorialItem } from '../shared/types'

/** Nombres de campo legibles para el historial. */
const ETIQUETAS_CAMPO: Record<string, string> = {
  nombre: 'Nombre del permiso',
  nombre_estandar: 'Nombre estándar',
  tipo_permiso: 'Tipo de permiso',
  n_expediente: 'N° de expediente',
  critico: 'Crítico',
  que_habilita: 'Qué habilita',
  habilitante_construccion: 'Habilitante para construcción',
  estado: 'Estado',
  fecha_ingreso: 'Fecha de ingreso',
  fecha_resolucion_estimada: 'Fecha estimada de resolución',
  fecha_resolucion: 'Fecha de resolución',
  tipo_resolucion: 'Tipo de resolución',
  hito_tramitacion: 'Hito de tramitación',
  incluido_catastro_hacienda: 'Incluido en catastro Hacienda',
  n_catastro: 'N° de catastro',
  observaciones: 'Observaciones',
}

function valorLegible(valor: string | null): string {
  if (valor === null) return '(vacío)'
  if (valor === 'true') return 'Sí'
  if (valor === 'false') return 'No'
  return valor
}

export function HistorialLista({ permisoId }: { permisoId: number | string }) {
  const { datos, cargando, error, recargar } = useApi<HistorialItem[]>(
    `/permisos/${permisoId}/historial`,
  )

  return (
    <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
      {(items) =>
        items.length === 0 ? (
          <Vacio
            titulo="Sin cambios registrados"
            texto="Cuando alguien edite este permiso, cada campo modificado va a quedar registrado acá."
          />
        ) : (
          <ul className="historial">
            {items.map((item) => (
              <li key={item.id} className="historial__item">
                <div className="historial__meta">
                  {fechaHora(item.created_at)} · {item.usuario_nombre ?? item.usuario_sub}
                </div>
                <div className="historial__cambio">
                  <span className="historial__campo">
                    {ETIQUETAS_CAMPO[item.campo] ?? item.campo}
                  </span>
                  {': '}
                  <span className="historial__antes">{valorLegible(item.valor_anterior)}</span>
                  {' → '}
                  <span className="historial__despues">{valorLegible(item.valor_nuevo)}</span>
                </div>
              </li>
            ))}
          </ul>
        )
      }
    </Contenido>
  )
}
