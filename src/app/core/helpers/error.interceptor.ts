import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private authenticationService: AuthenticationService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            // Note: 401 errors are handled by AuthInterceptor (token refresh)
            // Don't logout here, let AuthInterceptor handle it
            // Only handle other errors if needed
            
            // Preserve the full error object so components can access err.error.error
            // Backend returns errors in format: {"error": "message"}
            return throwError(() => err);
        }))
    }
}
