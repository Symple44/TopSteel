// Global type declarations for TopSteel ERP

// User interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nom: string;
  prenom: string;
  isActive: boolean;
  permissions: string[];
  avatar?: string;
}

// Page header props
interface PageHeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

// Test matchers
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
  }
}

// Window extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export {};
