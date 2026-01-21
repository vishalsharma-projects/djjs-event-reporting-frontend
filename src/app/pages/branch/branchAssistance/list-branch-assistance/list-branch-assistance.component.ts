import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/core/services/branch-assistance.service';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { ChildBranchService, ChildBranch } from 'src/app/core/services/child-branch.service';
import { AddBranchAssistanceComponent } from '../add-branch-assistance/add-branch-assistance.component';
import { EditBranchAssistanceComponent } from '../edit-branch-assistance/edit-branch-assistance.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface BranchOption {
  id: number;
  name: string;
  isChildBranch: boolean;
}

@Component({
  selector: 'app-list-branch-assistance',
  templateUrl: './list-branch-assistance.component.html',
  styleUrls: ['./list-branch-assistance.component.scss']
})
export class ListBranchAssistanceComponent implements OnInit {

  @ViewChild(AddBranchAssistanceComponent) addUserComponent?: AddBranchAssistanceComponent;
  @ViewChild(EditBranchAssistanceComponent) editUserComponent?: EditBranchAssistanceComponent;

  users: any[] = []; // Paginated users to display
  allUsersData: any[] = []; // Store all users for pagination
  filteredUsersData: any[] = []; // Store filtered users
  expandedRows: { [key: string]: boolean } = {};
  loading: boolean = false;
  allBranches: BranchOption[] = [];
  branches: Branch[] = [];
  childBranches: ChildBranch[] = [];

  // Pagination & Filters
  first = 0;
  rows = 20;
  rowsPerPageOptions = [10, 20, 50];
  globalFilterValue: string = '';

  // Per-column filter, dropdown, and pinning
  filters: { [key: string]: string } = {};
  activeFilter: string | null = null;
  dropdownOpen: { [key: string]: boolean } = {};
  pinnedColumns: string[] = [];

  constructor(
    private userService: UserService,
    private router: Router,
    private messageService: MessageService,
    private confirmationDialog: ConfirmationDialogService,
    private locationService: LocationService,
    private childBranchService: ChildBranchService
  ) { }

ngOnInit(): void {
  // Initialize filters for columns
  this.filters = {
    branchEmail: '',
    name: '',
    type: '',
    createdBy: '',
    updatedBy: ''
  };

  // Initialize empty users array - will be populated from API
  this.users = [];
  this.expandedRows = {};
  
  // Load branches first
  this.loadBranches();
  
  // Load users from API
  this.fetchUsers();
}


  // Fetch users from backend
  fetchUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        // Map the API response to ensure all fields are properly displayed
        const mappedUsers = data.map((user: any) => ({
          ...user,
          // Ensure role name is accessible
          roleName: user.role?.name || 'N/A'
        }));
        
        // Store all users
        this.allUsersData = mappedUsers;
        
        // Apply filters if any
        this.applyFilters();
        
