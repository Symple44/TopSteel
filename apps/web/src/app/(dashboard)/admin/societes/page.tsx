'use client'

export const dynamic = 'force-dynamic'

import { SocietesManagementPanel } from '@/components/admin/societes-management-panel'
import { AdminGuard } from '@/components/auth/admin-guard'

export default function SocietesManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN']}
      requiredPermissions={['SYSTEM_ADMIN']}
      showUnauthorized={true}
    >
      <div className="py-6">
        <SocietesManagementPanel />
      </div>
    </AdminGuard>
  )
}
