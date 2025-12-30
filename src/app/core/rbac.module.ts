import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from './directives/has-permission.directive';
import { HasRoleDirective } from './directives/has-role.directive';
import { RoleService } from './services/role.service';
import { RoleGuard } from './guards/role.guard';
import { PermissionGuard } from './guards/permission.guard';

/**
 * RbacModule - Role-Based Access Control Module
 * 
 * This module provides all RBAC functionality including:
 * - RoleService: Centralized permission management
 * - Guards: Route protection (RoleGuard, PermissionGuard)
 * - Directives: UI-level access control (*hasPermission, *hasRole)
 * 
 * Usage:
 * 1. Import this module in your AppModule or SharedModule
 * 2. Use guards in your routing configuration
 * 3. Use directives in your templates
 * 
 * Example in AppModule:
 * ```typescript
 * import { RbacModule } from './core/rbac.module';
 * 
 * @NgModule({
 *   imports: [
 *     BrowserModule,
 *     RbacModule,  // Import here
 *     // ... other imports
 *   ]
 * })
 * export class AppModule { }
 * ```
 * 
 * Example in feature module:
 * ```typescript
 * import { RbacModule } from '../core/rbac.module';
 * 
 * @NgModule({
 *   imports: [
 *     CommonModule,
 *     RbacModule,  // Import in feature modules
 *     // ... other imports
 *   ]
 * })
 * export class UsersModule { }
 * ```
 */
@NgModule({
  declarations: [
    HasPermissionDirective,
    HasRoleDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HasPermissionDirective,
    HasRoleDirective
  ],
  providers: [
    RoleService,
    RoleGuard,
    PermissionGuard
  ]
})
export class RbacModule { }

