import { Injectable } from '@angular/core';

/**
 * Service to manage scroll locking when modals are open.
 * Prevents background scrolling and preserves scroll position.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private scrollPosition = 0;
  private lockedElements: HTMLElement[] = [];
  private isLocked = false;

  /**
   * Lock scrolling on the page and preserve scroll position
   */
  lockScroll(): void {
    if (this.isLocked) {
      return;
    }

    this.isLocked = true;
    const body = document.body;
    const html = document.documentElement;

    // Save current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Lock body scroll
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollPosition}px`;
    body.style.width = '100%';

    // Lock html scroll (for some browsers)
    html.style.overflow = 'hidden';

    // Lock .page-content scroll (main content area)
    const pageContent = document.querySelector('.page-content') as HTMLElement;
    if (pageContent) {
      const currentScrollTop = pageContent.scrollTop;
      pageContent.style.overflow = 'hidden';
      pageContent.style.position = 'relative';
      // Store original overflow to restore later
      (pageContent as any).__originalOverflow = pageContent.style.overflow;
      this.lockedElements.push(pageContent);
    }

    // Prevent iOS bounce scrolling
    body.style.touchAction = 'none';
  }

  /**
   * Unlock scrolling and restore scroll position
   */
  unlockScroll(): void {
    if (!this.isLocked) {
      return;
    }

    this.isLocked = false;
    const body = document.body;
    const html = document.documentElement;

    // Restore body scroll
    body.style.overflow = '';
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    body.style.touchAction = '';

    // Restore html scroll
    html.style.overflow = '';

    // Restore .page-content scroll
    this.lockedElements.forEach((element) => {
      element.style.overflow = (element as any).__originalOverflow || '';
      element.style.position = '';
      delete (element as any).__originalOverflow;
    });
    this.lockedElements = [];

    // Restore scroll position
    window.scrollTo(0, this.scrollPosition);
  }

  /**
   * Check if scroll is currently locked
   */
  isScrollLocked(): boolean {
    return this.isLocked;
  }
}


