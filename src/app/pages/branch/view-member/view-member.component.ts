import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService } from 'src/app/core/services/location.service';
import { MessageService } from 'primeng/api';
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service';
import { BranchMember } from '../branch-members-list/branch-members-list.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-view-member',
  templateUrl: './view-member.component.html',
  styleUrls: ['./view-member.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ViewMemberComponent implements OnInit {
  branchId: number | null = null;
  memberId: number | null = null;
  member: BranchMember | null = null;
  loading: boolean = false;
  branchName: string = '';
  returnUrl: string | null = null; // Track where user came from

  // Breadcrumb items
  breadCrumbItems: Array<{}> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private locationService: LocationService,
    private messageService: MessageService,
    private confirmationDialog: ConfirmationDialogService
  ) { }

  ngOnInit(): void {
    // Get return URL from navigation state (if coming from all-members page)
    // Try getCurrentNavigation first (works during navigation), then history.state (works after navigation)
    const navigation = this.router.getCurrentNavigation();
    const navState = navigation?.extras?.state || (window.history.state || {});
    this.returnUrl = navState['returnUrl'] || null;

    // Get IDs from route - check both parent and child routes
    const branchIdParam = this.route.snapshot.paramMap.get('branchId') ||
                         this.route.parent?.snapshot.paramMap.get('id');
    const memberIdParam = this.route.snapshot.paramMap.get('memberId');

    if (branchIdParam) {
      this.branchId = parseInt(branchIdParam, 10);
    }

    if (memberIdParam && memberIdParam !== 'add') {
      this.memberId = parseInt(memberIdParam, 10);
    }

    // Load member - this will handle both cases (with and without branchId)
    if (this.memberId) {
      if (this.branchId) {
        this.loadMember();
        this.loadBranchName();
      } else {
        // No branchId - load member from all members
        this.loadMemberFromAll();
      }
    }

    // Set initial breadcrumbs (will be updated after loading)
    this.updateInitialBreadcrumbs();
  }

  loadBranchName() {
    if (!this.branchId) return;

    this.locationService.getBranchById(this.branchId).subscribe({
      next: (branch) => {
        this.branchName = branch.name;
        this.updateBreadcrumbs();
      },
      error: (error) => {
        console.error('Error loading branch:', error);
      }
    });
  }

  loadMember() {
    if (!this.memberId) return;

    this.loading = true;
    // Since we don't have a get member by ID endpoint, we'll get all members and find the one
    if (this.branchId) {
      this.locationService.getBranchMembers(this.branchId).subscribe({
        next: (members: any[]) => {
          this.member = members.find(m => m.id === this.memberId) || null;
          this.loading = false;
          if (this.member) {
            // Ensure branchId is set from member data if not already set
            if (!this.branchId && this.member.branch_id) {
              this.branchId = this.member.branch_id;
              this.loadBranchName();
            }
            this.updateBreadcrumbs();
          } else {
            // Member not found in branch, try loading from all members
            this.loadMemberFromAll();
          }
        },
        error: (error) => {
          console.error('Error loading member:', error);
          // If branch members fail, try loading from all members
          this.loadMemberFromAll();
        }
      });
    } else {
      // No branchId, try loading from all members
      this.loadMemberFromAll();
    }
  }

  loadMemberFromAll() {
    if (!this.memberId) return;

    this.loading = true;
    this.locationService.getAllBranchMembers().subscribe({
      next: (allMembers: any[]) => {
        const foundMember = allMembers.find(m => m.id === this.memberId);
        if (foundMember) {
          this.member = foundMember;
          // Set branchId from member data if available
          if (foundMember.branch_id && !this.branchId) {
            this.branchId = foundMember.branch_id;
            this.loadBranchName();
          }
          this.loading = false;
          this.updateBreadcrumbs();
        } else {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Member not found'
          });
          setTimeout(() => {
            this.goBack();
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error loading member:', error);
        let errorMessage = 'Failed to load member details. Please try again.';

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
          errorMessage = 'Member not found. It may have been deleted.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to view this member.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });
        this.loading = false;
        setTimeout(() => {
          this.goBack();
        }, 2000);
      }
    });
  }

  updateInitialBreadcrumbs() {
    // Set initial breadcrumbs based on return URL and branch status
    if (this.returnUrl === '/branch/members' || !this.branchId) {
      // Coming from all-members page or member has no branch
      this.breadCrumbItems = [
        { label: 'Branches', routerLink: '/branch' },
        { label: 'All Members', routerLink: '/branch/members' },
        { label: this.memberId ? 'Member Details' : 'Add Member', active: true }
      ];
    } else if (this.branchId) {
      // Coming from branch view page
      this.breadCrumbItems = [
        { label: 'Branches', routerLink: '/branch' },
        { label: 'Branch Details', routerLink: ['/branch/view', this.branchId.toString()] },
        { label: this.memberId ? 'Member Details' : 'Add Member', active: true }
      ];
    } else {
      // Default breadcrumbs
      this.breadCrumbItems = [
        { label: 'Branches', routerLink: '/branch' },
        { label: this.memberId ? 'Member Details' : 'Add Member', active: true }
      ];
    }
  }

  updateBreadcrumbs() {
    // If member has no branch or coming from all-members page
    if (!this.branchId || this.returnUrl === '/branch/members') {
      if (this.member) {
        this.breadCrumbItems = [
          { label: 'Branches', routerLink: '/branch' },
          { label: 'All Members', routerLink: '/branch/members' },
          { label: this.member.name, active: true }
        ];
      } else {
        this.breadCrumbItems = [
          { label: 'Branches', routerLink: '/branch' },
          { label: 'All Members', routerLink: '/branch/members' },
          { label: 'Member Details', active: true }
        ];
      }
    } else if (this.branchId) {
      // Coming from branch view page
      if (this.member) {
        // Member is loaded, show member name
        this.breadCrumbItems = [
          { label: 'Branches', routerLink: '/branch' },
          { label: this.branchName || 'Branch', routerLink: ['/branch/view', this.branchId.toString()] },
          { label: this.member.name, active: true }
        ];
      } else if (this.branchName) {
        // Branch name is loaded but member is not yet loaded
        this.breadCrumbItems = [
          { label: 'Branches', routerLink: '/branch' },
          { label: this.branchName, routerLink: ['/branch/view', this.branchId.toString()] },
          { label: 'Member Details', active: true }
        ];
      }
    }
  }

  editMember() {
    if (this.memberId) {
      if (this.branchId) {
        // Navigate to edit branch page with member tab active
        this.router.navigate(['/branch/edit', this.branchId.toString()]);
      } else {
        // Member has no branch - navigate to all-members page and open edit modal
        this.router.navigate(['/branch/members'], {
          state: { editMemberId: this.memberId }
        });
      }
    }
  }

  deleteMember() {
    if (!this.memberId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Member ID is missing. Cannot delete member.'
      });
      return;
    }

    const memberName = this.member ? this.member.name : 'this member';

    this.confirmationDialog.confirmDelete({
      title: 'Delete Member',
      text: `Are you sure you want to delete "${memberName}"? This action cannot be undone.`,
      successTitle: 'Member Deleted',
      successText: `Member "${memberName}" deleted successfully`,
      showSuccessMessage: false // We'll use PrimeNG message service instead
    }).then((result) => {
      if (result.value) {
        this.locationService.deleteBranchMember(this.memberId!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Member "${memberName}" deleted successfully`,
              life: 3000
            });
            setTimeout(() => {
              this.goBack();
            }, 1500);
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

  goBack() {
    // Use returnUrl if available (e.g., from all-members page)
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
    } else if (this.branchId) {
      // Default: go back to branch view
      this.router.navigate(['/branch/view', this.branchId.toString()]);
    } else {
      // Fallback: go to all members page (since member has no branch)
      this.router.navigate(['/branch/members']);
    }
  }
}

