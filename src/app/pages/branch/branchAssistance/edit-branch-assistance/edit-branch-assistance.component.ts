import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { UserApiService, User } from 'src/app/core/services/user-api.service';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { ChildBranchService, ChildBranch } from 'src/app/core/services/child-branch.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface BranchOption {
  id: number;
  name: string;
  isChildBranch: boolean;
}

@Component({
  selector: 'app-edit-branch-assistance',
  templateUrl: './edit-branch-assistance.component.html',
  styleUrls: ['./edit-branch-assistance.component.scss']
})
export class EditBranchAssistanceComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Output() userUpdated = new EventEmitter<void>();
  @Output() closeModalEvent = new EventEmitter<void>();

  updateUserForm: FormGroup;
  userId: number | null = null;
  userRoleName: string = '';
  userBranchId: number | null = null;
  userBranchName: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  submitting: boolean = false;
  loading: boolean = false;
  allBranches: BranchOption[] = [];
  branches: Branch[] = [];
  childBranches: ChildBranch[] = [];

  constructor(
    private fb: FormBuilder,
    private userApiService: UserApiService,
    private messageService: MessageService,
    private locationService: LocationService,
    private childBranchService: ChildBranchService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
  }

  initForm() {
    // Custom validator for name - no numeric characters
    const namePattern = /^[a-zA-Z\s]+$/;
    const nameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      if (control.value && !namePattern.test(control.value)) {
        return { numericNotAllowed: true };
      }
      return null;
    };

    // Custom validator for contact number - 10 digits or +91XXXXXXXXXX format
    const contactPattern = /^(\+91[0-9]{10}|[0-9]{10})$/;
    const contactValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      if (control.value && !contactPattern.test(control.value)) {
        return { invalidFormat: true };
      }
      return null;
    };

    // Custom validator for password strength
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const passwordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      if (control.value && !passwordPattern.test(control.value)) {
        return { pattern: true };
      }
      return null;
    };

    // Custom validator to check if passwords match
    const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      const newPassword = control.parent?.get('new_password')?.value;
      const confirmPassword = control.value;
      
      if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        return { passwordMismatch: true };
      }
      return null;
    };

    this.updateUserForm = this.fb.group({
      branch_id: ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2), nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13), contactValidator]],
      // Password fields - optional (only required if user wants to change password)
      old_password: [''],
      new_password: [''],
      confirm_password: ['']
    }, { validators: this.passwordFieldsValidator });
  }

  // Custom validator to ensure all password fields are filled together or all empty
  passwordFieldsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const oldPassword = control.get('old_password')?.value?.trim();
    const newPassword = control.get('new_password')?.value?.trim();
    const confirmPassword = control.get('confirm_password')?.value?.trim();

    // If any password field is filled, all must be filled
    const hasAnyPassword = oldPassword || newPassword || confirmPassword;
    const allPasswordsFilled = oldPassword && newPassword && confirmPassword;

    if (hasAnyPassword && !allPasswordsFilled) {
      return { passwordFieldsIncomplete: true };
    }

    // If passwords are provided, validate they match
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    // If new password is provided, validate strength
    if (newPassword) {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordPattern.test(newPassword)) {
        control.get('new_password')?.setErrors({ pattern: true });
        return { passwordWeak: true };
      }
    }

    return null;
  };

  openModal(userId: number): void {
    // Set userId first, then reset form (but keep userId)
    this.userId = userId;
    this.clearFormData();
    this.loadUserData(userId);
    this.isVisible = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
    this.resetForm();
    this.closeModalEvent.emit();
  }

  // Clear form data but keep userId (used when opening modal)
  clearFormData(): void {
    this.updateUserForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = false;
    this.loading = false;
    this.userRoleName = '';
    this.userBranchId = null;
    this.userBranchName = '';
    this.updateUserForm.markAsUntouched();
  }

  // Reset form completely including userId (used when closing modal)
  resetForm(): void {
    this.updateUserForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = false;
    this.loading = false;
    this.userId = null;
    this.userRoleName = '';
    this.userBranchId = null;
    this.userBranchName = '';
    this.updateUserForm.markAsUntouched();
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

  // Load user data based on the ID to be edited
  loadUserData(userId: number) {
    this.loading = true;
    this.userApiService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.loading = false;
        // Pre-fill form with user data
        this.updateUserForm.patchValue({
          branch_id: user.branch_id || '',
          name: user.name || '',
          email: user.email || '',
          contact_number: user.contact_number || ''
        });
        // Store role name and branch info for display
        this.userRoleName = user.role?.name || 'N/A';
        this.userBranchId = user.branch_id || null;
        // Find branch name from allBranches
        if (user.branch_id) {
          const branch = this.allBranches.find(b => b.id === user.branch_id);
          this.userBranchName = branch ? branch.name : 'N/A';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading user:', error);
        this.errorMessage = 'Failed to load user data. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user data. Please try again.',
          life: 5000
        });
      }
    });
  }

  onSubmit() {
    // Check if form is invalid (excluding optional password fields)
    const branchValid = this.updateUserForm.get('branch_id')?.valid;
    const nameValid = this.updateUserForm.get('name')?.valid;
    const emailValid = this.updateUserForm.get('email')?.valid;
    const contactValid = this.updateUserForm.get('contact_number')?.valid;
    
    if (!branchValid || !nameValid || !emailValid || !contactValid) {
      this.updateUserForm.markAllAsTouched();
      return;
    }

    // Check password fields - if any password field is filled, all must be filled and valid
    const oldPassword = this.updateUserForm.get('old_password')?.value;
    const newPassword = this.updateUserForm.get('new_password')?.value;
    const confirmPassword = this.updateUserForm.get('confirm_password')?.value;
    
    const hasPasswordFields = oldPassword || newPassword || confirmPassword;
    const allPasswordFieldsFilled = oldPassword && newPassword && confirmPassword;
    
    if (hasPasswordFields && !allPasswordFieldsFilled) {
      this.errorMessage = 'Please fill all password fields to change password, or leave them all empty.';
      this.updateUserForm.get('old_password')?.markAsTouched();
      this.updateUserForm.get('new_password')?.markAsTouched();
      this.updateUserForm.get('confirm_password')?.markAsTouched();
      return;
    }

    if (allPasswordFieldsFilled) {
      // Validate password strength
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
      if (!passwordPattern.test(newPassword)) {
        this.updateUserForm.get('new_password')?.markAsTouched();
        this.errorMessage = 'New password must be at least 8 characters with uppercase, lowercase, number, and special character.';
        return;
      }
      
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        this.updateUserForm.get('confirm_password')?.markAsTouched();
        this.errorMessage = 'New password and confirm password do not match.';
        return;
      }
    }

    if (!this.userId) {
      console.error('User ID is missing:', this.userId);
      this.errorMessage = 'User ID is missing. Cannot update user.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User ID is missing. Cannot update user.',
        life: 5000
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = true;

    // Prepare update data (only include fields that can be updated)
    const userData: Partial<User> = {
      branch_id: Number(this.updateUserForm.value.branch_id),
      name: this.updateUserForm.value.name,
      email: this.updateUserForm.value.email,
      contact_number: this.updateUserForm.value.contact_number
    };

    console.log('Updating user:', this.userId, userData);

    // Update user details first
    this.userApiService.updateUser(this.userId, userData).subscribe({
      next: (response) => {
        // If password fields are filled, update password separately
        if (allPasswordFieldsFilled) {
          this.updatePassword();
        } else {
          // User details updated, no password change
          this.submitting = false;
          this.successMessage = 'User updated successfully!';
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User details have been updated successfully.',
            life: 3000
          });
          
          // Reset form and emit event
          setTimeout(() => {
            this.userUpdated.emit();
            this.closeModal();
          }, 1500);
        }
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error updating user:', error);
        
        // Extract error message from response
        if (error.error) {
          if (error.error.error) {
            this.errorMessage = error.error.error;
          } else if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else {
            this.errorMessage = 'Failed to update user. Please try again.';
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Failed to update user. Please try again.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage,
          life: 5000
        });
      }
    });
  }

  updatePassword() {
    if (!this.userId) {
      this.errorMessage = 'User ID is missing. Cannot update password.';
      this.submitting = false;
      return;
    }

    const oldPassword = this.updateUserForm.get('old_password')?.value;
    const newPassword = this.updateUserForm.get('new_password')?.value;
    const confirmPassword = this.updateUserForm.get('confirm_password')?.value;

    this.userApiService.changePassword(
      this.userId,
      oldPassword,
      newPassword,
      confirmPassword
    ).subscribe({
      next: (response) => {
        this.submitting = false;
        this.successMessage = 'User details and password updated successfully!';
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User details and password have been updated successfully.',
          life: 3000
        });
        
        // Reset form and emit event
        setTimeout(() => {
          this.userUpdated.emit();
          this.closeModal();
        }, 1500);
      },
      error: (error) => {
        this.submitting = false;
        console.error('Error updating password:', error);
        
        // Extract error message from response
        let errorMsg = 'Failed to update password. Please try again.';
        if (error.error) {
          if (error.error.error) {
            errorMsg = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMsg = error.error;
          }
        } else if (error.message) {
          errorMsg = error.message;
        }

        this.errorMessage = errorMsg;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMsg,
          life: 5000
        });
      }
    });
  }
}
