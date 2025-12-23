import { Component, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../core/services/auth.service';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RootReducerState } from '../../../store/index';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

/**
 * Login component
 */
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: UntypedFormGroup;
  submitted: any = false;
  error: any = '';
  returnUrl: string;
  fieldTextType!: boolean;
  loading: boolean = false;

  // set the current year
  year: number = new Date().getFullYear();

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private store: Store<RootReducerState>
  ) { }

  ngOnInit() {
    // Check if user is already authenticated
    if (this.authenticationService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Get return URL from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check if there's a reason for redirect
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason) {
      switch (reason) {
        case 'expired':
          this.error = 'Your session has expired. Please login again.';
          break;
        case 'unauthorized':
          this.error = 'You are not authorized to access that page. Please login.';
          break;
        default:
          this.error = 'Please login to continue.';
      }
    }

    // Subscribe to auth state changes for loading and error display
    this.authenticationService.getAuthState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        this.loading = authState.loading;

        // Only update error if it's not a reason-based error
        if (!reason) {
          this.error = authState.error;
        }

        // Note: Redirect is handled in the login() subscribe callback
        // to ensure token is properly stored before navigation
      });

    // Initialize form validation
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;
    this.error = '';

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    // Trim whitespace from email and password to prevent login issues
    const credentials = {
      email: (this.f['email'].value || '').trim(),
      password: (this.f['password'].value || '').trim()
    };

    // Call authentication service
    this.authenticationService.login(credentials).subscribe({
      next: (response) => {
        // Token is stored synchronously in the service's map() operator
        // Use setTimeout to ensure the token is available to the guard
        setTimeout(() => {
          if (this.authenticationService.isAuthenticated()) {
            // Navigate to return URL or dashboard
            this.router.navigate([this.returnUrl]).catch(err => {
              console.error('Navigation error:', err);
            });
          } else {
            // Token should be stored, but if not, show error
            this.error = 'Login successful but authentication failed. Please try again.';
          }
        }, 0); // Use setTimeout with 0ms to ensure execution after current call stack
      },
      error: (error) => {
        // Extract error message
        if (error.error && error.error.error) {
          this.error = error.error.error;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Login failed. Please check your credentials and try again.';
        }
      }
    });
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  /**
   * Clear error message
   */
  clearError() {
    this.error = '';
  }
}
