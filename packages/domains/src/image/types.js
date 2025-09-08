export const DEFAULT_CONFIGS = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateVariants: true,
    variants: {
      thumbnail: { width: 64, height: 64 },
      medium: { width: 200, height: 200 },
    },
  },
  logo: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    generateVariants: true,
    variants: {
      thumbnail: { width: 64, height: 64 },
      medium: { width: 200, height: 200 },
      large: { width: 400, height: 400 },
    },
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    generateVariants: false,
  },
}
//# sourceMappingURL=types.js.map
