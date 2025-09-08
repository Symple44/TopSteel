'use client'
import { AlertCircle, Award, Filter, Hash, Plus, Search, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SkillCategory =
  | 'technical'
  | 'soft'
  | 'language'
  | 'certification'
  | 'equipment'
  | 'safety'
  | 'other'
export interface Skill {
  id: string
  name: string
  category: SkillCategory
  proficiency: ProficiencyLevel
  verified?: boolean
  yearsOfExperience?: number
  certificationDate?: Date
  description?: string
}
export interface SkillSuggestion {
  id: string
  name: string
  category: SkillCategory
  popularity?: number
  relatedSkills?: string[]
}
interface SkillsTagInputProps {
  value?: Skill[]
  onChange?: (value: Skill[]) => void
  onSkillSearch?: (query: string) => Promise<SkillSuggestion[]>
  suggestions?: SkillSuggestion[]
  categories?: SkillCategory[]
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  maxSkills?: number
  allowCustomSkills?: boolean
  showProficiency?: boolean
  showCategories?: boolean
  showVerification?: boolean
  placeholder?: string
  className?: string
}
const proficiencyLevels: { value: ProficiencyLevel; label: string; color: string }[] = [
  { value: 'beginner', label: 'Débutant', color: 'bg-gray-100 text-gray-800' },
  { value: 'intermediate', label: 'Intermédiaire', color: 'bg-blue-100 text-blue-800' },
  { value: 'advanced', label: 'Avancé', color: 'bg-green-100 text-green-800' },
  { value: 'expert', label: 'Expert', color: 'bg-purple-100 text-purple-800' },
]
const skillCategories: { value: SkillCategory; label: string; icon: React.ComponentType<unknown> }[] = [
  { value: 'technical', label: 'Technique', icon: Hash },
  { value: 'soft', label: 'Relationnelle', icon: Star },
  { value: 'language', label: 'Langue', icon: Award },
  { value: 'certification', label: 'Certification', icon: Award },
  { value: 'equipment', label: 'Équipement', icon: Hash },
  { value: 'safety', label: 'Sécurité', icon: AlertCircle },
  { value: 'other', label: 'Autre', icon: Hash },
]
export function SkillsTagInput({
  value = [],
  onChange,
  onSkillSearch,
  suggestions = [],
  categories,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  maxSkills,
  allowCustomSkills = true,
  showProficiency = true,
  showCategories = true,
  showVerification = false,
  placeholder = 'Ajouter une compétence...',
  className,
}: SkillsTagInputProps) {
  const [skills, setSkills] = useState<Skill[]>(value)
  const [inputValue, setInputValue] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<SkillSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all')
  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    setSkills(value)
  }, [value])
  const searchSkills = useCallback(
    async (query: string) => {
      if (!onSkillSearch || !query.trim()) {
        setSearchSuggestions([])
        return
      }
      setIsSearching(true)
      try {
        const results = await onSkillSearch(query)
        setSearchSuggestions(results)
        setShowSuggestions(true)
      } catch (_error) {
        setSearchSuggestions([])
      } finally {
        setIsSearching(false)
      }
    },
    [onSkillSearch]
  )
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchSkills(newValue)
    }, 300)
  }
  const handleAddSkill = (skillName: string, suggestion?: SkillSuggestion) => {
    if (!skillName.trim()) return
    if (maxSkills && skills.length >= maxSkills) return
    // Check if skill already exists
    if (skills.some((skill) => skill.name.toLowerCase() === skillName.toLowerCase())) {
      return
    }
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: skillName.trim(),
      category: suggestion?.category || 'other',
      proficiency: 'intermediate',
    }
    const updatedSkills = [...skills, newSkill]
    setSkills(updatedSkills)
    onChange?.(updatedSkills)
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }
  const handleRemoveSkill = (skillId: string) => {
    const updatedSkills = skills.filter((skill) => skill.id !== skillId)
    setSkills(updatedSkills)
    onChange?.(updatedSkills)
  }
  const handleUpdateSkill = (skillId: string, updates: Partial<Skill>) => {
    const updatedSkills = skills.map((skill) =>
      skill.id === skillId ? { ...skill, ...updates } : skill
    )
    setSkills(updatedSkills)
    onChange?.(updatedSkills)
    setEditingSkill(null)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      if (allowCustomSkills) {
        handleAddSkill(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      handleRemoveSkill(skills[skills.length - 1].id)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }
  const getProficiencyLevel = (level: ProficiencyLevel) => {
    return proficiencyLevels.find((p) => p.value === level)
  }
  const getCategoryInfo = (category: SkillCategory) => {
    return skillCategories.find((c) => c.value === category)
  }
  const filteredSkills =
    selectedCategory === 'all'
      ? skills
      : skills.filter((skill) => skill.category === selectedCategory)
  const filteredSuggestions = categories
    ? searchSuggestions.filter((s) => categories.includes(s.category))
    : searchSuggestions
  const groupedSuggestions = filteredSuggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = []
      }
      acc[suggestion.category].push(suggestion)
      return acc
    },
    {} as Record<SkillCategory, SkillSuggestion[]>
  )
  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {maxSkills && (
            <span className="text-sm text-muted-foreground">
              {skills.length}/{maxSkills}
            </span>
          )}
        </div>
      )}
      {/* Input field */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={disabled || (maxSkills ? skills.length >= maxSkills : false)}
              className="pl-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            )}
          </div>
          {allowCustomSkills && inputValue.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddSkill(inputValue)}
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Suggestions dropdown */}
        {showSuggestions && (filteredSuggestions.length > 0 || suggestions.length > 0) && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => {
              const categoryInfo = getCategoryInfo(category as SkillCategory)
              const CategoryIcon = categoryInfo?.icon || Hash
              return (
                <div key={category}>
                  <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {categoryInfo?.label || category}
                  </div>
                  {categorySuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex items-center justify-between"
                      onClick={() => handleAddSkill(suggestion.name, suggestion)}
                    >
                      <span>{suggestion.name}</span>
                      {suggestion.popularity && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.popularity}%
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
            {/* Default suggestions if no search results */}
            {filteredSuggestions.length === 0 && suggestions.length > 0 && (
              <div>
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                  Suggestions
                </div>
                {suggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className="w-full px-3 py-2 text-left hover:bg-muted text-sm"
                    onClick={() => handleAddSkill(suggestion.name, suggestion)}
                  >
                    {suggestion.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Category filter */}
      {showCategories && skills.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Catégorie:</Label>
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value as SkillCategory | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {skillCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Skills display */}
      {filteredSkills.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Compétences sélectionnées ({filteredSkills.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {filteredSkills.map((skill) => {
              const proficiency = getProficiencyLevel(skill.proficiency)
              const categoryInfo = getCategoryInfo(skill.category)
              const CategoryIcon = categoryInfo?.icon || Hash
              const isEditing = editingSkill === skill.id
              return (
                <div
                  key={skill.id}
                  className={cn(
                    'flex items-center gap-2 p-2 border rounded-lg transition-colors',
                    isEditing
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{skill.name}</span>
                    {showCategories && (
                      <Badge variant="outline" className="text-xs">
                        {categoryInfo?.label}
                      </Badge>
                    )}
                    {showProficiency && proficiency && (
                      <Badge className={cn('text-xs', proficiency.color)}>
                        {proficiency.label}
                      </Badge>
                    )}
                    {showVerification && skill.verified && (
                      <div title="Vérifié">
                        <Award className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {showProficiency && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingSkill(isEditing ? null : skill.id)}
                        disabled={disabled}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleRemoveSkill(skill.id)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Proficiency editor */}
                  {isEditing && showProficiency && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-background border rounded-lg shadow-lg z-20">
                      <div className="space-y-2 min-w-48">
                        <Label className="text-xs font-medium">Niveau de compétence</Label>
                        <div className="grid grid-cols-2 gap-1">
                          {proficiencyLevels.map((level) => (
                            <Button
                              type="button"
                              key={level.value}
                              type="button"
                              variant={skill.proficiency === level.value ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                handleUpdateSkill(skill.id, { proficiency: level.value })
                              }
                            >
                              {level.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Skills summary */}
      {skills.length > 0 && showCategories && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Répartition par catégorie</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillCategories.map((category) => {
              const count = skills.filter((skill) => skill.category === category.value).length
              if (count === 0) return null
              const CategoryIcon = category.icon
              return (
                <Badge key={category.value} variant="outline" className="text-xs">
                  <CategoryIcon className="h-3 w-3 mr-1" />
                  {category.label}: {count}
                </Badge>
              )
            })}
          </div>
        </div>
      )}
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
