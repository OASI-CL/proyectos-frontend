import { useNavigate } from 'react-router-dom'
import { fecha } from '../lib/format'
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
          const left = grupos.length === 1 ? (desde + hasta) / 2 : desde + paso * i
          // Alternate heights so neighbouring date labels don't overlap.
          const top = i % 2 === 0 ? 62 : 92
          const n = g.permisos.length
          const unico = n === 1 ? g.permisos[0] : null
          // A group's colour: pending wins, so an open permit is never hidden behind a resolved one.
          const estado = g.permisos.some((x) => x.estado === 'Pendiente') ? 'Pendiente' : g.permisos[0].estado
          const detalle = g.permisos
            .slice(0, 12)
            .map((x) => `• ${x.nombre} (${x.estado})`)
            .join('\n')
          return (
            <button
              key={g.fecha ?? 'sin-fecha'}
              type="button"
              onClick={() =>
                navigate(unico ? `/permisos/${unico.id}` : `/permisos?proyecto_id=${proyecto.id}&habilitante=true`)
              }
              title={`Ingreso: ${fecha(g.fecha)} · ${n} permiso(s)\n${detalle}${n > 12 ? `\n… y ${n - 12} más` : ''}`}
              style={{
                position: 'absolute', left: `${left}%`, top,
                transform: 'translateX(-50%)', background: 'none', border: 0,
                padding: 0, cursor: 'pointer', textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 16, height: 16, padding: n > 1 ? '0 4px' : 0, margin: '0 auto',
                  borderRadius: 8, background: COLOR_ESTADO[estado] ?? '#1F9BB0',
                  border: '1.5px solid #1F4E79', color: '#fff', fontSize: 10, fontWeight: 700,
                }}
              >
                {n > 1 ? n : ''}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: '#555', whiteSpace: 'nowrap', marginTop: 2 }}>
                {g.fecha ? fecha(g.fecha) : 'sin fecha'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="texto-suave texto-sm" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
        {habilitantes.length === 0 ? (
          <span>Este proyecto no tiene permisos reportados como críticos/habilitantes.</span>
        ) : (
          <>
            <span>
              {habilitantes.length} permiso(s) reportado(s) como críticos/habilitantes · fecha de ingreso bajo cada punto
              {grupos.length < habilitantes.length && ' · el número indica cuántos ingresaron ese día'}
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
