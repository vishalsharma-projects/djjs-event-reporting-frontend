import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SettingsRoutingModule } from './settings-routing.module';
import { PermissionsManagementComponent } from './permissions-management/permissions-management.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';

// PrimeNG modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { RbacModule } from '../../core/rbac.module';

@NgModule({
  declarations: [
    PermissionsManagementComponent,
    RolePermissionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    RbacModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    CheckboxModule,
    TabViewModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TooltipModule,
    BadgeModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class SettingsModule { }

