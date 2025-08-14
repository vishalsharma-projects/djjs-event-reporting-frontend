import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/branch-assistance.service';

@Component({
  selector: 'app-list-branch-assistance',
  templateUrl: './list-branch-assistance.component.html',
  styleUrls: ['./list-branch-assistance.component.scss']
})
export class ListBranchAssistanceComponent implements OnInit {

  users: any[] = [];
  expandedRows: { [key: string]: boolean } = {};
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];
  globalFilterValue: string = '';  // Search filter value

  constructor(private userService: UserService , private router : Router) { }

  ngOnInit(): void {
    this.fetchUsers();
  }

  // Fetch users from the backend
  fetchUsers() {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
    });
  }

  // Edit a user
  editUser(userId: string) {
    console.log('Edit user:', userId);
    // Implement edit functionality (e.g., open a modal or navigate to edit page)
  }

  // Delete a user
  deleteUser(userId: string) {
    console.log('Delete user:', userId);
    this.userService.deleteUser(userId).subscribe(() => {
      this.fetchUsers();  // Refresh the user list
    });
  }

  // Add a new user (handle button click)
  addUser() {
    console.log('Add new user');
    this.router.navigate(["/branch/branchAssistance/add"])
    // Implement the add user functionality (e.g., open a form, navigate to add page)
  }

  // Expand all rows
  expandAll() {
    this.users.forEach(user => {
      this.expandedRows[user.id] = true;
    });
  }

  // Collapse all rows
  collapseAll() {
    this.expandedRows = {};
  }

  // Handle row expand/collapse
  onRowExpand(event: any) {
    this.expandedRows[event.data.id] = true;
  }

  onRowCollapse(event: any) {
    this.expandedRows[event.data.id] = false;
  }

  // Handle sorting
  onSort(event: any) {
    // Handle sorting logic here
  }

  // Handle pagination
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }

  // Apply filter based on globalFilterValue (bind with input field)
  applyFilter() {
    // You can apply your filtering logic here (use globalFilterValue to filter users)
    if(this.globalFilterValue) {
      this.fetchUsers();  // Re-fetch users with filter applied
    }
  }
}
