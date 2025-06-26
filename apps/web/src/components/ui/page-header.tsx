import * as React from "react"

interface PageHeaderProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  breadcrumbs?: any[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  children, 
  className, 
  title, 
  subtitle, 
  breadcrumbs, 
  actions, 
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {title && <h1>{title}</h1>}
      {subtitle && <p>{subtitle}</p>}
      {breadcrumbs && <nav>{/* breadcrumbs */}</nav>}
      {actions}
      {children}
    </div>
  )
}
