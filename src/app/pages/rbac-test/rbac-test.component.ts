import { Component, OnInit } from '@angular/core';
import { RoleService, RoleType, ResourceType, ActionType } from '../../core/services/role.service';

@Component({
  selector: 'app-rbac-test',
  templateUrl: './rbac-test.component.html',
  styleUrls: ['./rbac-test.component.scss']
})
export class RbacTestComponent implements OnInit {
  currentRole = '';
  currentRoleId: number | null = null;
  permissions: string[] = [];
  
  hasUserCreate = false;
  hasUserRead = false;
  hasUserUpdate = false;
  hasUserDelete = false;
  hasEventCreate = false;
  hasEventRead = false;
  hasBranchCreate = false;
  
  isSuperAdmin = false;
  isAdmin = false;
  isCoordinatorOrHigher = false;

  RoleType = RoleType;
  ResourceType = ResourceType;
  ActionType = ActionType;

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    this.loadPermissions();
    this.checkPermissions();
    this.checkRoles();
    
    this.roleService.permissions$.subscribe(() => {
      this.loadPermissions();
      this.checkPermissions();
    });
    
    this.roleService.role$.subscribe(() => {
      this.loadPermissions();
      this.checkRoles();
    });
  }

  loadPermissions() {
    this.currentRole = this.roleService.getCurrentRole();
    this.currentRoleId = this.roleService.getCurrentRoleId();
    this.permissions = this.roleService.getCurrentPermissions();
  }

  checkPermissions() {
    this.hasUserCreate = this.roleService.hasPermission(ResourceType.USERS, ActionType.CREATE);
    this.hasUserRead = this.roleService.hasPermission(ResourceType.USERS, ActionType.READ);
    this.hasUserUpdate = this.roleService.hasPermission(ResourceType.USERS, ActionType.UPDATE);
    this.hasUserDelete = this.roleService.hasPermission(ResourceType.USERS, ActionType.DELETE);
    this.hasEventCreate = this.roleService.hasPermission(ResourceType.EVENTS, ActionType.CREATE);
    this.hasEventRead = this.roleService.hasPermission(ResourceType.EVENTS, ActionType.READ);
    this.hasBranchCreate = this.roleService.hasPermission(ResourceType.BRANCHES, ActionType.CREATE);
  }

  checkRoles() {
    this.isSuperAdmin = this.roleService.isSuperAdmin();
    this.isAdmin = this.roleService.isAdmin();
    this.isCoordinatorOrHigher = this.roleService.isCoordinatorOrHigher();
  }

  refreshPermissions() {
    this.roleService.fetchMyPermissions().subscribe({
      next: () => {
        console.log('Permissions refreshed');
        this.loadPermissions();
        this.checkPermissions();
        this.checkRoles();
      },
      error: (err) => {
        console.error('Failed to refresh permissions:', err);
      }
    });
  }
}
