// Temporary stub entity for backward compatibility
// TODO: Migrate to proper domain entities

export class MenuItemRole {
  id!: string
  menuItemId!: string
  roleId!: string

  static create(menuItemId: string, roleId: string): MenuItemRole {
    const role = new MenuItemRole()
    role.menuItemId = menuItemId
    role.roleId = roleId
    return role
  }
}
