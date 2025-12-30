import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventsListComponent } from './events-list/events-list.component';
import { AddEventComponent } from './add-event/add-event.component';
import { ViewEventComponent } from './view-event/view-event.component';
import { GalleryComponent } from './gallery/gallery.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { ResourceType, ActionType } from '../../core/services/role.service';

const routes: Routes = [
  {
    path: '',
    component: EventsListComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.LIST }
    }
  },
  {
    path: 'add',
    component: AddEventComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.CREATE }
    }
  },
  {
    path: 'edit/:id',
    component: AddEventComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.UPDATE }
    }
  },
  {
    path: 'add/:id',
    component: AddEventComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.CREATE }
    }
  },
  {
    path: 'view/:id',
    component: ViewEventComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.READ }
    }
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.EVENTS, action: ActionType.READ }
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventsRoutingModule { }
