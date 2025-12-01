/**
 * Status Tokens - Demo Component
 * Fichier de démonstration pour tester les status tokens
 */

import React from 'react';
import { statusByKey, type StatusKey } from './status';

// Liste de tous les statuts pour la démo
const allStatuses: StatusKey[] = [
  // Projets
  'EN_COURS',
  'TERMINE',
  'ANNULE',
  'BROUILLON',
  // Devis
  'EN_ATTENTE',
  'ACCEPTE',
  'REFUSE',
  // Production
  'PLANIFIE',
  'EN_PRODUCTION',
  'CONTROLE_QUALITE',
  // Stock
  'EN_STOCK',
  'RUPTURE',
  'STOCK_FAIBLE',
];

/**
 * Composant Badge avec classes Tailwind générées
 */
function StatusBadgeTailwind({ status }: { status: StatusKey }) {
  const cssName = status.toLowerCase().replace(/_/g, '-');

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        bg-status-${cssName}
        text-white
      `}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/**
 * Composant Badge avec tokens TypeScript
 */
function StatusBadgeTokens({ status }: { status: StatusKey }) {
  const config = statusByKey[status];

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        ${config.bg} ${config.text}
      `}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/**
 * Composant Card avec background et border
 */
function StatusCard({ status }: { status: StatusKey }) {
  const cssName = status.toLowerCase().replace(/_/g, '-');

  return (
    <div
      className={`
        p-4 rounded-lg border-2
        bg-status-${cssName}/10
        border-status-${cssName}/30
      `}
    >
      <h3 className={`font-semibold mb-2 text-status-${cssName}`}>
        {status.replace(/_/g, ' ')}
      </h3>
      <p className="text-sm text-muted-foreground">
        Exemple de carte avec le statut {status.toLowerCase()}
      </p>
    </div>
  );
}

/**
 * Composant principal de démonstration
 */
export function StatusTokensDemo() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Status Tokens Demo</h1>
        <p className="text-muted-foreground">
          Démonstration des 13 statuts métier TopSteel
        </p>
      </div>

      {/* Section 1: Badges Tailwind */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          1. Badges avec classes Tailwind
        </h2>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((status) => (
            <StatusBadgeTailwind key={status} status={status} />
          ))}
        </div>
      </section>

      {/* Section 2: Badges TypeScript Tokens */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          2. Badges avec tokens TypeScript
        </h2>
        <div className="flex flex-wrap gap-2">
          {allStatuses.map((status) => (
            <StatusBadgeTokens key={status} status={status} />
          ))}
        </div>
      </section>

      {/* Section 3: Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">3. Cards avec backgrounds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allStatuses.slice(0, 6).map((status) => (
            <StatusCard key={status} status={status} />
          ))}
        </div>
      </section>

      {/* Section 4: Variables CSS */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          4. Variables CSS directes
        </h2>
        <div className="space-y-2">
          {allStatuses.slice(0, 4).map((status) => {
            const cssVar = `--status-${status.toLowerCase().replace(/_/g, '-')}`;
            return (
              <div
                key={status}
                style={{
                  backgroundColor: `hsl(var(${cssVar}) / 0.1)`,
                  borderLeft: `4px solid hsl(var(${cssVar}))`,
                  padding: '1rem',
                  borderRadius: '0.5rem',
                }}
              >
                <code className="text-sm font-mono">{cssVar}</code>
                <span className="ml-4 text-sm">{status}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Table récapitulative */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          5. Table récapitulative
        </h2>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-left">Catégorie</th>
                <th className="px-4 py-2 text-left">HSL</th>
                <th className="px-4 py-2 text-left">Preview</th>
              </tr>
            </thead>
            <tbody>
              {allStatuses.map((status) => {
                const config = statusByKey[status];
                const category =
                  ['EN_COURS', 'TERMINE', 'ANNULE', 'BROUILLON'].includes(status)
                    ? 'Projets'
                    : ['EN_ATTENTE', 'ACCEPTE', 'REFUSE'].includes(status)
                      ? 'Devis'
                      : ['PLANIFIE', 'EN_PRODUCTION', 'CONTROLE_QUALITE'].includes(
                            status,
                          )
                        ? 'Production'
                        : 'Stock';

                return (
                  <tr key={status} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {status.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2">{category}</td>
                    <td className="px-4 py-2">
                      <code className="text-xs">{config.hsl}</code>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{
                            backgroundColor: `hsl(${config.hsl})`,
                          }}
                        />
                        <span className={`${config.text} text-sm`}>
                          {config.text}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6: Code examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">6. Exemples de code</h2>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tailwind Classes</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`<div className="bg-status-en-cours text-white">
  En cours
</div>`}</code>
            </pre>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">CSS Variables</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`background-color: hsl(var(--status-en-cours));
color: hsl(var(--status-en-cours-foreground));`}</code>
            </pre>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">TypeScript Tokens</h3>
            <pre className="text-sm overflow-x-auto">
              <code>{`import { statusByKey } from './status';

const status = statusByKey['EN_COURS'];
console.log(status.hsl); // "217 91% 60%"`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StatusTokensDemo;
