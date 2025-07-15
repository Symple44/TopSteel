import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Amélioration des modules TanStack mock');

const queryCoreLib = path.join(__dirname, 'node_modules', '@tanstack', 'query-core', 'build', 'lib');
const reactQueryModern = path.join(__dirname, 'node_modules', '@tanstack', 'react-query', 'build', 'modern');

// Créer les fichiers manquants pour query-core
const mockQueryClient = `
export class QueryClient {
  constructor(options = {}) {
    this.options = options;
    this.queryCache = new Map();
    this.mutationCache = new Map();
  }

  mount() {}
  unmount() {}
  clear() {}
  
  getQueryData(queryKey) {
    return this.queryCache.get(JSON.stringify(queryKey));
  }
  
  setQueryData(queryKey, data) {
    this.queryCache.set(JSON.stringify(queryKey), data);
  }
  
  invalidateQueries() {
    return Promise.resolve();
  }
  
  refetchQueries() {
    return Promise.resolve();
  }
  
  getDefaultOptions() {
    return this.options;
  }
  
  setDefaultOptions(options) {
    this.options = { ...this.options, ...options };
  }
}
`;

const mockQueryObserver = `
export class QueryObserver {
  constructor(client, options) {
    this.client = client;
    this.options = options;
  }
  
  subscribe(callback) {
    return { unsubscribe: () => {} };
  }
  
  destroy() {}
}
`;

const mockMutationObserver = `
export class MutationObserver {
  constructor(client, options) {
    this.client = client;
    this.options = options;
  }
  
  subscribe(callback) {
    return { unsubscribe: () => {} };
  }
  
  destroy() {}
}
`;

const mockOnlineManager = `
export const onlineManager = {
  subscribe: (callback) => ({ unsubscribe: () => {} }),
  isOnline: () => true,
  setOnline: (online) => {},
};
`;

const mockFocusManager = `
export const focusManager = {
  subscribe: (callback) => ({ unsubscribe: () => {} }),
  isFocused: () => true,
  setFocused: (focused) => {},
};
`;

const mockNotifyManager = `
export const notifyManager = {
  schedule: (callback) => callback(),
  batchCalls: (callback) => callback(),
};
`;

const mockTypes = `
export interface QueryClientOptions {
  defaultOptions?: any;
}

export interface QueryObserverOptions {
  queryKey?: any;
  queryFn?: any;
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export interface MutationObserverOptions {
  mutationFn?: any;
  onSuccess?: any;
  onError?: any;
}
`;

// Créer les fichiers dans query-core
fs.writeFileSync(path.join(queryCoreLib, 'QueryClient.js'), mockQueryClient);
fs.writeFileSync(path.join(queryCoreLib, 'QueryObserver.js'), mockQueryObserver);
fs.writeFileSync(path.join(queryCoreLib, 'MutationObserver.js'), mockMutationObserver);
fs.writeFileSync(path.join(queryCoreLib, 'onlineManager.js'), mockOnlineManager);
fs.writeFileSync(path.join(queryCoreLib, 'focusManager.js'), mockFocusManager);
fs.writeFileSync(path.join(queryCoreLib, 'notifyManager.js'), mockNotifyManager);
fs.writeFileSync(path.join(queryCoreLib, 'types.js'), mockTypes);

