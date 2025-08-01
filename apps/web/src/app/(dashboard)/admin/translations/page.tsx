'use client'

export const dynamic = 'force-dynamic'

import TranslationAdmin from '@/components/admin/translation-admin'
import { AdminGuard } from '@/components/auth/admin-guard'

export default function TranslationsAdminPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['MANAGE_TRANSLATIONS']}
    >
      <div className="py-6">
        <TranslationAdmin />
      </div>
    </AdminGuard>
  )
}
