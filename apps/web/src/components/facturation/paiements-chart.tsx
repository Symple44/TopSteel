// apps/web/src/components/facturation/paiements-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PaiementsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des paiements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Graphique des paiements - À implémenter
        </div>
      </CardContent>
    </Card>
  )
}
