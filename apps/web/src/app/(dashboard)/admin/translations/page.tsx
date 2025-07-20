'use client'

import { AdminGuard } from '@/components/auth/admin-guard'
import TranslationAdmin from '@/components/admin/translation-admin'

export default function TranslationsAdminPage() {
  return (
    <AdminGuard 
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['MANAGE_TRANSLATIONS']}
    >
      <div className="container mx-auto py-6">
        <TranslationAdmin />
      </div>
    </AdminGuard>
  )
}