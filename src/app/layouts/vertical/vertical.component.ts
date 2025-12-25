import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

import { EventService } from '../../core/services/event.service';

// import { SIDEBAR_TYPE } from "../layouts.model";

@Component({
  selector: 'app-vertical',
  templateUrl: './vertical.component.html',
  styleUrls: ['./vertical.component.scss']
})

/**
 * Vertical component
 */
export class VerticalComponent implements OnInit, AfterViewInit {

  isCondensed: any = false;
  sidebartype: string;

  constructor(private router: Router, private eventService: EventService) {
    this.router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        // Close sidebar on navigation (mobile only)
        this.closeMobileSidebar();
      }
    });

    // Close sidebar when clicking outside on mobile - improved handler
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        this.handleOutsideClick(e);
      }, true); // Use capture phase for better event handling
    }
  }

  /**
   * Close mobile sidebar
   */
  private closeMobileSidebar() {
    if (window.innerWidth <= 992) {
      document.body.classList.remove('sidebar-enable');
      // Restore body styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      // Restore page-content scrolling
      const pageContent = document.querySelector('.page-content') as HTMLElement;
      if (pageContent) {
        pageContent.style.overflow = '';
      }
    }
  }

  /**
   * Handle click outside sidebar
   */
  private handleOutsideClick(e: Event) {
    const isMobile = window.innerWidth <= 992;
    if (!isMobile || !document.body.classList.contains('sidebar-enable')) {
      return;
    }

    const target = e.target as HTMLElement;
    if (!target) return;

    const sidebar = document.querySelector('.vertical-menu');
    const toggleButton = document.querySelector('#vertical-menu-btn');
    const topbar = document.querySelector('#page-topbar');

    // Check if click is inside sidebar
    const clickedInsideSidebar = sidebar && sidebar.contains(target);
    
    // Check if click is on toggle button
    const clickedToggleButton = toggleButton && (toggleButton.contains(target) || target === toggleButton);
    
    // Check if click is on topbar (hamburger menu)
    const clickedOnTopbar = topbar && topbar.contains(target);

    // Don't close if clicking inside sidebar, on toggle button, or on topbar
    if (clickedInsideSidebar || clickedToggleButton || clickedOnTopbar) {
      return;
    }

    // Close sidebar for all other clicks (backdrop, main content, etc.)
    this.closeMobileSidebar();
  }

  ngOnInit() {
    document.body.setAttribute('data-layout', 'vertical');
  }

  isMobile() {
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  }

  ngAfterViewInit() {
  }

  /**
   * on settings button clicked from topbar
   */
  onSettingsButtonClicked() {
    document.body.classList.toggle('right-bar-enabled');
  }

  /**
   * On mobile toggle button clicked
   */
  onToggleMobileMenu() {
    const isMobile = window.innerWidth <= 992;

    if (isMobile) {
      // Mobile behavior - toggle sidebar overlay
      const isOpen = document.body.classList.contains('sidebar-enable');

      if (isOpen) {
        this.closeMobileSidebar();
      } else {
        // Open sidebar
        document.body.classList.add('sidebar-enable');
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        // Prevent page-content scrolling
        const pageContent = document.querySelector('.page-content') as HTMLElement;
        if (pageContent) {
          pageContent.style.overflow = 'hidden';
        }
      }
    } else {
      // Desktop behavior - toggle collapsed state
      this.isCondensed = !this.isCondensed;
      document.body.classList.toggle('vertical-collpsed');
      document.body.classList.remove('sidebar-enable');
      // Restore body styles on desktop
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
}
