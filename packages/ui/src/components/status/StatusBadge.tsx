/**
 * StatusBadge Component
 * Badge réutilisable pour afficher les statuts métier TopSteel
 */

import React from 'react';
import { type StatusKey } from '../../tokens/status';

export interface StatusBadgeProps {
  /**
   * Le statut à afficher (clé TypeScript)
   */
  status: StatusKey;

  /**
   * Variante d'affichage
   * - 'solid': fond coloré avec texte blanc/noir
   * - 'outline': bordure colorée avec fond transparent
   * - 'subtle': fond coloré léger avec texte coloré
   */
  variant?: 'solid' | 'outline' | 'subtle';

  /**
   * Taille du badge
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Texte personnalisé (sinon utilise le nom du statut)
   */
  label?: string;

  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Conversion du nom de statut en format CSS
 * EN_COURS -> en-cours
 */
function statusToCssName(status: StatusKey): string {
  return status.toLowerCase().replace(/_/g, '-');
}

/**
 * Conversion du nom de statut en texte lisible
 * EN_COURS -> En cours
 */
function statusToLabel(status: StatusKey): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Composant StatusBadge
 */
export function StatusBadge({
  status,
  variant = 'solid',
  size = 'md',
  label,
  className = '',
}: StatusBadgeProps) {
  const cssName = statusToCssName(status);
  const displayLabel = label || statusToLabel(status);

  // Classes de base
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap';

  // Classes de taille
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  // Classes de variante
  const variantClasses = {
    solid: `bg-status-${cssName} text-white`,
    outline: `bg-transparent border-2 border-status-${cssName} text-status-${cssName}`,
    subtle: `bg-status-${cssName}/10 text-status-${cssName} border border-status-${cssName}/20`,
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      data-status={status}
    >
      {displayLabel}
    </span>
  );
}

/**
 * Composant StatusBadge avec indicateur animé
 */
export function StatusBadgeWithDot({
  status,
  variant = 'subtle',
  size = 'md',
  label,
  className = '',
  animated = true,
}: StatusBadgeProps & { animated?: boolean }) {
  const cssName = statusToCssName(status);
  const displayLabel = label || statusToLabel(status);

  const baseClasses =
    'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantClasses = {
    solid: `bg-status-${cssName} text-white`,
    outline: `bg-transparent border-2 border-status-${cssName} text-status-${cssName}`,
    subtle: `bg-status-${cssName}/10 text-status-${cssName} border border-status-${cssName}/20`,
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      data-status={status}
    >
      <span
        className={`
          ${dotSize[size]}
          rounded-full
          bg-status-${cssName}
          ${animated ? 'animate-pulse' : ''}
        `.trim()}
      />
      {displayLabel}
    </span>
  );
}

/**
 * Composant StatusIndicator simple (juste un point coloré)
 */
export function StatusIndicator({
  status,
  size = 'md',
  animated = false,
  className = '',
}: {
  status: StatusKey;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}) {
  const cssName = statusToCssName(status);

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-status-${cssName}
        ${animated ? 'animate-pulse' : ''}
        ${className}
      `.trim()}
      data-status={status}
      aria-label={statusToLabel(status)}
    />
  );
}

export default StatusBadge;
