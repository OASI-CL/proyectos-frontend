import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fecha } from '../lib/format'
import { EstadoBadge, IdExcel } from './SemaforoBadge'
import type { VPermiso, VProyecto } from '../shared/types'

/**
 * Project timeline: the four milestones (Ingreso SEA, RCA aprobada,
 * Construcción, Operación) on a horizontal axis, with a dot per permit that
 * enables construction (`habilitante_construccion`). Other permits are left
 * out on purpose.
 *
 * A milestone is coloured when the project reached it and grey when it did
 * not. The data has no date for "Ingreso SEA" or "RCA aprobada", so those two
 * are inferred:
 *   - RCA aprobada: `estado_ambiental` mentions "aprob", or the project is
 *     already in construction/operation (it can't be without an RCA).
 *   - Ingreso SEA: RCA reached, or any `estado_ambiental` recorded at all.
 *   - Construcción / Operación: current stage, or the start date is past.
 * If OASI later adds real dates for SEA/RCA, only `hitos()` needs to change.
 *
 * Dots sit between "RCA aprobada" and "Construcción" (a construction-enabling
 * permit is processed after the RCA and before construction), ordered by
 * fecha_ingreso, with that date below each dot.
 */

interface Hito {
  etiqueta: string
  alcanzado: boolean
  fecha: string | null
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

function hitos(p: VProyecto): Hito[] {
  const hoy = hoyISO()
  const etapa = p.etapa_codigo
  const enOperacion = etapa === 'operacion' || (!!p.fecha_inicio_operacion && p.fecha_inicio_operacion <= hoy)
  const enConstruccion =
    enOperacion || etapa === 'construccion' || (!!p.fecha_inicio_construccion && p.fecha_inicio_construccion <= hoy)
  const rca = enConstruccion || /aprob/i.test(p.estado_ambiental ?? '')
  const sea = rca || !!p.estado_ambiental?.trim()

  return [
    { etiqueta: 'Ingreso SEA', alcanzado: sea, fecha: null },
    { etiqueta: 'RCA aprobada', alcanzado: rca, fecha: null },
    { etiqueta: 'Construcción', alcanzado: enConstruccion, fecha: p.fecha_inicio_construccion },
    { etiqueta: 'Operación', alcanzado: enOperacion, fecha: p.fecha_inicio_operacion },
  ]
}

const COLOR_ESTADO: Record<string, string> = {
  Resuelto: '#2E7D32',
  Pendiente: '#1F9BB0',
  Descartado: '#9E9E9E',
  Desistido: '#9E9E9E',
}

// Horizontal position (%) of each milestone; the dots go between index 1 and 2.
const POS = [12, 37, 72, 92]
const ALTO = 190
const EJE_Y = 140

export function LineaTiempoProyecto({ proyecto, permisos }: { proyecto: VProyecto; permisos: VPermiso[] }) {
  const navigate = useNavigate()
  const lista = hitos(proyecto)
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(null)

  const habilitantes = permisos.filter((x) => x.habilitante_construccion)

  // Permits with the same entry date share one dot (one project has 163
  // habilitantes). The dot shows how many it holds.
  const porFecha = new Map<string, VPermiso[]>()
  for (const x of habilitantes) {
    const k = x.fecha_ingreso ?? ''
    porFecha.set(k, [...(porFecha.get(k) ?? []), x])
  }
  const grupos = [...porFecha.entries()]
    .sort(([a], [b]) => (a || '9999').localeCompare(b || '9999'))
    .map(([f, xs]) => ({ fecha: f || null, permisos: xs }))

  const desde = POS[1] + 4
  const hasta = POS[2] - 4
  const paso = grupos.length > 1 ? (hasta - desde) / (grupos.length - 1) : 0
  // ~70px per dot inside a segment that is 27% of the width -> scroll horizontally past that.
  const anchoMin = Math.max(560, Math.ceil((grupos.length * 70) / ((hasta - desde) / 100)))

  return (
    <div>
      <div style={{ position: 'relative', height: ALTO, minWidth: anchoMin }}>
        {/* Eje */}
        <div
          style={{
            position: 'absolute', left: '4%', right: '3%', top: EJE_Y,
            height: 2, background: '#C0504D',
          }}
        />
        <div
          style={{
            position: 'absolute', right: 'calc(3% - 6px)', top: EJE_Y - 5,
            width: 0, height: 0, borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent', borderLeft: '9px solid #C0504D',
          }}
        />

        {/* Hitos */}
        {lista.map((h, i) => {
          const color = h.alcanzado ? '#1F4E79' : '#BDBDBD'
          return (
            <div key={h.etiqueta}>
              <div
                style={{
                  position: 'absolute', left: `${POS[i]}%`, top: 30, bottom: 10,
                  width: 2, marginLeft: -1, background: color,
                }}
              />
              <div
                style={{
                  position: 'absolute', left: `${POS[i]}%`, top: 0,
                  transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap',
                  color: h.alcanzado ? '#1F4E79' : '#9E9E9E', fontWeight: h.alcanzado ? 700 : 500,
                  fontSize: 14,
                }}
              >
                {h.etiqueta}
                <div style={{ fontSize: 11, fontWeight: 400 }}>
                  {h.fecha ? fecha(h.fecha) : h.alcanzado ? '' : 'pendiente'}
                </div>
              </div>
            </div>
          )
        })}

        {/* Permisos habilitantes */}
        {grupos.map((g, i) => {
          const clave = g.fecha ?? 'sin-fecha'
          const left = grupos.length === 1 ? (desde + hasta) / 2 : desde + paso * i
          // Alternate heights so neighbouring date labels don't overlap.
          const top = i % 2 === 0 ? 62 : 92
          const n = g.permisos.length
          const unico = n === 1 ? g.permisos[0] : null
          // A group's colour: pending wins, so an open permit is never hidden behind a resolved one.
          const estado = g.permisos.some((x) => x.estado === 'Pendiente') ? 'Pendiente' : g.permisos[0].estado
          const abierto = grupoAbierto === clave
          return (
            <button
              key={clave}
              type="button"
              onClick={() =>
                unico ? navigate(`/permisos/${unico.id}`) : setGrupoAbierto(abierto ? null : clave)
              }
              title={
                unico
                  ? unico.nombre
                  : `Ingreso: ${fecha(g.fecha)} · ${n} permiso(s). Clic para ver la lista`
              }
              style={{
                position: 'absolute', left: `${left}%`, top,
                transform: 'translateX(-50%)', background: 'none', border: 0,
                padding: 0, cursor: 'pointer', textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: n > 1 ? 22 : 14, height: n > 1 ? 22 : 14, margin: '0 auto',
                  borderRadius: '50%', background: COLOR_ESTADO[estado] ?? '#1F9BB0',
                  boxShadow: abierto
                    ? '0 0 0 2px #fff, 0 0 0 4px #1F4E79'
                    : '0 0 0 2px #fff, 0 1px 3px rgba(20, 30, 60, 0.35)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                }}
              >
                {n}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: '#555', whiteSpace: 'nowrap', marginTop: 2 }}>
                {g.fecha ? fecha(g.fecha) : 'sin fecha'}
              </span>
            </button>
          )
        })}
      </div>

      {grupoAbierto && (
        <GrupoDesplegado
          grupo={grupos.find((g) => (g.fecha ?? 'sin-fecha') === grupoAbierto)!}
          onClose={() => setGrupoAbierto(null)}
          onAbrirPermiso={(id) => navigate(`/permisos/${id}`)}
        />
      )}

      <div className="texto-suave texto-sm" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
        {habilitantes.length === 0 ? (
          <span>Este proyecto no tiene permisos reportados como habilitantes.</span>
        ) : (
          <>
            <span>
              {habilitantes.length} permiso(s) reportado(s) como habilitantes. Fecha de ingreso bajo cada punto, el
              número es cuántos ingresaron ese día. Clic en un punto con más de uno para ver la lista
            </span>
            <Leyenda color={COLOR_ESTADO.Pendiente} texto="Pendiente" />
            <Leyenda color={COLOR_ESTADO.Resuelto} texto="Resuelto" />
            <Leyenda color={COLOR_ESTADO.Descartado} texto="Descartado / Desistido" />
          </>
        )}
        <Leyenda color="#BDBDBD" texto="Hito no alcanzado" />
      </div>
    </div>
  )
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {texto}
    </span>
  )
}

