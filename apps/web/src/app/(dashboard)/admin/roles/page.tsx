'use client'

export const dynamic = 'force-dynamic'

import RoleManagementPanel from '@/components/admin/role-management-panel'
import { AdminGuard } from '@/components/auth/admin-guard'

export default function RoleManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN']}
      requiredPermissions={['SYSTEM_ADMIN', 'USER_DELETE']}
      showUnauthorized={true}
    >
      <div className="py-6">
        <RoleManagementPanel />
      </div>
    </AdminGuard>
  )
}
