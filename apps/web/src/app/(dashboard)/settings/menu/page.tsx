'use client'

export const dynamic = 'force-dynamic'

import { Button, PageContainer, PageHeader, PageSection } from '@erp/ui'
import { Menu, RotateCcw, Save } from 'lucide-react'
import { useTranslation } from '../../../../lib/i18n/hooks'
import { useMenuState } from './hooks/useMenuState'
import { useMenuApi } from './hooks/useMenuApi'
import { useMenuDragDrop } from './hooks/useMenuDragDrop'
import { getAllSortableIds } from './utils/menu-transformers'
import { UserMenuPanel } from './components/UserMenuPanel'
import { StandardMenuPanel } from './components/StandardMenuPanel'
import { MenuItemEditModal } from './components/MenuItemEditModal'

export default function MenuDragDropPage() {
  const { t } = useTranslation('settings')

  // State management
  const {
    standardMenu,
    setStandardMenu,
    userMenu,
    setUserMenu,
    loading,
    setLoading,
    saving,
    setSaving,
    draggedStandardItem,
    setDraggedStandardItem,
    expandedStandardItems,
    expandedUserItems,
    editingItem,
    showEditModal,
    toggleStandardItemExpansion,
    toggleUserItemExpansion,
    openEditModal,
    closeEditModal,
    resetUserMenu,
    addToUserMenu,
    removeFromUserMenu,
  } = useMenuState()

  // API operations
  const { saveUserMenu } = useMenuApi(setStandardMenu, setUserMenu, setLoading, setSaving)

  // Drag and drop logic
  const {
    handleDragEnd,
    handleStandardItemDragStart,
    handleDropInFolder,
    handleUserMenuDrop,
    handleUserMenuDragOver,
  } = useMenuDragDrop(userMenu, setUserMenu, setDraggedStandardItem)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageHeader
        title={t('menu.title')}
        description={t('menu.subtitle')}
        icon={Menu}
        iconBackground="bg-gradient-to-br from-purple-500 to-pink-600"
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetUserMenu}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('menu.reset')}
            </Button>
            <Button type="button" size="sm" onClick={() => saveUserMenu(userMenu)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('menu.saving') : t('menu.save')}
            </Button>
          </div>
        }
      />

      <PageSection spacing="default">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
        {/* Panneau WYSIWYG - Menu Utilisateur */}
        <UserMenuPanel
          userMenu={userMenu}
          draggedStandardItem={draggedStandardItem}
          expandedUserItems={expandedUserItems}
          onDragEnd={handleDragEnd}
          onUserMenuDrop={handleUserMenuDrop}
          onUserMenuDragOver={handleUserMenuDragOver}
          onRemoveFromUserMenu={removeFromUserMenu}
          onDropInFolder={handleDropInFolder}
          onToggleUserItemExpansion={toggleUserItemExpansion}
          onEditItem={openEditModal}
          onCreateFolder={addToUserMenu}
          onCreateLink={addToUserMenu}
          onCreateQuery={addToUserMenu}
          getAllSortableIds={getAllSortableIds}
          t={t}
        />

        {/* Bibliothèque d'éléments - Menu Standard */}
        <StandardMenuPanel
          standardMenu={standardMenu}
          expandedStandardItems={expandedStandardItems}
          onStandardItemDragStart={handleStandardItemDragStart}
          onToggleStandardItemExpansion={toggleStandardItemExpansion}
          t={t}
        />
        </div>
      </PageSection>

      {/* Modale d'édition */}
      <MenuItemEditModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        editingItem={editingItem}
        userMenu={userMenu}
        onMenuUpdate={setUserMenu}
      />
    </PageContainer>
  )
}
