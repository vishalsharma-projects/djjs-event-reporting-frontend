import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchListComponent } from './branch-list/branch-list.component';
import { ListBranchAssistanceComponent } from './branchAssistance/list-branch-assistance/list-branch-assistance.component';
import { AddBranchComponent } from './add-branch/add-branch.component';
import { EditBranchComponent } from './edit-branch/edit-branch.component';
import { ViewBranchComponent } from './view-branch/view-branch.component';
import { ViewMemberComponent } from './view-member/view-member.component';
import { AddMemberComponent } from './add-member/add-member.component';
import { AddChildBranchComponent } from './add-child-branch/add-child-branch.component';
import { EditChildBranchComponent } from './edit-child-branch/edit-child-branch.component';
import { ViewChildBranchComponent } from './view-child-branch/view-child-branch.component';
import { AddChildBranchMemberComponent } from './add-child-branch-member/add-child-branch-member.component';
import { BranchGalleryComponent } from './gallery/branch-gallery.component';
import { AllMembersComponent } from './all-members/all-members.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { ResourceType, ActionType } from '../../core/services/role.service';


const routes: Routes = [
  { 
    path: "", 
    component: BranchListComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.LIST }
    }
  },
  { 
    path: "add", 
    component: AddBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.CREATE }
    }
  },
  { 
    path: "edit/:id", 
    component: EditBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.UPDATE }
    }
  },
  { 
    path: "view/:id", 
    component: ViewBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
  { 
    path: "child-branch/add/:parentId", 
    component: AddChildBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.CREATE }
    }
  },
  { 
    path: "child-branch/edit/:id", 
    component: EditChildBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.UPDATE }
    }
  },
  { 
    path: "child-branch/view/:id", 
    component: ViewChildBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
  { 
    path: "members", 
    component: AllMembersComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
  { 
    path: ":branchId/members/add", 
    component: AddMemberComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.UPDATE }
    }
  },
  { 
    path: ":branchId/members/:memberId", 
    component: ViewMemberComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
  { 
    path: "gallery", 
    component: BranchGalleryComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
  { 
    path: "branchAssistance", 
    component: ListBranchAssistanceComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.BRANCHES, action: ActionType.READ }
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
