'use client'

export const dynamic = 'force-dynamic'

import GroupManagementPanel from '@/components/admin/group-management-panel'
import { AdminGuard } from '@/components/auth/admin-guard'

export default function GroupManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['ADMIN_ACCESS', 'GROUP_MANAGE']}
      showUnauthorized={true}
    >
      <div className="py-6">
        <GroupManagementPanel />
      </div>
    </AdminGuard>
  )
}
