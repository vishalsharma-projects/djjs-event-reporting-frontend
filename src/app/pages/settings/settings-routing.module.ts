import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionsManagementComponent } from './permissions-management/permissions-management.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { RoleType } from '../../core/services/role.service';

const routes: Routes = [
  {
    path: '',
    component: PermissionsManagementComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: {
      roles: [RoleType.SUPER_ADMIN],
      redirectTo: '/pages/error-403'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }

