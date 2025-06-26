import * as React from "react"

interface TabsProps {
  children?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsContentProps {
  children?: React.ReactNode;
  value: string;
  className?: string;
}

interface TabsListProps {
  children?: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children?: React.ReactNode;
  value: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, className, ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

export const TabsContent: React.FC<TabsContentProps> = ({ children, className, ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

export const TabsList: React.FC<TabsListProps> = ({ children, className, ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, className, ...props }) => {
  return <button className={className} {...props}>{children}</button>
}
