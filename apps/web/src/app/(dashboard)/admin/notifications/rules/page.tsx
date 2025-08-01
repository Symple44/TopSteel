import { PermissionGuard } from '@/components/auth/permission-guard'
import NotificationRulesPanel from '@/components/notifications/notification-rules-panel'

export default function NotificationRulesPage() {
  return (
    <div className="py-6">
      <PermissionGuard
        permission={['NOTIFICATION_ADMIN', 'NOTIFICATION_RULES']}
        roles={['ADMIN', 'MANAGER']}
        errorMessage="Vous devez être administrateur ou manager pour accéder à la gestion des règles de notification."
        mode="show-fallback"
      >
        <NotificationRulesPanel />
      </PermissionGuard>
    </div>
  )
}
