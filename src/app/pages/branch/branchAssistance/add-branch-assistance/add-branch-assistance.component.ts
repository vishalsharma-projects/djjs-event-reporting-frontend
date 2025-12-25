import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { UserService } from 'src/app/core/services/branch-assistance.service'; // Adjust path
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface Role {
  id: number;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-add-branch-assistance',
  templateUrl: './add-branch-assistance.component.html',
  styleUrls: ['./add-branch-assistance.component.css']
})
export class AddBranchAssistanceComponent implements OnInit {

  userForm: FormGroup;
  roles: Role[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private http: HttpClient
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

    this.userForm = this.fb.group({
      name: ['', [Validators.required, nameValidator]],
      email: ['', [Validators.required, Validators.email]],
      contact_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13), contactValidator]],
      role_id: ['', [Validators.required]]
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

  onSubmit(): void {
    if (this.userForm.valid) {
      this.errorMessage = '';
      this.successMessage = '';

      // Transform form data to match backend expectations
      const userData = {
        name: this.userForm.value.name,
        email: this.userForm.value.email,
        contact_number: this.userForm.value.contact_number,
        role_id: Number(this.userForm.value.role_id) // Ensure it's a number
      };

      console.log('Sending user data:', userData);

      this.userService.createUser(userData).subscribe(
        (response) => {
          console.log('User created successfully!', response);
          this.successMessage = `User created successfully! Password: ${response.password || 'N/A'}`;
          // Reset form after successful creation
          this.userForm.reset();
        },
        (error) => {
          console.error('Error creating user - Full error object:', error);
          console.error('Error status:', error.status);
          console.error('Error error:', error.error);
          
          // Extract error message from response
          if (error.error) {
            if (error.error.error) {
              this.errorMessage = error.error.error;
            } else if (typeof error.error === 'string') {
              this.errorMessage = error.error;
            } else {
              this.errorMessage = `Error: ${JSON.stringify(error.error)}`;
            }
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = `Failed to create user. Status: ${error.status || 'Unknown'}`;
          }
        }
      );
    } else {
      this.userForm.markAllAsTouched();  // Mark all fields as touched to show validation errors
    }
  }
}
