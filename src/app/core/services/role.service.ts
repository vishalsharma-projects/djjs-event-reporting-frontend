import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Role types matching backend
export enum RoleType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COORDINATOR = 'coordinator',
  STAFF = 'staff'
}

// Resource types matching backend
export enum ResourceType {
  USERS = 'users',
  ROLES = 'roles',
  PERMISSIONS = 'permissions',
  BRANCHES = 'branches',
  AREAS = 'areas',
  EVENTS = 'events',
  DONATIONS = 'donations',
  VOLUNTEERS = 'volunteers',
  SPECIAL_GUESTS = 'special_guests',
  MEDIA = 'media',
  PROMOTIONS = 'promotions',
  MASTER_DATA = 'master_data'
}

// Action types matching backend
export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  MANAGE = 'manage'
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface UserPermissions {
  permissions: string[];
  role: string;
}

/**
 * RoleService - Centralized RBAC management for Angular
 * 
 * Features:
 * - Permission caching with RxJS
 * - Role-based and permission-based checks
 * - Automatic token decoding
 * - Thread-safe observable patterns
 * - Comprehensive error handling
 */
@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = environment.apiBaseUrl;
  
  // BehaviorSubjects for reactive state management
  private readonly permissionsSubject = new BehaviorSubject<string[]>([]);
  private readonly roleSubject = new BehaviorSubject<string>('');
  private readonly roleIdSubject = new BehaviorSubject<number | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables (read-only)
  public readonly permissions$ = this.permissionsSubject.asObservable();
  public readonly role$ = this.roleSubject.asObservable();
  public readonly roleId$ = this.roleIdSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();

  // Cache for API calls
  private permissionsCache$?: Observable<UserPermissions>;

  constructor(private http: HttpClient) {
    // Only initialize role from token synchronously (no HTTP calls)
    // Permission fetching will be done lazily when needed or after login
    this.initializeRoleFromToken();
  }

  /**
   * Initialize role from stored JWT token (synchronous, no HTTP calls)
   * Called on service construction
   * Note: Permission fetching is done separately to avoid circular dependency
   */
  private initializeRoleFromToken(): void {
    try {
      const token = localStorage.getItem('auth-token');
      if (token) {
        const payload = this.decodeToken(token);
        if (payload) {
          this.roleSubject.next(payload.role_name || '');
          this.roleIdSubject.next(payload.role_id || null);
          // Don't fetch permissions here - will be fetched after login or when explicitly requested
        }
      }
    } catch (error) {
      console.error('[RoleService] Error initializing from token:', error);
    }
  }

  /**
   * Decode JWT token safely
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('[RoleService] Error decoding token:', error);
      return null;
    }
  }

  /**
   * Fetch current user's permissions from backend
   * Results are cached and shared across subscribers
   */
  fetchMyPermissions(): Observable<UserPermissions> {
    // Return cached observable if available
    if (this.permissionsCache$) {
      return this.permissionsCache$;
    }

    this.loadingSubject.next(true);

    // Create new cached observable
    this.permissionsCache$ = this.http.get<any>(`${this.apiUrl}/api/rbac/my-permissions`).pipe(
      map(response => {
        if (!response || !response.data) {
          throw new Error('Invalid response format');
        }
        return response.data as UserPermissions;
      }),
      tap(data => {
        this.permissionsSubject.next(data.permissions || []);
        this.roleSubject.next(data.role || '');
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('[RoleService] Error fetching permissions:', error);
        this.loadingSubject.next(false);
        this.clearCache();
        return throwError(() => error);
      }),
      shareReplay(1) // Cache and share result
    );

    return this.permissionsCache$;
  }

  /**
   * Clear the permissions cache
   * Call this when permissions might have changed
   */
  clearCache(): void {
    this.permissionsCache$ = undefined;
  }

  /**
   * Check if user has a specific permission
   * Checks both exact permission and manage permission
   */
  hasPermission(resource: ResourceType | string, action: ActionType | string): boolean {
    const permissions = this.permissionsSubject.value;
    const permissionString = `${resource}:${action}`;
    const managePermission = `${resource}:${ActionType.MANAGE}`;
    
    // Super admin has all permissions
    if (this.isSuperAdmin()) {
      return true;
    }
    
    return permissions.includes(permissionString) || permissions.includes(managePermission);
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(checks: Array<{ resource: ResourceType | string; action: ActionType | string }>): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    return checks.some(check => this.hasPermission(check.resource, check.action));
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  hasAllPermissions(checks: Array<{ resource: ResourceType | string; action: ActionType | string }>): boolean {
    if (this.isSuperAdmin()) {
      return true;
    }
    return checks.every(check => this.hasPermission(check.resource, check.action));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: RoleType | string): boolean {
    const currentRole = this.roleSubject.value;
    return currentRole === role;
  }

  /**
   * Check if user has ANY of the specified roles
   */
  hasAnyRole(roles: Array<RoleType | string>): boolean {
    const currentRole = this.roleSubject.value;
    return roles.includes(currentRole);
  }

  /**
   * Check if user has ALL of the specified roles (usually just one makes sense)
   */
  hasAllRoles(roles: Array<RoleType | string>): boolean {
    const currentRole = this.roleSubject.value;
    return roles.every(role => currentRole === role);
  }

  /**
   * Get current user's role
   */
  getCurrentRole(): string {
    return this.roleSubject.value;
  }

  /**
   * Get current user's role ID
   */
  getCurrentRoleId(): number | null {
    return this.roleIdSubject.value;
  }

  /**
   * Get current user's permissions
   */
  getCurrentPermissions(): string[] {
    return [...this.permissionsSubject.value]; // Return copy
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.hasRole(RoleType.SUPER_ADMIN);
  }

  /**
   * Check if user is admin (super_admin or admin)
   */
  isAdmin(): boolean {
    return this.hasAnyRole([RoleType.SUPER_ADMIN, RoleType.ADMIN]);
  }

  /**
   * Check if user is coordinator or higher
   */
  isCoordinatorOrHigher(): boolean {
    return this.hasAnyRole([RoleType.SUPER_ADMIN, RoleType.ADMIN, RoleType.COORDINATOR]);
  }

  /**
   * Check permission on backend (for critical operations)
   * Use this for double-checking before destructive actions
   */
  checkPermissionOnBackend(resource: string, action: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/api/rbac/check-permission`, {
      resource,
      action
    }).pipe(
      map(response => response?.data?.has_permission || false),
      catchError(error => {
        console.error('[RoleService] Error checking permission on backend:', error);
        return of(false);
      })
    );
  }

  /**
   * Clear all permissions and role data
   * Call this on logout
   */
  clearPermissions(): void {
    this.permissionsSubject.next([]);
    this.roleSubject.next('');
    this.roleIdSubject.next(null);
    this.clearCache();
  }

  // ========================================
  // RBAC Management APIs (Admin Use)
  // ========================================

  /**
   * Get all roles (admin only)
   */
  getRoles(): Observable<Role[]> {
    return this.http.get<any>(`${this.apiUrl}/api/rbac/roles`).pipe(
      map(response => response.data as Role[]),
      catchError(this.handleError)
    );
  }

  /**
   * Get role by ID
   */
  getRole(id: number): Observable<Role> {
    return this.http.get<any>(`${this.apiUrl}/api/rbac/roles/${id}`).pipe(
      map(response => response.data as Role),
      catchError(this.handleError)
    );
  }

  /**
   * Create new role (super admin only)
   */
  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<any>(`${this.apiUrl}/api/rbac/roles`, role).pipe(
      map(response => response.data as Role),
      catchError(this.handleError)
    );
  }

  /**
   * Update role
   */
  updateRole(id: number, role: Partial<Role>): Observable<Role> {
    return this.http.put<any>(`${this.apiUrl}/api/rbac/roles/${id}`, role).pipe(
      map(response => response.data as Role),
      catchError(this.handleError)
    );
  }

  /**
   * Delete role
   */
  deleteRole(id: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/api/rbac/roles/${id}`).pipe(
      map(() => void 0),
      catchError(this.handleError)
    );
  }

  /**
   * Get all permissions
   */
  getPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.apiUrl}/api/rbac/permissions`).pipe(
      map(response => response.data as Permission[]),
      catchError(this.handleError)
    );
  }

  /**
   * Get permissions for a specific role
   */
  getRolePermissions(roleId: number): Observable<string[]> {
    return this.http.get<any>(`${this.apiUrl}/api/rbac/role-permissions/role/${roleId}`).pipe(
      map(response => {
        console.log(`[RoleService] getRolePermissions for role ${roleId}:`, response);
        if (!response || !response.data) {
          console.warn(`[RoleService] Invalid response format for role ${roleId}:`, response);
          return [];
        }
        const permissions = response.data as string[];
        console.log(`[RoleService] Role ${roleId} has ${permissions.length} permissions:`, permissions);
        return permissions;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Grant permission to role
   */
  grantPermission(roleId: number, permissionId: number): Observable<void> {
    console.log(`[RoleService] grantPermission: roleId=${roleId}, permissionId=${permissionId}`);
    return this.http.post<any>(`${this.apiUrl}/api/rbac/role-permissions/grant`, {
      role_id: roleId,
      permission_id: permissionId
    }).pipe(
      map((response) => {
        console.log(`[RoleService] grantPermission response:`, response);
        // Response format: {success: true, message: "...", data: null}
        // Just return void on success
        if (!response || !response.success) {
          console.error(`[RoleService] grantPermission failed:`, response);
          throw new Error(response?.message || 'Failed to grant permission');
        }
        return void 0;
      }),
      catchError((error) => {
        console.error(`[RoleService] grantPermission error:`, error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Revoke permission from role
   */
  revokePermission(roleId: number, permissionId: number): Observable<void> {
    console.log(`[RoleService] revokePermission: roleId=${roleId}, permissionId=${permissionId}`);
    return this.http.post<any>(`${this.apiUrl}/api/rbac/role-permissions/revoke`, {
      role_id: roleId,
      permission_id: permissionId
    }).pipe(
      map((response) => {
        console.log(`[RoleService] revokePermission response:`, response);
        // Response format: {success: true, message: "...", data: null}
        // Just return void on success
        if (!response || !response.success) {
          console.error(`[RoleService] revokePermission failed:`, response);
          throw new Error(response?.message || 'Failed to revoke permission');
        }
        return void 0;
      }),
      catchError((error) => {
        console.error(`[RoleService] revokePermission error:`, error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.error || error.message || `Error Code: ${error.status}`;
    }
    
    console.error('[RoleService] HTTP Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

