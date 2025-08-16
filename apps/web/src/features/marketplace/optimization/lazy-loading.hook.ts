import { useEffect, useRef, useState, useCallback } from 'react';

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
  disabled?: boolean;
  onIntersect?: (entry: IntersectionObserverEntry) => void;
}

export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: LazyLoadOptions = {}
): [React.RefObject<T>, boolean] {
  const {
    rootMargin = '50px',
    threshold = 0.01,
    triggerOnce = true,
    disabled = false,
    onIntersect
  } = options;

  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    if (disabled || !ref.current || (triggerOnce && hasIntersected)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isCurrentlyIntersecting = entry.isIntersecting;
          
          setIsIntersecting(isCurrentlyIntersecting);
          
          if (isCurrentlyIntersecting) {
            setHasIntersected(true);
            onIntersect?.(entry);
            
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce, disabled, hasIntersected, onIntersect]);

  return [ref, isIntersecting || hasIntersected];
}

// Hook for lazy loading images
export function useLazyImage(
  src: string,
  placeholder?: string,
  options?: LazyLoadOptions
): {
  ref: React.RefObject<HTMLImageElement>;
  imageSrc: string;
  isLoaded: boolean;
} {
  const [ref, isVisible] = useLazyLoad<HTMLImageElement>(options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');

  useEffect(() => {
    if (isVisible && src && !isLoaded) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        setImageSrc(placeholder || '');
      };
    }
  }, [isVisible, src, placeholder, isLoaded]);

  return { ref, imageSrc, isLoaded };
}

// Hook for infinite scrolling
export function useInfiniteScroll(
  callback: () => void | Promise<void>,
  options: {
    threshold?: number;
    rootMargin?: string;
    hasMore?: boolean;
    isLoading?: boolean;
  } = {}
): React.RefObject<HTMLDivElement> {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    hasMore = true,
    isLoading = false
  } = options;

  const observerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!hasMore || isLoading || !observerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(observerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasMore, isLoading]);

  return observerRef;
}

// Component for lazy loading content
interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  height?: number | string;
  offset?: number;
  once?: boolean;
  className?: string;
  onVisible?: () => void;
}

export function LazyLoad({
  children,
  placeholder,
  height = 'auto',
  offset = 50,
  once = true,
  className,
  onVisible
}: LazyLoadProps): JSX.Element {
  const [ref, isVisible] = useLazyLoad<HTMLDivElement>({
    rootMargin: `${offset}px`,
    triggerOnce: once,
    onIntersect: () => onVisible?.()
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isVisible ? 'auto' : height }}
    >
      {isVisible ? children : placeholder}
    </div>
  );
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  getItemHeight
}: {
  items: T[];
  itemHeight?: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}): {
  virtualItems: Array<{
    index: number;
    item: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const getHeight = useCallback(
    (index: number) => {
      if (getItemHeight) {
        return getItemHeight(index);
      }
      return itemHeight || 50;
    },
    [itemHeight, getItemHeight]
  );

  const totalHeight = items.reduce((acc, _, index) => acc + getHeight(index), 0);

  const virtualItems = (() => {
    const result: Array<{
      index: number;
      item: T;
      style: React.CSSProperties;
    }> = [];

    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // Calculate starting position
    let startOffset = 0;
    for (let i = 0; i < startIndex; i++) {
      startOffset += getHeight(i);
    }

    // Find end index
    accumulatedHeight = startOffset;
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getHeight(i);
    }

    // Build virtual items
    let currentOffset = startOffset;
    for (let i = startIndex; i <= endIndex; i++) {
      const height = getHeight(i);
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute',
          top: currentOffset,
          left: 0,
          right: 0,
          height
        }
      });
      currentOffset += height;
    }

    return result;
  })();

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current) return;

      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getHeight(i);
      }

      containerRef.current.scrollTop = offset;
    },
    [getHeight]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerRef
  };
}

// Intersection Observer hook for multiple elements
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [
  (element: Element | null) => void,
  Map<Element, IntersectionObserverEntry>
] {
  const [entries, setEntries] = useState<Map<Element, IntersectionObserverEntry>>(
    new Map()
  );
  const observer = useRef<IntersectionObserver | null>(null);
  const elements = useRef<Set<Element>>(new Set());

  useEffect(() => {
    observer.current = new IntersectionObserver((newEntries) => {
      setEntries((prev) => {
        const next = new Map(prev);
        newEntries.forEach((entry) => {
          next.set(entry.target, entry);
        });
        return next;
      });
    }, options);

    const { current: currentObserver } = observer;
    elements.current.forEach((element) => currentObserver.observe(element));

    return () => currentObserver.disconnect();
  }, [options.root, options.rootMargin, options.threshold]);

  const observe = useCallback((element: Element | null) => {
    if (!element) return;

    elements.current.add(element);
    observer.current?.observe(element);
  }, []);

  return [observe, entries];
}