// Temporary stub entity for backward compatibility
// TODO: Migrate to proper domain entities

export class MenuItemPermission {
  id!: string
  menuItemId!: string
  permissionId!: string

  static create(menuItemId: string, permissionId: string): MenuItemPermission {
    const permission = new MenuItemPermission()
    permission.menuItemId = menuItemId
    permission.permissionId = permissionId
    return permission
  }
}
