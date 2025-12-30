import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RoleService, Role, Permission, RoleType } from '../../../core/services/role.service';
import { MessageService } from 'primeng/api';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

interface RolePermissionMap {
  [roleId: number]: {
    role: Role;
    permissions: Permission[];
    permissionIds: Set<number>;
  };
}

@Component({
  selector: 'app-permissions-management',
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  roles: Role[] = [];
  permissions: Permission[] = [];
  rolePermissionMap: RolePermissionMap = {};
  
  // UI State
  loading = false;
  selectedRole: Role | null = null;
  showRoleDialog = false;
  newRoleName = '';
  newRoleDescription = '';
  
  // Grouped permissions by resource
  groupedPermissions: { [resource: string]: Permission[] } = {};
  resources: string[] = [];
  
  // Search and Filter
  searchTerm: string = '';
  selectedResource: string | null = null;
  expandedResources: Set<string> = new Set();
  
  // Export RoleType for template use
  RoleType = RoleType;
  
  constructor(
    private roleService: RoleService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    
    // Load roles and permissions sequentially (permissions needed for role mapping)
    this.roleService.getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          console.log('[PermissionsManagement] Loaded roles:', roles);
          this.roles = roles;
          this.loadPermissions();
        },
        error: (err) => {
          console.error('[PermissionsManagement] Error loading roles:', err);
          const errorMsg = err?.error?.error || err?.message || 'Failed to load roles';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg
          });
          this.loading = false;
        }
      });
  }

  loadPermissions(): void {
    this.roleService.getPermissions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissions) => {
          console.log('[PermissionsManagement] Loaded permissions:', permissions.length);
          console.log('[PermissionsManagement] Sample permissions:', permissions.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action,
            string: `${p.resource}:${p.action}`
          })));
          this.permissions = permissions;
          this.groupPermissionsByResource();
          // Ensure permissions are loaded before loading role permissions
          if (this.permissions.length > 0) {
            this.initializeExpandedResources();
            this.loadRolePermissions();
          } else {
            console.warn('[PermissionsManagement] No permissions loaded, cannot load role permissions');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('[PermissionsManagement] Error loading permissions:', err);
          const errorMsg = err?.error?.error || err?.message || 'Failed to load permissions';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg
          });
          this.loading = false;
        }
      });
  }

  loadRolePermissions(): void {
    // Ensure permissions are loaded before mapping
    if (!this.permissions || this.permissions.length === 0) {
      console.warn('[PermissionsManagement] Permissions not loaded yet, waiting...');
      setTimeout(() => this.loadRolePermissions(), 100);
      return;
    }

    // Load permissions for each role
    const loadObservables = this.roles.map(role => 
      this.roleService.getRolePermissions(role.id)
        .pipe(
          takeUntil(this.destroy$),
          catchError(err => {
            console.error(`Error loading permissions for role ${role.id}:`, err);
            return of([]); // Return empty array on error
          })
        )
    );

    // Wait for all role permissions to load
    forkJoin(loadObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (permissionArrays) => {
          console.log('[PermissionsManagement] ===== INITIAL LOAD: Loaded role permissions for', permissionArrays.length, 'roles =====');
          this.roles.forEach((role, index) => {
            const permissionStrings = permissionArrays[index] || [];
            console.log(`[PermissionsManagement] Role ${role.name} (${role.id}) has ${permissionStrings.length} permission strings from backend:`, permissionStrings);
            console.log(`[PermissionsManagement] Available permission objects: ${this.permissions.length} total`);
            
            // Super admin has all permissions - show all as checked
            if (role.name === RoleType.SUPER_ADMIN) {
              // Create new map reference to trigger change detection
              this.rolePermissionMap = {
                ...this.rolePermissionMap,
                [role.id]: {
                  role,
                  permissions: [...this.permissions], // All permissions
                  permissionIds: new Set(this.permissions.map(p => p.id))
                }
              };
              console.log(`[PermissionsManagement] Super admin has all ${this.permissions.length} permissions`);
            } else {
              // Convert permission strings to Permission objects
              // Match by resource:action format (case-insensitive for safety)
              const rolePermissions: Permission[] = [];
              const unmatchedStrings: string[] = [];
              
              // Create a map of all permissions for faster lookup
              const permissionMap = new Map<string, Permission>();
              this.permissions.forEach(p => {
                const key = `${p.resource}:${p.action}`.toLowerCase();
                permissionMap.set(key, p);
              });
              
              console.log(`[PermissionsManagement] Matching ${permissionStrings.length} permission strings for role ${role.name} (${role.id})`);
              console.log(`[PermissionsManagement] Available permissions in map: ${permissionMap.size}`);
              
              permissionStrings.forEach(permString => {
                // Try exact match first
                let matchedPermission = this.permissions.find(p => 
                  `${p.resource}:${p.action}` === permString
                );
                
                // If no exact match, try case-insensitive match
                if (!matchedPermission) {
                  const lowerKey = permString.toLowerCase();
                  matchedPermission = permissionMap.get(lowerKey);
                }
                
                if (matchedPermission) {
                  rolePermissions.push(matchedPermission);
                  console.log(`[PermissionsManagement] ✓ Matched: ${permString} → Permission ID ${matchedPermission.id} (${matchedPermission.resource}:${matchedPermission.action})`);
                } else {
                  unmatchedStrings.push(permString);
                  console.error(`[PermissionsManagement] ✗ UNMATCHED: ${permString}`);
                  console.error(`[PermissionsManagement] Available permission formats:`, 
                    this.permissions.slice(0, 5).map(p => `${p.resource}:${p.action}`));
                }
              });
              
              if (unmatchedStrings.length > 0) {
                console.error(`[PermissionsManagement] ⚠️ Role ${role.name} (${role.id}) has ${unmatchedStrings.length} unmatched permission strings:`, unmatchedStrings);
                console.error(`[PermissionsManagement] This may cause checkboxes to appear unchecked after refresh!`);
              }
              
              // Ensure both arrays and sets are in sync
              const permissionIds = new Set(rolePermissions.map(p => p.id));
              
              console.log(`[PermissionsManagement] ✓ Role ${role.name} (ID: ${role.id}) mapped to ${rolePermissions.length} permission objects out of ${permissionStrings.length} permission strings`);
              console.log(`[PermissionsManagement] ✓ Permission IDs for role ${role.id}:`, Array.from(permissionIds).sort((a, b) => a - b));
              
              // Log a sample of matched permissions for verification
              if (rolePermissions.length > 0) {
                console.log(`[PermissionsManagement] Sample matched permissions for role ${role.id}:`, 
                  rolePermissions.slice(0, 3).map(p => `${p.id}:${p.resource}:${p.action}`));
              }
              
              // Create new map reference to trigger change detection
              this.rolePermissionMap = {
                ...this.rolePermissionMap,
                [role.id]: {
                  role,
                  permissions: rolePermissions, // Array of Permission objects
                  permissionIds: permissionIds // Set of permission IDs - source of truth
                }
              };
              
              // Verify the data structure
              const verifyData = this.rolePermissionMap[role.id];
              if (verifyData.permissions.length !== verifyData.permissionIds.size) {
                console.error(`[PermissionsManagement] DATA MISMATCH for role ${role.id}: permissions array has ${verifyData.permissions.length} but permissionIds has ${verifyData.permissionIds.size}`);
              }
              
              // Verify all permission strings were matched
              if (unmatchedStrings.length > 0) {
                console.error(`[PermissionsManagement] CRITICAL: ${unmatchedStrings.length} permissions could not be matched for role ${role.id}. Checkboxes may not work correctly!`);
              }
            }
          });
          
          this.loading = false;
          console.log('[PermissionsManagement] ===== INITIAL LOAD COMPLETE =====');
          console.log('[PermissionsManagement] Final rolePermissionMap summary:', Object.keys(this.rolePermissionMap).map(key => ({
            roleId: key,
            roleName: this.rolePermissionMap[+key].role.name,
            permissionsCount: this.rolePermissionMap[+key].permissions.length,
            permissionIdsCount: this.rolePermissionMap[+key].permissionIds.size
          })));
          
          // Final verification: Log all permission IDs for each role
          console.log('[PermissionsManagement] ===== FINAL PERMISSION STATE =====');
          Object.keys(this.rolePermissionMap).forEach(key => {
            const roleId = +key;
            const roleData = this.rolePermissionMap[roleId];
            const permIds = Array.from(roleData.permissionIds).sort((a, b) => a - b);
            console.log(`[PermissionsManagement] Role ${roleData.role.name} (${roleId}): ${permIds.length} permissions`, permIds);
          });
          console.log('[PermissionsManagement] ===== END INITIAL LOAD =====');
          
          // Set CSS variable for role count for responsive grid
          document.documentElement.style.setProperty('--role-count', this.roles.length.toString());
          
          // Force change detection after loading all permissions
          // Use setTimeout to ensure Angular has processed all the data
          setTimeout(() => {
            // Mark all views for check to ensure checkboxes update
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            console.log('[PermissionsManagement] Change detection triggered after initial load');
            
            // Verify checkbox states match data
            this.roles.forEach(role => {
              if (role.name !== RoleType.SUPER_ADMIN) {
                const roleData = this.rolePermissionMap[role.id];
                if (roleData) {
                  const permCount = roleData.permissionIds.size;
                  console.log(`[PermissionsManagement] Role ${role.name} (${role.id}) should have ${permCount} checked checkboxes`);
                  
                  // Force update checkboxes for this role by querying DOM
                  roleData.permissionIds.forEach(permId => {
                    const checkboxId = `perm-${role.id}-${permId}`;
                    const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
                    if (checkbox && !checkbox.checked) {
                      console.warn(`[PermissionsManagement] Checkbox ${checkboxId} should be checked but isn't - forcing update`);
                      checkbox.checked = true;
                      // Trigger change event to update PrimeNG's internal state
                      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  });
                }
              }
            });
            
            // One more change detection cycle to ensure everything is updated
            setTimeout(() => {
              this.cdr.detectChanges();
            }, 100);
          }, 0);
        },
        error: (err) => {
          console.error('Error loading role permissions:', err);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load role permissions'
          });
        }
      });
  }

  groupPermissionsByResource(): void {
    this.groupedPermissions = {};
    this.permissions.forEach(permission => {
      if (!this.groupedPermissions[permission.resource]) {
        this.groupedPermissions[permission.resource] = [];
      }
      this.groupedPermissions[permission.resource].push(permission);
    });
    this.resources = Object.keys(this.groupedPermissions).sort();
  }

  hasPermission(roleId: number, permissionId: number): boolean {
    const roleData = this.rolePermissionMap[roleId];
    if (!roleData) {
      // Role data not loaded yet - return false to prevent errors
      return false;
    }
    
    // Super admin always has all permissions
    if (roleData.role.name === RoleType.SUPER_ADMIN) {
      return true;
    }
    
    // Use permissionIds Set as source of truth
    return roleData.permissionIds.has(permissionId);
  }

  /**
   * Get checkbox checked state - ensures proper change detection
   */
  getCheckboxState(roleId: number, permissionId: number): boolean {
    return this.hasPermission(roleId, permissionId);
  }

  togglePermission(roleId: number, permissionId: number, event: Event): void {
    const roleData = this.rolePermissionMap[roleId];
    
    // Don't allow modifying super_admin permissions
    if (roleData && roleData.role.name === RoleType.SUPER_ADMIN) {
      // Prevent the checkbox from changing - revert to checked
      setTimeout(() => {
        const checkbox = document.getElementById(`perm-${roleId}-${permissionId}`) as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
        }
      }, 0);
      this.messageService.add({
        severity: 'warn',
        summary: 'Info',
        detail: 'Super Admin has all permissions and cannot be modified'
      });
      return;
    }
    
    const target = event.target as HTMLInputElement;
    const willBeChecked = target.checked;
    const currentlyHasPermission = this.hasPermission(roleId, permissionId);
    
    if (willBeChecked === currentlyHasPermission) {
      // State mismatch - revert
      setTimeout(() => {
        target.checked = currentlyHasPermission;
        this.cdr.detectChanges();
      }, 0);
      return;
    }
    
    if (willBeChecked) {
      this.grantPermission(roleId, permissionId);
    } else {
      this.revokePermission(roleId, permissionId);
    }
  }

  grantPermission(roleId: number, permissionId: number): void {
    const roleData = this.rolePermissionMap[roleId];
    if (!roleData) {
      console.error(`[PermissionsManagement] Role data not found for role ${roleId}`);
      return;
    }

    // Optimistically update UI immediately
    const permission = this.permissions.find(p => p.id === permissionId);
    if (permission && !roleData.permissionIds.has(permissionId)) {
      this.rolePermissionMap = {
        ...this.rolePermissionMap,
        [roleId]: {
          ...roleData,
          permissions: [...roleData.permissions, permission],
          permissionIds: new Set([...roleData.permissionIds, permissionId])
        }
      };
      this.cdr.detectChanges();
    }

    // Make API call to save to backend
    console.log(`[PermissionsManagement] 🔵 GRANTING: Role ${roleId}, Permission ${permissionId}`);
    const permissionObj = this.permissions.find(p => p.id === permissionId);
    if (permissionObj) {
      console.log(`[PermissionsManagement] Permission details: ${permissionObj.resource}:${permissionObj.action} (ID: ${permissionObj.id})`);
    }
    
    this.roleService.grantPermission(roleId, permissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log(`[PermissionsManagement] ✅ API call succeeded for granting permission ${permissionId} to role ${roleId}`);
          
          // Clear permissions cache so sidebar updates
          this.roleService.clearCache();
          
          // If this is the current user's role, reload their permissions
          const currentRoleId = this.roleService.getCurrentRoleId();
          if (currentRoleId === roleId) {
            // Reload current user's permissions to update sidebar
            this.roleService.fetchMyPermissions().subscribe({
              error: (err) => console.error('Error reloading user permissions:', err)
            });
          }
          
          // Reload permissions for this role to get fresh data from backend
          // Use a small delay to ensure database transaction is committed and backend cache is cleared
          console.log(`[PermissionsManagement] ⏳ Waiting 100ms before reloading permissions to verify save...`);
          setTimeout(() => {
            this.roleService.getRolePermissions(roleId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (permissionStrings) => {
                  console.log(`[PermissionsManagement] Reloaded permissions for role ${roleId} after grant:`, permissionStrings.length, 'permissions');
                  const currentRoleData = this.rolePermissionMap[roleId];
                  if (!currentRoleData) {
                    console.error(`[PermissionsManagement] Role data not found for role ${roleId}`);
                    return;
                  }
                  
                  // Convert permission strings to Permission objects
                  // Use improved matching logic (same as initial load)
                  const rolePermissions: Permission[] = [];
                  const permissionIds = new Set<number>();
                  const unmatchedStrings: string[] = [];
                  
                  // Create a map for faster lookup
                  const permissionMap = new Map<string, Permission>();
                  this.permissions.forEach(p => {
                    const key = `${p.resource}:${p.action}`.toLowerCase();
                    permissionMap.set(key, p);
                  });
                  
                  permissionStrings.forEach(permString => {
                    // Try exact match first
                    let matchedPermission = this.permissions.find(p => 
                      `${p.resource}:${p.action}` === permString
                    );
                    
                    // If no exact match, try case-insensitive match
                    if (!matchedPermission) {
                      const lowerKey = permString.toLowerCase();
                      matchedPermission = permissionMap.get(lowerKey);
                    }
                    
                    if (matchedPermission) {
                      rolePermissions.push(matchedPermission);
                      permissionIds.add(matchedPermission.id);
                    } else {
                      unmatchedStrings.push(permString);
                      console.error(`[PermissionsManagement] Could not find permission object for: ${permString}`);
                    }
                  });
                  
                  if (unmatchedStrings.length > 0) {
                    console.error(`[PermissionsManagement] After grant: ${unmatchedStrings.length} unmatched permissions for role ${roleId}:`, unmatchedStrings);
                  }
                  
                  console.log(`[PermissionsManagement] Role ${roleId} now has ${rolePermissions.length} permissions (was ${currentRoleData.permissions.length})`);
                  
                  // Verify the permission was actually saved
                  if (!permissionIds.has(permissionId)) {
                    console.error(`[PermissionsManagement] ⚠️ CRITICAL: Permission ${permissionId} was not found in reloaded permissions for role ${roleId}!`);
                    const expectedPerm = this.permissions.find(p => p.id === permissionId);
                    if (expectedPerm) {
                      const expectedString = `${expectedPerm.resource}:${expectedPerm.action}`;
                      console.error(`[PermissionsManagement] Expected permission string: ${expectedString}`);
                      console.error(`[PermissionsManagement] Reloaded permission strings:`, permissionStrings);
                      console.error(`[PermissionsManagement] This means the permission was NOT saved to the database!`);
                    }
                  } else {
                    console.log(`[PermissionsManagement] ✓ Verified: Permission ${permissionId} is present in reloaded permissions`);
                  }
                  
                  // Create new map reference to trigger change detection
                  this.rolePermissionMap = {
                    ...this.rolePermissionMap,
                    [roleId]: {
                      ...currentRoleData,
                      permissions: rolePermissions,
                      permissionIds: permissionIds
                    }
                  };
                  
                  // Force change detection
                  this.cdr.markForCheck();
                  this.cdr.detectChanges();
                  console.log(`[PermissionsManagement] UI updated for role ${roleId} with ${permissionIds.size} permissions`);
                  
                  // Ensure checkbox state is correct
                  setTimeout(() => {
                    const checkboxId = `perm-${roleId}-${permissionId}`;
                    const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
                    if (checkbox) {
                      const shouldBeChecked = permissionIds.has(permissionId);
                      if (checkbox.checked !== shouldBeChecked) {
                        console.log(`[PermissionsManagement] Fixing checkbox ${checkboxId}: setting to ${shouldBeChecked}`);
                        checkbox.checked = shouldBeChecked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        this.cdr.detectChanges();
                      }
                    }
                  }, 50);
                },
                error: (err) => {
                  console.error('Error reloading permissions after grant:', err);
                  // Don't revert optimistic update - keep the UI state as is
                  // The backend save succeeded, so the state should be correct
                }
              });
          }, 100); // Reduced delay to 100ms - database should commit faster
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission granted successfully. Sidebar will update automatically.'
          });
        },
        error: (err) => {
          console.error('Error granting permission:', err);
          
          // Revert optimistic update on error
          const currentRoleData = this.rolePermissionMap[roleId];
          if (currentRoleData && currentRoleData.permissionIds.has(permissionId)) {
            const newPermissionIds = new Set(currentRoleData.permissionIds);
            newPermissionIds.delete(permissionId);
            this.rolePermissionMap = {
              ...this.rolePermissionMap,
              [roleId]: {
                ...currentRoleData,
                permissions: currentRoleData.permissions.filter(p => p.id !== permissionId),
                permissionIds: newPermissionIds
              }
            };
            this.cdr.detectChanges();
          }
          
          const errorMsg = err?.error?.error || err?.message || 'Failed to grant permission';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg
          });
        }
      });
  }

  revokePermission(roleId: number, permissionId: number): void {
    const roleData = this.rolePermissionMap[roleId];
    if (!roleData) {
      console.error(`[PermissionsManagement] Role data not found for role ${roleId}`);
      return;
    }

    // Optimistically update UI immediately
    if (roleData.permissionIds.has(permissionId)) {
      const newPermissionIds = new Set(roleData.permissionIds);
      newPermissionIds.delete(permissionId);
      this.rolePermissionMap = {
        ...this.rolePermissionMap,
        [roleId]: {
          ...roleData,
          permissions: roleData.permissions.filter(p => p.id !== permissionId),
          permissionIds: newPermissionIds
        }
      };
      this.cdr.detectChanges();
    }

    // Make API call to save to backend
    this.roleService.revokePermission(roleId, permissionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Clear permissions cache so sidebar updates
          this.roleService.clearCache();
          
          // If this is the current user's role, reload their permissions
          const currentRoleId = this.roleService.getCurrentRoleId();
          if (currentRoleId === roleId) {
            // Reload current user's permissions to update sidebar
            this.roleService.fetchMyPermissions().subscribe({
              error: (err) => console.error('Error reloading user permissions:', err)
            });
          }
          
          // Reload permissions for this role to get fresh data from backend
          // Use a small delay to ensure database transaction is committed and backend cache is cleared
          setTimeout(() => {
            this.roleService.getRolePermissions(roleId)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (permissionStrings) => {
                  console.log(`[PermissionsManagement] Reloaded permissions for role ${roleId} after revoke:`, permissionStrings);
                  const currentRoleData = this.rolePermissionMap[roleId];
                  if (!currentRoleData) {
                    console.error(`[PermissionsManagement] Role data not found for role ${roleId}`);
                    return;
                  }
                  
                  // Convert permission strings to Permission objects
                  // Use improved matching logic (same as initial load)
                  const rolePermissions: Permission[] = [];
                  const permissionIds = new Set<number>();
                  const unmatchedStrings: string[] = [];
                  
                  // Create a map for faster lookup
                  const permissionMap = new Map<string, Permission>();
                  this.permissions.forEach(p => {
                    const key = `${p.resource}:${p.action}`.toLowerCase();
                    permissionMap.set(key, p);
                  });
                  
                  permissionStrings.forEach(permString => {
                    // Try exact match first
                    let matchedPermission = this.permissions.find(p => 
                      `${p.resource}:${p.action}` === permString
                    );
                    
                    // If no exact match, try case-insensitive match
                    if (!matchedPermission) {
                      const lowerKey = permString.toLowerCase();
                      matchedPermission = permissionMap.get(lowerKey);
                    }
                    
                    if (matchedPermission) {
                      rolePermissions.push(matchedPermission);
                      permissionIds.add(matchedPermission.id);
                    } else {
                      unmatchedStrings.push(permString);
                      console.error(`[PermissionsManagement] Could not find permission object for: ${permString}`);
                    }
                  });
                  
                  if (unmatchedStrings.length > 0) {
                    console.error(`[PermissionsManagement] After revoke: ${unmatchedStrings.length} unmatched permissions for role ${roleId}:`, unmatchedStrings);
                  }
                  
                  console.log(`[PermissionsManagement] Role ${roleId} now has ${rolePermissions.length} permissions after revoke (was ${currentRoleData.permissions.length})`);
                  
                  // Verify the permission was actually removed
                  if (permissionIds.has(permissionId)) {
                    console.error(`[PermissionsManagement] ⚠️ CRITICAL: Permission ${permissionId} was still found in reloaded permissions for role ${roleId}!`);
                    console.error(`[PermissionsManagement] This means the permission was NOT removed from the database!`);
                    console.error(`[PermissionsManagement] Reloaded permission strings:`, permissionStrings);
                  } else {
                    console.log(`[PermissionsManagement] ✓ Verified: Permission ${permissionId} was successfully removed`);
                  }
                  
                  // Create new map reference to trigger change detection
                  this.rolePermissionMap = {
                    ...this.rolePermissionMap,
                    [roleId]: {
                      ...currentRoleData,
                      permissions: rolePermissions,
                      permissionIds: permissionIds
                    }
                  };
                  
                  // Force change detection
                  this.cdr.markForCheck();
                  this.cdr.detectChanges();
                  console.log(`[PermissionsManagement] Change detection triggered for role ${roleId} after revoke`);
                  console.log(`[PermissionsManagement] Role ${roleId} now has ${permissionIds.size} permissions after revoke`);
                  
                  // Ensure checkbox state is correct
                  setTimeout(() => {
                    const checkboxId = `perm-${roleId}-${permissionId}`;
                    const checkbox = document.getElementById(checkboxId) as HTMLInputElement;
                    if (checkbox) {
                      const shouldBeChecked = permissionIds.has(permissionId);
                      if (checkbox.checked !== shouldBeChecked) {
                        console.log(`[PermissionsManagement] Fixing checkbox ${checkboxId}: setting to ${shouldBeChecked}`);
                        checkbox.checked = shouldBeChecked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        this.cdr.detectChanges();
                      }
                    }
                  }, 50);
                },
                error: (err) => {
                  console.error('Error reloading permissions after revoke:', err);
                  // Don't revert optimistic update - keep the UI state as is
                  // The backend save succeeded, so the state should be correct
                }
              });
          }, 100); // Reduced delay to 100ms - database should commit faster
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Permission revoked successfully. Sidebar will update automatically.'
          });
        },
        error: (err) => {
          console.error('Error revoking permission:', err);
          
          // Revert optimistic update on error
          const currentRoleData = this.rolePermissionMap[roleId];
          if (currentRoleData && !currentRoleData.permissionIds.has(permissionId)) {
            const permission = this.permissions.find(p => p.id === permissionId);
            if (permission) {
              this.rolePermissionMap = {
                ...this.rolePermissionMap,
                [roleId]: {
                  ...currentRoleData,
                  permissions: [...currentRoleData.permissions, permission],
                  permissionIds: new Set([...currentRoleData.permissionIds, permissionId])
                }
              };
              this.cdr.detectChanges();
            }
          }
          
          const errorMsg = err?.error?.error || err?.message || 'Failed to revoke permission';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg
          });
        }
      });
  }

  openRoleDialog(): void {
    this.newRoleName = '';
    this.newRoleDescription = '';
    this.showRoleDialog = true;
  }

  closeRoleDialog(): void {
    this.showRoleDialog = false;
    this.selectedRole = null;
  }

  createRole(): void {
    if (!this.newRoleName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Role name is required'
      });
      return;
    }

    this.loading = true;
    this.roleService.createRole({
      name: this.newRoleName.trim(),
      description: this.newRoleDescription.trim()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newRole) => {
          this.roles.push(newRole);
          this.rolePermissionMap[newRole.id] = {
            role: newRole,
            permissions: [],
            permissionIds: new Set()
          };
          this.closeRoleDialog();
          this.loading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Role created successfully'
          });
        },
        error: (err) => {
          console.error('Error creating role:', err);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create role'
          });
        }
      });
  }

  getRolePermissionsCount(roleId: number): number {
    const roleData = this.rolePermissionMap[roleId];
    if (!roleData) {
      return 0;
    }
    
    // Super admin has all permissions
    if (roleData.role.name === RoleType.SUPER_ADMIN) {
      return this.permissions.length;
    }
    
    // Use permissionIds size as source of truth (it's more reliable than array length)
    // This ensures consistency with hasPermission() which uses permissionIds
    return roleData.permissionIds.size;
  }

  getResourceDisplayName(resource: string): string {
    return resource.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getActionDisplayName(action: string): string {
    const actionMap: { [key: string]: string } = {
      'create': 'Create',
      'read': 'Read',
      'update': 'Update',
      'delete': 'Delete',
      'list': 'List',
      'manage': 'Manage'
    };
    return actionMap[action] || action;
  }

  // New UI Helper Methods
  getRoleDisplayName(roleName: string): string {
    return roleName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getRoleIcon(roleName: string): string {
    const iconMap: { [key: string]: string } = {
      'super_admin': 'mdi-shield-account',
      'admin': 'mdi-account',
      'coordinator': 'mdi-account-group',
      'staff': 'mdi-card-account-details'
    };
    return iconMap[roleName] || 'mdi-account';
  }

  getResourceIcon(resource: string): string {
    const iconMap: { [key: string]: string } = {
      'users': 'mdi-account-group',
      'roles': 'mdi-shield-account',
      'permissions': 'mdi-key',
      'branches': 'mdi-office-building',
      'areas': 'mdi-map-marker',
      'events': 'mdi-calendar',
      'donations': 'mdi-cash',
      'volunteers': 'mdi-heart',
      'special_guests': 'mdi-star',
      'media': 'mdi-image',
      'promotions': 'mdi-bullhorn',
      'master_data': 'mdi-database'
    };
    return iconMap[resource] || 'mdi-folder';
  }

  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'create': 'mdi-plus-circle',
      'read': 'mdi-eye',
      'update': 'mdi-pencil',
      'delete': 'mdi-delete',
      'list': 'mdi-format-list-bulleted',
      'manage': 'mdi-cog'
    };
    return iconMap[action] || 'mdi-circle';
  }

  getCheckboxTooltip(role: Role, permission: Permission): string {
    if (role.name === RoleType.SUPER_ADMIN) {
      return 'Super Admin has all permissions';
    }
    const hasPerm = this.hasPermission(role.id, permission.id);
    return hasPerm 
      ? `Click to revoke ${permission.resource}:${permission.action} from ${this.getRoleDisplayName(role.name)}`
      : `Click to grant ${permission.resource}:${permission.action} to ${this.getRoleDisplayName(role.name)}`;
  }

  // Search and Filter Methods
  onSearchChange(): void {
    // Search is handled by filteredResources getter
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.cdr.detectChanges();
  }

  filterByResource(resource: string | null): void {
    this.selectedResource = resource;
    // Expand the selected resource if filtering
    if (resource) {
      this.expandedResources.add(resource);
    }
    this.cdr.detectChanges();
  }

  get filteredResources(): string[] {
    let filtered = this.resources;
    
    // Filter by selected resource
    if (this.selectedResource) {
      filtered = [this.selectedResource];
    }
    
    // Filter by search term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(resource => {
        const resourceName = this.getResourceDisplayName(resource).toLowerCase();
        const permissions = this.groupedPermissions[resource] || [];
        return resourceName.includes(searchLower) ||
               permissions.some(p => 
                 this.getActionDisplayName(p.action).toLowerCase().includes(searchLower) ||
                 (p.description || '').toLowerCase().includes(searchLower)
               );
      });
    }
    
    return filtered;
  }

  getResourcePermissionCount(resource: string): number {
    return this.groupedPermissions[resource]?.length || 0;
  }

  hasAnyRolePermission(permissionId: number): boolean {
    return this.roles.some(role => {
      if (role.name === RoleType.SUPER_ADMIN) return true;
      return this.hasPermission(role.id, permissionId);
    });
  }

  // Expand/Collapse Methods
  toggleResource(resource: string): void {
    if (this.expandedResources.has(resource)) {
      this.expandedResources.delete(resource);
    } else {
      this.expandedResources.add(resource);
    }
    this.cdr.detectChanges();
  }

  isResourceExpanded(resource: string): boolean {
    return this.expandedResources.has(resource);
  }

  expandAll(): void {
    this.resources.forEach(resource => this.expandedResources.add(resource));
    this.cdr.detectChanges();
  }

  collapseAll(): void {
    this.expandedResources.clear();
    this.cdr.detectChanges();
  }

  // Initialize expanded resources on load
  private initializeExpandedResources(): void {
    // Expand first 3 resources by default
    this.resources.slice(0, 3).forEach(resource => {
      this.expandedResources.add(resource);
    });
  }
}

