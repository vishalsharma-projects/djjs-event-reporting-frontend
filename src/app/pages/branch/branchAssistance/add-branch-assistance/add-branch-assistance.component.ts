import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UserService } from 'src/app/core/services/branch-assistance.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { MessageService } from 'primeng/api';

interface Role {
  id: number;
  name: string;
  description?: string;
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
  errorMessage: string = '';
  successMessage: string = '';
  submitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
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
      name: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13), contactValidator]],
      role_id: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), passwordValidator]]
    });

    // Fetch roles for dropdown
    this.loadRoles();
  }

  loadRoles(): void {
    const apiUrl = `${environment.apiBaseUrl}/api/roles`;
    this.http.get<Role[]>(apiUrl).subscribe(
      (roles) => {
        this.roles = roles;
      },
      (error) => {
        console.error('Error loading roles:', error);
        this.errorMessage = 'Failed to load roles. Please refresh the page.';
      }
    );
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
    this.userForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.submitting = false;
    this.userForm.markAsUntouched();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.errorMessage = '';
      this.successMessage = '';
      this.submitting = true;

      // Transform form data to match backend expectations
      const userData = {
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