/** The permits ingresados on one date, when a grouped dot is clicked — just that group, not every habilitante of the project. */
function GrupoDesplegado({
  grupo,
  onClose,
  onAbrirPermiso,
}: {
  grupo: { fecha: string | null; permisos: VPermiso[] }
  onClose: () => void
  onAbrirPermiso: (id: number) => void
}) {
  return (
    <div className="panel" style={{ marginTop: 12, background: 'var(--azul-palido)', border: '1px solid var(--azul)' }}>
      <div className="panel__header" style={{ padding: '10px 14px' }}>
        <h3 style={{ margin: 0, fontSize: 13.5 }}>
          Ingresaron el {fecha(grupo.fecha)} ({grupo.permisos.length})
        </h3>
        <button type="button" className="btn btn--sm btn--texto" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="panel__cuerpo" style={{ padding: '6px 14px 12px' }}>
        {grupo.permisos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAbrirPermiso(p.id)}
            className="fila"
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 0,
              padding: '6px 0', cursor: 'pointer', gap: 8, justifyContent: 'space-between',
            }}
          >
            <span className="fila" style={{ gap: 8, minWidth: 0 }}>
              <IdExcel valor={p.id_excel} />
              <span className="truncar">{p.nombre}</span>
            </span>
            <EstadoBadge valor={p.estado} />
          </button>
        ))}
      </div>
    </div>
  )
}