        // Update paginated users
        this.updatePaginatedUsers();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load users. Please try again.' 
        });
        this.allUsersData = [];
        this.filteredUsersData = [];
        this.users = [];
        this.loading = false;
      }
    });
  }

  // Apply filters to users
  applyFilters() {
    if (!this.globalFilterValue || this.globalFilterValue.trim() === '') {
      this.filteredUsersData = [...this.allUsersData];
      return;
    }

    const searchTerm = this.globalFilterValue.toLowerCase().trim();
    this.filteredUsersData = this.allUsersData.filter((user: any) => {
      return (
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.role?.name && user.role.name.toLowerCase().includes(searchTerm)) ||
        (user.created_by && user.created_by.toLowerCase().includes(searchTerm)) ||
        (user.updated_by && user.updated_by.toLowerCase().includes(searchTerm))
      );
    });
  }

  // Update paginated users based on current page
  updatePaginatedUsers() {
    // PrimeNG handles pagination automatically, so we just need to set the full array
    this.users = this.hasActiveFilters() ? this.filteredUsersData : this.allUsersData;
  }

  // Check if there are active filters
  hasActiveFilters(): boolean {
    return this.globalFilterValue && this.globalFilterValue.trim() !== '';
  }

  // Get total records for pagination component
  getTotalRecords(): number {
    return this.hasActiveFilters() ? this.filteredUsersData.length : this.allUsersData.length;
  }

  // Add a new user - open modal
  addUser() {
    if (this.addUserComponent) {
      this.addUserComponent.openModal();
    }
  }

  // Handle user created event
  onUserCreated() {
    // Refresh the user list
    this.fetchUsers();
  }

  // Edit a user - open modal
  editUser(userId: string | number) {
    if (!userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'User ID is missing. Cannot edit user.',
        life: 3000
      });
      return;
    }
    const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (this.editUserComponent) {
      this.editUserComponent.openModal(userIdNumber);
    }
  }

  // Handle user updated event
  onUserUpdated() {
    // Refresh the user list
    this.fetchUsers();
  }

  // Delete a user
  deleteUser(userId: string) {
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID is missing. Cannot delete user.'
      });
      return;
    }

    // Find user to get name for confirmation message
    const user = this.allUsersData.find(u => u.id === userId);
    const userName = user?.name || user?.email || 'this user';

    this.confirmationDialog.confirmDelete({
      title: 'Delete User',
      text: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      successTitle: 'User Deleted',
      successText: `User "${userName}" deleted successfully`,
      showSuccessMessage: false // We'll use PrimeNG message service instead
    }).then((result) => {
      if (result.value) {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `User "${userName}" deleted successfully`,
              life: 3000
            });
            this.fetchUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            let errorMessage = 'Failed to delete user. Please try again.';

            if (error.error) {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              } else if (typeof error.error === 'string') {
                errorMessage = error.error;
              }
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
              life: 5000
            });
          }
        });
      }
    });
  }

  // Row expand/collapse
  onRowExpand(event: any) {
    this.expandedRows[event.data.id] = true;
  }

  onRowCollapse(event: any) {
    this.expandedRows[event.data.id] = false;
  }

  // Pagination
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows || this.rows; // Keep current rows if not provided
    // PrimeNG handles pagination automatically, no need to manually slice
  }

  // Sorting (client-side, no API call)
  onSort(event: any) {
    const { field, order } = event;
    
    console.log('Sort event - field:', field, 'order:', order);
    
    // Guard against undefined field
    if (!field) {
      console.warn('Sort field is undefined');
      return;
    }
    
    // Sort allUsersData
    this.allUsersData.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;
      
      // Special handling for branchName - sort by branch name
      if (field === 'branchName') {
        aValue = this.getBranchName(a.branch_id);
        bValue = this.getBranchName(b.branch_id);
        console.log('Branch sort - comparing:', aValue, 'vs', bValue);
      }
      // Handle nested properties (e.g., role.name)
      else if (field && field.includes('.')) {
        const parts = field.split('.');
        aValue = a;
        bValue = b;
        for (const part of parts) {
          aValue = aValue?.[part];
          bValue = bValue?.[part];
        }
      } else {
        aValue = a[field];
        bValue = b[field];
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return order === 1 ? 1 : -1;
      if (bValue == null) return order === 1 ? -1 : 1;
      
      // Convert to string and lowercase for case-insensitive comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      // String comparison
      if (order === 1) {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
    
    console.log('After branch sort, first 5 users:', this.allUsersData.slice(0, 5).map(u => ({ id: u.id, branch_id: u.branch_id, name: this.getBranchName(u.branch_id) })));
    
    // Re-apply any active filters
    this.applyFilters();
    this.updatePaginatedUsers();
  }

  // Apply global + per-column filter
  applyFilter() {
    this.first = 0; // Reset to first page when filtering
    this.applyFilters();
    this.updatePaginatedUsers();
  }

  // Dropdowns for per-column filters
  toggleDropdown(column: string) {
    this.dropdownOpen[column] = !this.dropdownOpen[column];
    // Close others
    Object.keys(this.dropdownOpen).forEach(key => {
      if (key !== column) this.dropdownOpen[key] = false;
    });
  }

  isDropdownOpen(column: string): boolean {
    return !!this.dropdownOpen[column];
  }

  showFilter(column: string) {
    this.activeFilter = column;
    this.toggleDropdown(column);
  }

  clearFilter(column: string) {
    this.filters[column] = '';
    this.applyFilter();
  }

  // Column pinning
  isColumnPinned(column: string): boolean {
    return this.pinnedColumns.includes(column);
  }

  toggleColumnPin(column: string) {
    if (this.isColumnPinned(column)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== column);
    } else {
      this.pinnedColumns.push(column);
    }
  }

  loadBranches(): void {
    // Load all branches (parent and child) and combine them
    forkJoin({
      branches: this.locationService.getAllBranches().pipe(catchError(() => of([]))),
      childBranches: this.childBranchService.getAllChildBranches().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.branches = result.branches || [];
        this.childBranches = result.childBranches || [];
        
        // Combine all branches into a single list
        this.allBranches = [
          // Parent branches (no parent_branch_id)
          ...(this.branches
            .filter(b => !b.parent_branch_id && b.id)
            .map(b => ({ id: b.id!, name: b.name, isChildBranch: false }))),
          // Child branches (have parent_branch_id)
          ...(this.childBranches
            .filter(b => b.id)
            .map(b => ({ id: b.id!, name: b.name, isChildBranch: true })))
        ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  getBranchName(branchId?: number): string {
    if (!branchId) {
      return '-';
    }
    const branch = this.allBranches.find(b => b.id === branchId);
    return branch ? branch.name : '-';
  }
}
