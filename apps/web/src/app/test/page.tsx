'use client'

export const dynamic = 'force-dynamic'

import { useTranslation } from '@/lib/i18n/hooks'

export default function TestPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-bold">Test des Traductions avec Overrides</h1>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Traduction avec override (si disponible)</h2>
          <p>
            Clé: <code>common.buttons.save</code>
          </p>
          <p>
            Valeur: "<strong>{t('common.buttons.save')}</strong>"
          </p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Traduction avec override (si disponible)</h2>
          <p>
            Clé: <code>dashboard.welcome</code>
          </p>
          <p>
            Valeur: "<strong>{t('dashboard.welcome')}</strong>"
          </p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Traduction normale</h2>
          <p>
            Clé: <code>common.buttons.cancel</code>
          </p>
          <p>
            Valeur: "<strong>{t('common.buttons.cancel')}</strong>"
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold">Instructions :</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Connectez-vous avec <code>admin@topsteel.tech</code>
          </li>
          <li>
            Allez sur{' '}
            <a href="/admin/translations" className="underline">
              /admin/translations
            </a>
          </li>
          <li>Vous devriez voir toutes les traductions de base</li>
          <li>Modifiez une traduction et sauvegardez</li>
          <li>Revenez sur cette page - le changement devrait être visible</li>
        </ol>
      </div>
    </div>
  )
}
