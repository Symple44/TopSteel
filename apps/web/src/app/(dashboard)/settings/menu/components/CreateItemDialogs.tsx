import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useFormFieldIds,
} from '@erp/ui'
import { FolderPlus, Link, Search } from 'lucide-react'
import type { UserMenuItem } from '../types/menu.types'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface CreateItemDialogsProps {
  userMenu: UserMenuItem[]
  onCreateFolder: (folder: UserMenuItem) => void
  onCreateLink: (link: UserMenuItem) => void
  onCreateQuery: (query: UserMenuItem) => void
  t: TranslationFunction
}

export function CreateItemDialogs({
  userMenu,
  onCreateFolder,
  onCreateLink,
  onCreateQuery,
  t,
}: CreateItemDialogsProps) {
  const ids = useFormFieldIds([
    'folder-title',
    'link-title',
    'link-url',
    'query-title',
    'query-id',
  ])

  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [showCreateQuery, setShowCreateQuery] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemQueryId, setNewItemQueryId] = useState('')

  const handleCreateFolder = () => {
    if (!newItemTitle?.trim()) return

    const newFolder: UserMenuItem = {
      id: `folder-${Date.now()}`,
      title: newItemTitle,
      type: 'M',
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'FolderOpen',
    }
    onCreateFolder(newFolder)
    setNewItemTitle('')
    setShowCreateFolder(false)
  }

  const handleCreateLink = () => {
    if (!newItemTitle?.trim() || !newItemUrl?.trim()) return

    const newLink: UserMenuItem = {
      id: `link-${Date.now()}`,
      title: newItemTitle,
      type: 'L',
      externalUrl: newItemUrl,
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'ExternalLink',
    }
    onCreateLink(newLink)
    setNewItemTitle('')
    setNewItemUrl('')
    setShowCreateLink(false)
  }

  const handleCreateQuery = () => {
    if (!newItemTitle?.trim() || !newItemQueryId?.trim()) return

    const newQuery: UserMenuItem = {
      id: `query-${Date.now()}`,
      title: newItemTitle,
      type: 'D',
      queryBuilderId: newItemQueryId,
      orderIndex: userMenu.length,
      isVisible: true,
      children: [],
      icon: 'BarChart3',
    }
    onCreateQuery(newQuery)
    setNewItemTitle('')
    setNewItemQueryId('')
    setShowCreateQuery(false)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Créer un dossier */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-1" />
            {t('menu.folder')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('menu.createNewFolder')}</DialogTitle>
            <DialogDescription>{t('menu.folderDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor={ids['folder-title']}>{t('menu.folderName')}</Label>
              <Input
                id={ids['folder-title']}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e?.target?.value)}
                placeholder={t('menu.folderPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateFolder(false)}>
              {t('menu.cancel')}
            </Button>
            <Button type="button" onClick={handleCreateFolder}>
              {t('menu.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Créer un lien */}
      <Dialog open={showCreateLink} onOpenChange={setShowCreateLink}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Link className="h-4 w-4 mr-1" />
            {t('menu.link')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('menu.createNewLink')}</DialogTitle>
            <DialogDescription>{t('menu.linkDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor={ids['link-title']}>{t('menu.linkName')}</Label>
              <Input
                id={ids['link-title']}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e?.target?.value)}
                placeholder={t('menu.linkPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor={ids['link-url']}>{t('menu.url')}</Label>
              <Input
                id={ids['link-url']}
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e?.target?.value)}
                placeholder={t('menu.urlPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateLink(false)}>
              {t('menu.cancel')}
            </Button>
            <Button type="button" onClick={handleCreateLink}>
              {t('menu.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Créer une vue de données */}
      <Dialog open={showCreateQuery} onOpenChange={setShowCreateQuery}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Search className="h-4 w-4 mr-1" />
            {t('menu.dataView')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('menu.createNewDataView')}</DialogTitle>
            <DialogDescription>{t('menu.dataViewDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor={ids['query-title']}>{t('menu.dataViewName')}</Label>
              <Input
                id={ids['query-title']}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e?.target?.value)}
                placeholder={t('menu.dataViewPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor={ids['query-id']}>{t('menu.queryId')}</Label>
              <Input
                id={ids['query-id']}
                value={newItemQueryId}
                onChange={(e) => setNewItemQueryId(e?.target?.value)}
                placeholder={t('menu.queryIdPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateQuery(false)}>
              {t('menu.cancel')}
            </Button>
            <Button type="button" onClick={handleCreateQuery}>
              {t('menu.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
