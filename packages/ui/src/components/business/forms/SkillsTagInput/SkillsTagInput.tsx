'use client'

interface SkillsTagInputProps {
  className?: string
  children?: React.ReactNode
}

export function SkillsTagInput({ className, children }: SkillsTagInputProps) {
  return (
    <div className={className}>
      {/* TODO: Implement Input tags compétences component */}
      <p className="text-muted-foreground">
        Input tags compétences component - Implementation needed
      </p>
      {children}
    </div>
  )
}
