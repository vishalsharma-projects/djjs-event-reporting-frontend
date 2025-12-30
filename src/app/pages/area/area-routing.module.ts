import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { TableComponent } from "./table/table.component";
import { AddBranchComponent } from "./add-branch/add-branch.component";
import { AuthGuard } from "../../core/guards/auth.guard";
import { PermissionGuard } from "../../core/guards/permission.guard";
import { ResourceType, ActionType } from "../../core/services/role.service";

const routes: Routes = [
  {
    path: "",
    component: TableComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.AREAS, action: ActionType.LIST }
    }
  },
  {
    path: "add",
    component: AddBranchComponent,
    canActivate: [AuthGuard, PermissionGuard],
    data: {
      permission: { resource: ResourceType.AREAS, action: ActionType.CREATE }
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AreaRoutingModule {}
