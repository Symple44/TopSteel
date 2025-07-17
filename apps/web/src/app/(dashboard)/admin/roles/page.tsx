'use client'

import RoleManagementPanel from '@/components/admin/role-management-panel'
import { PermissionGuard } from '@/components/auth/permission-guard'

export default function RoleManagementPage() {
  return (
    <div className="container mx-auto py-6">
      {/* <PermissionGuard 
        permission="ROLE_VIEW"
        roles={['SUPER_ADMIN', 'ADMIN']}
        errorMessage="Vous devez être super administrateur ou administrateur pour accéder à la gestion des rôles et permissions."
        mode="show-fallback"
      > */}
        <RoleManagementPanel />
      {/* </PermissionGuard> */}
    </div>
  )
}