// packages/utils/src/lib/formatters.ts
export function formatCurrency(amount: number, currency = 'EUR', locale = 'fr-FR'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDate(date: Date | string, locale = 'fr-FR'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale);
  } catch {
    return String(date);
  }
}

export function formatNumber(num: number, locale = 'fr-FR'): string {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return String(num);
  }
}