// Créer les fichiers TypeScript
fs.writeFileSync(path.join(queryCoreLib, 'QueryClient.d.ts'), 'export declare class QueryClient { constructor(options?: any); mount(): void; unmount(): void; clear(): void; getQueryData(queryKey: any): any; setQueryData(queryKey: any, data: any): void; invalidateQueries(): Promise<void>; refetchQueries(): Promise<void>; getDefaultOptions(): any; setDefaultOptions(options: any): void; }');
fs.writeFileSync(path.join(queryCoreLib, 'QueryObserver.d.ts'), 'export declare class QueryObserver { constructor(client: any, options: any); subscribe(callback: any): any; destroy(): void; }');
fs.writeFileSync(path.join(queryCoreLib, 'MutationObserver.d.ts'), 'export declare class MutationObserver { constructor(client: any, options: any); subscribe(callback: any): any; destroy(): void; }');
fs.writeFileSync(path.join(queryCoreLib, 'onlineManager.d.ts'), 'export declare const onlineManager: { subscribe: (callback: any) => any; isOnline: () => boolean; setOnline: (online: boolean) => void; };');
fs.writeFileSync(path.join(queryCoreLib, 'focusManager.d.ts'), 'export declare const focusManager: { subscribe: (callback: any) => any; isFocused: () => boolean; setFocused: (focused: boolean) => void; };');
fs.writeFileSync(path.join(queryCoreLib, 'notifyManager.d.ts'), 'export declare const notifyManager: { schedule: (callback: any) => any; batchCalls: (callback: any) => any; };');
fs.writeFileSync(path.join(queryCoreLib, 'types.d.ts'), mockTypes);

// Créer les fichiers pour react-query
const mockReactQueryClient = `
import { QueryClient as CoreQueryClient } from '@tanstack/query-core';
import { createElement } from 'react';

export class QueryClient extends CoreQueryClient {}

export function QueryClientProvider({ client, children }) {
  return createElement('div', { 'data-query-client': true }, children);
}
`;

const mockUseQuery = `
import { useState, useEffect } from 'react';

export function useQuery(options) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  return {
    data,
    isLoading,
    error,
    refetch: () => Promise.resolve(),
    isSuccess: !isLoading && !error,
    isError: !!error,
  };
}
`;

const mockUseMutation = `
import { useState } from 'react';

export function useMutation(options) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (variables) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await options.mutationFn(variables);
      setData(result);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    mutate,
    mutateAsync: mutate,
    isSuccess: !isLoading && !error,
    isError: !!error,
  };
}
`;

const mockHydrationBoundary = `
import { createElement } from 'react';

export function HydrationBoundary({ children }) {
  return createElement('div', { 'data-hydration-boundary': true }, children);
}
`;

// Créer les fichiers dans react-query
fs.writeFileSync(path.join(reactQueryModern, 'QueryClient.js'), mockReactQueryClient);
fs.writeFileSync(path.join(reactQueryModern, 'useQuery.js'), mockUseQuery);
fs.writeFileSync(path.join(reactQueryModern, 'useMutation.js'), mockUseMutation);
fs.writeFileSync(path.join(reactQueryModern, 'useInfiniteQuery.js'), mockUseQuery);
fs.writeFileSync(path.join(reactQueryModern, 'useQueries.js'), mockUseQuery);
fs.writeFileSync(path.join(reactQueryModern, 'HydrationBoundary.js'), mockHydrationBoundary);

// Créer les fichiers TypeScript pour react-query
fs.writeFileSync(path.join(reactQueryModern, 'QueryClient.d.ts'), 'import { QueryClient as CoreQueryClient } from "@tanstack/query-core"; export declare class QueryClient extends CoreQueryClient {} export declare function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode }): React.ReactElement;');
fs.writeFileSync(path.join(reactQueryModern, 'useQuery.d.ts'), 'export declare function useQuery(options: any): any;');
fs.writeFileSync(path.join(reactQueryModern, 'useMutation.d.ts'), 'export declare function useMutation(options: any): any;');
fs.writeFileSync(path.join(reactQueryModern, 'useInfiniteQuery.d.ts'), 'export declare function useInfiniteQuery(options: any): any;');
fs.writeFileSync(path.join(reactQueryModern, 'useQueries.d.ts'), 'export declare function useQueries(options: any): any;');
fs.writeFileSync(path.join(reactQueryModern, 'HydrationBoundary.d.ts'), 'export declare function HydrationBoundary({ children }: { children: React.ReactNode }): React.ReactElement;');

console.log('✅ Modules TanStack mock améliorés');
console.log('📁 Fichiers créés dans query-core:', fs.readdirSync(queryCoreLib).length);
console.log('📁 Fichiers créés dans react-query:', fs.readdirSync(reactQueryModern).length);