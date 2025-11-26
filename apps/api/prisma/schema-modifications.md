# Modifications schema.prisma - Multi-Tenant

## Modifications à Appliquer

### 1. SystemSetting (ligne ~482)
**AJOUTER après `key` et avant `value`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations (après `updatedByUser`):**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, category])
```

**MODIFIER la relation dans Societe:**
```prisma
  systemSettings  SystemSetting[]
```

---

### 2. SystemParameter (ligne ~502)
**AJOUTER après `key` et avant `value`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
```

**MODIFIER la relation dans Societe:**
```prisma
  systemParameters  SystemParameter[]
```

---

### 3. MenuConfiguration (ligne ~515)
**AJOUTER après `name` et avant `description`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, isActive])
```

**MODIFIER la relation dans Societe:**
```prisma
  menuConfigurations  MenuConfiguration[]
```

---

### 4. MenuConfigurationSimple (ligne ~626)
**AJOUTER après `name` et avant `config`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
```

---

### 5. UserMenuPreference (ligne ~638)
**AJOUTER après `userId` et avant `menuData`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId, userId])
```

---

### 6. UserMenuPreferences (ligne ~591)
**AJOUTER après `userId` et avant `theme`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

---

### 7. ParameterSystem (ligne ~669)
**AJOUTER après `code` et avant `label`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, category])
```

---

### 8. ParameterApplication (ligne ~693)
**AJOUTER après `code` et avant `label`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, category])
```

---

### 9. ParameterClient (ligne ~715)
**AJOUTER après `code` et avant `label`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, category])
```

---

### 10. Notification (ligne ~740)
**AJOUTER après `id` et avant `userId`:**
```prisma
  societeId   String   @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, userId])
  @@index([societeId, type])
```

---

### 11. NotificationEvent (ligne ~769)
**AJOUTER après `id` et avant `type`:**
```prisma
  societeId   String   @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, type])
```

---

### 12. NotificationTemplate (ligne ~787)
**AJOUTER après `id` et avant `code`:**
```prisma
  societeId   String   @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, code])
```

---

### 13. NotificationRule (ligne ~818)
**AJOUTER après `id` et avant `name`:**
```prisma
  societeId   String   @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, type])
```

---

### 14. QueryBuilder (ligne ~880)
**AJOUTER après `id` et avant `name`:**
```prisma
  societeId   String   @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, createdBy])
```

---

### 15. AuditLog (ligne ~313)
**AJOUTER après `userId` et avant `action`:**
```prisma
  societeId   String?  @map("societe_id")
```

**AJOUTER dans relations:**
```prisma
  societe     Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)
```

**AJOUTER dans index:**
```prisma
  @@index([societeId])
  @@index([societeId, createdAt])
```

---

## Modification dans model Societe

**AJOUTER ces relations dans le model Societe (après `permissions`):**

```prisma
  // Multi-tenant relations
  systemSettings        SystemSetting[]
  systemParameters      SystemParameter[]
  menuConfigurations    MenuConfiguration[]
  menuConfigSimples     MenuConfigurationSimple[]
  userMenuPreferences   UserMenuPreference[]
  userMenuPrefs         UserMenuPreferences[]
  parameterSystems      ParameterSystem[]
  parameterApps         ParameterApplication[]
  parameterClients      ParameterClient[]
  notifications         Notification[]
  notificationEvents    NotificationEvent[]
  notificationTemplates NotificationTemplate[]
  notificationRules     NotificationRule[]
  queryBuilders         QueryBuilder[]
  auditLogs             AuditLog[]
```
