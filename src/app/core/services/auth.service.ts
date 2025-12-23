import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  login,
  loginSuccess,
  loginFailure,
  logout,
  logoutSuccess
} from '../../store/Authentication/authentication.actions';
import { LoginRequest, LoginResponse, User } from '../../store/Authentication/auth.models';
import { RootReducerState } from '../../store/index';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private store: Store<RootReducerState>
  ) {}

  /**
   * Login user with email and password
   * @param credentials LoginRequest object containing email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Ensure credentials are trimmed (extra safety check)
    const trimmedCredentials: LoginRequest = {
      email: (credentials.email || '').trim(),
      password: (credentials.password || '').trim()
    };

    // Dispatch login action
    this.store.dispatch(login({ credentials: trimmedCredentials }));

    const url = `${this.apiUrl}/api/login`;

    // Debug: Log the request (without password for security)
    console.log('Login request to:', url);
    console.log('Email:', trimmedCredentials.email);
    console.log('Password length:', trimmedCredentials.password.length);

    return this.http.post<LoginResponse>(url, trimmedCredentials).pipe(
      tap(response => {
        // Store token in localStorage
        this.storeToken(response.token);

        // Dispatch success action with email from credentials
        this.store.dispatch(loginSuccess({ response, email: trimmedCredentials.email }));

        console.log('Login successful:', response);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);

        // Dispatch failure action
        this.store.dispatch(loginFailure({ error: errorMessage }));

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Dispatch logout action
    this.store.dispatch(logout());

    // Clear token from localStorage
    this.clearToken();

    // Dispatch logout success action
    this.store.dispatch(logoutSuccess());

    console.log('User logged out successfully');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const currentTime = Date.now() / 1000;

      // Check if token has expiration and if it's expired
      if (payload.exp && payload.exp < currentTime) {
        return true;
      }

      return false;
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Store token in localStorage
   */
  private storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear token from localStorage
   */
  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Get HTTP headers with authorization token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): string {
    let errorMessage = 'An error occurred during login';

    // Log the full error for debugging
    console.error('Login error:', error);

    if (error.error) {
      // Backend returns errors in format: {"error": "message"}
      if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.details) {
        errorMessage = error.error.details;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your credentials.';
          break;
        case 401:
          errorMessage = 'Invalid email or password';
          break;
        case 404:
          errorMessage = 'Login endpoint not found. Please contact support.';
          break;
        case 500:
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `HTTP error ${error.status}. Please try again.`;
      }
    }

    return errorMessage;
  }

  /**
   * Refresh token (if needed in future)
   */
  refreshToken(): Observable<any> {
    // Implementation for token refresh if needed
    return throwError(() => new Error('Token refresh not implemented'));
  }

  /**
   * Reset password
   * @param email email address
   */
  resetPassword(email: string): Observable<any> {
    // Implementation for password reset
    // This would typically call a password reset endpoint
    return throwError(() => new Error('Password reset not implemented'));
  }

  /**
   * Get current user from store
   */
  getCurrentUser(): Observable<User | null> {
    return this.store.select(state => state.auth.user);
  }

  /**
   * Get authentication state from store
   */
  getAuthState(): Observable<{
    isLoggedIn: boolean;
    user: User | null;
    token: string | null;
    error: string | null;
    loading: boolean;
  }> {
    return this.store.select(state => state.auth);
  }
}

