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
    
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // Additional check: verify token is still valid
      const token = this.authService.getToken();
      if (token && this.isTokenValid(token)) {
        return true;
      } else {
        // Token is expired or invalid, logout and redirect
        this.authService.logout();
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url, reason: 'expired' }
        });
        return false;
      }
    }

    // If not authenticated, redirect to login with return URL
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }

  /**
   * Token validation - checks if token exists, has valid format, and is not expired
   */
  private isTokenValid(token: string): boolean {
    if (!token) return false;
    
    try {
      // Basic JWT format validation (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode the payload (second part)
      const payload = parts[1];
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decodedPayload = atob(paddedPayload);
      const payloadObj = JSON.parse(decodedPayload);
      
      // Check if token has expiration claim
      if (payloadObj.exp) {
        const expirationTime = payloadObj.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        // Token is expired
        if (currentTime >= expirationTime) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      // If decoding fails, token is invalid
      return false;
    }
  }
}
