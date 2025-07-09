// Test du composant Input avec checked
import { Input, CheckboxInput, RadioInput } from '@erp/ui'

// Test Input checkbox avec checked
function TestInputChecked() {
  const [isChecked, setIsChecked] = useState(false)
  const [isActive, setIsActive] = useState(false)
  
  return (
    <div className="space-y-4">
      {/* Input checkbox standard */}
      <Input 
        type="checkbox" 
        checked={isChecked}
        onCheckedChange={setIsChecked}
      />
      
      {/* Input avec état actif */}
      <Input 
        type="text"
        active={isActive}
        onActiveChange={setIsActive}
        placeholder="Saisir du texte"
      />
      
      {/* Composants de convenance */}
      <CheckboxInput 
        checked={isChecked}
        onCheckedChange={setIsChecked}
      />
      
      <RadioInput 
        name="test"
        value="option1"
        checked={isChecked}
        onCheckedChange={setIsChecked}
      />
    </div>
  )
}
