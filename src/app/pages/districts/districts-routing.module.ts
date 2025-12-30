import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { TableComponent } from "./table/table.component";
import { AddDistrictComponent } from "./add-branch/add-branch.component";
import { AuthGuard } from "../../core/guards/auth.guard";
import { PermissionGuard } from "../../core/guards/permission.guard";
import { ResourceType, ActionType } from "../../core/services/role.service";

const routes: Routes = [
  {
    path: "",
    component: TableComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.MASTER_DATA, action: ActionType.LIST }
    }
  },
  {
    path: "add",
    component: AddDistrictComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.MASTER_DATA, action: ActionType.CREATE }
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistrictRoutingModule {}
