import { Component, OnInit } from '@angular/core';
import { RoleService } from './core/services/role.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private roleService: RoleService) {}

  ngOnInit() {
    // Load permissions if user is already logged in (has token)
    // Defer to next tick to avoid circular dependency during DI
    setTimeout(() => {
      const token = localStorage.getItem('auth-token');
      if (token && this.roleService.getCurrentRole()) {
        // User is logged in, load permissions
        this.roleService.fetchMyPermissions().subscribe({
          error: (err) => {
            // Silently fail - permissions will be loaded on next navigation or explicit request
            console.debug('[AppComponent] Permissions not loaded on startup (will load on demand)');
          }
        });
      }
    }, 100);
  }
}
