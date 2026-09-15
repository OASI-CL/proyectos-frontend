/**
 * Recharts click handlers receive a chart-internal item (BarRectangleItem,
 * PieSectorDataItem, ScatterPointItem...) and the original data row sits
 * somewhere under `payload` — one or two levels deep depending on the chart
 * type. This walks down looking for the row that actually carries the field
 * we need, so click-to-filter works the same way in every chart.
 */
/**
 * Shortens long category labels so the axis does not overlap itself.
 * The full value stays available in the tooltip.
 */
export function truncateLabel(value: string, max = 22): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function pickChartRow<T extends object>(
  event: unknown,
  key: keyof T & string,
): T | undefined {
  let current: unknown = event

  for (let depth = 0; depth < 3; depth++) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return current as T
    }
    if (!current || typeof current !== 'object') return undefined
    current = (current as { payload?: unknown }).payload
  }

  return undefined
}
