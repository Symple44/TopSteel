// packages/ui/src/components/toaster.tsx
import * as React from "react";
import { cn } from "../lib/utils";

interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Toaster.displayName = "Toaster";

export { Toaster };
