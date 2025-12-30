import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router, 
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { RoleService, RoleType } from '../services/role.service';

/**
 * RoleGuard - Protects routes based on user roles
 * 
 * Usage in routes:
 * {
 *   path: 'admin',
 *   canActivate: [AuthGuard, RoleGuard],
 *   data: { 
 *     roles: [RoleType.SUPER_ADMIN, RoleType.ADMIN],
 *     redirectTo: '/unauthorized' // Optional custom redirect
 *   }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Get required roles from route data
    const requiredRoles = route.data['roles'] as Array<RoleType | string>;
    
    // No role requirement specified
    if (!requiredRoles || requiredRoles.length === 0) {
      console.warn('[RoleGuard] No roles specified in route data. Allowing access.');
      return true;
    }

    // Check if user has any of the required roles
    const hasAccess = this.roleService.hasAnyRole(requiredRoles);
    
    if (hasAccess) {
      return true;
    }

    // Log denial for debugging
    const currentRole = this.roleService.getCurrentRole();
    console.warn('[RoleGuard] Access denied', {
      required: requiredRoles,
      current: currentRole,
      path: state.url
    });

    // Get custom redirect or use default
    const redirectTo = route.data['redirectTo'] || '/pages/error-403';
    
    // Redirect to unauthorized page
    return this.router.createUrlTree([redirectTo], {
      queryParams: { 
        returnUrl: state.url,
        reason: 'insufficient_role'
      }
    });
  }
}

