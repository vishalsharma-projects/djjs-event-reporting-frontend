import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UserService } from 'src/app/core/services/branch-assistance.service';
import { LocationService, Branch } from 'src/app/core/services/location.service';
import { ChildBranchService, ChildBranch } from 'src/app/core/services/child-branch.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface BranchOption {
  id: number;
  name: string;
  isChildBranch: boolean;
}

@Component({
  selector: 'app-add-branch-assistance',
  templateUrl: './add-branch-assistance.component.html',
  styleUrls: ['./add-branch-assistance.component.scss']
})
export class AddBranchAssistanceComponent implements OnInit {

  @Input() isVisible: boolean = false;
  @Output() userCreated = new EventEmitter<void>();
  @Output() closeModalEvent = new EventEmitter<void>();

  userForm: FormGroup;
  roles: Role[] = [];
  allBranches: BranchOption[] = [];
  branches: Branch[] = [];
  childBranches: ChildBranch[] = [];
  errorMessage: string = '';
  successMessage: string = '';
  submitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private locationService: LocationService,
    private childBranchService: ChildBranchService,
    private http: HttpClient,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
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

    this.userForm = this.fb.group({
      branch_id: ['', [Validators.required]],
      name: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13), contactValidator]],
      role_id: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), passwordValidator]]
    });

    // Fetch roles and branches for dropdowns
    this.loadRoles();
    this.loadBranches();
  }

  loadRoles(): void {
    const apiUrl = `${environment.apiBaseUrl}/api/roles`;
    this.http.get<Role[]>(apiUrl).subscribe(
      (roles) => {
        this.roles = roles;
        // Set default value to first role
        if (this.roles.length > 0) {
          this.userForm.patchValue({ role_id: this.roles[0].id });
        }
      },
      (error) => {
        console.error('Error loading roles:', error);
        this.errorMessage = 'Failed to load roles. Please refresh the page.';
      }
    );
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
        
        // Set default value to first branch
        if (this.allBranches.length > 0) {
          this.userForm.patchValue({ branch_id: this.allBranches[0].id });
        }
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  openModal(): void {
    this.resetForm();
    this.isVisible = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
    this.resetForm();
    this.closeModalEvent.emit();
  }

  resetForm(): void {
    this.userForm.reset({
      branch_id: '',
      role_id: ''
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = false;
    this.userForm.markAsUntouched();
  }

  onlyNumbersAndPlus(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    // Allow only numbers (0-9), plus sign (+), and hyphen (-)
    if (!/[0-9+\-]/.test(char)) {
      event.preventDefault();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.errorMessage = '';
      this.successMessage = '';
      this.submitting = true;

      // Transform form data to match backend expectations
      const userData = {
        branch_id: Number(this.userForm.value.branch_id),
        name: this.userForm.value.name,
        email: this.userForm.value.email,
        contact_number: this.userForm.value.contact_number,
        role_id: Number(this.userForm.value.role_id),
        password: this.userForm.value.password
      };

      this.userService.createUser(userData).subscribe({
        next: (response) => {
          this.submitting = false;
          this.successMessage = 'User created successfully!';
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully!',
            life: 3000
          });
          
          // Reset form and emit event
          setTimeout(() => {
            this.userForm.reset();
            this.userCreated.emit();
            this.closeModal();
          }, 1500);
        },
        error: (error) => {
          this.submitting = false;
          
          // Extract error message from response
          if (error.error) {
            if (error.error.error) {
              this.errorMessage = error.error.error;
            } else if (typeof error.error === 'string') {
              this.errorMessage = error.error;
            } else {
              this.errorMessage = 'Failed to create user. Please try again.';
            }
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Failed to create user. Please try again.';
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage,
            life: 5000
          });
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
