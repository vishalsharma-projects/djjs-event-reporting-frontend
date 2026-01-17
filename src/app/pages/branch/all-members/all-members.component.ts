import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { ChildBranchService, ChildBranchMember, ChildBranch } from 'src/app/core/services/child-branch.service';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { UserPreferencesService, ColumnPreferences } from 'src/app/core/services/user-preferences.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UnifiedMember {
  id: number;
  name: string;
  member_type: string;
  branch_role?: string;
  responsibility?: string;
  age?: number;
  date_of_samarpan?: string;
  qualification?: string;
  date_of_birth?: string;
  branch_id?: number;
  child_branch_id?: number;
  branch_name?: string;
  child_branch_name?: string;
  branch_type: 'branch' | 'child_branch';
}

@Component({
  selector: 'app-all-members',
  templateUrl: './all-members.component.html',
  styleUrls: ['./all-members.component.scss']
})
export class AllMembersComponent implements OnInit {
  members: UnifiedMember[] = [];
  loading: boolean = false;
  filteredMembers: UnifiedMember[] = [];
  activeMemberType: 'all' | 'preacher' | 'samarpit' = 'all';
  activeBranchType: 'all' | 'branch' | 'child_branch' = 'all';
  searchTerm: string = '';
  breadCrumbItems: Array<{}> = [];

  // Pagination
  first = 0;
  rows = 10;
  rowsPerPageOptions = [5, 10, 20, 50];

  // Add Member Modal
  showAddMemberModal: boolean = false;
  memberForm: FormGroup;
  isSubmitting: boolean = false;
  branches: Branch[] = [];
  childBranches: ChildBranch[] = [];
  allBranches: Array<{id: number, name: string, isChildBranch: boolean}> = []; // Combined list of all branches
  maxDateOfBirth: string = '';

  // Edit Member Modal
  showEditMemberModal: boolean = false;
  editMemberForm: FormGroup;
  editingMember: UnifiedMember | null = null;
  isUpdating: boolean = false;

  // Export state
  exporting: boolean = false;

  // Column reordering and visibility
  columnOrder: string[] = ['name', 'memberType', 'branchName', 'branchRole', 'responsibility', 'age', 'qualification', 'actions'];
  hiddenColumns: string[] = [];
  draggedColumn: string | null = null;
  dragOverColumn: string | null = null;
  isColumnVisibilityMenuOpen: boolean = false;

  constructor(
    private locationService: LocationService,
    private childBranchService: ChildBranchService,
    private router: Router,
    private messageService: MessageService,
    private confirmationDialog: ConfirmationDialogService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userPreferencesService: UserPreferencesService
  ) {
    this.memberForm = this.fb.group({
      branch_id: [null], // Optional field - not mandatory
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      member_type: ['', Validators.required],
      branch_role: ['', Validators.required],
      responsibility: [''],
      age: ['', [Validators.min(1), Validators.max(120)]],
      qualification: [''],
      date_of_birth: [''],
      date_of_samarpan: ['']
    });

    // Edit Member Form
    this.editMemberForm = this.fb.group({
      branch_id: [null], // Optional field - can assign or unassign branch
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      member_type: ['', Validators.required],
      branch_role: ['', Validators.required],
      responsibility: [''],
      age: ['', [Validators.min(1), Validators.max(120)]],
      qualification: [''],
      date_of_birth: [''],
      date_of_samarpan: ['']
    });

    // Set max date for date of birth (today)
    const today = new Date();
    today.setFullYear(today.getFullYear() - 1);
    this.maxDateOfBirth = today.toISOString().split('T')[0];

    // No need for branch_type watcher - all branches use the same branch_id field
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Members', routerLink: '/branch/members' },
      { label: 'All Members', active: true }
    ];
    
    // Check if we need to open edit modal for a specific member
    const navigation = this.router.getCurrentNavigation();
    const navState = navigation?.extras?.state || (window.history.state || {});
    const editMemberId = navState['editMemberId'];
    
