import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BranchListComponent } from './branch-list/branch-list.component';
import { ListBranchAssistanceComponent } from './branchAssistance/list-branch-assistance/list-branch-assistance.component';
import { AddBranchAssistanceComponent } from './branchAssistance/add-branch-assistance/add-branch-assistance.component';
import { EditBranchAssistanceComponent } from './branchAssistance/edit-branch-assistance/edit-branch-assistance.component';
import { AddBranchComponent } from './add-branch/add-branch.component';
import { EditBranchComponent } from './edit-branch/edit-branch.component';
import { ViewBranchComponent } from './view-branch/view-branch.component';
import { ViewMemberComponent } from './view-member/view-member.component';
import { AddMemberComponent } from './add-member/add-member.component';


const routes: Routes = [
  { path: "", component: BranchListComponent },
  { path: "add", component: AddBranchComponent },
  { path: "edit/:id", component: EditBranchComponent },
  { path: "view/:id", component: ViewBranchComponent },
  { path: ":branchId/members/add", component: AddMemberComponent },
  { path: ":branchId/members/:memberId", component: ViewMemberComponent },
  { path: "branchAssistance", component: ListBranchAssistanceComponent },
  { path: "branchAssistance/add", component: AddBranchAssistanceComponent },
  { path: "branchAssistance/edit/:id", component: EditBranchAssistanceComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchRoutingModule { }
