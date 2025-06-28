// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  extends: '@erp/config/tailwind/web',
} satisfies Config

export default config