    this.loadAllMembers(editMemberId);
    this.loadBranches();
    this.loadChildBranches();
    this.loadColumnPreferences();
  }

  // Column reordering methods
  onColumnDragStart(event: DragEvent, column: string): void {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('.dropdown-menu') || target.closest('input') || target.closest('a')) {
      event.preventDefault();
      return;
    }
    this.draggedColumn = column;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', column);
    }
    const thElement = (event.currentTarget as HTMLElement);
    if (thElement) {
      thElement.classList.add('dragging');
    }
  }

  onColumnDragEnd(event: DragEvent): void {
    this.draggedColumn = null;
    this.dragOverColumn = null;
    const thElement = (event.currentTarget as HTMLElement);
    if (thElement) {
      thElement.classList.remove('dragging');
    }
    document.querySelectorAll('.column-drag-over').forEach(el => {
      el.classList.remove('column-drag-over');
    });
  }

  onColumnDragOver(event: DragEvent, column: string): void {
    if (this.draggedColumn && this.draggedColumn !== column) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      this.dragOverColumn = column;
      if (event.currentTarget) {
        (event.currentTarget as HTMLElement).classList.add('column-drag-over');
      }
    }
  }

  onColumnDragLeave(event: DragEvent): void {
    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('column-drag-over');
    }
    this.dragOverColumn = null;
  }

  onColumnDrop(event: DragEvent, targetColumn: string): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedColumn || this.draggedColumn === targetColumn) {
      return;
    }

    if (event.currentTarget) {
      (event.currentTarget as HTMLElement).classList.remove('column-drag-over');
    }

    const draggedIndex = this.columnOrder.indexOf(this.draggedColumn);
    const targetIndex = this.columnOrder.indexOf(targetColumn);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const newOrder = [...this.columnOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, this.draggedColumn);

    this.columnOrder = newOrder;
    this.saveColumnPreferences();
    this.cdr.detectChanges();

    this.draggedColumn = null;
    this.dragOverColumn = null;
  }

  private loadColumnPreferences(): void {
    this.userPreferencesService.getColumnPreferences('all_members_columns').subscribe({
      next: (preferences) => {
        if (preferences) {
          if (preferences.hidden_columns && preferences.hidden_columns.length > 0) {
            this.hiddenColumns = [...preferences.hidden_columns];
          }
          if (preferences.column_order && preferences.column_order.length > 0) {
            const validOrder = preferences.column_order.filter(col => this.columnOrder.includes(col));
            const missingColumns = this.columnOrder.filter(col => !validOrder.includes(col));
            this.columnOrder = [...validOrder, ...missingColumns];
          }
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading column preferences:', error);
      }
    });
  }

  private saveColumnPreferences(): void {
    const preferences: ColumnPreferences = {
      hidden_columns: this.hiddenColumns,
      column_order: this.columnOrder
    };
    this.userPreferencesService.saveColumnPreferences('all_members_columns', preferences).subscribe({
      next: () => {
        // Preferences saved successfully
      },
      error: (error) => {
        console.error('Error saving column preferences:', error);
      }
    });
  }

  isColumnHidden(column: string): boolean {
    return this.hiddenColumns.includes(column);
  }

  toggleColumnVisibility(column: string): void {
    const index = this.hiddenColumns.indexOf(column);
    if (index > -1) {
      this.hiddenColumns.splice(index, 1);
    } else {
      this.hiddenColumns.push(column);
    }
    this.hiddenColumns = [...this.hiddenColumns];
    this.saveColumnPreferences();
    this.cdr.detectChanges();
  }

  toggleColumnVisibilityMenu(): void {
    this.isColumnVisibilityMenuOpen = !this.isColumnVisibilityMenuOpen;
  }

  closeColumnVisibilityMenu(): void {
    this.isColumnVisibilityMenuOpen = false;
  }

  getColumnDisplayName(column: string): string {
    const names: Record<string, string> = {
      'name': 'Name',
      'memberType': 'Member Type',
      'branchName': 'Branch Name',
      'branchRole': 'Branch Role',
      'responsibility': 'Responsibility',
      'age': 'Age',
      'qualification': 'Qualification',
      'actions': 'Actions'
    };
    return names[column] || column;
  }

  getAllColumns(): string[] {
    return this.columnOrder;
  }

  showAllColumns(): void {
    this.hiddenColumns = [];
    this.hiddenColumns = [...this.hiddenColumns];
    this.closeColumnVisibilityMenu();
    this.saveColumnPreferences();
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.column-visibility-manager')) {
      this.closeColumnVisibilityMenu();
    }
  }

  getColumnCellContent(member: UnifiedMember, column: string): any {
    switch (column) {
      case 'name':
        return member.name;
      case 'memberType':
        return member.member_type === 'preacher' ? 'Preacher' : 'Samarpit Sevadar';
      case 'branchName':
        return member.branch_name || member.child_branch_name || 'N/A';
      case 'branchRole':
        return member.branch_role || 'N/A';
      case 'responsibility':
        return member.responsibility || 'N/A';
      case 'age':
        return member.age || 'N/A';
      case 'qualification':
        return member.qualification || 'N/A';
      default:
        return '';
    }
  }

  loadBranches() {
    // Load all branches (parent and child) and combine them
    forkJoin({
      branches: this.locationService.getAllBranches().pipe(catchError(() => of([]))),
      childBranches: this.childBranchService.getAllChildBranches().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.branches = result.branches || [];
        this.childBranches = result.childBranches || [];
        
        // Combine all branches into a single list for the dropdown
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

  loadChildBranches() {
    // This method is kept for backward compatibility but loadBranches now handles both
  }

  loadAllMembers(editMemberId?: number) {
    this.loading = true;
    this.members = [];
    this.filteredMembers = [];

    // Fetch all members from unified table (includes both parent and child branch members)
    // The backend returns all members with their branch information, including parent_branch_id
    this.locationService.getAllBranchMembers().pipe(
      map((members: any[]) => {
        // Map all members - determine if parent or child branch based on branch.parent_branch_id
        return members.map(member => {
          const isChildBranch = member.branch?.parent_branch_id != null;
          const branchType: 'branch' | 'child_branch' = isChildBranch ? 'child_branch' : 'branch';
          return {
            id: member.id,
            name: member.name || '',
            member_type: member.member_type || '',
            branch_role: member.branch_role || '',
            responsibility: member.responsibility || '',
            age: member.age || 0,
            date_of_samarpan: member.date_of_samarpan || '',
            qualification: member.qualification || '',
            date_of_birth: member.date_of_birth || '',
            branch_id: member.branch_id,
            child_branch_id: isChildBranch ? member.branch_id : undefined, // For backward compatibility
            branch_name: member.branch?.name || 'N/A',
            child_branch_name: isChildBranch ? (member.branch?.name || 'N/A') : undefined,
            branch_type: branchType
          };
        });
      }),
      catchError(error => {
        console.error('Error loading all members:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load members. Please try again.',
          life: 3000
        });
        return of([]);
      })
    ).subscribe({
      next: (allMembers) => {
        this.members = allMembers;
        this.filteredMembers = allMembers;
        this.applyFilters();
        this.loading = false;
        
        // If editMemberId is provided, open edit modal for that member
        if (editMemberId) {
          const memberToEdit = this.members.find(m => m.id === editMemberId);
          if (memberToEdit) {
            // Wait a bit for the UI to render, then open modal
            setTimeout(() => {
              this.openEditMemberModal(memberToEdit);
            }, 300);
          }
        }
      },
      error: (error) => {
        console.error('Error in loadAllMembers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load members. Please try again.',
          life: 5000
        });
        this.loading = false;
        this.members = [];
        this.filteredMembers = [];
      }
    });
  }

  filterByType(type: 'all' | 'preacher' | 'samarpit') {
    this.activeMemberType = type;
    this.applyFilters();
  }

  filterByBranchType(type: 'all' | 'branch' | 'child_branch') {
    this.activeBranchType = type;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.members];

    // Filter by member type
    if (this.activeMemberType !== 'all') {
      filtered = filtered.filter(m => m.member_type === this.activeMemberType);
    }

    // Filter by branch type
    if (this.activeBranchType !== 'all') {
      filtered = filtered.filter(m => m.branch_type === this.activeBranchType);
    }

    // Filter by search term
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        (m.branch_role && m.branch_role.toLowerCase().includes(searchLower)) ||
        (m.responsibility && m.responsibility.toLowerCase().includes(searchLower)) ||
        (m.branch_name && m.branch_name.toLowerCase().includes(searchLower)) ||
        (m.child_branch_name && m.child_branch_name.toLowerCase().includes(searchLower))
      );
    }

    this.filteredMembers = filtered;
  }

  viewMember(member: UnifiedMember) {
    // All members use branch_id (unified table)
    if (member.branch_id) {
      // Check if it's a child branch to determine the correct route
      const isChildBranch = member.branch_type === 'child_branch';
      if (isChildBranch) {
        this.router.navigate(['/branch/child-branch/view', member.branch_id.toString()], {
          state: { returnUrl: '/branch/members' }
        });
      } else {
        this.router.navigate(['/branch', member.branch_id.toString(), 'members', member.id.toString()], {
          state: { returnUrl: '/branch/members' }
        });
      }
    } else {
      // If branch_id is missing, try to fetch it from all members
      this.locationService.getAllBranchMembers().subscribe({
        next: (allMembers: any[]) => {
          const foundMember = allMembers.find(m => m.id === member.id);
          if (foundMember && foundMember.branch_id) {
            // Navigate with the found branch_id
            this.router.navigate(['/branch', foundMember.branch_id.toString(), 'members', member.id.toString()], {
              state: { returnUrl: '/branch/members' }
            });
          } else {
            // Member has no branch assigned - navigate to member view without branch
            this.router.navigate(['/branch/members/view', member.id.toString()], {
              state: { returnUrl: '/branch/members', noBranch: true }
            });
          }
        },
        error: (error) => {
          console.error('Error fetching member branch information:', error);
          // Even if fetch fails, try to navigate to member view without branch
          this.router.navigate(['/branch/members/view', member.id.toString()], {
            state: { returnUrl: '/branch/members', noBranch: true }
          });
        }
      });
    }
  }

  openEditMemberModal(member: UnifiedMember) {
    this.editingMember = member;
    
    // Format dates for input fields
    const formatDate = (dateStr: string | undefined): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };

    this.editMemberForm.patchValue({
      branch_id: member.branch_id || null,
      name: member.name || '',
      member_type: member.member_type || '',
      branch_role: member.branch_role || '',
      responsibility: member.responsibility || '',
      age: member.age || '',
      qualification: member.qualification || '',
      date_of_birth: formatDate(member.date_of_birth),
      date_of_samarpan: formatDate(member.date_of_samarpan)
    });

    this.showEditMemberModal = true;
  }

  closeEditMemberModal() {
    this.showEditMemberModal = false;
    this.editingMember = null;
    this.editMemberForm.reset();
  }

  updateMember() {
    if (!this.editingMember || !this.editMemberForm.valid) {
      Object.keys(this.editMemberForm.controls).forEach(key => {
        const control = this.editMemberForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly.',
        life: 3000
      });
      return;
    }

    this.isUpdating = true;
    const formValue = this.editMemberForm.value;

    // Handle branch_id - can be null to unassign, or a number to assign
    const branchId = formValue.branch_id 
      ? (typeof formValue.branch_id === 'string' 
          ? parseInt(formValue.branch_id, 10) 
          : (typeof formValue.branch_id === 'number' ? formValue.branch_id : null))
      : null;

    const memberPayload = {
      branch_id: branchId, // Can be null to unassign branch
      name: formValue.name.trim(),
      member_type: formValue.member_type,
      branch_role: formValue.branch_role || '',
      responsibility: formValue.responsibility || '',
      age: formValue.age ? parseInt(formValue.age, 10) : 0,
      qualification: formValue.qualification || '',
      date_of_birth: formValue.date_of_birth || null,
      date_of_samarpan: formValue.date_of_samarpan || null
    };

    // Use unified service - all members stored in one table with branch_id
    this.locationService.updateBranchMember(this.editingMember.id, memberPayload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Member updated successfully!',
          life: 3000
        });
        this.isUpdating = false;
        this.closeEditMemberModal();
        this.loadAllMembers();
      },
      error: (error) => {
        console.error('Error updating member:', error);
        let errorMessage = 'Failed to update member. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
        this.isUpdating = false;
      }
    });
  }

  deleteMember(member: UnifiedMember) {
    if (!member.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Member ID is missing. Cannot delete member.'
      });
      return;
    }

    const memberName = member.name || 'this member';

    this.confirmationDialog.confirmDelete({
      title: 'Delete Member',
      text: `Are you sure you want to delete "${memberName}"? This action cannot be undone.`,
      successTitle: 'Member Deleted',
      successText: `Member "${memberName}" deleted successfully`,
      showSuccessMessage: false
    }).then((result) => {
      if (result.value) {
        // Use unified service - works for both parent and child branches (all in one table)
        const deleteRequest = this.locationService.deleteBranchMember(member.id);

        deleteRequest.subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Member "${memberName}" deleted successfully`,
              life: 3000
            });
            this.loadAllMembers();
          },
          error: (error) => {
            console.error('Error deleting member:', error);
            let errorMessage = 'Failed to delete member. Please try again.';

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

            if (error.status === 404) {
              errorMessage = 'Member not found. It may have been already deleted.';
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to delete this member.';
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

  get preacherCount(): number {
    return this.members.filter(m => m.member_type === 'preacher').length;
  }

  get samarpitCount(): number {
    return this.members.filter(m => m.member_type === 'samarpit').length;
  }

  get branchCount(): number {
    return this.members.filter(m => m.branch_type === 'branch').length;
  }

  get childBranchCount(): number {
    return this.members.filter(m => m.branch_type === 'child_branch').length;
  }

  openAddMemberModal() {
    this.memberForm.reset({
      branch_id: null,
      name: '',
      member_type: '',
      branch_role: '',
      responsibility: '',
      age: '',
      qualification: '',
      date_of_birth: '',
      date_of_samarpan: ''
    });
    this.showAddMemberModal = true;
  }

  closeAddMemberModal() {
    this.showAddMemberModal = false;
    this.memberForm.reset({
      branch_id: null
    });
  }

  onSubmitMember() {
    if (!this.memberForm.valid) {
      Object.keys(this.memberForm.controls).forEach(key => {
        const control = this.memberForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly.',
        life: 3000
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.memberForm.value;
    // Use unified service - all members stored in one table with branch_id
    // Branch is optional, so we allow null/undefined
    const branchId = formValue.branch_id 
      ? (typeof formValue.branch_id === 'string' 
          ? parseInt(formValue.branch_id, 10) 
          : (typeof formValue.branch_id === 'number' ? formValue.branch_id : null))
      : null;
    
    // Validate branchId only if provided (not mandatory)
    if (formValue.branch_id && (!branchId || isNaN(branchId))) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a valid branch.',
        life: 3000
      });
      this.isSubmitting = false;
      return;
    }

    const memberPayload = {
      branch_id: branchId || null, // Allow null - branch is optional
      name: formValue.name.trim(),
      member_type: formValue.member_type,
      branch_role: formValue.branch_role || '',
      responsibility: formValue.responsibility || '',
      age: formValue.age ? parseInt(formValue.age, 10) : 0,
      qualification: formValue.qualification || '',
      date_of_birth: formValue.date_of_birth || null,
      date_of_samarpan: formValue.date_of_samarpan || null
    };

    // Use unified service - works for both parent and child branches (all in one table)
    this.locationService.createBranchMember(memberPayload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Member added successfully!',
          life: 3000
        });
        this.isSubmitting = false;
        this.closeAddMemberModal();
        this.loadAllMembers();
      },
      error: (error) => {
        console.error('Error creating member:', error);
        let errorMessage = 'Failed to add member. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Export members to Excel based on current filters
   */
  exportMembersToExcel(): void {
    this.exporting = true;

    // Use current filters
    const searchTerm = this.searchTerm?.trim() || '';
    const memberType = this.activeMemberType !== 'all' ? this.activeMemberType : undefined;
    const branchType = this.activeBranchType !== 'all' ? this.activeBranchType : undefined;

    this.locationService.exportMembersToExcel(searchTerm, memberType, branchType).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        let filename = 'members_export';
        if (searchTerm) {
          filename = `members_${searchTerm.replace(/[^a-z0-9]/gi, '_')}`;
        }
        if (memberType) {
          filename += `_${memberType}`;
        }
        if (branchType) {
          filename += `_${branchType}`;
        }
        filename += '.xlsx';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Members exported to Excel successfully',
          life: 3000
        });
        this.exporting = false;
      },
      error: (error) => {
        console.error('Error exporting members:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.error?.error || 'Failed to export members to Excel',
          life: 5000
        });
        this.exporting = false;
      }
    });
  }
}

