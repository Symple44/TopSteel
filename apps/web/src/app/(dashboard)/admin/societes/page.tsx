'use client'

export const dynamic = 'force-dynamic'

import { PageContainer, PageSection } from '@erp/ui'
import { SocietesDataTable } from '../../../../components/admin/societes-datatable'
import { AdminGuard } from '../../../../components/auth/admin-guard'

export default function SocietesManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN']}
      requiredPermissions={['SYSTEM_ADMIN']}
      showUnauthorized={true}
    >
      <PageContainer maxWidth="full" padding="default">
        <PageSection spacing="default">
          <SocietesDataTable />
        </PageSection>
      </PageContainer>
    </AdminGuard>
  )
}
