import * as React from "react"

export const Toaster: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="fixed bottom-0 right-0 z-50 w-full md:max-w-[420px] p-4">
    {children}
  </div>
)
