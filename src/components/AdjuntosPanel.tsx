import { useRef, useState } from 'react'
import axios from 'axios'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { Contenido, Vacio } from './Estados'
import { IconoAdjunto } from './Iconos'
import { api, mensajeError } from '../lib/api'
import { fechaHora, numero } from '../lib/format'

interface Adjunto {
  id: number
  nombre_archivo: string
  s3_key: string
  content_type: string | null
  size_bytes: number | null
  created_at: string
  subido_por_nombre: string | null
  url: string | null
}

function tamanio(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${numero(bytes / 1024, 1)} KB`
  return `${numero(bytes / (1024 * 1024), 1)} MB`
}

/**
 * Adjuntos del permiso (resoluciones, documentos).
 *
 * La subida va directo del navegador a S3 con una URL prefirmada que entrega
 * el backend, así el archivo no pasa por Lambda. Si el bucket no está
 * configurado (S3_BUCKET_ADJUNTOS vacío), el backend responde 503 y acá se
 * muestra el aviso correspondiente.
 */
export function AdjuntosPanel({ permisoId }: { permisoId: number | string }) {
  const { puedeEditar } = useAuth()
  const { datos, cargando, error, recargar } = useApi<Adjunto[]>(`/adjuntos/permiso/${permisoId}`)
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'ok'; texto: string } | null>(null)

  async function subir(archivo: File) {
    setSubiendo(true)
    setMensaje(null)
    try {
      // 1. Pedir la URL prefirmada
      const { data: firma } = await api.post(`/adjuntos/permiso/${permisoId}/url-subida`, {
        nombre_archivo: archivo.name,
        content_type: archivo.type,
      })

      // 2. Subir directo a S3 (sin el interceptor de axios, es otro host)
      await axios.put(firma.url, archivo, {
        headers: archivo.type ? { 'Content-Type': archivo.type } : undefined,
      })

      // 3. Registrar el adjunto en la base
      await api.post(`/adjuntos/permiso/${permisoId}`, {
        nombre_archivo: archivo.name,
        s3_key: firma.s3_key,
        content_type: archivo.type,
        size_bytes: archivo.size,
      })

      setMensaje({ tipo: 'ok', texto: 'Archivo subido correctamente.' })
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function eliminar(id: number) {
    if (!window.confirm('¿Eliminar este archivo? No se puede deshacer.')) return
    try {
      await api.delete(`/adjuntos/${id}`)
      recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: mensajeError(err) })
    }
  }

  return (
    <>
      {mensaje && (
        <div className={`alerta alerta--${mensaje.tipo === 'ok' ? 'ok' : 'error'}`} style={{ marginBottom: 16 }}>
          {mensaje.texto}
        </div>
      )}

      {puedeEditar && (
        <div className="fila fila--separada" style={{ marginBottom: 16 }}>
          <div className="texto-sm texto-suave">
            Resoluciones, oficios y documentos asociados a este permiso.
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                if (archivo) subir(archivo)
              }}
            />
            <button
              type="button"
              className="btn btn--primario btn--sm"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo}
            >
              <IconoAdjunto /> {subiendo ? 'Subiendo…' : 'Adjuntar archivo'}
            </button>
          </div>
        </div>
      )}

      <Contenido cargando={cargando} error={error} datos={datos} recargar={recargar}>
        {(items) =>
          items.length === 0 ? (
            <Vacio
              titulo="Sin adjuntos"
              texto={puedeEditar ? 'Todavía no se subió ningún documento a este permiso.' : 'Este permiso no tiene documentos adjuntos.'}
            />
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Subido por</th>
                    <th>Fecha</th>
                    <th className="der">Tamaño</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.url ? (
                          <a href={a.url} target="_blank" rel="noreferrer">{a.nombre_archivo}</a>
                        ) : (
                          <span title="S3 no está configurado en el backend">{a.nombre_archivo}</span>
                        )}
                      </td>
                      <td className="texto-suave">{a.subido_por_nombre ?? '—'}</td>
                      <td className="nowrap texto-suave">{fechaHora(a.created_at)}</td>
                      <td className="der texto-suave">{tamanio(a.size_bytes)}</td>
                      <td className="der">
                        {puedeEditar && (
                          <button type="button" className="btn btn--sm btn--peligro" onClick={() => eliminar(a.id)}>
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Contenido>
    </>
  )
}
