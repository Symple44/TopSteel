// packages/utils/src/format/number.ts
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)} %`
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}min`
  }

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h${mins.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  const sizes = ['o', 'Ko', 'Mo', 'Go']
  if (bytes === 0) return '0 o'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`
}
