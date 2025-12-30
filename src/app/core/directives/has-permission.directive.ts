import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  OnInit, 
  OnDestroy 
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RoleService, ResourceType, ActionType } from '../services/role.service';

/**
 * HasPermissionDirective - Structural directive for permission-based UI control
 * 
 * This directive shows/hides elements based on user permissions.
 * It automatically subscribes to permission changes and updates the view.
 * 
 * Usage Examples:
 * 
 * // Single permission check
 * <button *hasPermission="{ resource: 'users', action: 'create' }">
 *   Create User
 * </button>
 * 
 * // Multiple permissions (ANY - default)
 * <div *hasPermission="[
 *   { resource: 'users', action: 'create' },
 *   { resource: 'users', action: 'update' }
 * ]">
 *   User Management Section
 * </div>
 * 
 * // Multiple permissions (ALL)
 * <div *hasPermission="[
 *   { resource: 'users', action: 'create' },
 *   { resource: 'branches', action: 'create' }
 * ]" [hasPermissionRequireAll]="true">
 *   Advanced Admin Panel
 * </div>
 * 
 * // Using enums (recommended)
 * <button *hasPermission="{ resource: ResourceType.USERS, action: ActionType.DELETE }">
 *   Delete User
 * </button>
 */
@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private permission: 
    | { resource: ResourceType | string; action: ActionType | string }
    | Array<{ resource: ResourceType | string; action: ActionType | string }>
    | null = null;
  private requireAll = false;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {}

  /**
   * Set the permission requirement
   */
  @Input()
  set hasPermission(
    permission: 
      | { resource: ResourceType | string; action: ActionType | string }
      | Array<{ resource: ResourceType | string; action: ActionType | string }>
  ) {
    this.permission = permission;
    this.updateView();
  }

  /**
   * Set whether all permissions are required (for multiple permissions)
   * Default is false (ANY permission)
   */
  @Input()
  set hasPermissionRequireAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
  }

  ngOnInit(): void {
    // Subscribe to permission changes for reactive updates
    this.roleService.permissions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateView();
    });

    // Also subscribe to role changes (for role-based logic)
    this.roleService.role$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update the view based on current permissions
   */
  private updateView(): void {
    if (!this.permission) {
      this.removeView();
      return;
    }

    const hasAccess = this.checkPermission();

    if (hasAccess) {
      this.createView();
    } else {
      this.removeView();
    }
  }

  /**
   * Check if user has required permission(s)
   */
  private checkPermission(): boolean {
    if (!this.permission) {
      return false;
    }

    // Multiple permissions
    if (Array.isArray(this.permission)) {
      if (this.requireAll) {
        return this.roleService.hasAllPermissions(this.permission);
      } else {
        return this.roleService.hasAnyPermission(this.permission);
      }
    }

    // Single permission
    return this.roleService.hasPermission(
      this.permission.resource, 
      this.permission.action
    );
  }

  /**
   * Create the view if not already created
   */
  private createView(): void {
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }

  /**
   * Remove the view if it exists
   */
  private removeView(): void {
    if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

