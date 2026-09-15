export function formatGridCurrency(value: number, currency = 'USD') {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: value >= 1_000_000 ? 'compact' : 'standard',
  }).format(value)
}

/** Compact currency for chart axes / tooltips (e.g. $1.2M). */
export function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function formatPercent(value: number, alreadyRatio = true) {
  const pct = alreadyRatio ? value * 100 : value
  return `${formatNumber(pct, 1)}%`
}

export function formatDelta(value: number) {
  const pct = value * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${formatNumber(pct, 1)}%`
}

/** Syncfusion chart axis labelFormat for USD (whole dollars). */
export const chartCurrencyAxis = 'C0'
/** Syncfusion chart axis labelFormat for ratios shown as percent. */
export const chartPercentAxis = 'P0'
