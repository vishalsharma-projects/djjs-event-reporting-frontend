import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Use isAuthenticated() which checks both token existence and validity
    if (this.authService.isAuthenticated()) {
      // User is authenticated, allow access
      return true;
    }
    
    // Not authenticated, redirect to login
    // Check if we're already on login page to avoid redirect loop
    if (!state.url.includes('/auth/login')) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
    }
    
    return false;
  }

}
