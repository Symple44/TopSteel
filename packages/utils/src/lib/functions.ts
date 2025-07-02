// packages/utils/src/lib/functions.ts - Version corrigée sans 'this'
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | number | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (typeof timeout === 'number' && typeof clearTimeout !== 'undefined') {
        clearTimeout(timeout);
      } else if (timeout && typeof clearTimeout !== 'undefined') {
        clearTimeout(timeout as NodeJS.Timeout);
      }
      func(...args);
    };

    if (typeof timeout === 'number' && typeof clearTimeout !== 'undefined') {
      clearTimeout(timeout);
    } else if (timeout && typeof clearTimeout !== 'undefined') {
      clearTimeout(timeout as NodeJS.Timeout);
    }
    
    if (typeof setTimeout !== 'undefined') {
      timeout = setTimeout(later, wait);
    }
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      // FIX: Utiliser func(...args) au lieu de func.apply(this, args)
      func(...args);
      inThrottle = true;
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };
}

// Fonctions utilitaires additionnelles
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    if (typeof setTimeout !== 'undefined') {
      setTimeout(resolve, ms);
    } else {
      resolve();
    }
  });
}

export function once<T extends (...args: any[]) => any>(func: T): T {
  let called = false;
  let result: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = func(...args);
    }
    return result;
  }) as T;
}
