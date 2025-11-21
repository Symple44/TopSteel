export interface MenuItemConfig {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: MenuItemConfig[]
  depth: number
  icon?: string
  badge?: string
  gradient?: string
}

export interface UserMenuItem {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: UserMenuItem[]
  icon?: string
  customTitle?: string
  titleTranslations?: Record<string, string>
  customIcon?: string
  customIconColor?: string
  isUserCreated?: boolean // Indique si l'élément a été créé par l'utilisateur (éditable)
}
