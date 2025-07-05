"use client";

import * as React from 'react';
import { useToast } from '../hooks/use-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

// Définition explicite du type pour éviter les erreurs TS4058
interface ToastContextValue {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
  }>;
  toast: (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
  }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: ToastProviderProps) {
  const toastApi = useToast();

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      {/* Render toasts */}
      <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toastApi.toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={toastApi.dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastComponentProps {
  toast: {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
  };
  onDismiss: (id: string) => void;
}

function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200 text-gray-900',
    destructive: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  };

  return (
    <div
      className={`
        min-w-[300px] max-w-[400px] p-4 border rounded-lg shadow-lg
        ${variantStyles[toast.variant || 'default']}
        animate-in slide-in-from-right duration-300
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {toast.title && (
            <h4 className="font-semibold text-sm">{toast.title}</h4>
          )}
          {toast.description && (
            <p className="text-sm mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Type de retour explicite pour éviter l'erreur TS4058
export function useToastContext(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}