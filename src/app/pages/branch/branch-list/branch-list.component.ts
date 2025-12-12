import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MessageService } from 'primeng/api';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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
export class BranchListComponent implements OnInit, OnDestroy {

  branches: BranchData[] = [];

  // Breadcrumb items
  breadCrumbItems: Array<{}> = [];
  expandedRows: { [key: string]: boolean } = {};
  loading: boolean = false;
  loadingMembers: { [key: string]: boolean } = {};
  membersLoaded: { [key: string]: boolean } = {};
  private routerSubscription?: Subscription;

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
    // Set breadcrumbs
    this.breadCrumbItems = [
      { label: 'Branches', active: true }
    ];

    // Load branches from service
    this.loadBranches();

    // Subscribe to router events to reload branches when returning to this page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Reload branches when navigating to branch list
        if (event.url === '/branch' || event.url.startsWith('/branch?')) {
          this.loadBranches();
        }
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Clear search timeout
    if ((this as any).searchTimeout) {
      clearTimeout((this as any).searchTimeout);
    }
  }

  loadBranches(sortField?: string, sortOrder?: number) {
    this.loading = true;

    // Determine if we should use server-side search
    const searchTerm = this.globalFilterValue?.trim();
    const shouldUseSearch = searchTerm && searchTerm.length > 0;

    // Use search API if we have a search term, otherwise get all branches
    // Search by name and coordinator - API will search both fields with OR logic
    const branchesObservable = shouldUseSearch
      ? this.locationService.searchBranches(searchTerm, searchTerm)
      : this.locationService.getAllBranches();

    // Debug logging
    console.log('Loading branches:', {
      searchTerm: searchTerm,
      shouldUseSearch: shouldUseSearch,
      first: this.first,
      rows: this.rows
    });

    branchesObservable.subscribe({
      next: (branches: Branch[]) => {
        console.log('API Response - Raw branches:', branches);
        console.log('API Response - Branch count:', branches?.length || 0);

        // Handle empty results gracefully
        if (!branches || branches.length === 0) {
          console.log('No branches returned from API');
          this.branches = [];
          this.totalRecords = 0;
          this.loading = false;
          return;
        }

        // Convert API branch data to BranchData format
        let convertedBranches: BranchData[] = branches.map(branch => {
          console.log('Converting branch:', branch.id, branch.name);
          return {
          id: branch.id?.toString() || '',
          branchName: branch.name || 'Unnamed Branch',
          coordinatorName: branch.coordinator_name || 'Not specified',
          state: branch.state?.name || '',
          city: branch.city?.name || '',
          establishedOn: branch.established_on ? new Date(branch.established_on) : new Date(branch.created_on || Date.now()),
          ashramArea: branch.aashram_area ? `${branch.aashram_area} sq km` : '0 sq km',
          members: [] // Members not included in API response
          };
        });

        console.log('Converted branches:', convertedBranches.length);

        // Don't apply additional client-side filtering when using search API
        // The API already handles name and coordinator search
        // Only apply client-side filtering if NOT using search API (for state/city)
        if (this.globalFilterValue && !shouldUseSearch) {
          const filterValue = this.globalFilterValue.toLowerCase();
          // Full client-side filtering when not using search API
          convertedBranches = convertedBranches.filter(branch =>
            (branch.branchName && branch.branchName.toLowerCase().includes(filterValue)) ||
            (branch.coordinatorName && branch.coordinatorName.toLowerCase().includes(filterValue)) ||
            (branch.state && branch.state.toLowerCase().includes(filterValue)) ||
            (branch.city && branch.city.toLowerCase().includes(filterValue))
          );
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

        // Store all converted branches before pagination
        const allBranches = convertedBranches;

        // Apply pagination
        const start = this.first;
        const end = start + this.rows;
        this.branches = allBranches.slice(start, end);
        this.totalRecords = allBranches.length;
        this.loading = false;

        // Debug logging
        console.log('Loaded branches:', {
          total: allBranches.length,
          showing: this.branches.length,
          start: start,
          end: end,
          searchTerm: this.globalFilterValue
        });
      },
      error: (error) => {
        console.error('Error loading branches:', error);

        // Handle "no branches found" as info, not error
        const errorMessage = error.error?.error || error.error?.message || error.message || '';
        const isNotFound = error.status === 404 || errorMessage.toLowerCase().includes('no branches found');

        if (isNotFound) {
          // No branches found is not an error, just show empty state
          this.branches = [];
          this.totalRecords = 0;
          this.loading = false;
          return;
        }

        // Only show error for actual errors
        let errorDetail = 'Failed to load branches. Please try again.';
        if (error.error) {
          if (error.error.error && !error.error.error.toLowerCase().includes('no branches found')) {
            errorDetail = error.error.error;
          } else if (error.error.message && !error.error.message.toLowerCase().includes('no branches found')) {
            errorDetail = error.error.message;
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorDetail,
          life: 5000
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

  // Handle global filter with debouncing
  onGlobalFilterChange(event: any) {
    const newValue = event.target.value || '';
    this.globalFilterValue = newValue;
    this.first = 0; // Reset to first page when searching

    console.log('Search input changed:', newValue);

    // Debounce search to avoid too many API calls
    // Clear any existing timeout
    if ((this as any).searchTimeout) {
      clearTimeout((this as any).searchTimeout);
    }

    // If search is cleared, load immediately
    if (!newValue || newValue.trim() === '') {
      console.log('Search cleared, loading all branches');
      this.loadBranches();
      return;
    }

    // Set new timeout - wait 300ms after user stops typing
    (this as any).searchTimeout = setTimeout(() => {
      console.log('Executing search after debounce:', this.globalFilterValue);
      this.loadBranches();
    }, 300);
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
  viewBranch(branchId: string) {
    this.router.navigate(['/branch/view', branchId]);
  }

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
