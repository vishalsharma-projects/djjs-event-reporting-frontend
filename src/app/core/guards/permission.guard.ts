import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router, 
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { RoleService, ResourceType, ActionType } from '../services/role.service';

/**
 * Permission check configuration for routes
 */
export interface PermissionCheck {
  resource: ResourceType | string;
  action: ActionType | string;
}

/**
 * PermissionGuard - Protects routes based on user permissions
 * 
 * Usage examples:
 * 
 * // Single permission
 * {
 *   path: 'users/create',
 *   canActivate: [AuthGuard, PermissionGuard],
 *   data: {
 *     permission: { resource: ResourceType.USERS, action: ActionType.CREATE }
 *   }
 * }
 * 
 * // Multiple permissions (ANY)
 * {
 *   path: 'reports',
 *   canActivate: [AuthGuard, PermissionGuard],
 *   data: {
 *     permissions: [
 *       { resource: ResourceType.EVENTS, action: ActionType.READ },
 *       { resource: ResourceType.DONATIONS, action: ActionType.READ }
 *     ],
 *     requireAllPermissions: false // Default is false (ANY)
 *   }
 * }
 * 
 * // Multiple permissions (ALL)
 * {
 *   path: 'admin-panel',
 *   canActivate: [AuthGuard, PermissionGuard],
 *   data: {
 *     permissions: [
 *       { resource: ResourceType.USERS, action: ActionType.MANAGE },
 *       { resource: ResourceType.BRANCHES, action: ActionType.MANAGE }
 *     ],
 *     requireAllPermissions: true
 *   }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Get permission requirements from route data
    const singlePermission = route.data['permission'] as PermissionCheck;
    const multiplePermissions = route.data['permissions'] as PermissionCheck[];
    const requireAll = route.data['requireAllPermissions'] === true; // Default to false (ANY)

    // No permission requirement specified
    if (!singlePermission && !multiplePermissions) {
      console.warn('[PermissionGuard] No permissions specified in route data. Allowing access.');
      return true;
    }

    let hasAccess = false;
    let checkedPermissions: string[] = [];

    // Check single permission
    if (singlePermission) {
      hasAccess = this.roleService.hasPermission(
        singlePermission.resource,
        singlePermission.action
      );
      checkedPermissions.push(`${singlePermission.resource}:${singlePermission.action}`);
    }

    // Check multiple permissions
    if (multiplePermissions && multiplePermissions.length > 0) {
      if (requireAll) {
        hasAccess = this.roleService.hasAllPermissions(multiplePermissions);
      } else {
        hasAccess = this.roleService.hasAnyPermission(multiplePermissions);
      }
      checkedPermissions = multiplePermissions.map(p => `${p.resource}:${p.action}`);
    }

    if (hasAccess) {
      return true;
    }

    // Log denial for debugging
    console.warn('[PermissionGuard] Access denied', {
      required: checkedPermissions,
      requireAll: requireAll,
      currentPermissions: this.roleService.getCurrentPermissions(),
      path: state.url
    });

    // Get custom redirect or use default
    const redirectTo = route.data['redirectTo'] || '/pages/error-403';

    // Redirect to forbidden page
    return this.router.createUrlTree([redirectTo], {
      queryParams: { 
        returnUrl: state.url,
        reason: 'insufficient_permissions',
        required: checkedPermissions.join(',')
      }
    });
  }
}

