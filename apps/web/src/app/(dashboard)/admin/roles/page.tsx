'use client'

export const dynamic = 'force-dynamic'

import { PageContainer, PageSection } from '@erp/ui'
import { RolesDataTable } from '../../../../components/admin/roles-datatable'
import { AdminGuard } from '../../../../components/auth/admin-guard'

export default function RoleManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN']}
      requiredPermissions={['SYSTEM_ADMIN', 'USER_DELETE']}
      showUnauthorized={true}
    >
      <PageContainer maxWidth="full" padding="default">
        <PageSection spacing="default">
          <RolesDataTable />
        </PageSection>
      </PageContainer>
    </AdminGuard>
  )
}
