# Phase 3: Migration Strategy - Adapter Services vers Prisma

## Executive Summary

Phase 3 focuses on transitioning from TypeORM to Prisma at the application layer while maintaining backward compatibility.

## Strategy

### Approach: Parallel Implementation with Gradual Migration

Instead of refactoring existing TypeORM services (high risk), we adopt a **parallel implementation strategy**:

1. ✅ **Prisma Services Created** (Phase 1-2): Full CRUD Prisma services for all entities
2. 🔄 **Keep TypeORM Services** (Phase 3): Maintain existing services for compatibility
3. 🎯 **Migrate at Controller/Module Level** (Phase 3): Update high-level code to use Prisma
4. 🧹 **Deprecate TypeORM** (Phase 4): Remove TypeORM after full validation

## Current State

### Prisma Services (Complete - 39 services)

#### Auth Domain (8 services)
- ✅ `AuthPrismaService` - Main authentication
- ✅ `MfaPrismaService` - MFA/TOTP/SMS/WebAuthn
- ✅ `TenantPrismaService` - Multi-tenant management
- ✅ `UserSettingsPrismaService` - User preferences
- ✅ `GroupsPrismaService` - User groups
- ✅ `AuditLogPrismaService` - Audit logging
- ✅ `SmsLogPrismaService` - SMS logs
- ✅ `ModulePrismaService` - Functional modules

#### Sociétés Domain (5 services)
- ✅ `SocietePrismaService`
- ✅ `SocieteLicensePrismaService`
- ✅ `SocieteUserPrismaService`
- ✅ `UserSocieteRolePrismaService`
- ✅ `SitePrismaService`

#### Admin Domain (11 services)
- ✅ `MenuItemPrismaService`
- ✅ `MenuItemRolePrismaService`
- ✅ `MenuItemPermissionPrismaService`
- ✅ `MenuConfigurationPrismaService`
- ✅ `MenuConfigurationSimplePrismaService`
- ✅ `SystemSettingPrismaService`
- ✅ `SystemParameterPrismaService`
- ✅ `UserMenuPreferencesPrismaService`
- ✅ `UserMenuItemPreferencePrismaService`
- ✅ `UserMenuPreferencePrismaService`
- ✅ `DiscoveredPagePrismaService`

#### Parameters Domain (3 services)
- ✅ `ParameterSystemPrismaService`
- ✅ `ParameterApplicationPrismaService`
- ✅ `ParameterClientPrismaService`

#### Notifications Domain (7 services)
- ✅ `NotificationPrismaService`
- ✅ `NotificationEventPrismaService`
- ✅ `NotificationTemplatePrismaService`
- ✅ `NotificationSettingsPrismaService`
- ✅ `NotificationRulePrismaService`
- ✅ `NotificationRuleExecutionPrismaService`
- ✅ `NotificationReadPrismaService`

#### Query Builder Domain (5 services)
- ✅ `QueryBuilderPrismaService`
- ✅ `QueryBuilderColumnPrismaService`
- ✅ `QueryBuilderJoinPrismaService`
- ✅ `QueryBuilderCalculatedFieldPrismaService`
- ✅ `QueryBuilderPermissionPrismaService`

### TypeORM Services (Legacy - To Be Deprecated)

#### Auth Domain (20+ services)
- ⚠️ `auth.service.ts` - Main auth (uses multiple repositories)
- ⚠️ `mfa.service.ts` - MFA logic (1432 lines, complex)
- ⚠️ `audit.service.ts` - Audit logging (720 lines)
- ⚠️ `group.service.ts`, `role.service.ts`, etc.

#### Other Domains
- ⚠️ Various societes, admin, notifications services

## Phase 3 Implementation Plan

### 3.1 Auth Domain Migration ✅

**Goal**: Ensure auth controllers use Prisma services

**Actions**:
1. ✅ Verify AuthPrismaModule exports all services
2. ✅ Verify AuthPrismaController uses Prisma services
3. 🔄 Update AuthModule to import AuthPrismaModule
4. 🔄 Update existing controllers to inject Prisma services
5. 🔄 Create compatibility layer if needed

**Migration Pattern**:
```typescript
// OLD (TypeORM)
constructor(
  @InjectRepository(User, 'auth')
  private readonly userRepository: Repository<User>
) {}

// NEW (Prisma)
constructor(
  private readonly authPrismaService: AuthPrismaService
) {}
```

### 3.2 Admin Domain Migration

**Goal**: Migrate admin/menu controllers to Prisma

**Actions**:
1. Update MenuController to use MenuItemPrismaService
2. Update SystemSettingsController to use SystemSettingPrismaService
3. Update ParametersController to use Parameter*PrismaService
4. Test all admin endpoints

### 3.3 Notifications Domain Migration

**Goal**: Migrate notification controllers to Prisma

**Actions**:
1. Update NotificationsController to use NotificationPrismaService
2. Update NotificationRulesController to use NotificationRulePrismaService
3. Test notification delivery

### 3.4 Validation

**Goal**: Ensure all Prisma integrations work correctly

**Actions**:
1. Run comprehensive test suite
2. Test E2E flows with Prisma
3. Performance benchmarks
4. Documentation updates

## Benefits of This Approach

### ✅ Advantages

1. **Low Risk**: Existing TypeORM code continues to work
2. **Gradual Migration**: Change one controller at a time
3. **Testable**: Each change can be verified independently
4. **Reversible**: Can rollback if issues arise
5. **Parallel Development**: Teams can work on different areas

### ⚠️ Trade-offs

1. **Temporary Duplication**: Both TypeORM and Prisma services exist
2. **Memory Overhead**: Two ORM systems loaded
3. **Maintenance**: Need to track which services use which ORM

## Migration Checklist

### Controllers to Migrate

#### Auth Controllers
- [ ] `auth.controller.ts`
- [ ] `auth-prisma.controller.ts` (already using Prisma)
- [ ] `mfa.controller.ts`
- [ ] `users.controller.ts`

#### Admin Controllers
- [ ] `menu.controller.ts`
- [ ] `system-settings.controller.ts`
- [ ] `parameters.controller.ts`

#### Notification Controllers
- [ ] `notifications.controller.ts`
- [ ] `notification-rules.controller.ts`

### Modules to Update

- [ ] `AuthModule` - Import `AuthPrismaModule`
- [ ] `AdminModule` - Import `AdminPrismaModule`
- [ ] `NotificationsModule` - Import `NotificationsPrismaModule`
- [ ] `SocietesModule` - Import `SocietesPrismaModule`

## Success Criteria

### Phase 3 Complete When:

- ✅ All controllers use Prisma services
- ✅ All tests pass with Prisma
- ✅ E2E flows work correctly
- ✅ Performance benchmarks meet targets
- ✅ Documentation updated
- ✅ No TypeORM imports in controllers/modules (except legacy compatibility)

## Next Steps

1. **Immediate**: Update AuthModule to use AuthPrismaModule
2. **Short-term**: Migrate controllers one by one
3. **Medium-term**: Add integration tests for each migration
4. **Long-term**: Phase 4 - Remove TypeORM completely

## Notes

- All Prisma services follow consistent patterns (Logger, error handling, CRUD)
- Prisma schema is complete and validated
- TypeScript compilation passes for all Prisma services
- Ready for production use after validation

---

**Status**: Phase 3.1 In Progress
**Last Updated**: 2025-01-16
**Next Milestone**: Complete Auth domain controller migration
