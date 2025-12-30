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
import { RoleService, RoleType } from '../services/role.service';

/**
 * HasRoleDirective - Structural directive for role-based UI control
 * 
 * This directive shows/hides elements based on user roles.
 * It automatically subscribes to role changes and updates the view.
 * 
 * Usage Examples:
 * 
 * // Single role check
 * <div *hasRole="'admin'">
 *   Admin Only Content
 * </div>
 * 
 * // Multiple roles check (ANY)
 * <div *hasRole="['admin', 'coordinator']">
 *   Admin or Coordinator Content
 * </div>
 * 
 * // Using enum (recommended)
 * <button *hasRole="RoleType.SUPER_ADMIN">
 *   Super Admin Action
 * </button>
 * 
 * // Multiple roles with enum
 * <div *hasRole="[RoleType.SUPER_ADMIN, RoleType.ADMIN]">
 *   Management Panel
 * </div>
 */
@Directive({
  selector: '[hasRole]'
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private roles: RoleType | string | Array<RoleType | string> | null = null;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private roleService: RoleService
  ) {}

  /**
   * Set the role requirement
   */
  @Input()
  set hasRole(roles: RoleType | string | Array<RoleType | string>) {
    this.roles = roles;
    this.updateView();
  }

  ngOnInit(): void {
    // Subscribe to role changes for reactive updates
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
   * Update the view based on current role
   */
  private updateView(): void {
    if (!this.roles) {
      this.removeView();
      return;
    }

    const hasAccess = this.checkRole();

    if (hasAccess) {
      this.createView();
    } else {
      this.removeView();
    }
  }

  /**
   * Check if user has required role(s)
   */
  private checkRole(): boolean {
    if (!this.roles) {
      return false;
    }

    // Multiple roles
    if (Array.isArray(this.roles)) {
      return this.roleService.hasAnyRole(this.roles);
    }

    // Single role
    return this.roleService.hasRole(this.roles);
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

