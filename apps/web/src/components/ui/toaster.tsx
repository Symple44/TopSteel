import * as React from "react"

interface ToasterProps {
  children?: React.ReactNode;
  className?: string;
}

export const Toaster: React.FC<ToasterProps> = ({ children, className, ...props }) => {
  return <div className={className} {...props}>{children}</div>
}
