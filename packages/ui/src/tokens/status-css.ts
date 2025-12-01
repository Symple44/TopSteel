/**
 * Status CSS Variables Generator
 */
import { statusByKey } from './status';

export const statusCSSVariables = Object.entries(statusByKey).reduce(
  (acc, [key, value]) => {
    const cssKey = `--status-${key.toLowerCase().replace(/_/g, '-')}`;
    acc[cssKey] = value.hsl;
    return acc;
  },
  {} as Record<string, string>
);

// Exemple de résultat:
// {
//   '--status-en-cours': '217 91% 60%',
//   '--status-termine': '142 76% 36%',
//   ...
// }
