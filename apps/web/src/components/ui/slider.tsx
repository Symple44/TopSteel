import * as React from "react"

interface SliderProps {
  [key: string]: unknown; // Accepte toutes les props
}

const _Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const _stringValue = Array.isArray(value) ? value[0]?.toString() || '0' : value?.toString() || '0';
    
    return (
      <input
        type="range"
        value={stringValue}
        onChange={(e) => {
          const _newValue = Number((e.target as HTMLInputElement | HTMLTextAreaElement).value);

          if (onValueChange) {
            onValueChange([newValue]); // Retourne array pour compatibilité
          }
        }}
        ref={ref}
        {...props}
      />
    )
  }
)

Slider.displayName = "Slider"

export { Slider }


