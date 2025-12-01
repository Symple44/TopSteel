'use client'

export const dynamic = 'force-dynamic'

import { PageContainer, PageSection } from '@erp/ui'
import { GroupsDataTable } from '../../../../components/admin/groups-datatable'
import { AdminGuard } from '../../../../components/auth/admin-guard'

export default function GroupManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['SYSTEM_ADMIN', 'USER_CREATE']}
      showUnauthorized={true}
    >
      <PageContainer maxWidth="full" padding="default">
        <PageSection spacing="default">
          <GroupsDataTable />
        </PageSection>
      </PageContainer>
    </AdminGuard>
  )
}
