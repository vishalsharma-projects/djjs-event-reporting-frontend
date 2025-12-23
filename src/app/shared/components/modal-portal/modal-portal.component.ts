import { Component, OnInit, ViewContainerRef, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { ModalPortalService, ModalInstance } from '../../../core/services/modal-portal.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Modal Portal Component
 * Renders all modals at the body level, outside layout containers.
 * This ensures modals are never clipped by overflow or transform contexts.
 */
@Component({
  selector: 'app-modal-portal',
  templateUrl: './modal-portal.component.html',
  styleUrls: ['./modal-portal.component.scss']
})
export class ModalPortalComponent implements OnInit, OnDestroy {
  activeModals: ModalInstance[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: ModalPortalService,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Register container with service
    this.modalService.setContainer(this.viewContainerRef);

    // Subscribe to modal changes
    this.updateModals();
    
    // Listen for modal close events to update UI
    this.modalService.onModalClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateModals();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update active modals list
   */
  updateModals(): void {
    this.activeModals = this.modalService.getModalsForRendering();
    this.cdr.detectChanges();
  }

  /**
   * Check if there are active modals
   */
  hasActiveModals(): boolean {
    return this.activeModals.length > 0;
  }

  /**
   * Get modal dialog classes based on config
   */
  getModalDialogClasses(config: any): string {
    const classes: string[] = [];

    if (config.centered) {
      classes.push('modal-dialog-centered');
    }

    if (config.scrollable) {
      classes.push('modal-dialog-scrollable');
    }

    if (config.size) {
      if (config.size === 'fullscreen') {
        classes.push('modal-fullscreen');
      } else {
        classes.push(`modal-${config.size}`);
      }
    }

    if (config.class) {
      classes.push(config.class);
    }

    return classes.join(' ');
  }

  /**
   * Check if value is a template
   */
  isTemplate(value: any): boolean {
    return value && value.createEmbeddedView;
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    // Close topmost modal if backdrop click is enabled
    const topModal = this.activeModals[this.activeModals.length - 1];
    if (topModal && topModal.config.closeOnBackdropClick !== false && topModal.config.backdrop !== 'static') {
      this.closeModal(topModal.id);
    }
  }

  /**
   * Handle modal container click (to prevent backdrop click when clicking modal content)
   */
  onModalClick(event: MouseEvent, modal: ModalInstance): void {
    // If clicking the modal element itself (not content), treat as backdrop click
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal') && modal.config.closeOnBackdropClick !== false) {
      this.closeModal(modal.id);
    }
  }

  /**
   * Handle escape key
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(modal?: ModalInstance): void {
    if (modal && modal.config.keyboard !== false) {
      this.closeModal(modal.id);
    } else if (this.activeModals.length > 0) {
      const topModal = this.activeModals[this.activeModals.length - 1];
      if (topModal.config.keyboard !== false) {
        this.closeModal(topModal.id);
      }
    }
  }

  /**
   * Close a modal
   */
  closeModal(modalId: string): void {
    this.modalService.close(modalId);
    this.updateModals();
  }
}

