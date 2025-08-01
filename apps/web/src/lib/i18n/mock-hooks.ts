// Mock i18n hooks for build time
export function useTranslation(_namespace?: string) {
  return {
    t: (key: string) => key,
    plural: (key: string, count: number) => `${key} (${count})`,
    currentLanguage: { code: 'fr', name: 'Français', direction: 'ltr' },
    changeLanguage: () => {},
    setLanguage: () => {},
    supportedLanguages: [],
    isLoading: false,
  }
}

export function useLanguage() {
  return {
    current: { code: 'fr', name: 'Français', direction: 'ltr' },
    supported: [],
    change: () => {},
    isLoading: false,
  }
}

export function useFormatting() {
  return {
    formatDate: (date: Date) => date.toLocaleDateString(),
    formatNumber: (number: number) => number.toString(),
    formatCurrency: (amount: number) => `€${amount}`,
    formatPercentage: (value: number) => `${value}%`,
    formatFileSize: (bytes: number) => `${bytes} B`,
    formatRelativeTime: (date: Date) => date.toLocaleDateString(),
    locale: 'fr',
  }
}

export function useDirection() {
  return {
    direction: 'ltr' as const,
    isRTL: false,
    isLTR: true,
  }
}
