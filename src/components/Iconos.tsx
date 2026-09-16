/**
 * Iconos SVG inline. Se dibujan con `currentColor` para heredar el color del
 * contexto (menú activo, botones, etc.).
 */

interface Props {
  size?: number
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

export const IconoDashboard = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconoProyectos = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-5h6v5" />
    <path d="M9 10h.01M15 10h.01" />
  </svg>
)

export const IconoPermisos = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 14l2 2 4-4" />
  </svg>
)

export const IconoComites = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

export const IconoOrganismos = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M3 21h18" />
    <path d="M4 21V10l8-6 8 6v11" />
    <path d="M9 21v-6h6v6" />
  </svg>
)

export const IconoUsuarios = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  </svg>
)

export const IconoFiltro = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
)

export const IconoDescargar = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
)

export const IconoMas = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconoVolver = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

export const IconoMenu = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
)

export const IconoGuardar = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </svg>
)

export const IconoAprobaciones = ({ size = 18 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

export const IconoAdjunto = ({ size = 16 }: Props) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)
