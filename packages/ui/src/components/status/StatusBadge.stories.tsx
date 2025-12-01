/**
 * StatusBadge Stories
 * Exemples d'utilisation des composants de statut
 */

import React from 'react';
import {
  StatusBadge,
  StatusBadgeWithDot,
  StatusIndicator,
} from './StatusBadge';
import { type StatusKey } from '../../tokens/status';

const allStatuses: StatusKey[] = [
  'EN_COURS',
  'TERMINE',
  'ANNULE',
  'BROUILLON',
  'EN_ATTENTE',
  'ACCEPTE',
  'REFUSE',
  'PLANIFIE',
  'EN_PRODUCTION',
  'CONTROLE_QUALITE',
  'EN_STOCK',
  'RUPTURE',
  'STOCK_FAIBLE',
];

/**
 * Démo complète des composants de statut
 */
export function StatusBadgeDemo() {
  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Status Badge Components</h1>
        <p className="text-muted-foreground">
          Composants réutilisables pour les statuts métier TopSteel
        </p>
      </div>

      {/* Variantes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Variantes</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Solid (défaut)</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <StatusBadge key={status} status={status} variant="solid" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Outline</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <StatusBadge key={status} status={status} variant="outline" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Subtle</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <StatusBadge key={status} status={status} variant="subtle" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tailles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tailles</h2>

        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status="EN_COURS" size="sm" />
          <StatusBadge status="EN_COURS" size="md" />
          <StatusBadge status="EN_COURS" size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status="TERMINE" variant="outline" size="sm" />
          <StatusBadge status="TERMINE" variant="outline" size="md" />
          <StatusBadge status="TERMINE" variant="outline" size="lg" />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status="EN_ATTENTE" variant="subtle" size="sm" />
          <StatusBadge status="EN_ATTENTE" variant="subtle" size="md" />
          <StatusBadge status="EN_ATTENTE" variant="subtle" size="lg" />
        </div>
      </section>

      {/* Avec point indicateur */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Avec indicateur</h2>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Statique
            </h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.slice(0, 6).map((status) => (
                <StatusBadgeWithDot
                  key={status}
                  status={status}
                  animated={false}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Animé (pulse)
            </h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.slice(0, 6).map((status) => (
                <StatusBadgeWithDot
                  key={status}
                  status={status}
                  animated={true}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Indicateurs simples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Indicateurs simples</h2>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <StatusIndicator status="EN_STOCK" size="sm" />
            <span className="text-sm">En stock (sm)</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="EN_PRODUCTION" size="md" />
            <span className="text-sm">En production (md)</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="RUPTURE" size="lg" />
            <span className="text-sm">Rupture (lg)</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <StatusIndicator status="EN_COURS" size="md" animated />
            <span className="text-sm">En cours (animé)</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status="EN_ATTENTE" size="md" animated />
            <span className="text-sm">En attente (animé)</span>
          </div>
        </div>
      </section>

      {/* Labels personnalisés */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Labels personnalisés</h2>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status="EN_COURS" label="En développement" />
          <StatusBadge status="TERMINE" label="Projet livré" />
          <StatusBadge status="EN_ATTENTE" label="Devis envoyé" />
          <StatusBadge status="PLANIFIE" label="À venir" />
        </div>
      </section>

      {/* Exemples d'utilisation */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Exemples d'utilisation</h2>

        {/* Tableau */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Projet
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-3 font-medium">Projet Alpha</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  Client A
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status="EN_COURS" size="sm" />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  2024-11-30
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 font-medium">Projet Beta</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  Client B
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status="TERMINE" size="sm" />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  2024-11-25
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 font-medium">Projet Gamma</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  Client C
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status="BROUILLON" size="sm" />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  2024-12-01
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Production ligne 1</h3>
              <StatusIndicator status="EN_PRODUCTION" animated />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Machine de découpe laser
            </p>
            <StatusBadgeWithDot
              status="EN_PRODUCTION"
              variant="subtle"
              size="sm"
            />
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Stock matériau A</h3>
              <StatusIndicator status="STOCK_FAIBLE" animated />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Aluminium 6061
            </p>
            <StatusBadgeWithDot
              status="STOCK_FAIBLE"
              variant="subtle"
              size="sm"
              label="Réappro. requise"
            />
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Devis #12345</h3>
              <StatusIndicator status="EN_ATTENTE" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              En attente de validation
            </p>
            <StatusBadgeWithDot
              status="EN_ATTENTE"
              variant="subtle"
              size="sm"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <StatusIndicator status="TERMINE" size="md" />
              <div>
                <p className="font-medium">Projet approuvé</p>
                <p className="text-sm text-muted-foreground">
                  Le projet a été approuvé par le client
                </p>
                <div className="mt-1">
                  <StatusBadge status="TERMINE" variant="subtle" size="sm" />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <StatusIndicator status="EN_PRODUCTION" size="md" animated />
              <div>
                <p className="font-medium">Production en cours</p>
                <p className="text-sm text-muted-foreground">
                  Les pièces sont en cours de fabrication
                </p>
                <div className="mt-1">
                  <StatusBadge
                    status="EN_PRODUCTION"
                    variant="subtle"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <StatusIndicator status="PLANIFIE" size="md" />
              <div>
                <p className="font-medium">Livraison planifiée</p>
                <p className="text-sm text-muted-foreground">
                  Prévue pour le 15 décembre
                </p>
                <div className="mt-1">
                  <StatusBadge status="PLANIFIE" variant="subtle" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Exemples de code</h2>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Badge simple</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<StatusBadge status="EN_COURS" />`}</code>
            </pre>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Badge avec variante et taille</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<StatusBadge
  status="TERMINE"
  variant="subtle"
  size="sm"
/>`}</code>
            </pre>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Badge avec label personnalisé</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<StatusBadge
  status="EN_ATTENTE"
  label="En attente de validation"
  variant="outline"
/>`}</code>
            </pre>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Badge avec indicateur animé</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<StatusBadgeWithDot
  status="EN_PRODUCTION"
  animated={true}
  variant="subtle"
/>`}</code>
            </pre>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Indicateur simple</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<StatusIndicator
  status="EN_STOCK"
  size="md"
  animated={false}
/>`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StatusBadgeDemo;
