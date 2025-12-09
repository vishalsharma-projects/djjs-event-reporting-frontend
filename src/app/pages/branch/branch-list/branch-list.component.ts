import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';

interface BranchData {
  id: string;
  branchName: string;
  coordinatorName: string;
  state: string;
  city: string;
  establishedOn: Date;
  ashramArea: string;
  members: any[];
}

@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss']
})
export class BranchListComponent implements OnInit {

  branches: BranchData[] = [];
  expandedRows: { [key: string]: boolean } = {};
  loading: boolean = false;
  loadingMembers: { [key: string]: boolean } = {};
  membersLoaded: { [key: string]: boolean } = {};

  // Pagination & Filters
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];
  globalFilterValue = '';
  totalRecords: number = 0;

  // Per-column filter, dropdown, and pinning state
  filters: { [key: string]: string } = {};
  activeFilter: string | null = null;
  dropdownOpen: { [key: string]: boolean } = {};
  pinnedColumns: string[] = [];


  constructor(
    private router: Router,
    private locationService: LocationService,
    private messageService: MessageService,
    private tokenStorage: TokenStorageService,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  ngOnInit(): void {
    // Load branches from service
    this.loadBranches();
  }

  loadBranches(sortField?: string, sortOrder?: number) {
    this.loading = true;

    // Determine if we should use server-side search
    const searchTerm = this.globalFilterValue?.trim();
    const shouldUseSearch = searchTerm && searchTerm.length > 0;

    // Use search API if we have a search term, otherwise get all branches
    // Search by name (primary) and coordinator (secondary) - API will return matches for either
    const branchesObservable = shouldUseSearch
      ? this.locationService.searchBranches(searchTerm, searchTerm)
      : this.locationService.getAllBranches();

    branchesObservable.subscribe({
      next: (branches: Branch[]) => {
        // Convert API branch data to BranchData format
        let convertedBranches: BranchData[] = branches.map(branch => ({
          id: branch.id?.toString() || '',
          branchName: branch.name || 'Unnamed Branch',
          coordinatorName: branch.coordinator_name || 'Not specified',
          state: branch.state?.name || '',
          city: branch.city?.name || '',
          establishedOn: branch.established_on ? new Date(branch.established_on) : new Date(branch.created_on || Date.now()),
          ashramArea: branch.aashram_area ? `${branch.aashram_area} sq km` : '0 sq km',
          members: [] // Members not included in API response
        }));

        // Apply client-side filtering
        // Note: When using search API, name/coordinator filtering is done server-side
        // We only need client-side filtering for state/city (not supported by API search)
        if (this.globalFilterValue) {
          const filterValue = this.globalFilterValue.toLowerCase();
          if (shouldUseSearch) {
            // API already filtered by name/coordinator, only filter by state/city client-side
            convertedBranches = convertedBranches.filter(branch =>
              branch.state.toLowerCase().includes(filterValue) ||
              branch.city.toLowerCase().includes(filterValue)
            );
          } else {
            // Full client-side filtering when not using search API
            convertedBranches = convertedBranches.filter(branch =>
              branch.branchName.toLowerCase().includes(filterValue) ||
              branch.coordinatorName.toLowerCase().includes(filterValue) ||
              branch.state.toLowerCase().includes(filterValue) ||
              branch.city.toLowerCase().includes(filterValue)
            );
          }
        }

        // Apply sorting if provided
        if (sortField && sortOrder) {
          convertedBranches.sort((a, b) => {
            const aValue = a[sortField as keyof BranchData];
            const bValue = b[sortField as keyof BranchData];
            if (aValue < bValue) return sortOrder === 1 ? -1 : 1;
            if (aValue > bValue) return sortOrder === 1 ? 1 : -1;
            return 0;
          });
        }

        // Apply pagination
        const start = this.first;
        const end = start + this.rows;
        this.branches = convertedBranches.slice(start, end);
        this.totalRecords = convertedBranches.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading branches:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load branches. Please try again.'
        });
        this.loading = false;
        this.branches = [];
        this.totalRecords = 0;
      }
    });
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadBranches();
  }

  onSort(event: any) {
    const { field, order } = event;
    this.loadBranches(field, order);
  }

  // Handle global filter
  onGlobalFilterChange(event: any) {
    this.globalFilterValue = event.target.value;
    this.first = 0;
    this.loadBranches();
  }

  // Handle row expand
  onRowExpand(event: any) {
    const branchId = event.data.id;
    this.expandedRows[branchId] = true;

    // Fetch members if not already loaded
    if (!this.membersLoaded[branchId]) {
      this.loadBranchMembers(branchId);
    }
  }

  // Handle row collapse
  onRowCollapse(event: any) {
    this.expandedRows[event.data.id] = false;
  }

  // Load branch members
  loadBranchMembers(branchId: string) {
    const branchIdNum = parseInt(branchId, 10);
    if (isNaN(branchIdNum)) {
      console.error('Invalid branch ID:', branchId);
      return;
    }

    this.loadingMembers[branchId] = true;
    this.locationService.getBranchMembers(branchIdNum).subscribe({
      next: (members: any[]) => {
        // Map API response to component member structure
        const mappedMembers = members.map(member => ({
          name: member.name || '',
          role: member.branch_role || '',
          responsibility: member.responsibility || '',
          age: member.age || 0,
          dateOfSamarpan: member.date_of_samarpan ? new Date(member.date_of_samarpan).toLocaleDateString() : '',
          qualification: member.qualification || '',
          memberType: member.member_type || '',
          dateOfBirth: member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : ''
        }));

        // Update the branch's members
        const branch = this.branches.find(b => b.id === branchId);
        if (branch) {
          branch.members = mappedMembers;
        }
        this.loadingMembers[branchId] = false;
        this.membersLoaded[branchId] = true;
      },
      error: (error) => {
        console.error('Error loading branch members:', error);
        this.loadingMembers[branchId] = false;
        // Set empty array on error
        const branch = this.branches.find(b => b.id === branchId);
        if (branch) {
          branch.members = [];
        }
        this.membersLoaded[branchId] = true; // Mark as loaded even on error to prevent retries
      }
    });
  }

  // Add new branch
  addBranch() {
    this.router.navigate(['/branch/add']);
  }

  // Edit branch
  editBranch(branchId: string) {
    this.router.navigate(['/branch/edit', branchId]);
  }

  // Delete branch
  deleteBranch(branchId: string) {
    const branchIdNum = parseInt(branchId, 10);
    if (isNaN(branchIdNum)) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid branch ID' });
      return;
    }

    // Confirm deletion
    this.confirmationDialog.confirmDelete({
      title: 'Delete Branch',
      text: 'Are you sure you want to delete this branch? This action cannot be undone.',
      successTitle: 'Branch Deleted',
      successText: 'Branch deleted successfully',
      showSuccessMessage: false // We'll use PrimeNG message service instead
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.locationService.deleteBranch(branchIdNum).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Branch deleted successfully'
            });
            this.loadBranches(); // Reload the list
          },
          error: (error) => {
            console.error('Error deleting branch:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete branch. Please try again.'
            });
            this.loading = false;
          }
        });
      }
    });
  }


  // --- Per-column filter, dropdown, and pinning logic ---

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

  applyFilter() {
    // For demo: combine all filters into global filter string
    // For real: pass this.filters to backend and filter there
    this.globalFilterValue = Object.values(this.filters).filter(Boolean).join(' ');
    this.first = 0;
    this.loadBranches();
  }

  isColumnPinned(column: string): boolean {
    return this.pinnedColumns.includes(column);
  }

  toggleColumnPin(column: string) {
    if (this.isColumnPinned(column)) {
      this.pinnedColumns = this.pinnedColumns.filter(c => c !== column);
    } else {
      this.pinnedColumns.push(column);
    }
    this.applyPinning();
  }

  applyPinning() {
    // Custom logic to apply pinning if needed
    console.log('Pinned columns:', this.pinnedColumns);
  }
}
